import {
  Appointment,
  AppointmentStatus,
  DoctorDetails,
  DoctorWithProfile,
  TimeSlot,
  UserProfile
} from '../types';
import { requireSupabase } from './supabase';
import { getLocalDateString, getLocalTimeString } from '../utils/date';

const throwIfError = (error: { message: string } | null): void => {
  if (error) throw new Error(error.message);
};

const formatTime = (time: string): string => time.slice(0, 5);

const appointmentStatusResult = (error: { message: string } | null) => ({
  success: !error,
  error: error?.message
});

export const db = {
  async getProfileById(id: string): Promise<UserProfile | null> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfError(error);
    return data as UserProfile | null;
  },

  async getProfiles(): Promise<UserProfile[]> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    throwIfError(error);
    return (data ?? []) as UserProfile[];
  },

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        avatar_url: updates.avatar_url
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    throwIfError(error);
    return data as UserProfile | null;
  },

  async toggleUserBlock(userId: string): Promise<boolean> {
    const profile = await this.getProfileById(userId);
    if (!profile) throw new Error('User profile not found.');
    const { error } = await requireSupabase().rpc('admin_set_user_blocked', {
      requested_user_id: userId,
      blocked: !profile.is_blocked
    });
    throwIfError(error);
    return !profile.is_blocked;
  },

  async getDoctorDetailsList(): Promise<DoctorDetails[]> {
    const { data, error } = await requireSupabase().from('doctor_details').select('*');
    throwIfError(error);
    return (data ?? []) as DoctorDetails[];
  },

  async getDoctorDetails(userId: string): Promise<DoctorDetails | null> {
    const { data, error } = await requireSupabase()
      .from('doctor_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    throwIfError(error);
    return data as DoctorDetails | null;
  },

  async updateDoctorDetails(details: DoctorDetails): Promise<DoctorDetails> {
    const { data, error } = await requireSupabase()
      .from('doctor_details')
      .update({
        specialization: details.specialization,
        experience_years: details.experience_years,
        qualification: details.qualification,
        clinic_name: details.clinic_name,
        consultation_fee: details.consultation_fee,
        bio: details.bio,
        photo_url: details.photo_url
      })
      .eq('user_id', details.user_id)
      .select()
      .single();
    throwIfError(error);
    return data as DoctorDetails;
  },

  async getAllDoctors(approvedOnly = false): Promise<DoctorWithProfile[]> {
    const client = requireSupabase();
    if (approvedOnly) {
      const { data, error } = await client
        .from('doctor_directory')
        .select('*')
        .order('name');
      throwIfError(error);
      return (data ?? []).map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        email: '',
        phone: '',
        role: 'doctor' as const,
        is_approved: doctor.is_approved,
        is_blocked: false,
        avatar_url: doctor.avatar_url ?? undefined,
        created_at: doctor.created_at,
        details: {
          user_id: doctor.user_id,
          specialization: doctor.specialization,
          experience_years: doctor.experience_years,
          qualification: doctor.qualification,
          clinic_name: doctor.clinic_name,
          consultation_fee: Number(doctor.consultation_fee),
          bio: doctor.bio,
          photo_url: doctor.photo_url ?? undefined,
          rating: Number(doctor.rating),
          review_count: doctor.review_count
        }
      } as DoctorWithProfile));
    }

    let profileQuery = client.from('profiles').select('*').eq('role', 'doctor');
    const [{ data: profiles, error: profileError }, { data: details, error: detailsError }] =
      await Promise.all([
        profileQuery.order('name'),
        client.from('doctor_details').select('*')
      ]);
    throwIfError(profileError);
    throwIfError(detailsError);

    const detailByUser = new Map(
      ((details ?? []) as DoctorDetails[]).map(detail => [detail.user_id, detail])
    );
    return ((profiles ?? []) as UserProfile[])
      .flatMap(profile => {
        const detail = detailByUser.get(profile.id);
        return detail ? [{ ...profile, details: detail }] : [];
      });
  },

  async getDoctorWithProfile(doctorId: string): Promise<DoctorWithProfile | null> {
    const profile = await this.getProfileById(doctorId);
    if (!profile || profile.role !== 'doctor') return null;
    const details = await this.getDoctorDetails(doctorId);
    return details ? { ...profile, details } : null;
  },

  async approveDoctor(doctorId: string, approve: boolean): Promise<void> {
    const { error } = await requireSupabase().rpc('admin_set_doctor_approval', {
      requested_doctor_id: doctorId,
      approved: approve
    });
    throwIfError(error);
  },

  async getSlots(doctorId?: string, date?: string, availableOnly = false): Promise<TimeSlot[]> {
    let query = requireSupabase().from('slots').select('*');
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (date) query = query.eq('date', date);
    if (availableOnly) query = query.eq('is_booked', false);
    if (availableOnly) query = query.gte('date', getLocalDateString());
    const { data, error } = await query.order('date').order('start_time');
    throwIfError(error);
    const slots = ((data ?? []) as TimeSlot[]).map(slot => ({
      ...slot,
      start_time: formatTime(slot.start_time),
      end_time: formatTime(slot.end_time)
    }));
    if (!availableOnly) return slots;
    const today = getLocalDateString();
    const currentTime = getLocalTimeString();
    return slots.filter(slot => slot.date > today || slot.start_time > currentTime);
  },

  async generateSlots(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
    durationMinutes: number
  ): Promise<{ created: TimeSlot[]; skipped: number }> {
    if (![15, 30, 45].includes(durationMinutes)) throw new Error('Choose a 15, 30, or 45 minute duration.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose a valid date.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
      throw new Error('Choose valid start and end times.');
    }
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
      throw new Error('The end time must be later than the start time.');
    }

    const existing = await this.getSlots(doctorId, date);
    const existingStarts = new Set(existing.map(slot => slot.start_time));
    const candidates: Omit<TimeSlot, 'id'>[] = [];
    let skipped = 0;
    for (let cursor = startMinutes; cursor + durationMinutes <= endMinutes; cursor += durationMinutes) {
      const slotStart = `${Math.floor(cursor / 60).toString().padStart(2, '0')}:${(cursor % 60).toString().padStart(2, '0')}`;
      const slotEndMinutes = cursor + durationMinutes;
      const slotEnd = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;
      const overlaps = existing.some(slot => {
        const existingStart = slot.start_time.split(':').map(Number);
        const existingEnd = slot.end_time.split(':').map(Number);
        const existingStartMinutes = existingStart[0] * 60 + existingStart[1];
        const existingEndMinutes = existingEnd[0] * 60 + existingEnd[1];
        return cursor < existingEndMinutes && slotEndMinutes > existingStartMinutes;
      });
      if (existingStarts.has(slotStart) || overlaps) {
        skipped++;
      } else {
        candidates.push({
          doctor_id: doctorId,
          date,
          start_time: slotStart,
          end_time: slotEnd,
          duration_minutes: durationMinutes,
          is_booked: false
        });
      }
    }
    if (candidates.length === 0) return { created: [], skipped };

    const { data, error } = await requireSupabase()
      .from('slots')
      .upsert(candidates, {
        onConflict: 'doctor_id,date,start_time',
        ignoreDuplicates: true
      })
      .select();
    throwIfError(error);
    const created = ((data ?? []) as TimeSlot[]).map(slot => ({
      ...slot,
      start_time: formatTime(slot.start_time),
      end_time: formatTime(slot.end_time)
    }));
    return { created, skipped: skipped + candidates.length - created.length };
  },

  async deleteSlot(slotId: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await requireSupabase()
      .from('slots')
      .delete()
      .eq('id', slotId)
      .eq('is_booked', false)
      .select('id')
      .maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'Slot could not be deleted. It may already be booked or no longer exist.' };
    return { success: true };
  },

  async getAppointments(filters?: {
    doctorId?: string;
    patientId?: string;
    status?: string;
    date?: string;
  }): Promise<Appointment[]> {
    const client = requireSupabase();
    let query = client.from('appointments').select('*');
    if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
    if (filters?.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters?.date) query = query.eq('date', filters.date);
    const { data, error } = await query.order('created_at', { ascending: false });
    throwIfError(error);

    const appointments = (data ?? []) as Appointment[];
    const [profiles, doctors, details] = await Promise.all([
      this.getProfiles(),
      this.getAllDoctors(true),
      this.getDoctorDetailsList()
    ]);
    doctors.forEach(doctor => {
      if (!profiles.some(profile => profile.id === doctor.id)) profiles.push(doctor);
    });
    const profileById = new Map(profiles.map(profile => [profile.id, profile]));
    const detailById = new Map(details.map(detail => [detail.user_id, detail]));
    return appointments.map(appointment => {
      const patient = profileById.get(appointment.patient_id);
      const doctor = profileById.get(appointment.doctor_id);
      const doctorDetails = detailById.get(appointment.doctor_id);
      return {
        ...appointment,
        start_time: formatTime(appointment.start_time),
        end_time: formatTime(appointment.end_time),
        patient_name: patient?.name ?? 'Patient',
        patient_email: patient?.email ?? '',
        patient_phone: patient?.phone ?? '',
        doctor_name: doctor?.name ?? 'Doctor',
        doctor_specialization: doctorDetails?.specialization ?? '',
        doctor_clinic: doctorDetails?.clinic_name ?? '',
        doctor_fee: doctorDetails?.consultation_fee ?? 0,
        consultation_fee: appointment.consultation_fee ?? doctorDetails?.consultation_fee ?? 0,
        platform_fee: appointment.platform_fee ?? 0
      };
    });
  },

  async bookSlot(
    doctorId: string,
    slotId: string,
    notes?: string
  ): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    const { data, error } = await requireSupabase().rpc('book_appointment', {
      requested_slot_id: slotId,
      requested_doctor_id: doctorId,
      appointment_notes: notes ?? ''
    });
    if (error) return { success: false, error: error.message };
    return { success: true, appointment: data as Appointment };
  },

  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await requireSupabase().rpc('update_appointment_status', {
      requested_appointment_id: appointmentId,
      requested_status: newStatus
    });
    return appointmentStatusResult(error);
  },

  async getPlatformFee(): Promise<number> {
    const { data, error } = await requireSupabase()
      .from('app_settings')
      .select('platform_fee')
      .eq('id', 1)
      .maybeSingle();
    throwIfError(error);
    if (!data) throw new Error('Hospital settings are missing. Apply the Supabase schema setup.');
    return Number(data.platform_fee);
  },

  async setPlatformFee(amount: number): Promise<number> {
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Platform fee must be a non-negative number.');
    const { data, error } = await requireSupabase().rpc('admin_set_platform_fee', {
      new_fee: amount
    });
    throwIfError(error);
    return Number(data);
  },

  async getAdminStats() {
    const [profiles, appointments, platformFee] = await Promise.all([
      this.getProfiles(),
      this.getAppointments(),
      this.getPlatformFee()
    ]);
    const doctors = profiles.filter(profile => profile.role === 'doctor');
    const patients = profiles.filter(profile => profile.role === 'patient');
    const today = new Date().toISOString().slice(0, 10);
    const chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dateString = date.toISOString().slice(0, 10);
      return {
        date: dateString,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        count: appointments.filter(appointment => appointment.date === dateString).length
      };
    });
    return {
      totalDoctors: doctors.length,
      approvedDoctors: doctors.filter(profile => profile.is_approved).length,
      pendingDoctorsCount: doctors.filter(profile => !profile.is_approved).length,
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      todayAppointmentsCount: appointments.filter(appointment => appointment.date === today).length,
      activeBookingsCount: appointments.filter(appointment => ['confirmed', 'pending'].includes(appointment.status)).length,
      completedCount: appointments.filter(appointment => appointment.status === 'completed').length,
      cancelledCount: appointments.filter(appointment => appointment.status === 'cancelled').length,
      platformFee,
      chartData
    };
  }
};
