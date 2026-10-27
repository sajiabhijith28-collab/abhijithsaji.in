import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { requireSupabase } from '../../services/supabase';
import { getLocalDateString } from '../../utils/date';
import { Appointment, TimeSlot, DoctorDetails, AppointmentStatus } from '../../types';
import { useToast } from '../common/Toast';
import {
  Calendar,
  Clock,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  CheckSquare,
  AlertTriangle,
  User,
  Filter,
  Stethoscope,
  Building,
  Save,
  Lock,
  CalendarCheck,
  Camera,
  Upload,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'bookings' | 'slots' | 'profile'>('bookings');

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Slots state
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotDate, setSlotDate] = useState<string>(getLocalDateString);
  const [slotStartTime, setSlotStartTime] = useState<string>('09:00');
  const [slotEndTime, setSlotEndTime] = useState<string>('13:00');
  const [slotDuration, setSlotDuration] = useState<number>(30);

  // Profile edit state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState<number>(5);
  const [qualification, setQualification] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [fee, setFee] = useState<number>(50);
  const [bio, setBio] = useState('');
  const [platformFee, setPlatformFee] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast('error', 'Unsupported Photo', 'Choose a JPEG, PNG, or WebP image.');
      e.target.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      addToast('error', 'File Too Large', 'Choose a photo smaller than 3MB.');
      e.target.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const path = `${user.id}/profile`;
      const storage = requireSupabase().storage.from('doctor-avatars');
      const { data, error } = await storage.upload(path, file, {
        cacheControl: '0',
        contentType: file.type,
        upsert: true
      });
      if (error) throw error;
      setAvatarUrl(storage.getPublicUrl(data.path).data.publicUrl);
      addToast('success', 'Photo Uploaded', 'Save your profile to publish this photo.');
    } catch (error) {
      addToast('error', 'Photo Upload Failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Reload data
  const loadDoctorData = async () => {
    if (!user) return;
    const [docAppts, docSlots, details, fee] = await Promise.all([
      db.getAppointments({ doctorId: user.id }),
      db.getSlots(user.id),
      db.getDoctorDetails(user.id),
      db.getPlatformFee()
    ]);
    setAppointments(docAppts);
    setSlots(docSlots);
    setName(user.name);
    setPhone(user.phone);
    setPlatformFee(fee);
    setAvatarUrl(user.avatar_url || details?.photo_url || '');
    if (details) {
      setSpecialization(details.specialization);
      setExperience(details.experience_years);
      setQualification(details.qualification);
      setClinicName(details.clinic_name);
      setFee(details.consultation_fee);
      setBio(details.bio);
    }
  };

  useEffect(() => {
    void loadDoctorData().catch(error => {
      addToast('error', 'Unable to Load Practice Data', error instanceof Error ? error.message : 'Please try again.');
    });
  }, [user]);

  // Appointment Actions
  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const res = await db.updateAppointmentStatus(appointmentId, newStatus);
      if (res.success) {
      addToast(
        newStatus === 'confirmed' ? 'success' : newStatus === 'cancelled' ? 'error' : 'info',
        `Appointment ${newStatus.toUpperCase()}`,
        `Patient schedule updated.`
      );
        await loadDoctorData();
      } else {
        addToast('error', 'Update Failed', res.error);
      }
    } catch (error) {
      addToast('error', 'Update Failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // Generate Slots
  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!slotDate) {
      addToast('error', 'Date Required', 'Please select a date for slot generation.');
      return;
    }

    try {
    const res = await db.generateSlots(user.id, slotDate, slotStartTime, slotEndTime, slotDuration);
    if (res.created.length > 0) {
      addToast(
        'success',
        `${res.created.length} Slots Generated!`,
        `Slots created for ${slotDate} (${slotStartTime} to ${slotEndTime})`
      );
      if (res.skipped > 0) {
        addToast('info', 'Overlap Skipped', `${res.skipped} overlapping time slots were kept as-is.`);
      }
      await loadDoctorData();
    } else {
      addToast('info', 'No New Slots', 'All requested intervals on this date already exist.');
    }
    } catch (error) {
      addToast('error', 'Unable to Create Slots', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // Delete individual slot
  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await db.deleteSlot(slotId);
      if (res.success) {
      addToast('info', 'Slot Removed', 'Available time slot removed.');
        await loadDoctorData();
      } else {
        addToast('error', 'Cannot Delete', res.error);
      }
    } catch (error) {
      addToast('error', 'Cannot Delete', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedDetails: DoctorDetails = {
      user_id: user.id,
      specialization,
      experience_years: Number(experience),
      qualification,
      clinic_name: clinicName,
      consultation_fee: Number(fee),
      bio,
      photo_url: avatarUrl,
      rating: 0,
      review_count: 0
    };
    try {
      await Promise.all([
        db.updateProfile(user.id, { name, phone, avatar_url: avatarUrl }),
        db.updateDoctorDetails(updatedDetails)
      ]);
      await refreshUser();
      addToast('success', 'Profile Updated', 'Your doctor practice profile and photo were updated.');
    } catch (error) {
      addToast('error', 'Unable to Save Profile', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesDate = !dateFilter || apt.date === dateFilter;
    return matchesStatus && matchesDate;
  });

  // Group slots by date for clear chips view
  const groupedSlots = slots.reduce<Record<string, TimeSlot[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const datesSorted = Object.keys(groupedSlots).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Approval Warning Banner if Doctor is pending verification */}
      {user && !user.is_approved && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Credential Verification in Progress: </span>
            Your clinical registration is currently awaiting review by the Hospital Medical Director. You can set up your practice profile and consultation slots in the meantime; they will become publicly bookable as soon as your account is approved.
          </div>
        </div>
      )}

      {/* Doctor Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || '/avatar-placeholder.svg'}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-200 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user?.name}</h1>
              {user?.is_approved ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Doctor
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>{specialization || 'Clinical Specialist'}</span>
              <span>·</span>
              <span>{clinicName || 'Ente Hospital'}</span>
              <span>·</span>
              <span className="font-semibold text-slate-800">Clinic Consultation Fee: ₹{fee} (Pay at clinic)</span>
              <span>·</span>
              <span className="font-semibold text-teal-700">Online Platform Fee: ₹{platformFee}</span>
            </p>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
          <div className="text-center px-2">
            <div className="text-lg font-bold text-slate-900 tabular-nums">{appointments.length}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Bookings</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center px-2">
            <div className="text-lg font-bold text-teal-700 tabular-nums">
              {appointments.filter(a => a.status === 'confirmed').length}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Confirmed</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center px-2">
            <div className="text-lg font-bold text-sky-700 tabular-nums">{slots.filter(s => !s.is_booked).length}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Open Slots</div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'bookings'
              ? 'text-teal-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            <span>See Bookings</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
              {appointments.length}
            </span>
          </div>
          {activeTab === 'bookings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'slots'
              ? 'text-teal-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Add & Manage Slots</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
              {slots.length}
            </span>
          </div>
          {activeTab === 'slots' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'profile'
              ? 'text-teal-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </div>
          {activeTab === 'profile' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: SEE BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filter Bookings</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Status filter tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      statusFilter === st
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bookings Table / List */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are currently no patient visits matching your selected filter criteria.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Patient Name</th>
                      <th className="py-3.5 px-6">Date & Time</th>
                      <th className="py-3.5 px-6">Clinical Notes</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAppointments.map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          <div>{apt.patient_name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{apt.patient_phone || apt.patient_email}</div>
                        </td>
                        <td className="py-4 px-6 tabular-nums">
                          <div className="font-medium text-slate-800">{apt.date}</div>
                          <div className="text-[11px] text-teal-700 font-semibold">{apt.start_time} - {apt.end_time}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                          {apt.notes || 'Routine consultation'}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                              apt.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : apt.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : apt.status === 'completed'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {apt.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {apt.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'completed')}
                                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  <span>Mark Completed</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                  className="px-2 py-1 text-slate-400 hover:text-rose-600 text-xs font-medium"
                                  title="Cancel Visit"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {(apt.status === 'completed' || apt.status === 'cancelled') && (
                              <span className="text-slate-400 text-[11px] italic">No further actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD & MANAGE SLOTS */}
      {activeTab === 'slots' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generator Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs h-fit">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Add Consultation Slots</h2>
            </div>

            <form onSubmit={handleGenerateSlots} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={slotDate}
                  min={getLocalDateString()}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Slot Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setSlotDuration(dur)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        slotDuration === dur
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dur} mins
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate Slots</span>
              </button>
            </form>
          </div>

          {/* Existing Slots organized by date as chips */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Current Slot Schedule</h2>
                  <p className="text-xs text-slate-500">Unbooked slots can be removed anytime with (✕). Booked slots are locked.</p>
                </div>
                <div className="text-xs text-teal-700 font-semibold bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60 tabular-nums">
                  Total Slots: {slots.length}
                </div>
              </div>

              {datesSorted.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No time slots scheduled yet. Use the generator on the left to add slots.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {datesSorted.map(dateKey => {
                    const daySlots = groupedSlots[dateKey];
                    const dateObj = new Date(dateKey);
                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <div key={dateKey} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                            {formattedDate}
                          </span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {daySlots.filter(s => s.is_booked).length} booked / {daySlots.length} slots
                          </span>
                        </div>

                        {/* Slot Chips Grid */}
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map(slot => (
                            <div
                              key={slot.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums border transition-all ${
                                slot.is_booked
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-teal-400'
                              }`}
                            >
                              {slot.is_booked ? (
                                <span title="Slot is Booked">
                                  <Lock className="w-3 h-3 text-amber-600" />
                                </span>
                              ) : (
                                <Clock className="w-3 h-3 text-teal-600" />
                              )}
                              <span>
                                {slot.start_time} - {slot.end_time}
                              </span>

                              {/* Only show delete on unbooked slots */}
                              {!slot.is_booked && (
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded-full hover:bg-rose-50"
                                  title="Delete Slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
            <User className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Doctor Profile & Clinical Settings</h2>
              <p className="text-xs text-slate-500">Keep your specialization, medical credentials, and consultation fee current.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* PROFILE PHOTO MANAGEMENT SECTION */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-600" />
                <span>Doctor Profile Photo</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Image Preview */}
                <div className="relative group shrink-0">
                  <img
                    src={avatarUrl || '/avatar-placeholder.svg'}
                    alt="Doctor Profile Preview"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-teal-500 shadow-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-900/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-semibold gap-1 backdrop-blur-xs"
                    title="Change Photo"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                </div>

                <div className="flex-1 w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">JPEG, PNG, or WebP; maximum size 3MB.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Clinic Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 tabular-nums"
                />
                <span className="text-[10px] text-amber-700 mt-0.5 block font-medium">Payable separately by patient at clinic</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Platform Booking Fee (₹)
                </label>
                <input
                  type="number"
                  value={platformFee}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold tabular-nums cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Managed solely by Hospital Admin</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Medical Qualification
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. MBBS, MD (Cardiology), FACC"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Clinic / Department Location
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Bio & Clinical Summary
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
