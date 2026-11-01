import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import {
  calculateBookingFees,
  calculateCancellationRefund,
} from "@/lib/payments/fee-calculator";
import {
  generateTempDoctorPassword,
  hashPassword,
  verifyPassword,
} from "@/lib/security";
import {
  addMinutesToTime,
  formatTime12h,
  generateBookingCode,
  getLocalISODate,
  normalizeIndianPhone,
} from "@/lib/utils";
import type {
  AppointmentRecord,
  AppointmentStatus,
  AppointmentWithDetails,
  DoctorAvailabilityRecord,
  DoctorLeaveRecord,
  DoctorPayoutRecord,
  DoctorRecord,
  DoctorWithDetails,
  FeeType,
  GenderType,
  HospitalRecord,
  LocationRecord,
  NotificationRecord,
  PaymentRecord,
  PlatformSettingsRecord,
  ProfileRecord,
  PublicProfile,
  SlotItem,
  SpecialtyRecord,
  UserRole,
} from "@/types/database";
import {
  buildInitialSeedDatabase,
  CURRENT_STORE_VERSION,
  DEFAULT_ADMIN_PASSWORD_HASH,
  DEFAULT_ADMIN_PHONE,
  DEFAULT_PONKUNNAM_HOSPITALS,
  type LocalDatabaseSchema,
} from "./seed-data";

// Persist runtime store in MYDR_DATA_DIR (for Railway/VPS persistent volumes) or OS temp dir outside Next.js watcher root
const DATA_DIR =
  process.env.MYDR_DATA_DIR || path.join(os.tmpdir(), "mydr-runtime-data");
const DB_FILE = path.join(DATA_DIR, "mydr-store.json");

declare global {
  // eslint-disable-next-line no-var
  var __MYDR_MEM_DB__: LocalDatabaseSchema | undefined;
}

function ensureSettingsDefaults(db: LocalDatabaseSchema): boolean {
  let patched = false;
  const s = db.platform_settings as Partial<PlatformSettingsRecord>;
  if (!s.payment_gateway_mode) {
    s.payment_gateway_mode = "upi_direct";
    patched = true;
  }
  if (!s.upi_id) {
    s.upi_id = process.env.ADMIN_UPI_ID || "pksaji020@oksbi";
    patched = true;
  }
  if (!s.upi_payee_name) {
    s.upi_payee_name = process.env.ADMIN_UPI_PAYEE_NAME || "My Dr Healthcare";
    patched = true;
  }
  if (!s.upi_verification_mode) {
    s.upi_verification_mode = "instant_utr";
    patched = true;
  }

  // Ensure clinics exist so doctors can always be onboarded smoothly
  if (!db.hospitals || db.hospitals.length === 0) {
    const nowIso = new Date().toISOString();
    db.hospitals = DEFAULT_PONKUNNAM_HOSPITALS.map((h) => ({
      ...h,
      created_at: nowIso,
      updated_at: nowIso,
    }));
    patched = true;
  }

  // Ensure Palai locations exist in database
  const hasPalai = db.locations?.some((l) => l.city.toLowerCase() === "palai");
  if (!hasPalai) {
    if (!db.locations) db.locations = [];
    const nowIso = new Date().toISOString();
    db.locations.push(
      {
        id: "loc-palai-town",
        city: "Palai",
        area: "Palai Town",
        state: "Kerala",
        pincode: "686575",
        latitude: 9.7126,
        longitude: 76.6835,
        is_active: true,
        created_at: nowIso,
      },
      {
        id: "loc-palai-bypass",
        city: "Palai",
        area: "Main Road (Pala Bypass)",
        state: "Kerala",
        pincode: "686575",
        latitude: 9.7145,
        longitude: 76.6872,
        is_active: true,
        created_at: nowIso,
      },
      {
        id: "loc-palai-tb-junction",
        city: "Palai",
        area: "TB Junction / Hospital Road",
        state: "Kerala",
        pincode: "686575",
        latitude: 9.7108,
        longitude: 76.6811,
        is_active: true,
        created_at: nowIso,
      },
      {
        id: "loc-palai-lalam",
        city: "Palai",
        area: "Lalam",
        state: "Kerala",
        pincode: "686575",
        latitude: 9.7161,
        longitude: 76.6849,
        is_active: true,
        created_at: nowIso,
      }
    );
    patched = true;
  }

  // Ensure Palai clinics exist in database
  const hasPalaiHosp = db.hospitals?.some((h) =>
    h.location_id?.startsWith("loc-palai")
  );
  if (!hasPalaiHosp) {
    if (!db.hospitals) db.hospitals = [];
    const nowIso = new Date().toISOString();
    db.hospitals.push(
      {
        id: "hosp-palai-main",
        name: "Palai Specialty Hospital & Medical Centre",
        slug: "palai-specialty-hospital",
        location_id: "loc-palai-town",
        address: "Hospital Road, Palai, Kerala 686575",
        phone: "+914822212000",
        email: "care@palaimedical.in",
        rating: 4.8,
        is_verified: true,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: "hosp-palai-care",
        name: "Palai Medicare & Specialist Clinic",
        slug: "palai-medicare-clinic",
        location_id: "loc-palai-bypass",
        address: "Main Road (Pala Bypass), Palai, Kerala 686575",
        phone: "+914822213000",
        email: "info@palaimedicare.in",
        rating: 4.7,
        is_verified: true,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      }
    );
    patched = true;
  }

  // Upgrade legacy bootstrap admin (+919000000001) to owner's admin credentials in-place
  const adminProfile = db.profiles.find(
    (p) => p.id === "usr-admin-1" && p.role === "admin"
  );
  if (adminProfile && adminProfile.phone === "+919000000001") {
    adminProfile.phone = normalizeIndianPhone(
      process.env.ADMIN_BOOTSTRAP_PHONE || DEFAULT_ADMIN_PHONE
    );
    adminProfile.full_name = "Abhijith Saji";
    adminProfile.email =
      process.env.ADMIN_BOOTSTRAP_EMAIL || "sajiabhijith28@gmail.com";
    adminProfile.password_hash = process.env.ADMIN_BOOTSTRAP_PASSWORD
      ? hashPassword(process.env.ADMIN_BOOTSTRAP_PASSWORD)
      : DEFAULT_ADMIN_PASSWORD_HASH;
    adminProfile.updated_at = new Date().toISOString();
    patched = true;
  }

  // Ensure active appointments are populated for admin / test flows
  if (!db.appointments || db.appointments.length === 0) {
    const seed = buildInitialSeedDatabase();
    db.appointments = seed.appointments;
    db.payments = seed.payments;
    patched = true;
  }

  return patched;
}

export function loadDb(): LocalDatabaseSchema {
  if (
    global.__MYDR_MEM_DB__ &&
    global.__MYDR_MEM_DB__.store_version === CURRENT_STORE_VERSION
  ) {
    if (ensureSettingsDefaults(global.__MYDR_MEM_DB__)) {
      persistDb(global.__MYDR_MEM_DB__);
    }
    return global.__MYDR_MEM_DB__;
  }
  try {
    if (fs.existsSync(/*turbopackIgnore: true*/ DB_FILE)) {
      const raw = fs.readFileSync(/*turbopackIgnore: true*/ DB_FILE, "utf8");
      const parsed = JSON.parse(raw) as LocalDatabaseSchema;
      if (parsed.store_version === CURRENT_STORE_VERSION) {
        const migrated = ensureSettingsDefaults(parsed);
        global.__MYDR_MEM_DB__ = parsed;
        if (migrated) persistDb(parsed);
        return parsed;
      }
    }
  } catch {
    // Fallback to clean bootstrap database
  }
  const initial = buildInitialSeedDatabase();
  global.__MYDR_MEM_DB__ = initial;
  persistDb(initial);
  return initial;
}

export function persistDb(db: LocalDatabaseSchema): void {
  global.__MYDR_MEM_DB__ = db;
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ DATA_DIR)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(/*turbopackIgnore: true*/ DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch {
    // Read-only serverless filesystem (Vercel) — in-memory cache remains active
  }
}

export function toPublicProfile(p: ProfileRecord): PublicProfile {
  const { password_hash: _unused, ...rest } = p;
  void _unused;
  return rest;
}

function cleanupExpiredLocks(db: LocalDatabaseSchema): boolean {
  const nowMs = Date.now();
  let mutated = false;
  for (const appt of db.appointments) {
    if (
      appt.status === "pending_payment" &&
      appt.lock_expires_at &&
      new Date(appt.lock_expires_at).getTime() < nowMs
    ) {
      appt.status = "cancelled";
      appt.cancellation_reason = "Payment window expired";
      appt.cancelled_at = new Date().toISOString();
      appt.updated_at = appt.cancelled_at;
      mutated = true;
    }
  }
  if (mutated) persistDb(db);
  return mutated;
}

// ============================================================================
// METADATA & CATALOG QUERIES
// ============================================================================

export function getLocations(includeInactive = false): LocationRecord[] {
  const db = loadDb();
  return db.locations.filter((l) => includeInactive || l.is_active);
}

export function getSpecialties(includeInactive = false): SpecialtyRecord[] {
  const db = loadDb();
  return db.specialties.filter((s) => includeInactive || s.is_active);
}

export function getHospitals(includeInactive = false): (HospitalRecord & {
  location?: LocationRecord;
})[] {
  const db = loadDb();
  return db.hospitals
    .filter((h) => includeInactive || h.is_active)
    .map((h) => ({
      ...h,
      location: db.locations.find((l) => l.id === h.location_id),
    }));
}

export function getPlatformSettings(): PlatformSettingsRecord {
  return loadDb().platform_settings;
}

// ============================================================================
// DOCTOR ENRICHMENT, SEARCH & LIVE SLOT GENERATOR
// ============================================================================

export function enrichDoctor(
  db: LocalDatabaseSchema,
  doc: DoctorRecord
): DoctorWithDetails | null {
  const profile = db.profiles.find((p) => p.id === doc.profile_id);
  const specialty =
    db.specialties.find((s) => s.id === doc.specialty_id) || db.specialties[0];
  const hospital =
    db.hospitals.find((h) => h.id === doc.hospital_id) || db.hospitals[0];
  const location =
    db.locations.find((l) => l.id === doc.location_id) || db.locations[0];
  if (!profile || !specialty || !hospital || !location) return null;

  // Compute next available slot preview across today + next 3 days
  let nextAvailableLabel = "Check schedule";
  for (let offset = 0; offset <= 3; offset++) {
    const dt = getLocalISODate(offset);
    const slots = computeDoctorSlotsInternal(db, doc.id, dt);
    const firstOpen = slots.find((s) => s.available);
    if (firstOpen) {
      const dayPrefix =
        offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : dt;
      nextAvailableLabel = `${dayPrefix}, ${firstOpen.label}`;
      break;
    }
  }

  return {
    ...doc,
    full_name: profile.full_name,
    phone: profile.phone,
    email: profile.email,
    specialty,
    hospital,
    location,
    next_available_label: nextAvailableLabel,
  };
}

export interface DoctorSearchFilters {
  query?: string;
  city?: string;
  area?: string;
  specialtySlug?: string;
  specialtyId?: string;
  hospitalId?: string;
  date?: string; // YYYY-MM-DD
  maxFee?: number;
  minRating?: number;
  featuredOnly?: boolean;
  includeInactive?: boolean;
}

export function searchDoctors(
  filters: DoctorSearchFilters = {}
): DoctorWithDetails[] {
  const db = loadDb();
  cleanupExpiredLocks(db);

  const q = filters.query?.trim().toLowerCase();

  return db.doctors
    .filter((d) => (filters.includeInactive ? true : d.is_active))
    .map((d) => enrichDoctor(db, d))
    .filter((d): d is DoctorWithDetails => d !== null)
    .filter((d) => {
      if (filters.featuredOnly && !d.is_featured) return false;
      if (
        filters.city &&
        filters.city !== "All Cities" &&
        d.location.city.toLowerCase() !== filters.city.toLowerCase()
      ) {
        return false;
      }
      if (
        filters.area &&
        filters.area !== "All Areas" &&
        d.location.area.toLowerCase() !== filters.area.toLowerCase()
      ) {
        return false;
      }
      if (
        filters.specialtySlug &&
        filters.specialtySlug !== "all" &&
        d.specialty.slug !== filters.specialtySlug
      ) {
        return false;
      }
      if (
        filters.specialtyId &&
        filters.specialtyId !== "all" &&
        d.specialty_id !== filters.specialtyId
      ) {
        return false;
      }
      if (
        filters.hospitalId &&
        filters.hospitalId !== "all" &&
        d.hospital_id !== filters.hospitalId
      ) {
        return false;
      }
      if (
        typeof filters.maxFee === "number" &&
        filters.maxFee > 0 &&
        d.consultation_fee > filters.maxFee
      ) {
        return false;
      }
      if (
        typeof filters.minRating === "number" &&
        filters.minRating > 0 &&
        d.rating < filters.minRating
      ) {
        return false;
      }
      if (filters.date) {
        const slots = computeDoctorSlotsInternal(db, d.id, filters.date);
        if (!slots.some((s) => s.available)) return false;
      }
      if (q) {
        const hay = [
          d.full_name,
          d.specialty.name,
          d.hospital.name,
          d.location.city,
          d.location.area,
          ...d.qualifications,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.rating - a.rating);
}

export function getDoctorById(
  doctorId: string,
  includeInactive = false
): DoctorWithDetails | null {
  const db = loadDb();
  cleanupExpiredLocks(db);
  const doc = db.doctors.find(
    (d) => d.id === doctorId && (includeInactive || d.is_active)
  );
  if (!doc) return null;
  return enrichDoctor(db, doc);
}

export function getDoctorByProfileId(profileId: string): DoctorWithDetails | null {
  const db = loadDb();
  const doc = db.doctors.find((d) => d.profile_id === profileId);
  if (!doc) return null;
  return enrichDoctor(db, doc);
}

function generateShiftSlots(
  start: string | null,
  end: string | null,
  durationMins: number,
  period: "Morning" | "Evening"
): { time: string; endTime: string; period: "Morning" | "Evening" }[] {
  if (!start || !end) return [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startTotal = (sh || 0) * 60 + (sm || 0);
  const endTotal = (eh || 0) * 60 + (em || 0);
  const result: { time: string; endTime: string; period: "Morning" | "Evening" }[] = [];

  for (let cur = startTotal; cur + durationMins <= endTotal; cur += durationMins) {
    const hh = String(Math.floor(cur / 60)).padStart(2, "0");
    const mm = String(cur % 60).padStart(2, "0");
    const time = `${hh}:${mm}`;
    result.push({
      time,
      endTime: addMinutesToTime(time, durationMins),
      period,
    });
  }
  return result;
}

function computeDoctorSlotsInternal(
  db: LocalDatabaseSchema,
  doctorId: string,
  dateStr: string
): SlotItem[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return [];

  // Check if doctor is on leave
  const onLeave = db.doctor_leaves.some(
    (l) => l.doctor_id === doctorId && l.leave_date === dateStr
  );
  if (onLeave) return [];

  const dtObj = new Date(y, m - 1, d);
  const dayOfWeek = dtObj.getDay();

  const avail = db.doctor_availability.find(
    (a) => a.doctor_id === doctorId && a.day_of_week === dayOfWeek
  );
  if (!avail || !avail.is_working) return [];

  const doc = db.doctors.find((item) => item.id === doctorId);
  const duration = avail.slot_duration_mins || doc?.slot_duration_mins || 20;

  const rawSlots = [
    ...generateShiftSlots(avail.morning_start, avail.morning_end, duration, "Morning"),
    ...generateShiftSlots(avail.evening_start, avail.evening_end, duration, "Evening"),
  ];

  const activeTakenSet = new Set(
    db.appointments
      .filter(
        (a) =>
          a.doctor_id === doctorId &&
          a.appointment_date === dateStr &&
          [
            "pending_payment",
            "verification_pending",
            "confirmed",
            "completed",
          ].includes(a.status)
      )
      .map((a) => a.slot_time)
  );

  const todayStr = getLocalISODate(0);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return rawSlots.map((s) => {
    const [sh, sm] = s.time.split(":").map(Number);
    const slotMins = (sh || 0) * 60 + (sm || 0);
    const isPast = dateStr < todayStr || (dateStr === todayStr && slotMins <= nowMinutes + 10);
    const isBooked = activeTakenSet.has(s.time);
    return {
      time: s.time,
      endTime: s.endTime,
      label: formatTime12h(s.time),
      period: s.period,
      available: !isBooked && !isPast,
      isPast,
    };
  });
}

export function getDoctorSlotsForDate(doctorId: string, dateStr: string): {
  slots: SlotItem[];
  onLeaveReason?: string;
} {
  const db = loadDb();
  cleanupExpiredLocks(db);
  const leave = db.doctor_leaves.find(
    (l) => l.doctor_id === doctorId && l.leave_date === dateStr
  );
  if (leave) {
    return {
      slots: [],
      onLeaveReason: leave.reason || "Doctor is on scheduled leave on this date",
    };
  }
  return {
    slots: computeDoctorSlotsInternal(db, doctorId, dateStr),
  };
}

// ============================================================================
// AUTH, OTP & PROFILES
// ============================================================================

export function getProfileById(userId: string): ProfileRecord | null {
  const db = loadDb();
  return db.profiles.find((p) => p.id === userId) || null;
}

export function getProfileByPhone(rawPhone: string): ProfileRecord | null {
  const db = loadDb();
  const phone = normalizeIndianPhone(rawPhone);
  return db.profiles.find((p) => p.phone === phone) || null;
}

export function createOtpChallenge(params: {
  phone: string;
  fullName?: string;
}): { otp: string; normalizedPhone: string } {
  const db = loadDb();
  const normalizedPhone = normalizeIndianPhone(params.phone);
  const nowMs = Date.now();

  const existingChallenge = db.otp_challenges.find(
    (c) => c.phone === normalizedPhone && c.expiresAt > nowMs
  );
  if (
    existingChallenge?.createdAt &&
    nowMs - existingChallenge.createdAt < 15 * 1000
  ) {
    const waitSec = Math.ceil(
      (15 * 1000 - (nowMs - existingChallenge.createdAt)) / 1000
    );
    throw new Error(
      `Please wait ${waitSec}s before requesting another OTP.`
    );
  }

  const otp = String(crypto.randomInt(100000, 999999));

  db.otp_challenges = db.otp_challenges.filter(
    (c) => c.phone !== normalizedPhone && c.expiresAt > nowMs
  );
  db.otp_challenges.push({
    phone: normalizedPhone,
    otp,
    createdAt: nowMs,
    attempts: 0,
    expiresAt: nowMs + 5 * 60 * 1000,
    fullName: params.fullName,
  });
  persistDb(db);
  return { otp, normalizedPhone };
}

function consumeValidOtpOrThrow(
  db: LocalDatabaseSchema,
  normalizedPhone: string,
  otp: string
): { storedName?: string } {
  const challengeIndex = db.otp_challenges.findIndex(
    (c) => c.phone === normalizedPhone
  );

  if (challengeIndex === -1) {
    throw new Error("OTP expired or not requested. Please request a fresh OTP.");
  }

  const challenge = db.otp_challenges[challengeIndex];
  if (challenge.expiresAt < Date.now()) {
    db.otp_challenges.splice(challengeIndex, 1);
    persistDb(db);
    throw new Error("OTP has expired (5-min limit). Please request a fresh OTP.");
  }

  if (challenge.otp !== otp) {
    challenge.attempts = (challenge.attempts || 0) + 1;
    if (challenge.attempts >= 5) {
      db.otp_challenges.splice(challengeIndex, 1);
      persistDb(db);
      throw new Error(
        "Too many incorrect attempts. Please request a new 6-digit OTP."
      );
    }
    persistDb(db);
    throw new Error(
      `Incorrect 6-digit OTP (${5 - challenge.attempts} attempts remaining).`
    );
  }

  const storedName = challenge.fullName;
  db.otp_challenges.splice(challengeIndex, 1);
  return { storedName };
}

export function verifyOtpChallengeAndUpsertPatient(params: {
  phone: string;
  otp: string;
  fullName?: string;
  city?: string;
}): {
  profile: ProfileRecord;
  isNewUser: boolean;
  needsProfileSetup: boolean;
} {
  const db = loadDb();
  const normalizedPhone = normalizeIndianPhone(params.phone);

  const { storedName } = consumeValidOtpOrThrow(db, normalizedPhone, params.otp);

  let existing = db.profiles.find((p) => p.phone === normalizedPhone);
  let isNewUser = false;

  if (!existing) {
    isNewUser = true;
    const now = new Date().toISOString();
    existing = {
      id: `usr-pat-${crypto.randomUUID().slice(0, 8)}`,
      role: "patient",
      phone: normalizedPhone,
      full_name:
        params.fullName?.trim() ||
        storedName?.trim() ||
        `Patient ${normalizedPhone.slice(-4)}`,
      city: params.city || "Ponkunnam",
      has_password: false,
      must_change_password: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.profiles.push(existing);

    db.notifications.unshift({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      user_id: existing.id,
      channel: "sms",
      title: "Personal Account Verified",
      message: `Welcome to My Dr! Your mobile number ${normalizedPhone} is verified and linked to your personal healthcare account.`,
      is_read: false,
      sent_at: now,
    });
  } else if (!existing.is_active) {
    throw new Error("This account has been deactivated. Contact support.");
  } else if (params.fullName?.trim()) {
    existing.full_name = params.fullName.trim();
    if (params.city) existing.city = params.city;
    existing.updated_at = new Date().toISOString();
  }

  const needsProfileSetup =
    existing.role === "patient" &&
    (isNewUser ||
      !existing.age ||
      existing.full_name.startsWith("Patient "));

  persistDb(db);
  return { profile: existing, isNewUser, needsProfileSetup };
}

export function upsertVerifiedPatient(params: {
  phone: string;
  fullName?: string;
  city?: string;
}): {
  profile: ProfileRecord;
  isNewUser: boolean;
  needsProfileSetup: boolean;
} {
  const db = loadDb();
  const normalizedPhone = normalizeIndianPhone(params.phone);
  let existing = db.profiles.find((p) => p.phone === normalizedPhone);
  let isNewUser = false;

  if (!existing) {
    isNewUser = true;
    const now = new Date().toISOString();
    existing = {
      id: `usr-pat-${crypto.randomUUID().slice(0, 8)}`,
      role: "patient",
      phone: normalizedPhone,
      full_name:
        params.fullName?.trim() || `Patient ${normalizedPhone.slice(-4)}`,
      city: params.city || "Ponkunnam",
      has_password: false,
      must_change_password: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.profiles.push(existing);
    persistDb(db);
  } else if (!existing.is_active) {
    throw new Error("This account has been deactivated. Contact support.");
  } else if (params.fullName?.trim()) {
    existing.full_name = params.fullName.trim();
    if (params.city) existing.city = params.city;
    existing.updated_at = new Date().toISOString();
    persistDb(db);
  }

  const needsProfileSetup =
    existing.role === "patient" &&
    (isNewUser ||
      !existing.age ||
      existing.full_name.startsWith("Patient "));

  return { profile: existing, isNewUser, needsProfileSetup };
}


export function verifyAndChangePatientPhone(params: {
  userId: string;
  newPhone: string;
  otp: string;
}): ProfileRecord {
  const db = loadDb();
  const normalizedNewPhone = normalizeIndianPhone(params.newPhone);

  const duplicate = db.profiles.find(
    (p) => p.phone === normalizedNewPhone && p.id !== params.userId
  );
  if (duplicate) {
    throw new Error(
      "This mobile number is already linked to another My Dr account."
    );
  }

  consumeValidOtpOrThrow(db, normalizedNewPhone, params.otp);

  const profile = db.profiles.find((p) => p.id === params.userId);
  if (!profile) throw new Error("Account not found.");

  const oldPhone = profile.phone;
  const nowIso = new Date().toISOString();
  profile.phone = normalizedNewPhone;
  profile.updated_at = nowIso;

  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: profile.id,
    channel: "sms",
    title: "Mobile Number Updated",
    message: `Your personal account mobile number was verified via OTP and updated from ${oldPhone} to ${normalizedNewPhone}.`,
    is_read: false,
    sent_at: nowIso,
  });

  persistDb(db);
  return profile;
}

export function authenticateWithPassword(params: {
  phone: string;
  password: string;
  expectedRole?: UserRole;
}): ProfileRecord {
  const db = loadDb();
  const normalizedPhone = normalizeIndianPhone(params.phone);
  const profile = db.profiles.find((p) => p.phone === normalizedPhone);

  if (!profile) {
    throw new Error("No account found for this mobile number.");
  }
  if (!profile.is_active) {
    throw new Error("Account is currently deactivated. Please contact admin.");
  }
  if (!profile.has_password || !profile.password_hash) {
    throw new Error(
      "Password login is not set up yet. Please sign in with Mobile + OTP first, then set a password."
    );
  }
  if (!verifyPassword(params.password, profile.password_hash)) {
    throw new Error("Invalid mobile number or password.");
  }
  if (
    params.expectedRole &&
    profile.role !== params.expectedRole &&
    profile.role !== "admin"
  ) {
    throw new Error(
      `Access denied: This account does not have ${params.expectedRole} privileges.`
    );
  }
  return profile;
}

export function updateUserPassword(params: {
  userId: string;
  currentPassword?: string;
  newPassword: string;
}): ProfileRecord {
  const db = loadDb();
  const profile = db.profiles.find((p) => p.id === params.userId);
  if (!profile) throw new Error("User not found");

  if (
    profile.has_password &&
    profile.password_hash &&
    !profile.must_change_password &&
    params.currentPassword
  ) {
    if (!verifyPassword(params.currentPassword, profile.password_hash)) {
      throw new Error("Current password is incorrect.");
    }
  }

  profile.password_hash = hashPassword(params.newPassword);
  profile.has_password = true;
  profile.must_change_password = false;
  profile.updated_at = new Date().toISOString();
  persistDb(db);
  return profile;
}

export function updatePatientProfile(
  userId: string,
  updates: {
    full_name: string;
    email?: string;
    age: number;
    gender: GenderType;
    blood_group?: string;
    emergency_contact?: string;
    city: string;
    area?: string;
    avatar_url?: string;
  }
): ProfileRecord {
  const db = loadDb();
  const profile = db.profiles.find((p) => p.id === userId);
  if (!profile) throw new Error("Profile not found");

  profile.full_name = updates.full_name;
  profile.email = updates.email || undefined;
  profile.age = updates.age;
  profile.gender = updates.gender;
  profile.blood_group = updates.blood_group || undefined;
  profile.emergency_contact = updates.emergency_contact || undefined;
  profile.city = updates.city;
  profile.area = updates.area || undefined;
  if (updates.avatar_url !== undefined) {
    profile.avatar_url = updates.avatar_url || undefined;
  }
  profile.updated_at = new Date().toISOString();
  persistDb(db);
  return profile;
}

// ============================================================================
// BOOKINGS, DOUBLE-BOOKING PROTECTION & PAYMENTS
// ============================================================================

export function enrichAppointment(
  db: LocalDatabaseSchema,
  appt: AppointmentRecord
): AppointmentWithDetails {
  const doc = db.doctors.find((d) => d.id === appt.doctor_id);
  const docProfile = doc
    ? db.profiles.find((p) => p.id === doc.profile_id)
    : undefined;
  const spec = doc
    ? db.specialties.find((s) => s.id === doc.specialty_id)
    : undefined;
  const hosp = db.hospitals.find((h) => h.id === appt.hospital_id);
  const loc = doc
    ? db.locations.find((l) => l.id === doc.location_id)
    : undefined;
  const payment = db.payments.find((p) => p.appointment_id === appt.id);

  return {
    ...appt,
    doctor_name: docProfile?.full_name || "Doctor",
    doctor_photo:
      doc?.photo_url ||
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
    doctor_qualifications: doc?.qualifications || ["MBBS"],
    specialty_name: spec?.name || "General Consultation",
    hospital_name: hosp?.name || "Partner Clinic",
    hospital_address: hosp?.address || "",
    city: loc?.city || "",
    area: loc?.area || "",
    payment,
  };
}

export function createBookingLockAndOrder(params: {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  slotTime: string;
  patientName: string;
  patientAge: number;
  patientGender: GenderType;
  patientPhone: string;
  symptomsNotes?: string;
  razorpayOrderId: string;
  payAtClinic?: boolean;
}): { appointment: AppointmentWithDetails; payment: PaymentRecord } {
  const db = loadDb();
  cleanupExpiredLocks(db);

  const doc = db.doctors.find((d) => d.id === params.doctorId && d.is_active);
  if (!doc) {
    throw new Error("Selected doctor is currently unavailable.");
  }

  // Check leave
  const onLeave = db.doctor_leaves.some(
    (l) =>
      l.doctor_id === params.doctorId && l.leave_date === params.appointmentDate
  );
  if (onLeave) {
    throw new Error("Doctor is on leave on the chosen date. Please select another date.");
  }

  // Prevent Double Booking (Atomic uniqueness check matching SQL partial unique index)
  const conflict = db.appointments.find(
    (a) =>
      a.doctor_id === params.doctorId &&
      a.appointment_date === params.appointmentDate &&
      a.slot_time === params.slotTime &&
      [
        "pending_payment",
        "verification_pending",
        "confirmed",
        "completed",
      ].includes(a.status)
  );

  if (conflict) {
    throw new Error(
      "This slot was just reserved by another patient! Please select a different slot."
    );
  }

  // Snapshot fees at checkout creation so future fee changes NEVER alter historical bookings
  const feeBreakdown = calculateBookingFees(doc, db.platform_settings);
  const now = new Date();
  const nowIso = now.toISOString();
  // 24 hours payment window so patient bookings are preserved safely and not aggressively dropped
  const lockExpiresIso = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const isZeroOnlineFee =
    feeBreakdown.onlinePayable <= 0 || params.payAtClinic === true;

  const appt: AppointmentRecord = {
    id: `appt-${crypto.randomUUID().slice(0, 8)}`,
    booking_code: generateBookingCode(),
    patient_id: params.patientId,
    doctor_id: doc.id,
    hospital_id: doc.hospital_id,
    appointment_date: params.appointmentDate,
    slot_time: params.slotTime,
    slot_end_time: addMinutesToTime(params.slotTime, doc.slot_duration_mins),
    patient_name: params.patientName,
    patient_age: params.patientAge,
    patient_gender: params.patientGender,
    patient_phone: normalizeIndianPhone(params.patientPhone),
    symptoms_notes: params.symptomsNotes,
    consultation_fee: feeBreakdown.consultationFee,
    applied_fee_type: feeBreakdown.appliedFeeType,
    applied_fee_rate: feeBreakdown.appliedFeeRate,
    platform_fee: feeBreakdown.platformFee,
    total_amount: feeBreakdown.totalAmount,
    net_doctor_earning: feeBreakdown.netDoctorEarning,
    status: isZeroOnlineFee ? "confirmed" : "pending_payment",
    lock_expires_at: isZeroOnlineFee ? undefined : lockExpiresIso,
    payout_status: "pending",
    created_at: nowIso,
    updated_at: nowIso,
  };

  // Online Razorpay payment collects ONLY the Platform Booking Fee;
  // Doctor Consultation Fee is paid directly at the clinic counter.
  const payment: PaymentRecord = {
    id: `pay-${crypto.randomUUID().slice(0, 8)}`,
    appointment_id: appt.id,
    patient_id: params.patientId,
    doctor_id: doc.id,
    razorpay_order_id: params.razorpayOrderId,
    razorpay_payment_id: isZeroOnlineFee
      ? `pay_clinic_${crypto.randomUUID().slice(0, 8)}`
      : undefined,
    consultation_fee: feeBreakdown.consultationFee,
    platform_fee: feeBreakdown.platformFee,
    total_amount: feeBreakdown.onlinePayable,
    currency: "INR",
    status: isZeroOnlineFee ? "paid" : "created",
    payment_method: "direct_to_doctor",
    paid_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  db.appointments.unshift(appt);
  db.payments.unshift(payment);

  const enriched = enrichAppointment(db, appt);

  // Dispatch confirmation notification for patient
  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: appt.patient_id,
    appointment_id: appt.id,
    channel: "sms",
    title: `Booking Confirmed — ${appt.booking_code}`,
    message: `Appointment confirmed with ${enriched.doctor_name} at ${enriched.hospital_name} on ${appt.appointment_date} at ${formatTime12h(appt.slot_time)}. Please give consultation fee of ₹${appt.consultation_fee} and platform fee of ₹${appt.platform_fee} (Total: ₹${appt.total_amount}) directly to the doctor at the clinic.`,
    is_read: false,
    sent_at: nowIso,
  });

  persistDb(db);

  return {
    appointment: enriched,
    payment,
  };
}

export function confirmBookingPayment(params: {
  appointmentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string;
}): AppointmentWithDetails {
  const db = loadDb();
  const appt = db.appointments.find((a) => a.id === params.appointmentId);
  if (!appt) throw new Error("Booking not found.");

  const pay = db.payments.find(
    (p) =>
      p.appointment_id === appt.id &&
      p.razorpay_order_id === params.razorpayOrderId
  );
  if (!pay) throw new Error("Payment order record not found.");

  const nowIso = new Date().toISOString();
  appt.status = "confirmed";
  appt.lock_expires_at = undefined;
  appt.updated_at = nowIso;

  pay.status = "paid";
  pay.razorpay_payment_id = params.razorpayPaymentId;
  pay.razorpay_signature = params.razorpaySignature;
  pay.payment_method = params.paymentMethod || "upi";
  pay.paid_at = nowIso;
  pay.updated_at = nowIso;

  const enriched = enrichAppointment(db, appt);

  // Dispatch SMS/In-App confirmation notification hook
  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: appt.patient_id,
    appointment_id: appt.id,
    channel: "sms",
    title: `Booking Confirmed — ${appt.booking_code}`,
    message: `Confirmed with ${enriched.doctor_name} at ${enriched.hospital_name} on ${appt.appointment_date} at ${formatTime12h(appt.slot_time)}. Paid ₹${appt.platform_fee} platform fee online • Pay ₹${appt.consultation_fee} consultation fee at the clinic.`,
    is_read: false,
    sent_at: nowIso,
  });

  persistDb(db);
  return enriched;
}

export function submitUpiPaymentForVerification(params: {
  appointmentId: string;
  actorUserId: string;
  actorRole: UserRole;
  upiUtr: string;
  upiPayerVpa?: string;
  upiApp?: string;
}): { appointment: AppointmentWithDetails; payment: PaymentRecord } {
  const db = loadDb();
  cleanupExpiredLocks(db);

  const appt = db.appointments.find((a) => a.id === params.appointmentId);
  if (!appt) {
    throw new Error("Booking not found.");
  }
  if (params.actorRole === "patient" && appt.patient_id !== params.actorUserId) {
    throw new Error("Unauthorized booking access.");
  }
  if (appt.status === "cancelled" || appt.status === "completed") {
    throw new Error(
      `This booking is already ${appt.status}. Please lock a new slot.`
    );
  }
  if (appt.status === "confirmed") {
    const existingPay = db.payments.find((p) => p.appointment_id === appt.id)!;
    return { appointment: enrichAppointment(db, appt), payment: existingPay };
  }

  const normalizedUtr =
    params.upiUtr?.trim() || `VERIFY-${Date.now().toString().slice(-6)}`;
  // Prevent duplicate UTR reuse across bookings (ignoring auto-generated verification tags)
  const isAutoTag =
    normalizedUtr.startsWith("VERIFY-") || normalizedUtr.startsWith("UTR-");
  const duplicateUtr =
    !isAutoTag &&
    db.payments.find(
      (p) =>
        p.appointment_id !== appt.id &&
        p.upi_utr === normalizedUtr &&
        p.status !== "failed"
    );
  if (duplicateUtr) {
    throw new Error(
      "This UPI UTR / Reference has already been submitted on another booking."
    );
  }

  const pay = db.payments.find((p) => p.appointment_id === appt.id);
  if (!pay) {
    throw new Error("Payment record not found for this booking.");
  }

  const nowIso = new Date().toISOString();
  const isInstant = db.platform_settings.upi_verification_mode === "instant_utr";
  const receivingUpi = db.platform_settings.upi_id || "pksaji020@oksbi";

  pay.upi_utr = normalizedUtr;
  pay.upi_payer_vpa = params.upiPayerVpa?.trim() || undefined;
  pay.upi_paid_to = receivingUpi;
  pay.upi_submitted_at = nowIso;
  pay.razorpay_payment_id = `UTR-${normalizedUtr}`;
  pay.payment_method = params.upiApp
    ? `upi_${params.upiApp.toLowerCase()}`
    : "upi_direct";

  if (isInstant) {
    pay.status = "paid";
    pay.paid_at = nowIso;
    pay.updated_at = nowIso;

    appt.status = "confirmed";
    appt.lock_expires_at = undefined;
    appt.updated_at = nowIso;
  } else {
    // Hold slot indefinitely until Admin clicks Approve in /admin/payments
    pay.status = "verification_pending";
    pay.updated_at = nowIso;

    appt.status = "verification_pending";
    appt.lock_expires_at = undefined;
    appt.updated_at = nowIso;
  }

  const enriched = enrichAppointment(db, appt);

  if (isInstant) {
    db.notifications.unshift({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      user_id: appt.patient_id,
      appointment_id: appt.id,
      channel: "sms",
      title: `Booking Confirmed — ${appt.booking_code}`,
      message: `Confirmed with ${enriched.doctor_name} on ${appt.appointment_date} at ${formatTime12h(appt.slot_time)} (UPI UTR: ${normalizedUtr}). Pay ₹${appt.consultation_fee} consultation fee at the clinic.`,
      is_read: false,
      sent_at: nowIso,
    });
  } else {
    // Notify patient that slot is safely held pending Admin verification
    db.notifications.unshift({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      user_id: appt.patient_id,
      appointment_id: appt.id,
      channel: "in_app",
      title: `Payment Verification Pending — ${appt.booking_code}`,
      message: `Your ₹${appt.platform_fee} UPI payment (UTR: ${normalizedUtr} to ${receivingUpi}) has been submitted. Your slot with ${enriched.doctor_name} is reserved while Admin verifies the payment.`,
      is_read: false,
      sent_at: nowIso,
    });

    // Notify all Admin accounts to approve in /admin/payments
    for (const admin of db.profiles.filter((p) => p.role === "admin")) {
      db.notifications.unshift({
        id: `notif-${crypto.randomUUID().slice(0, 8)}`,
        user_id: admin.id,
        appointment_id: appt.id,
        channel: "in_app",
        title: `Approve UPI UTR ${normalizedUtr} (${appt.booking_code})`,
        message: `${appt.patient_name} submitted ₹${appt.platform_fee} to ${receivingUpi} for ${enriched.doctor_name}. Review & click Approve in Admin → Payments.`,
        is_read: false,
        sent_at: nowIso,
      });
    }
  }

  persistDb(db);
  return { appointment: enriched, payment: pay };
}

export function adminVerifyUpiPayment(params: {
  paymentId: string;
  adminUserId: string;
  action: "approve" | "reject";
  reason?: string;
}): { appointment: AppointmentWithDetails; payment: PaymentRecord } {
  const db = loadDb();
  const pay = db.payments.find((p) => p.id === params.paymentId);
  if (!pay) {
    throw new Error("Payment record not found.");
  }

  const appt = db.appointments.find((a) => a.id === pay.appointment_id);
  if (!appt) {
    throw new Error("Associated booking not found.");
  }

  const nowIso = new Date().toISOString();

  if (params.action === "approve") {
    pay.status = "paid";
    pay.paid_at = nowIso;
    pay.verified_by = params.adminUserId;
    pay.verified_at = nowIso;
    pay.rejection_reason = undefined;
    pay.updated_at = nowIso;

    appt.status = "confirmed";
    appt.lock_expires_at = undefined;
    appt.updated_at = nowIso;

    const enriched = enrichAppointment(db, appt);

    db.notifications.unshift({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      user_id: appt.patient_id,
      appointment_id: appt.id,
      channel: "sms",
      title: `UPI Payment Verified & Booking Confirmed — ${appt.booking_code}`,
      message: `Your ₹${appt.platform_fee} UPI payment (UTR: ${pay.upi_utr || "Verified"}) is approved! Appointment confirmed with ${enriched.doctor_name} at ${enriched.hospital_name} on ${appt.appointment_date} at ${formatTime12h(appt.slot_time)}. Pay ₹${appt.consultation_fee} consultation fee at the clinic.`,
      is_read: false,
      sent_at: nowIso,
    });

    persistDb(db);
    return { appointment: enriched, payment: pay };
  }

  // Reject invalid / unreceived UTR & release slot
  const rejectNote =
    params.reason?.trim() ||
    "UPI UTR could not be verified in receiving bank account";

  pay.status = "failed";
  pay.verified_by = params.adminUserId;
  pay.verified_at = nowIso;
  pay.rejection_reason = rejectNote;
  pay.updated_at = nowIso;

  appt.status = "cancelled";
  appt.cancelled_by_role = "admin";
  appt.cancelled_at = nowIso;
  appt.cancellation_reason = `Payment verification failed: ${rejectNote}`;
  appt.lock_expires_at = undefined;
  appt.updated_at = nowIso;

  const enriched = enrichAppointment(db, appt);

  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: appt.patient_id,
    appointment_id: appt.id,
    channel: "sms",
    title: `UPI Payment Not Verified — ${appt.booking_code}`,
    message: `Your booking ${appt.booking_code} could not be confirmed: ${rejectNote}. Please book again with a valid UPI transaction reference.`,
    is_read: false,
    sent_at: nowIso,
  });

  persistDb(db);
  return { appointment: enriched, payment: pay };
}

export function getAppointmentById(
  appointmentId: string
): AppointmentWithDetails | null {
  const db = loadDb();
  cleanupExpiredLocks(db);
  const appt = db.appointments.find((a) => a.id === appointmentId);
  if (!appt) return null;
  return enrichAppointment(db, appt);
}

export function getPatientAppointments(
  patientId: string
): AppointmentWithDetails[] {
  const db = loadDb();
  cleanupExpiredLocks(db);
  const patient = db.profiles.find((p) => p.id === patientId);
  const patientPhone = patient?.phone || null;
  const normalizedUserPhone = patientPhone
    ? normalizeIndianPhone(patientPhone)
    : null;

  return db.appointments
    .filter((a) => {
      if (a.patient_id === patientId) return true;
      if (normalizedUserPhone && a.patient_phone) {
        return normalizeIndianPhone(a.patient_phone) === normalizedUserPhone;
      }
      return false;
    })
    .map((a) => enrichAppointment(db, a))
    .sort((a, b) =>
      `${b.appointment_date} ${b.slot_time}`.localeCompare(
        `${a.appointment_date} ${a.slot_time}`
      )
    );
}

export function syncClientBookings(
  incoming: AppointmentWithDetails[]
): number {
  if (!Array.isArray(incoming) || incoming.length === 0) return 0;
  const db = loadDb();
  let count = 0;
  for (const item of incoming) {
    if (!item.id || !item.booking_code) continue;
    const exists = db.appointments.find(
      (a) => a.id === item.id || a.booking_code === item.booking_code
    );
    if (!exists) {
      const {
        payment,
        doctor_name,
        doctor_photo,
        doctor_qualifications,
        specialty_name,
        hospital_name,
        hospital_address,
        city,
        area,
        ...record
      } = item;
      void doctor_name;
      void doctor_photo;
      void doctor_qualifications;
      void specialty_name;
      void hospital_name;
      void hospital_address;
      void city;
      void area;
      db.appointments.unshift(record as AppointmentRecord);
      if (payment && !db.payments.find((p) => p.id === payment.id)) {
        db.payments.unshift(payment);
      }
      count++;
    }
  }
  if (count > 0) persistDb(db);
  return count;
}

export function getUserNotifications(userId: string): NotificationRecord[] {
  const db = loadDb();
  return db.notifications
    .filter((n) => n.user_id === userId)
    .sort((a, b) => b.sent_at.localeCompare(a.sent_at));
}

export function cancelAppointmentWithRefund(params: {
  appointmentId: string;
  actorUserId: string;
  actorRole: UserRole;
  reason?: string;
}): { appointment: AppointmentWithDetails; refundAmount: number } {
  const db = loadDb();
  const appt = db.appointments.find((a) => a.id === params.appointmentId);
  if (!appt) throw new Error("Appointment not found.");

  if (params.actorRole === "patient" && appt.patient_id !== params.actorUserId) {
    throw new Error("Unauthorized to cancel this appointment.");
  }
  if (params.actorRole === "doctor") {
    const doc = db.doctors.find((d) => d.profile_id === params.actorUserId);
    if (!doc || doc.id !== appt.doctor_id) {
      throw new Error("Unauthorized doctor access.");
    }
  }
  if (appt.status === "cancelled" || appt.status === "completed") {
    throw new Error(`Cannot cancel a ${appt.status} appointment.`);
  }

  const nowIso = new Date().toISOString();
  const payment = db.payments.find((p) => p.appointment_id === appt.id);
  let refundAmount = 0;

  if (payment && payment.status === "verification_pending") {
    payment.status = "failed";
    payment.rejection_reason = params.reason || `Cancelled by ${params.actorRole} prior to UPI verification`;
    payment.updated_at = nowIso;
  } else if (payment && payment.status === "paid") {
    const calc = calculateCancellationRefund({
      appointmentDate: appt.appointment_date,
      slotTime: appt.slot_time,
      totalPaid: payment.total_amount,
      cancelledByRole: params.actorRole,
      freeCancellationHours: db.platform_settings.free_cancellation_hours,
      cancellationRefundPercent: db.platform_settings.cancellation_refund_percent,
    });
    refundAmount = calc.refundAmount;
    if (refundAmount > 0) {
      payment.status =
        refundAmount >= payment.total_amount ? "refunded" : "partially_refunded";
      payment.refund_id = `rfnd_${crypto.randomUUID().slice(0, 10)}`;
      payment.refund_amount = refundAmount;
      payment.refund_reason = params.reason
        ? `${params.reason} — ${calc.reasonNote}`
        : calc.reasonNote;
      payment.refunded_at = nowIso;
      payment.updated_at = nowIso;
    }
  }

  appt.status = "cancelled";
  appt.cancellation_reason = params.reason || `Cancelled by ${params.actorRole}`;
  appt.cancelled_by_role = params.actorRole;
  appt.cancelled_at = nowIso;
  appt.updated_at = nowIso;

  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: appt.patient_id,
    appointment_id: appt.id,
    channel: "sms",
    title: `Booking Cancelled — ${appt.booking_code}`,
    message:
      refundAmount > 0
        ? `Your booking ${appt.booking_code} has been cancelled. Refund of ₹${refundAmount} initiated.`
        : `Your booking ${appt.booking_code} has been cancelled.`,
    is_read: false,
    sent_at: nowIso,
  });

  persistDb(db);
  return {
    appointment: enrichAppointment(db, appt),
    refundAmount,
  };
}

export function reschedulePatientAppointment(params: {
  appointmentId: string;
  patientId: string;
  newDate: string;
  newSlotTime: string;
}): AppointmentWithDetails {
  const db = loadDb();
  cleanupExpiredLocks(db);

  const appt = db.appointments.find((a) => a.id === params.appointmentId);
  if (!appt || appt.patient_id !== params.patientId) {
    throw new Error("Appointment not found.");
  }
  if (appt.status !== "confirmed") {
    throw new Error("Only confirmed appointments can be rescheduled.");
  }

  const conflict = db.appointments.find(
    (a) =>
      a.id !== appt.id &&
      a.doctor_id === appt.doctor_id &&
      a.appointment_date === params.newDate &&
      a.slot_time === params.newSlotTime &&
      [
        "pending_payment",
        "verification_pending",
        "confirmed",
        "completed",
      ].includes(a.status)
  );
  if (conflict) {
    throw new Error("The selected new slot is already booked. Please choose another slot.");
  }

  const doc = db.doctors.find((d) => d.id === appt.doctor_id);
  const duration = doc?.slot_duration_mins || 20;
  const nowIso = new Date().toISOString();

  appt.appointment_date = params.newDate;
  appt.slot_time = params.newSlotTime;
  appt.slot_end_time = addMinutesToTime(params.newSlotTime, duration);
  appt.updated_at = nowIso;

  const enriched = enrichAppointment(db, appt);

  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: appt.patient_id,
    appointment_id: appt.id,
    channel: "sms",
    title: `Rescheduled — ${appt.booking_code}`,
    message: `Your appointment with ${enriched.doctor_name} is moved to ${params.newDate} at ${formatTime12h(params.newSlotTime)}.`,
    is_read: false,
    sent_at: nowIso,
  });

  persistDb(db);
  return enriched;
}

export function confirmPayAtClinic(params: {
  appointmentId: string;
  actorUserId: string;
}): { appointment: AppointmentWithDetails; payment: PaymentRecord } {
  const db = loadDb();
  cleanupExpiredLocks(db);

  const appt = db.appointments.find((a) => a.id === params.appointmentId);
  if (!appt) {
    throw new Error("Appointment not found");
  }

  const nowIso = new Date().toISOString();
  appt.status = "confirmed";
  appt.lock_expires_at = undefined;
  appt.updated_at = nowIso;

  let pay = db.payments.find((p) => p.appointment_id === appt.id);
  if (!pay) {
    pay = {
      id: `pay-${crypto.randomUUID().slice(0, 8)}`,
      appointment_id: appt.id,
      patient_id: appt.patient_id,
      doctor_id: appt.doctor_id,
      razorpay_order_id: `order_clinic_${crypto.randomUUID().slice(0, 8)}`,
      razorpay_payment_id: `pay_clinic_${crypto.randomUUID().slice(0, 8)}`,
      consultation_fee: appt.consultation_fee,
      platform_fee: appt.platform_fee,
      total_amount: 0,
      currency: "INR",
      status: "paid",
      payment_method: "clinic_reception",
      paid_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };
    db.payments.push(pay);
  } else {
    pay.status = "paid";
    pay.payment_method = "clinic_reception";
    pay.total_amount = 0;
    pay.paid_at = nowIso;
    pay.updated_at = nowIso;
  }

  const enriched = enrichAppointment(db, appt);
  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: appt.patient_id,
    appointment_id: appt.id,
    channel: "sms",
    title: `Confirmed (Pay at Clinic) — ${appt.booking_code}`,
    message: `Your appointment with ${enriched.doctor_name} at ${enriched.hospital_name} on ${appt.appointment_date} at ${formatTime12h(appt.slot_time)} is confirmed! Consultation fee of ?${appt.consultation_fee} payable directly at the clinic counter.`,
    is_read: false,
    sent_at: nowIso,
  });

  persistDb(db);
  return { appointment: enriched, payment: pay };
}

// ============================================================================
// DOCTOR PORTAL OPERATIONS
// ============================================================================

export function getDoctorAppointments(doctorId: string): AppointmentWithDetails[] {
  const db = loadDb();
  cleanupExpiredLocks(db);
  return db.appointments
    .filter((a) => a.doctor_id === doctorId)
    .map((a) => enrichAppointment(db, a))
    .sort((a, b) =>
      `${a.appointment_date} ${a.slot_time}`.localeCompare(
        `${b.appointment_date} ${b.slot_time}`
      )
    );
}

export function updateAppointmentStatusByStaff(params: {
  appointmentId: string;
  actorUserId: string;
  actorRole: "doctor" | "admin";
  status: AppointmentStatus;
  reason?: string;
}): AppointmentWithDetails {
  const db = loadDb();
  const appt = db.appointments.find((a) => a.id === params.appointmentId);
  if (!appt) throw new Error("Appointment not found.");

  if (params.actorRole === "doctor") {
    const doc = db.doctors.find((d) => d.profile_id === params.actorUserId);
    if (!doc || doc.id !== appt.doctor_id) {
      throw new Error("Unauthorized doctor access.");
    }
  }

  if (params.status === "cancelled") {
    return cancelAppointmentWithRefund({
      appointmentId: params.appointmentId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      reason: params.reason,
    }).appointment;
  }

  const nowIso = new Date().toISOString();
  appt.status = params.status;
  if (params.status === "completed") {
    appt.completed_at = nowIso;
  }
  if (params.status === "confirmed") {
    appt.lock_expires_at = undefined;
    appt.cancellation_reason = undefined;
    appt.cancelled_at = undefined;
    const pay = db.payments.find((p) => p.appointment_id === appt.id);
    if (pay) {
      pay.status = "paid";
      pay.paid_at = pay.paid_at || nowIso;
      pay.verified_by = params.actorUserId;
      pay.verified_at = nowIso;
      pay.rejection_reason = undefined;
      pay.updated_at = nowIso;
    }
  }
  appt.updated_at = nowIso;
  persistDb(db);
  return enrichAppointment(db, appt);
}

export function getDoctorAvailabilitySchedule(doctorId: string): {
  days: DoctorAvailabilityRecord[];
  leaves: DoctorLeaveRecord[];
  slotDurationMins: number;
} {
  const db = loadDb();
  const doc = db.doctors.find((d) => d.id === doctorId);
  const days = db.doctor_availability
    .filter((a) => a.doctor_id === doctorId)
    .sort((a, b) => a.day_of_week - b.day_of_week);
  const leaves = db.doctor_leaves
    .filter((l) => l.doctor_id === doctorId)
    .sort((a, b) => a.leave_date.localeCompare(b.leave_date));

  return {
    days,
    leaves,
    slotDurationMins: doc?.slot_duration_mins || 20,
  };
}

export function saveDoctorAvailabilitySchedule(params: {
  doctorId: string;
  slotDurationMins: number;
  days: Omit<DoctorAvailabilityRecord, "id" | "doctor_id">[];
}): void {
  const db = loadDb();
  const doc = db.doctors.find((d) => d.id === params.doctorId);
  if (!doc) throw new Error("Doctor not found");

  doc.slot_duration_mins = params.slotDurationMins;
  doc.updated_at = new Date().toISOString();

  db.doctor_availability = db.doctor_availability.filter(
    (a) => a.doctor_id !== params.doctorId
  );
  for (const day of params.days) {
    db.doctor_availability.push({
      id: `avail-${params.doctorId}-${day.day_of_week}`,
      doctor_id: params.doctorId,
      day_of_week: day.day_of_week,
      is_working: day.is_working,
      morning_start: day.morning_start,
      morning_end: day.morning_end,
      evening_start: day.evening_start,
      evening_end: day.evening_end,
      slot_duration_mins: params.slotDurationMins,
    });
  }
  persistDb(db);
}

export function addDoctorLeave(params: {
  doctorId: string;
  leaveDate: string;
  reason?: string;
}): DoctorLeaveRecord {
  const db = loadDb();
  const exists = db.doctor_leaves.find(
    (l) => l.doctor_id === params.doctorId && l.leave_date === params.leaveDate
  );
  if (exists) throw new Error("This date is already marked as leave.");

  const rec: DoctorLeaveRecord = {
    id: `leave-${crypto.randomUUID().slice(0, 8)}`,
    doctor_id: params.doctorId,
    leave_date: params.leaveDate,
    reason: params.reason || "Personal Leave",
    created_at: new Date().toISOString(),
  };
  db.doctor_leaves.push(rec);
  persistDb(db);
  return rec;
}

export function removeDoctorLeave(doctorId: string, leaveId: string): void {
  const db = loadDb();
  db.doctor_leaves = db.doctor_leaves.filter(
    (l) => !(l.id === leaveId && l.doctor_id === doctorId)
  );
  persistDb(db);
}

export function getDoctorEarningsData(doctorId: string) {
  const db = loadDb();
  const billableAppts = db.appointments.filter(
    (a) =>
      a.doctor_id === doctorId &&
      (a.status === "completed" || a.status === "confirmed")
  );

  const grossCollected = billableAppts.reduce((sum, a) => sum + a.total_amount, 0);
  const platformFeeDeducted = billableAppts.reduce(
    (sum, a) => sum + a.platform_fee,
    0
  );
  const netPayableTotal = billableAppts.reduce(
    (sum, a) => sum + a.net_doctor_earning,
    0
  );
  const settledAmount = billableAppts
    .filter((a) => a.payout_status === "settled")
    .reduce((sum, a) => sum + a.net_doctor_earning, 0);
  const pendingPayoutAmount = billableAppts
    .filter((a) => a.payout_status === "pending")
    .reduce((sum, a) => sum + a.net_doctor_earning, 0);

  const payouts = db.doctor_payouts
    .filter((p) => p.doctor_id === doctorId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    grossCollected,
    platformFeeDeducted,
    netPayableTotal,
    settledAmount,
    pendingPayoutAmount,
    billableCount: billableAppts.length,
    payouts,
    appointments: billableAppts.map((a) => enrichAppointment(db, a)),
  };
}

// ============================================================================
// ADMIN PORTAL OPERATIONS & ANALYTICS
// ============================================================================

export function adminUpsertDoctor(input: {
  id?: string;
  full_name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  specialty_id: string;
  hospital_id?: string;
  new_hospital_name?: string;
  location_id: string;
  registration_number: string;
  qualifications: string[];
  experience_years: number;
  languages: string[];
  bio?: string;
  consultation_fee: number;
  slot_duration_mins: number;
  platform_fee_override_type?: FeeType | null;
  platform_fee_override_value?: number | null;
  is_featured: boolean;
  is_active: boolean;
}): {
  doctor: DoctorWithDetails;
  generatedCredentials?: { phone: string; tempPassword: string };
} {
  const db = loadDb();
  const nowIso = new Date().toISOString();
  const normalizedPhone = normalizeIndianPhone(input.phone);

  // Resolve Hospital / Clinic (or create if specified)
  let resolvedHospitalId = input.hospital_id;
  if (
    !resolvedHospitalId ||
    resolvedHospitalId === "__new__" ||
    resolvedHospitalId === "new" ||
    !db.hospitals.some((h) => h.id === resolvedHospitalId)
  ) {
    if (input.new_hospital_name?.trim()) {
      const created = adminUpsertHospital({
        name: input.new_hospital_name.trim(),
        location_id: input.location_id,
        address: "Main Road, Ponkunnam, Kerala 686506",
        phone: "+914828221000",
        email: "desk@clinic.in",
        rating: 4.8,
        is_active: true,
      });
      resolvedHospitalId = created.id;
    } else if (db.hospitals.length > 0) {
      resolvedHospitalId = db.hospitals[0].id;
    } else {
      const created = adminUpsertHospital({
        name: "Ponkunnam Medical Centre & Specialty Clinic",
        location_id: input.location_id,
        address: "Main Town, PP Road (NH 183), Ponkunnam, Kerala 686506",
        phone: "+914828221000",
        email: "care@ponkunnamclinic.in",
        rating: 4.8,
        is_active: true,
      });
      resolvedHospitalId = created.id;
    }
  }

  const resolvedBio =
    input.bio?.trim() ||
    "Experienced clinical specialist in Ponkunnam dedicated to evidence-based patient care.";

  if (input.id) {
    const doc = db.doctors.find((d) => d.id === input.id);
    if (!doc) throw new Error("Doctor not found.");
    const profile = db.profiles.find((p) => p.id === doc.profile_id);
    if (!profile) throw new Error("Doctor profile not found.");

    const phoneTaken = db.profiles.find(
      (p) => p.phone === normalizedPhone && p.id !== profile.id
    );
    if (phoneTaken) {
      throw new Error("Another account already uses this mobile number.");
    }

    profile.full_name = input.full_name;
    profile.phone = normalizedPhone;
    profile.email = input.email || undefined;
    if (input.photo_url !== undefined) {
      profile.avatar_url = input.photo_url || undefined;
    }
    profile.is_active = input.is_active;
    profile.updated_at = nowIso;

    doc.specialty_id = input.specialty_id;
    doc.hospital_id = resolvedHospitalId;
    doc.location_id = input.location_id;
    doc.registration_number = input.registration_number;
    doc.qualifications = input.qualifications;
    doc.experience_years = input.experience_years;
    doc.languages = input.languages;
    doc.bio = resolvedBio;
    if (input.photo_url !== undefined) doc.photo_url = input.photo_url || doc.photo_url;
    doc.consultation_fee = input.consultation_fee;
    doc.slot_duration_mins = input.slot_duration_mins;
    doc.platform_fee_override_type = input.platform_fee_override_type || null;
    doc.platform_fee_override_value =
      input.platform_fee_override_type &&
        input.platform_fee_override_value !== null &&
        input.platform_fee_override_value !== undefined
        ? input.platform_fee_override_value
        : null;
    doc.is_featured = input.is_featured;
    doc.is_active = input.is_active;
    doc.updated_at = nowIso;

    persistDb(db);
    return { doctor: enrichDoctor(db, doc)! };
  }

  // Creating a brand-new Doctor + Profile + Auto-generated login credentials
  const phoneTaken = db.profiles.find((p) => p.phone === normalizedPhone);
  if (phoneTaken) {
    throw new Error("This mobile number is already registered on My Dr.");
  }

  const tempPassword = generateTempDoctorPassword();
  const profileId = `usr-doc-${crypto.randomUUID().slice(0, 8)}`;
  const doctorId = `doc-${crypto.randomUUID().slice(0, 8)}`;
  const loc = db.locations.find((l) => l.id === input.location_id);

  const newProfile: ProfileRecord = {
    id: profileId,
    role: "doctor",
    phone: normalizedPhone,
    full_name: input.full_name,
    email: input.email || undefined,
    city: loc?.city || "Ponkunnam",
    area: loc?.area,
    avatar_url: input.photo_url || undefined,
    password_hash: hashPassword(tempPassword),
    has_password: true,
    must_change_password: true, // Forced password change on first login
    is_active: input.is_active,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const newDoc: DoctorRecord = {
    id: doctorId,
    profile_id: profileId,
    hospital_id: resolvedHospitalId,
    specialty_id: input.specialty_id,
    location_id: input.location_id,
    registration_number: input.registration_number,
    qualifications: input.qualifications,
    experience_years: input.experience_years,
    languages: input.languages,
    bio: resolvedBio,
    photo_url:
      input.photo_url ||
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80",
    consultation_fee: input.consultation_fee,
    platform_fee_override_type: input.platform_fee_override_type || null,
    platform_fee_override_value:
      input.platform_fee_override_type &&
        input.platform_fee_override_value !== null &&
        input.platform_fee_override_value !== undefined
        ? input.platform_fee_override_value
        : null,
    rating: 4.8,
    review_count: 1,
    slot_duration_mins: input.slot_duration_mins,
    is_featured: input.is_featured,
    is_active: input.is_active,
    created_at: nowIso,
    updated_at: nowIso,
  };

  db.profiles.push(newProfile);
  db.doctors.unshift(newDoc);

  // Seed default Mon-Sat availability
  for (let day = 0; day <= 6; day++) {
    db.doctor_availability.push({
      id: `avail-${doctorId}-${day}`,
      doctor_id: doctorId,
      day_of_week: day,
      is_working: day !== 0,
      morning_start: "09:30",
      morning_end: "13:30",
      evening_start: day === 0 ? null : "17:00",
      evening_end: day === 0 ? null : "20:30",
      slot_duration_mins: input.slot_duration_mins,
    });
  }

  persistDb(db);
  return {
    doctor: enrichDoctor(db, newDoc)!,
    generatedCredentials: {
      phone: normalizedPhone,
      tempPassword,
    },
  };
}

export function updateDoctorPhoto(doctorId: string, photoUrl: string): DoctorWithDetails {
  const db = loadDb();
  const doc = db.doctors.find((d) => d.id === doctorId);
  if (!doc) throw new Error("Doctor not found");
  const nowIso = new Date().toISOString();
  doc.photo_url = photoUrl;
  doc.updated_at = nowIso;
  const profile = db.profiles.find((p) => p.id === doc.profile_id);
  if (profile) {
    profile.avatar_url = photoUrl;
    profile.updated_at = nowIso;
  }
  persistDb(db);
  return enrichDoctor(db, doc)!;
}

export function adminToggleDoctorStatus(
  doctorId: string,
  isActive: boolean
): DoctorWithDetails {
  const db = loadDb();
  const doc = db.doctors.find((d) => d.id === doctorId);
  if (!doc) throw new Error("Doctor not found");
  const nowIso = new Date().toISOString();
  doc.is_active = isActive;
  doc.updated_at = nowIso;
  const profile = db.profiles.find((p) => p.id === doc.profile_id);
  if (profile && profile.role !== "admin") {
    profile.is_active = isActive;
    profile.updated_at = nowIso;
  }
  persistDb(db);
  return enrichDoctor(db, doc)!;
}

function purgeDoctorFromDb(db: LocalDatabaseSchema, doctorId: string): boolean {
  const docIdx = db.doctors.findIndex((d) => d.id === doctorId);
  if (docIdx === -1) return false;
  const doc = db.doctors[docIdx];

  db.doctor_availability = db.doctor_availability.filter(
    (a) => a.doctor_id !== doctorId
  );
  db.doctor_leaves = db.doctor_leaves.filter((l) => l.doctor_id !== doctorId);

  if (doc.profile_id) {
    const prof = db.profiles.find((p) => p.id === doc.profile_id);
    if (prof && prof.role !== "admin") {
      db.profiles = db.profiles.filter((p) => p.id !== doc.profile_id);
    }
  }

  db.doctors.splice(docIdx, 1);
  return true;
}

/**
 * Re-applies doctor deletions on this server instance. Serverless instances
 * (Vercel) do not share memory, so the admin browser replays its deletions.
 */
export function adminSyncDeletedDoctors(ids: string[]): { removed: string[] } {
  const db = loadDb();
  const clean = Array.from(
    new Set(ids.filter((id) => typeof id === "string" && id.length > 0))
  );
  const known = new Set(db.deleted_doctor_ids || []);
  const removed: string[] = [];
  let changed = false;
  for (const id of clean) {
    if (!known.has(id)) {
      known.add(id);
      changed = true;
    }
    if (purgeDoctorFromDb(db, id)) {
      removed.push(id);
      changed = true;
    }
  }
  if (changed) {
    db.deleted_doctor_ids = Array.from(known);
    persistDb(db);
  }
  return { removed };
}

export function adminDeleteDoctor(doctorId: string): { success: boolean; id: string } {
  const db = loadDb();
  const docIdx = db.doctors.findIndex((d) => d.id === doctorId);
  // Idempotent: on serverless the doctor may already be gone on this instance.
  if (docIdx === -1) {
    const known = new Set(db.deleted_doctor_ids || []);
    known.add(doctorId);
    db.deleted_doctor_ids = Array.from(known);
    persistDb(db);
    return { success: true, id: doctorId };
  }
  const doc = db.doctors[docIdx];

  // Remove doctor availability and leaves
  db.doctor_availability = db.doctor_availability.filter(
    (a) => a.doctor_id !== doctorId
  );
  db.doctor_leaves = db.doctor_leaves.filter(
    (l) => l.doctor_id !== doctorId
  );

  // Remove linked profile if only associated with this doctor and not an admin
  if (doc.profile_id) {
    const prof = db.profiles.find((p) => p.id === doc.profile_id);
    if (prof && prof.role !== "admin") {
      db.profiles = db.profiles.filter((p) => p.id !== doc.profile_id);
    }
  }

  // Remove doctor record and leave a tombstone so patches never resurrect it
  db.doctors.splice(docIdx, 1);
  db.deleted_doctor_ids = Array.from(
    new Set([...(db.deleted_doctor_ids || []), doctorId])
  );
  persistDb(db);
  return { success: true, id: doctorId };
}

export function adminResetDoctorCredentials(doctorId: string): {
  phone: string;
  tempPassword: string;
} {
  const db = loadDb();
  const doc = db.doctors.find((d) => d.id === doctorId);
  if (!doc) throw new Error("Doctor not found");
  const profile = db.profiles.find((p) => p.id === doc.profile_id);
  if (!profile) throw new Error("Doctor profile not found");

  const tempPassword = generateTempDoctorPassword();
  profile.password_hash = hashPassword(tempPassword);
  profile.has_password = true;
  profile.must_change_password = true;
  profile.updated_at = new Date().toISOString();
  persistDb(db);

  return { phone: profile.phone, tempPassword };
}

export function adminUpsertHospital(input: {
  id?: string;
  name: string;
  location_id: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  is_active: boolean;
}): HospitalRecord {
  const db = loadDb();
  const nowIso = new Date().toISOString();
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (input.id) {
    const h = db.hospitals.find((item) => item.id === input.id);
    if (!h) throw new Error("Hospital not found");
    h.name = input.name;
    h.location_id = input.location_id;
    h.address = input.address;
    h.phone = input.phone;
    h.email = input.email;
    h.rating = input.rating;
    h.is_active = input.is_active;
    h.updated_at = nowIso;
    persistDb(db);
    return h;
  }

  const created: HospitalRecord = {
    id: `hosp-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name,
    slug: `${slug}-${crypto.randomInt(10, 99)}`,
    location_id: input.location_id,
    address: input.address,
    phone: input.phone,
    email: input.email,
    rating: input.rating,
    is_verified: true,
    is_active: input.is_active,
    created_at: nowIso,
    updated_at: nowIso,
  };
  db.hospitals.unshift(created);
  persistDb(db);
  return created;
}

export function adminUpsertSpecialty(input: {
  id?: string;
  name: string;
  icon_name: string;
  description: string;
  is_active: boolean;
}): SpecialtyRecord {
  const db = loadDb();
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (input.id) {
    const s = db.specialties.find((item) => item.id === input.id);
    if (!s) throw new Error("Specialty not found");
    s.name = input.name;
    s.icon_name = input.icon_name;
    s.description = input.description;
    s.is_active = input.is_active;
    persistDb(db);
    return s;
  }

  const created: SpecialtyRecord = {
    id: `spec-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name,
    slug,
    icon_name: input.icon_name,
    description: input.description,
    is_active: input.is_active,
    created_at: new Date().toISOString(),
  };
  db.specialties.push(created);
  persistDb(db);
  return created;
}

export function adminUpsertLocation(input: {
  id?: string;
  city: string;
  area: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}): LocationRecord {
  const db = loadDb();
  if (input.id) {
    const l = db.locations.find((item) => item.id === input.id);
    if (!l) throw new Error("Location not found");
    l.city = input.city;
    l.area = input.area;
    l.state = input.state;
    l.pincode = input.pincode;
    l.latitude = input.latitude;
    l.longitude = input.longitude;
    l.is_active = input.is_active;
    persistDb(db);
    return l;
  }

  const created: LocationRecord = {
    id: `loc-${crypto.randomUUID().slice(0, 8)}`,
    city: input.city,
    area: input.area,
    state: input.state,
    pincode: input.pincode,
    latitude: input.latitude,
    longitude: input.longitude,
    is_active: input.is_active,
    created_at: new Date().toISOString(),
  };
  db.locations.push(created);
  persistDb(db);
  return created;
}

export function adminUpdatePlatformSettings(
  updates: Omit<PlatformSettingsRecord, "id" | "updated_at">
): PlatformSettingsRecord {
  const db = loadDb();
  db.platform_settings = {
    id: 1,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  persistDb(db);
  return db.platform_settings;
}

export function adminGetAllBookings(): AppointmentWithDetails[] {
  const db = loadDb();
  cleanupExpiredLocks(db);
  return db.appointments
    .map((a) => enrichAppointment(db, a))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function adminGetAllPatients(): (PublicProfile & {
  bookingsCount: number;
  totalSpent: number;
})[] {
  const db = loadDb();
  return db.profiles
    .filter((p) => p.role === "patient")
    .map((p) => {
      const paidPays = db.payments.filter(
        (pay) => pay.patient_id === p.id && pay.status === "paid"
      );
      const appts = db.appointments.filter((a) => a.patient_id === p.id);
      return {
        ...toPublicProfile(p),
        bookingsCount: appts.length,
        totalSpent: paidPays.reduce((s, item) => s + item.total_amount, 0),
      };
    });
}

export function adminTogglePatientActive(
  patientId: string,
  isActive: boolean
): void {
  const db = loadDb();
  const pat = db.profiles.find(
    (p) => p.id === patientId && p.role === "patient"
  );
  if (!pat) throw new Error("Patient not found");
  pat.is_active = isActive;
  pat.updated_at = new Date().toISOString();
  persistDb(db);
}

export function adminGetPaymentsLedger() {
  const db = loadDb();
  const rows = db.payments
    .map((p) => {
      const appt = db.appointments.find((a) => a.id === p.appointment_id);
      const doc = db.doctors.find((d) => d.id === p.doctor_id);
      const docProf = doc
        ? db.profiles.find((pr) => pr.id === doc.profile_id)
        : undefined;
      const patProf = db.profiles.find((pr) => pr.id === p.patient_id);
      return {
        ...p,
        booking_code: appt?.booking_code || "-",
        appointment_date: appt?.appointment_date || "",
        appointment_status: appt?.status || "confirmed",
        doctor_name: docProf?.full_name || "Doctor",
        patient_name: appt?.patient_name || patProf?.full_name || "Patient",
        patient_phone: appt?.patient_phone || patProf?.phone || "",
        net_doctor_payout:
          p.status === "paid" ? p.consultation_fee : 0,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const paidRows = rows.filter((r) => r.status === "paid");
  const grossRevenue = paidRows.reduce((s, r) => s + r.total_amount, 0);
  const platformEarnings = paidRows.reduce((s, r) => s + r.platform_fee, 0);
  const doctorPayoutsTotal = paidRows.reduce((s, r) => s + r.consultation_fee, 0);
  const totalRefunded = rows.reduce((s, r) => s + (r.refund_amount || 0), 0);

  return {
    rows,
    totals: {
      grossRevenue,
      platformEarnings,
      doctorPayoutsTotal,
      totalRefunded,
    },
  };
}

export function adminGetPayoutSummary() {
  const db = loadDb();
  const doctorsSummary = db.doctors.map((doc) => {
    const prof = db.profiles.find((p) => p.id === doc.profile_id);
    const hosp = db.hospitals.find((h) => h.id === doc.hospital_id);
    const spec = db.specialties.find((s) => s.id === doc.specialty_id);

    const eligibleAppts = db.appointments.filter(
      (a) =>
        a.doctor_id === doc.id &&
        (a.status === "completed" || a.status === "confirmed")
    );
    const pendingAppts = eligibleAppts.filter(
      (a) => a.payout_status === "pending"
    );
    const settledAppts = eligibleAppts.filter(
      (a) => a.payout_status === "settled"
    );

    const pendingGross = pendingAppts.reduce((s, a) => s + a.total_amount, 0);
    const pendingPlatformFee = pendingAppts.reduce(
      (s, a) => s + a.platform_fee,
      0
    );
    const pendingNetPayable = pendingAppts.reduce(
      (s, a) => s + a.net_doctor_earning,
      0
    );
    const settledNetTotal = settledAppts.reduce(
      (s, a) => s + a.net_doctor_earning,
      0
    );

    return {
      doctor_id: doc.id,
      doctor_name: prof?.full_name || "Doctor",
      doctor_phone: prof?.phone || "",
      specialty_name: spec?.name || "",
      hospital_name: hosp?.name || "",
      pendingCount: pendingAppts.length,
      pendingGross,
      pendingPlatformFee,
      pendingNetPayable,
      settledCount: settledAppts.length,
      settledNetTotal,
    };
  });

  const payoutBatches = db.doctor_payouts
    .map((b) => {
      const doc = db.doctors.find((d) => d.id === b.doctor_id);
      const prof = doc
        ? db.profiles.find((p) => p.id === doc.profile_id)
        : undefined;
      return {
        ...b,
        doctor_name: prof?.full_name || "Doctor",
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    doctorsSummary,
    payoutBatches,
  };
}

export function adminMarkDoctorPayoutSettled(params: {
  doctorId: string;
  adminUserId: string;
  settlementReference: string;
  notes?: string;
}): DoctorPayoutRecord {
  const db = loadDb();
  const pendingAppts = db.appointments.filter(
    (a) =>
      a.doctor_id === params.doctorId &&
      (a.status === "completed" || a.status === "confirmed") &&
      a.payout_status === "pending"
  );

  if (pendingAppts.length === 0) {
    throw new Error("No pending unsettled earnings found for this doctor.");
  }

  const dates = pendingAppts
    .map((a) => a.appointment_date)
    .sort((a, b) => a.localeCompare(b));
  const gross = pendingAppts.reduce((s, a) => s + a.total_amount, 0);
  const feeDeducted = pendingAppts.reduce((s, a) => s + a.platform_fee, 0);
  const netPayout = pendingAppts.reduce((s, a) => s + a.net_doctor_earning, 0);
  const nowIso = new Date().toISOString();

  const batch: DoctorPayoutRecord = {
    id: `payout-${crypto.randomUUID().slice(0, 8)}`,
    doctor_id: params.doctorId,
    period_start: dates[0] || getLocalISODate(0),
    period_end: dates[dates.length - 1] || getLocalISODate(0),
    appointments_count: pendingAppts.length,
    gross_consultation_amount: gross,
    platform_fee_deducted: feeDeducted,
    net_payout_amount: netPayout,
    status: "settled",
    settlement_reference: params.settlementReference,
    settled_by: params.adminUserId,
    settled_at: nowIso,
    notes: params.notes,
    created_at: nowIso,
  };

  for (const appt of pendingAppts) {
    appt.payout_status = "settled";
    appt.payout_id = batch.id;
    appt.updated_at = nowIso;
  }

  db.doctor_payouts.unshift(batch);
  persistDb(db);
  return batch;
}

export function adminGetExecutiveAnalytics() {
  const db = loadDb();
  cleanupExpiredLocks(db);

  const paidPayments = db.payments.filter((p) => p.status === "paid");
  const totalRevenue = paidPayments.reduce(
    (s, p) => s + p.consultation_fee + p.platform_fee,
    0
  );
  const platformEarnings = paidPayments.reduce((s, p) => s + p.platform_fee, 0);
  const netDoctorPayable = db.appointments
    .filter(
      (a) =>
        (a.status === "completed" || a.status === "confirmed") &&
        a.payout_status === "pending"
    )
    .reduce((s, a) => s + a.net_doctor_earning, 0);

  // Last 7 days bookings & revenue series
  const dailySeries: {
    date: string;
    shortLabel: string;
    bookings: number;
    revenue: number;
    platformFee: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const dt = getLocalISODate(-i);
    const [y, m, d] = dt.split("-").map(Number);
    const label = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    const dayAppts = db.appointments.filter(
      (a) => a.appointment_date === dt && a.status !== "cancelled"
    );
    const dayRevenue = dayAppts.reduce((s, a) => s + a.total_amount, 0);
    const dayPlatform = dayAppts.reduce((s, a) => s + a.platform_fee, 0);

    dailySeries.push({
      date: dt,
      shortLabel: label,
      bookings: dayAppts.length,
      revenue: dayRevenue,
      platformFee: dayPlatform,
    });
  }

  // Top Doctors
  const topDoctors = db.doctors
    .map((doc) => {
      const enriched = enrichDoctor(db, doc);
      const docAppts = db.appointments.filter(
        (a) => a.doctor_id === doc.id && a.status !== "cancelled"
      );
      const revenue = docAppts.reduce((s, a) => s + a.total_amount, 0);
      return {
        id: doc.id,
        name: enriched?.full_name || "Doctor",
        specialty: enriched?.specialty.name || "",
        hospital: enriched?.hospital.name || "",
        photo_url: doc.photo_url,
        bookingsCount: docAppts.length,
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top Specialties
  const topSpecialties = db.specialties
    .map((spec) => {
      const specDocIds = new Set(
        db.doctors.filter((d) => d.specialty_id === spec.id).map((d) => d.id)
      );
      const specAppts = db.appointments.filter(
        (a) => specDocIds.has(a.doctor_id) && a.status !== "cancelled"
      );
      const revenue = specAppts.reduce((s, a) => s + a.total_amount, 0);
      return {
        id: spec.id,
        name: spec.name,
        bookingsCount: specAppts.length,
        revenue,
      };
    })
    .sort((a, b) => b.bookingsCount - a.bookingsCount || b.revenue - a.revenue);

  return {
    kpis: {
      totalDoctors: db.doctors.filter((d) => d.is_active).length,
      totalPatients: db.profiles.filter((p) => p.role === "patient").length,
      totalBookings: db.appointments.length,
      activeBookings: db.appointments.filter((a) => a.status === "confirmed")
        .length,
      pendingUpiVerifications: db.payments.filter(
        (p) => p.status === "verification_pending"
      ).length,
      totalRevenue,
      platformEarnings,
      pendingPayouts: netDoctorPayable,
    },
    dailySeries,
    topDoctors,
    topSpecialties,
  };
}

