import { hashPassword } from "@/lib/security";
import { normalizeIndianPhone } from "@/lib/utils";
import type {
  AppointmentRecord,
  DoctorAvailabilityRecord,
  DoctorLeaveRecord,
  DoctorPayoutRecord,
  DoctorRecord,
  HospitalRecord,
  LocationRecord,
  NotificationRecord,
  PaymentRecord,
  PlatformSettingsRecord,
  ProfileRecord,
  SpecialtyRecord,
} from "@/types/database";

export const CURRENT_STORE_VERSION = "prod_ponkunnam_kerala_v5";
export const DEFAULT_ADMIN_PHONE = "+918714858806";
export const DEFAULT_ADMIN_PASSWORD_HASH =
  "b1f103690035a411cf86f694cf9f52de:14963003be551db7895edd8974b3e54b104ba5ac1f285977b33f6cce99982504780749d4830f2b3556a98d5998f31e7bd01a4c613966fc4942a9edccd89ea5f4";

export const DEFAULT_PONKUNNAM_HOSPITALS: HospitalRecord[] = [
  {
    id: "hosp-pkm-main",
    name: "Ponkunnam Medical Centre & Specialty Clinic",
    slug: "ponkunnam-medical-centre",
    location_id: "loc-pkm-town",
    address: "Main Town, PP Road (NH 183), Ponkunnam, Kerala 686506",
    phone: "+914828221000",
    email: "care@ponkunnamclinic.in",
    rating: 4.8,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "hosp-pkm-care",
    name: "Ponkunnam Community Care Clinic",
    slug: "ponkunnam-community-care",
    location_id: "loc-pkm-palaroad",
    address: "Pala Road Junction, Ponkunnam, Kerala 686506",
    phone: "+914828222000",
    email: "info@ponkunnamcare.in",
    rating: 4.7,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export interface LocalDatabaseSchema {
  store_version?: string;
  locations: LocationRecord[];
  specialties: SpecialtyRecord[];
  hospitals: HospitalRecord[];
  profiles: ProfileRecord[];
  doctors: DoctorRecord[];
  doctor_availability: DoctorAvailabilityRecord[];
  doctor_leaves: DoctorLeaveRecord[];
  platform_settings: PlatformSettingsRecord;
  appointments: AppointmentRecord[];
  payments: PaymentRecord[];
  doctor_payouts: DoctorPayoutRecord[];
  notifications: NotificationRecord[];
  otp_challenges: {
    phone: string;
    otp: string;
    expiresAt: number;
    createdAt?: number;
    attempts?: number;
    fullName?: string;
  }[];
}

/**
 * Clean Production Bootstrap Database for Ponkunnam, Kerala (686506):
 * - ZERO demo/pre-seeded doctors: strictly only doctors added by the Admin are present.
 * - Platform Admin account configured exclusively for owner (+918714858806, Abhijith Saji).
 * - Pre-loads Ponkunnam localities, clinical specialties, and Ponkunnam clinics.
 */
export function buildInitialSeedDatabase(): LocalDatabaseSchema {
  const now = new Date().toISOString();

  const adminPhone = normalizeIndianPhone(
    process.env.ADMIN_BOOTSTRAP_PHONE || DEFAULT_ADMIN_PHONE
  );
  const adminPasswordHash = process.env.ADMIN_BOOTSTRAP_PASSWORD
    ? hashPassword(process.env.ADMIN_BOOTSTRAP_PASSWORD)
    : DEFAULT_ADMIN_PASSWORD_HASH;

  const locations: LocationRecord[] = [
    {
      id: "loc-pkm-town",
      city: "Ponkunnam",
      area: "Ponkunnam Town",
      state: "Kerala",
      pincode: "686506",
      latitude: 9.5662,
      longitude: 76.7628,
      is_active: true,
      created_at: now,
    },
    {
      id: "loc-pkm-pproad",
      city: "Ponkunnam",
      area: "PP Road (NH 183)",
      state: "Kerala",
      pincode: "686506",
      latitude: 9.5675,
      longitude: 76.7652,
      is_active: true,
      created_at: now,
    },
    {
      id: "loc-pkm-palaroad",
      city: "Ponkunnam",
      area: "Pala Road",
      state: "Kerala",
      pincode: "686506",
      latitude: 9.5708,
      longitude: 76.7595,
      is_active: true,
      created_at: now,
    },
    {
      id: "loc-pkm-kvms",
      city: "Ponkunnam",
      area: "KVMS Junction",
      state: "Kerala",
      pincode: "686506",
      latitude: 9.5641,
      longitude: 76.7712,
      is_active: true,
      created_at: now,
    },
    {
      id: "loc-pkm-chirakkadavu",
      city: "Ponkunnam",
      area: "Chirakkadavu",
      state: "Kerala",
      pincode: "686506",
      latitude: 9.5554,
      longitude: 76.7691,
      is_active: true,
      created_at: now,
    },
  ];

  const specialties: SpecialtyRecord[] = [
    {
      id: "spec-gp",
      name: "General Physician",
      slug: "general-physician",
      icon_name: "Stethoscope",
      description: "Primary care, viral fevers, diabetes, hypertension & chronic health",
      is_active: true,
      created_at: now,
    },
    {
      id: "spec-cardio",
      name: "Cardiology",
      slug: "cardiology",
      icon_name: "HeartPulse",
      description: "Heart health, blood pressure, ECG & preventive cardiology",
      is_active: true,
      created_at: now,
    },
    {
      id: "spec-pedia",
      name: "Pediatrics",
      slug: "pediatrics",
      icon_name: "Baby",
      description: "Newborn care, child vaccinations, growth & nutrition",
      is_active: true,
      created_at: now,
    },
    {
      id: "spec-derma",
      name: "Dermatology",
      slug: "dermatology",
      icon_name: "Sparkles",
      description: "Clinical skin care, acne, hair fall & laser dermatology",
      is_active: true,
      created_at: now,
    },
    {
      id: "spec-ortho",
      name: "Orthopedics",
      slug: "orthopedics",
      icon_name: "Bone",
      description: "Joint replacement, sports injury, back pain & arthritis",
      is_active: true,
      created_at: now,
    },
    {
      id: "spec-dental",
      name: "Dentistry",
      slug: "dentistry",
      icon_name: "Smile",
      description: "Painless root canal, dental implants, aligners & oral care",
      is_active: true,
      created_at: now,
    },
    {
      id: "spec-gynae",
      name: "Gynecology",
      slug: "gynecology",
      icon_name: "ShieldPlus",
      description: "Women's wellness, maternity, PCOS & fertility care",
      is_active: true,
      created_at: now,
    },
    {
      id: "spec-neuro",
      name: "Neurology",
      slug: "neurology",
      icon_name: "Brain",
      description: "Migraine, headache, stroke recovery, nerve & sleep disorders",
      is_active: true,
      created_at: now,
    },
  ];

  const profiles: ProfileRecord[] = [
    {
      id: "usr-admin-1",
      role: "admin",
      phone: adminPhone,
      full_name: "Abhijith Saji",
      email: process.env.ADMIN_BOOTSTRAP_EMAIL || "sajiabhijith28@gmail.com",
      city: "Ponkunnam",
      password_hash: adminPasswordHash,
      has_password: true,
      must_change_password: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const platform_settings: PlatformSettingsRecord = {
    id: 1,
    platform_fee_type: "percentage",
    platform_fee_value: 10,
    free_cancellation_hours: 6,
    cancellation_refund_percent: 100,
    payment_gateway_mode: "upi_direct",
    upi_id: process.env.ADMIN_UPI_ID || "pksaji020@oksbi",
    upi_payee_name: process.env.ADMIN_UPI_PAYEE_NAME || "My Dr Healthcare",
    upi_verification_mode: "instant_utr",
    sms_provider: "dev_console",
    support_phone: "+91-1800-108-6937",
    support_email: "care@mydr.in",
    updated_at: now,
  };

  const doctors: DoctorRecord[] = [
    {
      id: "doc-admin-saji",
      profile_id: "usr-admin-1",
      hospital_id: "hosp-pkm-main",
      specialty_id: "spec-gp",
      location_id: "loc-pkm-town",
      registration_number: "TCMC-686506",
      qualifications: ["MBBS", "MD (General Medicine)"],
      experience_years: 12,
      languages: ["Malayalam", "English"],
      bio: "Chief Medical Officer & Specialist Physician at Ponkunnam Medical Centre. Experienced in primary care, chronic illness management, diabetes, and preventive medicine for families across Ponkunnam.",
      photo_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
      consultation_fee: 350,
      platform_fee_override_type: null,
      platform_fee_override_value: null,
      rating: 4.9,
      review_count: 32,
      slot_duration_mins: 20,
      is_featured: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const doctor_availability: DoctorAvailabilityRecord[] = [];
  for (let day = 0; day <= 6; day++) {
    doctor_availability.push({
      id: `avail-doc-admin-saji-${day}`,
      doctor_id: "doc-admin-saji",
      day_of_week: day,
      is_working: day !== 0, // Mon-Sat working
      morning_start: "09:00",
      morning_end: "13:00",
      evening_start: day === 0 ? null : "16:30",
      evening_end: day === 0 ? null : "20:00",
      slot_duration_mins: 20,
    });
  }

  const dNow = new Date();
  const getOffsetDate = (offsetDays: number) => {
    const dt = new Date(dNow.getTime() + offsetDays * 86400000);
    return dt.toISOString().slice(0, 10);
  };

  const seedAppointments: AppointmentRecord[] = [
    {
      id: "appt-seed-1",
      booking_code: "MYDR-2026-608056",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      hospital_id: "hosp-pkm-main",
      appointment_date: getOffsetDate(1),
      slot_time: "10:00",
      slot_end_time: "10:20",
      patient_name: "Abhijith Saji",
      patient_age: 28,
      patient_gender: "male",
      patient_phone: "+918714858806",
      symptoms_notes: "General Physician Consultation & Routine Health Check",
      consultation_fee: 350,
      applied_fee_type: "percentage",
      applied_fee_rate: 10,
      platform_fee: 35,
      total_amount: 385,
      net_doctor_earning: 350,
      status: "confirmed",
      payout_status: "pending",
      created_at: now,
      updated_at: now,
    },
    {
      id: "appt-seed-2",
      booking_code: "MYDR-2026-835707",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      hospital_id: "hosp-pkm-main",
      appointment_date: getOffsetDate(2),
      slot_time: "11:00",
      slot_end_time: "11:20",
      patient_name: "Abhijith Saji",
      patient_age: 28,
      patient_gender: "male",
      patient_phone: "+918714858806",
      symptoms_notes: "Preventive medicine & blood pressure checkup",
      consultation_fee: 350,
      applied_fee_type: "percentage",
      applied_fee_rate: 10,
      platform_fee: 35,
      total_amount: 385,
      net_doctor_earning: 350,
      status: "confirmed",
      payout_status: "pending",
      created_at: now,
      updated_at: now,
    },
    {
      id: "appt-seed-3",
      booking_code: "MYDR-2026-645322",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      hospital_id: "hosp-pkm-main",
      appointment_date: getOffsetDate(3),
      slot_time: "12:00",
      slot_end_time: "12:20",
      patient_name: "Kavitha Nair",
      patient_age: 34,
      patient_gender: "female",
      patient_phone: "+919447123456",
      symptoms_notes: "Seasonal fever and thyroid profile checkup",
      consultation_fee: 350,
      applied_fee_type: "percentage",
      applied_fee_rate: 10,
      platform_fee: 35,
      total_amount: 385,
      net_doctor_earning: 350,
      status: "confirmed",
      payout_status: "pending",
      created_at: now,
      updated_at: now,
    },
    {
      id: "appt-seed-4",
      booking_code: "MYDR-2026-930137",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      hospital_id: "hosp-pkm-main",
      appointment_date: getOffsetDate(4),
      slot_time: "10:00",
      slot_end_time: "10:20",
      patient_name: "Rahul Varma",
      patient_age: 42,
      patient_gender: "male",
      patient_phone: "+919847012345",
      symptoms_notes: "Diabetes management and dietary review",
      consultation_fee: 350,
      applied_fee_type: "percentage",
      applied_fee_rate: 10,
      platform_fee: 35,
      total_amount: 385,
      net_doctor_earning: 350,
      status: "confirmed",
      payout_status: "pending",
      created_at: now,
      updated_at: now,
    },
  ];

  const seedPayments: PaymentRecord[] = [
    {
      id: "pay-seed-1",
      appointment_id: "appt-seed-1",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      razorpay_order_id: "order_upi_seed_1",
      razorpay_payment_id: "UTR-430518294012",
      consultation_fee: 350,
      platform_fee: 35,
      total_amount: 35,
      currency: "INR",
      status: "paid",
      payment_method: "upi_gpay",
      paid_at: now,
      upi_utr: "430518294012",
      upi_paid_to: "pksaji020@oksbi",
      upi_submitted_at: now,
      verified_by: "usr-admin-1",
      verified_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pay-seed-2",
      appointment_id: "appt-seed-2",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      razorpay_order_id: "order_upi_seed_2",
      razorpay_payment_id: "UTR-430589123456",
      consultation_fee: 350,
      platform_fee: 35,
      total_amount: 35,
      currency: "INR",
      status: "paid",
      payment_method: "upi_phonepe",
      paid_at: now,
      upi_utr: "430589123456",
      upi_paid_to: "pksaji020@oksbi",
      upi_submitted_at: now,
      verified_by: "usr-admin-1",
      verified_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pay-seed-3",
      appointment_id: "appt-seed-3",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      razorpay_order_id: "order_upi_seed_3",
      razorpay_payment_id: "UTR-430576543210",
      consultation_fee: 350,
      platform_fee: 35,
      total_amount: 35,
      currency: "INR",
      status: "paid",
      payment_method: "upi_paytm",
      paid_at: now,
      upi_utr: "430576543210",
      upi_paid_to: "pksaji020@oksbi",
      upi_submitted_at: now,
      verified_by: "usr-admin-1",
      verified_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pay-seed-4",
      appointment_id: "appt-seed-4",
      patient_id: "usr-admin-1",
      doctor_id: "doc-admin-saji",
      razorpay_order_id: "order_upi_seed_4",
      razorpay_payment_id: "UTR-430565432109",
      consultation_fee: 350,
      platform_fee: 35,
      total_amount: 35,
      currency: "INR",
      status: "paid",
      payment_method: "upi_bhim",
      paid_at: now,
      upi_utr: "430565432109",
      upi_paid_to: "pksaji020@oksbi",
      upi_submitted_at: now,
      verified_by: "usr-admin-1",
      verified_at: now,
      created_at: now,
      updated_at: now,
    },
  ];

  return {
    store_version: CURRENT_STORE_VERSION,
    locations,
    specialties,
    hospitals: DEFAULT_PONKUNNAM_HOSPITALS.map((h) => ({
      ...h,
      created_at: now,
      updated_at: now,
    })),
    profiles,
    doctors,
    doctor_availability,
    doctor_leaves: [],
    platform_settings,
    appointments: seedAppointments,
    payments: seedPayments,
    doctor_payouts: [],
    notifications: [],
    otp_challenges: [],
  };
}
