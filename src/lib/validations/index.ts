import { z } from "zod";

export const indianPhoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, "");
      return (
        (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
        (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits))
      );
    },
    { message: "Enter a valid 10-digit Indian mobile number" }
  );

export const sendOtpSchema = z.object({
  phone: indianPhoneSchema,
  mode: z.enum(["login", "signup", "change_phone"]).default("login"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
});

export const verifyOtpSchema = z.object({
  phone: indianPhoneSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
  fullName: z.string().trim().min(2).optional(),
  city: z.string().trim().optional(),
});

export const passwordLoginSchema = z.object({
  phone: indianPhoneSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  expectedRole: z.enum(["patient", "doctor", "admin"]).optional(),
});

export const setPasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must include a letter")
      .regex(/\d/, "Must include a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(80),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  age: z.coerce.number().int().min(1, "Age must be at least 1").max(120),
  gender: z.enum(["male", "female", "other"]),
  blood_group: z.string().trim().max(10).optional().or(z.literal("")),
  emergency_contact: z.string().trim().max(20).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required"),
  area: z.string().trim().optional(),
});

export const changeMobileVerifySchema = z.object({
  newPhone: indianPhoneSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const createBookingLockSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid slot time"),
  patientName: z.string().trim().min(2, "Patient name is required").max(80),
  patientAge: z.coerce.number().int().min(0).max(120),
  patientGender: z.enum(["male", "female", "other"]),
  patientPhone: indianPhoneSchema,
  symptomsNotes: z.string().trim().max(500).optional(),
});

export const verifyPaymentSchema = z.object({
  appointmentId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  payment_method: z.string().optional(),
});

export const upiIdSchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/,
    "Enter a valid UPI ID (e.g. pksaji020@oksbi)"
  );

export const submitUpiUtrSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  upi_utr: z
    .string()
    .trim()
    .regex(
      /^\d{12}$/,
      "Enter a valid 12-digit UPI UTR / Transaction Reference Number"
    ),
  upi_payer_vpa: z.string().trim().max(120).optional().or(z.literal("")),
  upi_app: z.string().trim().max(40).optional(),
});

export const adminVerifyUpiPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(300).optional(),
});

export const cancelOrRescheduleSchema = z.object({
  action: z.enum(["cancel", "reschedule"]),
  reason: z.string().trim().min(3, "Please provide a brief reason").max(300).optional(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  newSlotTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const doctorStatusUpdateSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["confirmed", "completed", "cancelled", "no_show"]),
  reason: z.string().trim().max(300).optional(),
});

export const doctorAvailabilityDaySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  is_working: z.boolean(),
  morning_start: z.string().nullable(),
  morning_end: z.string().nullable(),
  evening_start: z.string().nullable(),
  evening_end: z.string().nullable(),
  slot_duration_mins: z.number().int().refine((v) => [10, 15, 20, 30, 45, 60].includes(v)),
});

export const saveDoctorAvailabilitySchema = z.object({
  slotDurationMins: z.coerce
    .number()
    .int()
    .refine((v) => [10, 15, 20, 30, 45, 60].includes(v)),
  days: z.array(doctorAvailabilityDaySchema).length(7),
});

export const doctorLeaveSchema = z.object({
  leave_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
  reason: z.string().trim().max(200).optional(),
});

export const adminUpsertDoctorSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().trim().min(3, "Doctor name is required"),
  phone: indianPhoneSchema,
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  photo_url: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
  specialty_id: z.string().min(1, "Select a specialty"),
  hospital_id: z.string().min(1, "Select a hospital"),
  location_id: z.string().min(1, "Select a location"),
  registration_number: z.string().trim().min(4, "Medical reg. number is required"),
  qualifications: z.array(z.string().trim().min(1)).min(1, "Add at least one qualification"),
  experience_years: z.coerce.number().int().min(0).max(70),
  languages: z.array(z.string().trim().min(1)).min(1, "Add at least one language"),
  bio: z.string().trim().min(10, "Bio must be at least 10 characters").max(1000),
  consultation_fee: z.coerce.number().min(0, "Consultation fee must be >= 0"),
  slot_duration_mins: z.coerce
    .number()
    .int()
    .refine((v) => [10, 15, 20, 30, 45, 60].includes(v))
    .default(20),
  platform_fee_override_type: z.enum(["percentage", "flat"]).nullable().optional(),
  platform_fee_override_value: z.coerce.number().min(0).nullable().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const adminHospitalSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, "Hospital name is required"),
  location_id: z.string().min(1, "Select a city/area"),
  address: z.string().trim().min(5, "Address is required"),
  phone: z.string().trim().min(6, "Phone is required"),
  email: z.string().trim().email("Valid email required"),
  rating: z.coerce.number().min(1).max(5).default(4.7),
  is_active: z.boolean().default(true),
});

export const adminSpecialtySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Specialty name required"),
  icon_name: z.string().trim().default("Stethoscope"),
  description: z.string().trim().min(5, "Short description required"),
  is_active: z.boolean().default(true),
});

export const adminLocationSchema = z.object({
  id: z.string().optional(),
  city: z.string().trim().min(2, "City required"),
  area: z.string().trim().min(2, "Area required"),
  state: z.string().trim().min(2, "State required"),
  pincode: z.string().trim().min(4, "Pincode required"),
  latitude: z.coerce.number().min(-90).max(90).default(19.076),
  longitude: z.coerce.number().min(-180).max(180).default(72.8777),
  is_active: z.boolean().default(true),
});

export const platformSettingsSchema = z.object({
  platform_fee_type: z.enum(["percentage", "flat"]),
  platform_fee_value: z.coerce.number().min(0, "Fee cannot be negative").max(10000),
  free_cancellation_hours: z.coerce.number().int().min(0).max(168),
  cancellation_refund_percent: z.coerce.number().min(0).max(100),
  payment_gateway_mode: z.enum(["upi_direct", "razorpay"]).default("upi_direct"),
  upi_id: upiIdSchema,
  upi_payee_name: z.string().trim().min(2, "Payee name is required").max(80),
  upi_verification_mode: z
    .enum(["admin_approval", "instant_utr"])
    .default("admin_approval"),
  sms_provider: z.enum([
    "fast2sms",
    "twofactor",
    "msg91",
    "twilio",
    "supabase_native",
    "dev_console",
  ]),
  sms_api_key: z.string().trim().max(240).optional().or(z.literal("")),
  sms_template_id: z.string().trim().max(120).optional().or(z.literal("")),
  twilio_account_sid: z.string().trim().max(120).optional().or(z.literal("")),
  twilio_auth_token: z.string().trim().max(120).optional().or(z.literal("")),
  twilio_from_number: z.string().trim().max(30).optional().or(z.literal("")),
  support_phone: z.string().trim().min(6),
  support_email: z.string().trim().email(),
});

export const settlePayoutSchema = z.object({
  doctorId: z.string().min(1),
  settlementReference: z.string().trim().min(4, "Enter UTR / Bank Ref number"),
  notes: z.string().trim().max(300).optional(),
});

