-- ============================================================================
-- Migration 0001: Core Schema, Constraints & Double-Booking Prevention
-- Project: "My Dr" — Hospital & Doctor Appointment Booking Platform
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fee_type AS ENUM ('percentage', 'flat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending_payment', 'verification_pending', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('created', 'verification_pending', 'paid', 'failed', 'refunded', 'partially_refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'settled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. LOCATIONS (Ponkunnam, Kerala & Localities)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL DEFAULT 'Ponkunnam',
  area TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Kerala',
  pincode TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(city, area)
);

-- 3. SPECIALTIES
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT NOT NULL DEFAULT 'Stethoscope',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. HOSPITALS / CLINICS
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.6 CHECK (rating >= 0 AND rating <= 5),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PROFILES (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'patient',
  phone TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  age INT CHECK (age >= 0 AND age <= 120),
  gender gender_type,
  city TEXT,
  area TEXT,
  avatar_url TEXT,
  has_password BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. DOCTORS
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  registration_number TEXT NOT NULL UNIQUE,
  qualifications TEXT[] NOT NULL DEFAULT '{}',
  experience_years INT NOT NULL DEFAULT 1 CHECK (experience_years >= 0),
  languages TEXT[] NOT NULL DEFAULT ARRAY['English', 'Hindi'],
  bio TEXT,
  photo_url TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL CHECK (consultation_fee >= 0),
  platform_fee_override_type fee_type,
  platform_fee_override_value NUMERIC(10,2) CHECK (platform_fee_override_value >= 0),
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8 CHECK (rating >= 0 AND rating <= 5),
  review_count INT NOT NULL DEFAULT 0,
  slot_duration_mins INT NOT NULL DEFAULT 20 CHECK (slot_duration_mins IN (10, 15, 20, 30, 45, 60)),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. DOCTOR AVAILABILITY & LEAVES
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_working BOOLEAN NOT NULL DEFAULT true,
  morning_start TIME DEFAULT '09:30',
  morning_end TIME DEFAULT '13:30',
  evening_start TIME DEFAULT '17:00',
  evening_end TIME DEFAULT '20:30',
  slot_duration_mins INT NOT NULL DEFAULT 20,
  UNIQUE(doctor_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, leave_date)
);

-- 8. PLATFORM SETTINGS (Singleton id = 1)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_fee_type fee_type NOT NULL DEFAULT 'percentage',
  platform_fee_value NUMERIC(10,2) NOT NULL DEFAULT 10.00 CHECK (platform_fee_value >= 0),
  free_cancellation_hours INT NOT NULL DEFAULT 6 CHECK (free_cancellation_hours >= 0),
  cancellation_refund_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (cancellation_refund_percent BETWEEN 0 AND 100),
  payment_gateway_mode TEXT NOT NULL DEFAULT 'upi_direct',
  upi_id TEXT NOT NULL DEFAULT 'pksaji020@oksbi',
  upi_payee_name TEXT NOT NULL DEFAULT 'My Dr Healthcare',
  upi_verification_mode TEXT NOT NULL DEFAULT 'admin_approval',
  sms_provider TEXT NOT NULL DEFAULT 'supabase_native',
  support_phone TEXT DEFAULT '+91-1800-108-6937',
  support_email TEXT DEFAULT 'care@mydr.in',
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. DOCTOR PAYOUTS
CREATE TABLE IF NOT EXISTS public.doctor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  appointments_count INT NOT NULL DEFAULT 0,
  gross_consultation_amount NUMERIC(10,2) NOT NULL,
  platform_fee_deducted NUMERIC(10,2) NOT NULL,
  net_payout_amount NUMERIC(10,2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  settlement_reference TEXT,
  settled_by UUID REFERENCES public.profiles(id),
  settled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  slot_end_time TIME NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INT NOT NULL,
  patient_gender gender_type NOT NULL,
  patient_phone TEXT NOT NULL,
  symptoms_notes TEXT,
  -- Immutable Financial Snapshot captured at payment/checkout creation
  consultation_fee NUMERIC(10,2) NOT NULL,
  applied_fee_type fee_type NOT NULL,
  applied_fee_rate NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  net_doctor_earning NUMERIC(10,2) NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending_payment',
  lock_expires_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by_role user_role,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  payout_id UUID REFERENCES public.doctor_payouts(id) ON DELETE SET NULL,
  payout_status payout_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent double-booking of any active slot for a doctor
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_doctor_slot
ON public.appointments (doctor_id, appointment_date, slot_time)
WHERE status IN ('pending_payment', 'verification_pending', 'confirmed', 'completed');

-- 11. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  upi_utr TEXT,
  upi_payer_vpa TEXT,
  upi_paid_to TEXT DEFAULT 'pksaji020@oksbi',
  upi_submitted_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  payment_method TEXT,
  refund_id TEXT,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  raw_webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  channel notification_channel NOT NULL DEFAULT 'sms',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. INDEXES
CREATE INDEX IF NOT EXISTS idx_doctors_search ON public.doctors(location_id, specialty_id, is_active, consultation_fee, rating DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON public.payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, sent_at DESC);

-- Storage Bucket for Doctor Photos & Hospital Logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-media', 'medical-media', true)
ON CONFLICT (id) DO NOTHING;

