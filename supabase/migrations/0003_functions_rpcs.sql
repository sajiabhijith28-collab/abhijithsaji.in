-- ============================================================================
-- Migration 0003: Transactional Booking Lock RPC & Fee Snapshot Engine
-- Prevents race conditions & double-booking via transactional lock + constraint
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_locked_appointment(
  p_booking_code TEXT,
  p_patient_id UUID,
  p_doctor_id UUID,
  p_appointment_date DATE,
  p_slot_time TIME,
  p_patient_name TEXT,
  p_patient_age INT,
  p_patient_gender gender_type,
  p_patient_phone TEXT,
  p_symptoms_notes TEXT DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.doctors;
  v_settings public.platform_settings;
  v_fee_type fee_type;
  v_fee_rate NUMERIC(10,2);
  v_platform_fee NUMERIC(10,2);
  v_total NUMERIC(10,2);
  v_slot_end TIME;
  v_appt public.appointments;
BEGIN
  -- 1. Release any expired pending_payment slot locks older than lock_expires_at
  UPDATE public.appointments
  SET status = 'cancelled',
      cancellation_reason = 'Payment lock expired',
      cancelled_at = now(),
      updated_at = now()
  WHERE doctor_id = p_doctor_id
    AND appointment_date = p_appointment_date
    AND slot_time = p_slot_time
    AND status = 'pending_payment'
    AND lock_expires_at < now();

  -- 2. Lock doctor row and ensure doctor is active
  SELECT * INTO v_doc
  FROM public.doctors
  WHERE id = p_doctor_id AND is_active = true
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Doctor not found or inactive';
  END IF;

  -- 3. Check if doctor is on leave on the requested date
  IF EXISTS (
    SELECT 1 FROM public.doctor_leaves
    WHERE doctor_id = p_doctor_id AND leave_date = p_appointment_date
  ) THEN
    RAISE EXCEPTION 'Doctor is unavailable on the selected date';
  END IF;

  -- 4. Resolve immutable platform fee (doctor override takes precedence over global setting)
  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;

  IF v_doc.platform_fee_override_type IS NOT NULL AND v_doc.platform_fee_override_value IS NOT NULL THEN
    v_fee_type := v_doc.platform_fee_override_type;
    v_fee_rate := v_doc.platform_fee_override_value;
  ELSE
    v_fee_type := COALESCE(v_settings.platform_fee_type, 'percentage');
    v_fee_rate := COALESCE(v_settings.platform_fee_value, 10.00);
  END IF;

  IF v_fee_type = 'percentage' THEN
    v_platform_fee := ROUND((v_doc.consultation_fee * v_fee_rate) / 100.0, 2);
  ELSE
    v_platform_fee := ROUND(v_fee_rate, 2);
  END IF;

  -- Note: Patient pays ONLY v_platform_fee online via Razorpay to lock & confirm the slot;
  -- v_doc.consultation_fee is paid directly at the clinic counter during the visit.
  v_total := v_doc.consultation_fee + v_platform_fee;
  v_slot_end := p_slot_time + make_interval(mins => v_doc.slot_duration_mins);

  -- 5. Insert locked appointment (idx_unique_active_doctor_slot guarantees zero double-booking)
  INSERT INTO public.appointments (
    booking_code,
    patient_id,
    doctor_id,
    hospital_id,
    appointment_date,
    slot_time,
    slot_end_time,
    patient_name,
    patient_age,
    patient_gender,
    patient_phone,
    symptoms_notes,
    consultation_fee,
    applied_fee_type,
    applied_fee_rate,
    platform_fee,
    total_amount,
    net_doctor_earning,
    status,
    lock_expires_at
  ) VALUES (
    p_booking_code,
    p_patient_id,
    p_doctor_id,
    v_doc.hospital_id,
    p_appointment_date,
    p_slot_time,
    v_slot_end,
    p_patient_name,
    p_patient_age,
    p_patient_gender,
    p_patient_phone,
    p_symptoms_notes,
    v_doc.consultation_fee,
    v_fee_type,
    v_fee_rate,
    v_platform_fee,
    v_total,
    v_doc.consultation_fee,
    'pending_payment',
    now() + interval '10 minutes'
  )
  RETURNING * INTO v_appt;

  RETURN v_appt;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'This time slot has just been booked by another patient. Please pick another slot.';
END;
$$;

