export type UserRole = 'patient' | 'doctor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_approved: boolean; // default true for patient/admin, false for doctor until approved
  is_blocked: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface DoctorDetails {
  user_id: string;
  specialization: string;
  experience_years: number;
  qualification: string;
  clinic_name: string;
  consultation_fee: number;
  bio: string;
  photo_url?: string;
  rating: number;
  review_count: number;
}

export interface TimeSlot {
  id: string;
  doctor_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_minutes: number;
  is_booked: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  // Denormalized/joined helpers
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_clinic?: string;
  doctor_fee?: number;
  platform_fee?: number;
  consultation_fee?: number;
}

export interface DoctorWithProfile extends UserProfile {
  details: DoctorDetails;
}
