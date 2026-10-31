/* @datacloud.settings
{
  "version": 1,
  "service": "SPARK",
  "connectionInfo": {},
  "dialect": "ANSI_SQL"
}
*/

-- ============================================================================
-- Migration 0002: Row Level Security (RLS) Policies on Every Table
-- Patients see only own data; Doctors see only own bookings/payouts; Admin sees all
-- ============================================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to safely inspect current role)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE profile_id = auth.uid();
$$;

-- 1. LOCATIONS, SPECIALTIES, HOSPITALS, DOCTORS, PLATFORM_SETTINGS (Public Read, Admin Write)
CREATE POLICY "Public read active locations" ON public.locations
  FOR SELECT USING (is_active = true OR public.current_user_role() = 'admin');
CREATE POLICY "Admin manage locations" ON public.locations
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Public read active specialties" ON public.specialties
  FOR SELECT USING (is_active = true OR public.current_user_role() = 'admin');
CREATE POLICY "Admin manage specialties" ON public.specialties
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Public read active hospitals" ON public.hospitals
  FOR SELECT USING (is_active = true OR public.current_user_role() = 'admin');
CREATE POLICY "Admin manage hospitals" ON public.hospitals
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Public read active doctors" ON public.doctors
  FOR SELECT USING (is_active = true OR profile_id = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Admin manage doctors" ON public.doctors
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Public read platform settings" ON public.platform_settings
  FOR SELECT USING (true);
CREATE POLICY "Admin update platform settings" ON public.platform_settings
  FOR ALL USING (public.current_user_role() = 'admin');

-- 2. DOCTOR AVAILABILITY & LEAVES (Public Read, Own Doctor or Admin Write)
CREATE POLICY "Public read doctor availability" ON public.doctor_availability
  FOR SELECT USING (true);
CREATE POLICY "Doctor or Admin manage availability" ON public.doctor_availability
  FOR ALL USING (doctor_id = public.current_doctor_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Public read doctor leaves" ON public.doctor_leaves
  FOR SELECT USING (true);
CREATE POLICY "Doctor or Admin manage leaves" ON public.doctor_leaves
  FOR ALL USING (doctor_id = public.current_doctor_id() OR public.current_user_role() = 'admin');

-- 3. PROFILES (Own Profile Read/Update, Admin All)
CREATE POLICY "Users read own profile or Admin reads all" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users insert own patient profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() AND role = 'patient');
CREATE POLICY "Admin full access profiles" ON public.profiles
  FOR ALL USING (public.current_user_role() = 'admin');

-- 4. APPOINTMENTS (Patient own, Doctor own, Admin all)
CREATE POLICY "Patients view own appointments" ON public.appointments
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Patients insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Patients cancel/reschedule own appointments" ON public.appointments
  FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY "Doctors view own appointments" ON public.appointments
  FOR SELECT USING (doctor_id = public.current_doctor_id());
CREATE POLICY "Doctors update status of own appointments" ON public.appointments
  FOR UPDATE USING (doctor_id = public.current_doctor_id());

CREATE POLICY "Admin full access appointments" ON public.appointments
  FOR ALL USING (public.current_user_role() = 'admin');

-- 5. PAYMENTS (Patient own read, Doctor own read, Admin all)
CREATE POLICY "Patients read own payments" ON public.payments
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctors read own payments" ON public.payments
  FOR SELECT USING (doctor_id = public.current_doctor_id());
CREATE POLICY "Admin full access payments" ON public.payments
  FOR ALL USING (public.current_user_role() = 'admin');

-- 6. DOCTOR PAYOUTS (Doctor own read, Admin all)
CREATE POLICY "Doctors read own payouts" ON public.doctor_payouts
  FOR SELECT USING (doctor_id = public.current_doctor_id());
CREATE POLICY "Admin full access payouts" ON public.doctor_payouts
  FOR ALL USING (public.current_user_role() = 'admin');

-- 7. NOTIFICATIONS (Own user read/update, Admin all)
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin full access notifications" ON public.notifications
  FOR ALL USING (public.current_user_role() = 'admin');
