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

export const CURRENT_STORE_VERSION = "prod_ponkunnam_kerala_v3";
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
    upi_verification_mode: "admin_approval",
    sms_provider: "dev_console",
    support_phone: "+91-1800-108-6937",
    support_email: "care@mydr.in",
    updated_at: now,
  };

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
    doctors: [],
    doctor_availability: [],
    doctor_leaves: [],
    platform_settings,
    appointments: [],
    payments: [],
    doctor_payouts: [],
    notifications: [],
    otp_challenges: [],
  };
}
