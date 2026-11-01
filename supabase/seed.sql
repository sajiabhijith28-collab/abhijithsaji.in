-- ============================================================================
-- Clean Production Bootstrap Data for "My Dr"
-- Seeds ONLY Platform Settings, Indian Cities, and Medical Specialties.
-- Add your real Hospitals/Clinics and Doctors in /admin.
-- ============================================================================

INSERT INTO public.platform_settings (
  id,
  platform_fee_type,
  platform_fee_value,
  free_cancellation_hours,
  cancellation_refund_percent,
  payment_gateway_mode,
  upi_id,
  upi_payee_name,
  upi_verification_mode,
  sms_provider
) VALUES (
  1,
  'percentage',
  10.00,
  6,
  100.00,
  'upi_direct',
  'pksaji020@oksbi',
  'My Dr Healthcare',
  'admin_approval',
  'supabase_native'
) ON CONFLICT (id) DO NOTHING;

-- Locations (Ponkunnam, Kottayam District, Kerala - 686506)
INSERT INTO public.locations (id, city, area, state, pincode, latitude, longitude) VALUES
  ('11111111-1111-4111-8111-111111111101', 'Ponkunnam', 'Ponkunnam Town', 'Kerala', '686506', 9.5662, 76.7628),
  ('11111111-1111-4111-8111-111111111102', 'Ponkunnam', 'PP Road (NH 183)', 'Kerala', '686506', 9.5675, 76.7652),
  ('11111111-1111-4111-8111-111111111103', 'Ponkunnam', 'Pala Road', 'Kerala', '686506', 9.5708, 76.7595),
  ('11111111-1111-4111-8111-111111111104', 'Ponkunnam', 'KVMS Junction', 'Kerala', '686506', 9.5641, 76.7712),
  ('11111111-1111-4111-8111-111111111105', 'Ponkunnam', 'Chirakkadavu', 'Kerala', '686506', 9.5554, 76.7691)
ON CONFLICT (city, area) DO NOTHING;

-- Specialties
INSERT INTO public.specialties (id, name, slug, icon_name, description) VALUES
  ('22222222-2222-4222-8222-222222222201', 'Cardiology', 'cardiology', 'HeartPulse', 'Heart care, hypertension, preventive & interventional cardiology'),
  ('22222222-2222-4222-8222-222222222202', 'Dermatology', 'dermatology', 'Sparkles', 'Skin, hair, acne, clinical & aesthetic dermatology'),
  ('22222222-2222-4222-8222-222222222203', 'Pediatrics', 'pediatrics', 'Baby', 'Child health, vaccinations, growth & newborn care'),
  ('22222222-2222-4222-8222-222222222204', 'Orthopedics', 'orthopedics', 'Bone', 'Joint pain, sports injuries, spine & fracture care'),
  ('22222222-2222-4222-8222-222222222205', 'Gynecology', 'gynecology', 'ShieldPlus', 'Women''s health, maternity, PCOS & prenatal care'),
  ('22222222-2222-4222-8222-222222222206', 'General Physician', 'general-physician', 'Stethoscope', 'Fever, infections, diabetes, thyroid & primary care'),
  ('22222222-2222-4222-8222-222222222207', 'Neurology', 'neurology', 'Brain', 'Migraine, stroke, epilepsy & nerve disorders'),
  ('22222222-2222-4222-8222-222222222208', 'Dentistry', 'dentistry', 'Smile', 'Root canal, dental implants, aligners & oral care')
ON CONFLICT (slug) DO NOTHING;

-- Hospitals / Clinics (Ponkunnam, Kerala)
INSERT INTO public.hospitals (id, name, slug, location_id, address, phone, email, rating, is_verified, is_active) VALUES
  ('33333333-3333-4333-8333-333333333301', 'Ponkunnam Medical Centre & Specialty Clinic', 'ponkunnam-medical-centre', '11111111-1111-4111-8111-111111111101', 'Main Town, PP Road (NH 183), Ponkunnam, Kerala 686506', '+914828221000', 'care@ponkunnamclinic.in', 4.8, true, true),
  ('33333333-3333-4333-8333-333333333302', 'Ponkunnam Community Care Clinic', 'ponkunnam-community-care', '11111111-1111-4111-8111-111111111103', 'Pala Road Junction, Ponkunnam, Kerala 686506', '+914828222000', 'info@ponkunnamcare.in', 4.7, true, true)
ON CONFLICT (slug) DO NOTHING;
