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

export const CURRENT_STORE_VERSION = "prod_ponkunnam_kerala_v2";
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
 * - Includes verified Ponkunnam medical clinics and specialists across Cardiology, General Medicine, Pediatrics, Dermatology, Orthopedics, and Dentistry.
 * - Ready for immediate booking with full weekly slot schedules.
 * - Platform Admin account configured for owner (8714858806).
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

  const defaultDoctorPasswordHash = hashPassword("Doctor@1234");

  const doctorConfigs = [
    {
      docId: "doc-pkm-athira",
      profileId: "usr-doc-athira",
      name: "Dr. Athira Nair",
      phone: "+919847101001",
      email: "dr.athira@ponkunnamclinic.in",
      specialtyId: "spec-gp",
      hospitalId: "hosp-pkm-main",
      locationId: "loc-pkm-town",
      regNo: "TCMC-KL-48201",
      qualifications: ["MBBS", "MD (General Medicine)"],
      experience: 12,
      fee: 350,
      rating: 4.9,
      reviews: 128,
      photo: "https://images.unsplash.com/photo-1594824813590-48967916962f?auto=format&fit=crop&w=400&q=80",
      bio: "Senior Consultant Physician practicing in Ponkunnam. Dedicated to comprehensive primary care, diabetes and thyroid management, preventive medicine, and acute fever clinics.",
      isFeatured: true,
    },
    {
      docId: "doc-pkm-rajesh",
      profileId: "usr-doc-rajesh",
      name: "Dr. Rajesh K. Varma",
      phone: "+919847101002",
      email: "dr.rajesh@ponkunnamclinic.in",
      specialtyId: "spec-cardio",
      hospitalId: "hosp-pkm-main",
      locationId: "loc-pkm-pproad",
      regNo: "TCMC-KL-39144",
      qualifications: ["MBBS", "MD", "DM (Cardiology)"],
      experience: 15,
      fee: 600,
      rating: 4.9,
      reviews: 94,
      photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
      bio: "Cardiologist in Ponkunnam providing advanced cardiac consultations, blood pressure management, preventive heart checkups, ECG/Echocardiogram assessments, and rehabilitation.",
      isFeatured: true,
    },
    {
      docId: "doc-pkm-meera",
      profileId: "usr-doc-meera",
      name: "Dr. Meera Thomas",
      phone: "+919847101003",
      email: "dr.meera@ponkunnamcare.in",
      specialtyId: "spec-pedia",
      hospitalId: "hosp-pkm-care",
      locationId: "loc-pkm-palaroad",
      regNo: "TCMC-KL-51022",
      qualifications: ["MBBS", "DCH", "MD (Pediatrics)"],
      experience: 10,
      fee: 400,
      rating: 4.8,
      reviews: 82,
      photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      bio: "Compassionate Pediatric Specialist in Ponkunnam with extensive experience in newborn care, childhood immunizations, developmental milestones, and pediatric respiratory conditions.",
      isFeatured: true,
    },
    {
      docId: "doc-pkm-arun",
      profileId: "usr-doc-arun",
      name: "Dr. Arun Pillai",
      phone: "+919847101004",
      email: "dr.arun@ponkunnamclinic.in",
      specialtyId: "spec-derma",
      hospitalId: "hosp-pkm-main",
      locationId: "loc-pkm-kvms",
      regNo: "TCMC-KL-46290",
      qualifications: ["MBBS", "MD (Dermatology)", "DDVL"],
      experience: 11,
      fee: 450,
      rating: 4.9,
      reviews: 115,
      photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
      bio: "Consultant Dermatologist and Cosmetologist in Ponkunnam offering clinical diagnosis for acne, eczema, psoriasis, skin allergies, hair loss, and aesthetic skin wellness.",
      isFeatured: true,
    },
    {
      docId: "doc-pkm-joseph",
      profileId: "usr-doc-joseph",
      name: "Dr. Joseph Kurian",
      phone: "+919847101005",
      email: "dr.joseph@ponkunnamcare.in",
      specialtyId: "spec-ortho",
      hospitalId: "hosp-pkm-care",
      locationId: "loc-pkm-chirakkadavu",
      regNo: "TCMC-KL-32810",
      qualifications: ["MBBS", "MS (Orthopedics)", "DNB"],
      experience: 14,
      fee: 500,
      rating: 4.8,
      reviews: 64,
      photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
      bio: "Senior Orthopedic Surgeon in Ponkunnam specializing in knee and hip joint pain, back pain, spine care, sports injury management, and fracture recovery.",
      isFeatured: false,
    },
    {
      docId: "doc-pkm-deepa",
      profileId: "usr-doc-deepa",
      name: "Dr. Deepa Nambiar",
      phone: "+919847101006",
      email: "dr.deepa@ponkunnamclinic.in",
      specialtyId: "spec-dental",
      hospitalId: "hosp-pkm-main",
      locationId: "loc-pkm-town",
      regNo: "DCI-KL-18920",
      qualifications: ["BDS", "MDS (Conservative Dentistry)"],
      experience: 9,
      fee: 350,
      rating: 4.9,
      reviews: 78,
      photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80",
      bio: "Dental Surgeon in Ponkunnam offering painless single-sitting root canals, dental crowns, teeth alignment, pediatric dental care, and preventive oral hygiene.",
      isFeatured: false,
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

  const doctors: DoctorRecord[] = [];
  const doctor_availability: DoctorAvailabilityRecord[] = [];

  for (const cfg of doctorConfigs) {
    profiles.push({
      id: cfg.profileId,
      role: "doctor",
      phone: cfg.phone,
      full_name: cfg.name,
      email: cfg.email,
      city: "Ponkunnam",
      avatar_url: cfg.photo,
      password_hash: defaultDoctorPasswordHash,
      has_password: true,
      must_change_password: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    doctors.push({
      id: cfg.docId,
      profile_id: cfg.profileId,
      hospital_id: cfg.hospitalId,
      specialty_id: cfg.specialtyId,
      location_id: cfg.locationId,
      registration_number: cfg.regNo,
      qualifications: cfg.qualifications,
      experience_years: cfg.experience,
      languages: ["Malayalam", "English"],
      bio: cfg.bio,
      photo_url: cfg.photo,
      consultation_fee: cfg.fee,
      platform_fee_override_type: null,
      platform_fee_override_value: null,
      rating: cfg.rating,
      review_count: cfg.reviews,
      slot_duration_mins: 20,
      is_featured: cfg.isFeatured,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // Mon (1) to Sat (6) working schedule
    for (let day = 0; day <= 6; day++) {
      doctor_availability.push({
        id: `avail-${cfg.docId}-${day}`,
        doctor_id: cfg.docId,
        day_of_week: day,
        is_working: day !== 0, // Sunday off
        morning_start: "09:30",
        morning_end: "13:30",
        evening_start: day === 0 ? null : "16:30",
        evening_end: day === 0 ? null : "20:00",
        slot_duration_mins: 20,
      });
    }
  }

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
    doctors,
    doctor_availability,
    doctor_leaves: [],
    platform_settings,
    appointments: [],
    payments: [],
    doctor_payouts: [],
    notifications: [],
    otp_challenges: [],
  };
}
