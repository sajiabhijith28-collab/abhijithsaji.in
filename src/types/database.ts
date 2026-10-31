export type UserRole = "patient" | "doctor" | "admin";
export type GenderType = "male" | "female" | "other";
export type FeeType = "percentage" | "flat";
export type PaymentGatewayMode = "upi_direct" | "razorpay";
export type UpiVerificationMode = "admin_approval" | "instant_utr";
export type SmsProviderType =
  | "fast2sms"
  | "twofactor"
  | "msg91"
  | "twilio"
  | "supabase_native"
  | "dev_console";
export type AppointmentStatus =
  | "pending_payment"
  | "verification_pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentStatus =
  | "created"
  | "verification_pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type PayoutStatus = "pending" | "processing" | "settled";
export type NotificationChannel = "sms" | "email" | "in_app";

export interface LocationRecord {
  id: string;
  city: string;
  area: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
}

export interface SpecialtyRecord {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface HospitalRecord {
  id: string;
  name: string;
  slug: string;
  location_id: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  rating: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRecord {
  id: string;
  role: UserRole;
  phone: string; // +91XXXXXXXXXX
  full_name: string;
  email?: string;
  age?: number;
  gender?: GenderType;
  blood_group?: string;
  emergency_contact?: string;
  city?: string;
  area?: string;
  avatar_url?: string;
  password_hash?: string; // Server-side only (never serialized to client)
  has_password: boolean;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PublicProfile = Omit<ProfileRecord, "password_hash">;

export interface DoctorRecord {
  id: string;
  profile_id: string;
  hospital_id: string;
  specialty_id: string;
  location_id: string;
  registration_number: string;
  qualifications: string[];
  experience_years: number;
  languages: string[];
  bio: string;
  photo_url: string;
  consultation_fee: number;
  platform_fee_override_type: FeeType | null;
  platform_fee_override_value: number | null;
  rating: number;
  review_count: number;
  slot_duration_mins: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorWithDetails extends DoctorRecord {
  full_name: string;
  phone: string;
  email?: string;
  specialty: SpecialtyRecord;
  hospital: HospitalRecord;
  location: LocationRecord;
  next_available_label?: string;
}

export interface DoctorAvailabilityRecord {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 (Sun) - 6 (Sat)
  is_working: boolean;
  morning_start: string | null; // "09:30"
  morning_end: string | null; // "13:30"
  evening_start: string | null; // "17:00"
  evening_end: string | null; // "20:30"
  slot_duration_mins: number;
}

export interface DoctorLeaveRecord {
  id: string;
  doctor_id: string;
  leave_date: string; // YYYY-MM-DD
  reason?: string;
  created_at: string;
}

export interface PlatformSettingsRecord {
  id: number;
  platform_fee_type: FeeType;
  platform_fee_value: number;
  free_cancellation_hours: number;
  cancellation_refund_percent: number;
  payment_gateway_mode: PaymentGatewayMode;
  upi_id: string;
  upi_payee_name: string;
  upi_verification_mode: UpiVerificationMode;
  sms_provider: SmsProviderType;
  sms_api_key?: string;
  sms_template_id?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_from_number?: string;
  support_phone: string;
  support_email: string;
  updated_at: string;
}

export interface DoctorPayoutRecord {
  id: string;
  doctor_id: string;
  period_start: string;
  period_end: string;
  appointments_count: number;
  gross_consultation_amount: number;
  platform_fee_deducted: number;
  net_payout_amount: number;
  status: PayoutStatus;
  settlement_reference?: string;
  settled_by?: string;
  settled_at?: string;
  notes?: string;
  created_at: string;
}

export interface AppointmentRecord {
  id: string;
  booking_code: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  appointment_date: string; // YYYY-MM-DD
  slot_time: string; // HH:mm
  slot_end_time: string; // HH:mm
  patient_name: string;
  patient_age: number;
  patient_gender: GenderType;
  patient_phone: string;
  symptoms_notes?: string;
  // Immutable fee snapshot stored at checkout/payment creation
  consultation_fee: number;
  applied_fee_type: FeeType;
  applied_fee_rate: number;
  platform_fee: number;
  total_amount: number;
  net_doctor_earning: number;
  status: AppointmentStatus;
  lock_expires_at?: string;
  cancellation_reason?: string;
  cancelled_by_role?: UserRole;
  cancelled_at?: string;
  completed_at?: string;
  payout_id?: string;
  payout_status: PayoutStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends AppointmentRecord {
  doctor_name: string;
  doctor_photo: string;
  doctor_qualifications: string[];
  specialty_name: string;
  hospital_name: string;
  hospital_address: string;
  city: string;
  area: string;
  payment?: PaymentRecord;
}

export interface PaymentRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  consultation_fee: number;
  platform_fee: number;
  total_amount: number;
  currency: "INR";
  status: PaymentStatus;
  payment_method?: string;
  upi_utr?: string;
  upi_payer_vpa?: string;
  upi_paid_to?: string;
  upi_submitted_at?: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  refund_id?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  appointment_id?: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

export interface SlotItem {
  time: string; // "10:00"
  endTime: string; // "10:20"
  label: string; // "10:00 AM"
  period: "Morning" | "Evening";
  available: boolean;
  isPast?: boolean;
}

