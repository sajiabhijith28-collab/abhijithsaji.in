import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { getLocalDateString } from '../../utils/date';
import { DoctorWithProfile, TimeSlot, Appointment } from '../../types';
import { useToast } from '../common/Toast';
import {
  Search,
  Calendar,
  Clock,
  Star,
  Building,
  HeartPulse,
  Award,
  CheckCircle2,
  X,
  XCircle,
  CalendarCheck,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  Smartphone
} from 'lucide-react';

interface PatientDashboardProps {
  initialTab?: string;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ initialTab = 'find-doctor' }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'find-doctor' | 'my-appointments'>(
    initialTab === 'my-appointments' ? 'my-appointments' : 'find-doctor'
  );

  // Doctors directory state
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  // Booking modal state
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithProfile | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [bookingDate, setBookingDate] = useState<string>(getLocalDateString);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My Appointments state
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [platformFee, setPlatformFee] = useState(0);

  // Load patient data
  const loadData = async () => {
    const [docs, fee, appts] = await Promise.all([
      db.getAllDoctors(true),
      db.getPlatformFee(),
      user ? db.getAppointments({ patientId: user.id }) : Promise.resolve([])
    ]);
    setDoctors(docs);
    setPlatformFee(fee);
    setMyAppointments(appts);
  };

  useEffect(() => {
    void loadData().catch(error => {
      addToast('error', 'Unable to Load Portal Data', error instanceof Error ? error.message : 'Please try again.');
    });
  }, [user]);

  // When selected doctor or booking date changes, fetch available slots
  useEffect(() => {
    if (selectedDoctor && bookingDate) {
      void db.getSlots(selectedDoctor.id, bookingDate, true).then(slots => {
        setAvailableSlots(slots);
        setSelectedSlot(null);
      }).catch(error => {
        addToast('error', 'Unable to Load Availability', error instanceof Error ? error.message : 'Please try again.');
      });
    }
  }, [selectedDoctor, bookingDate]);

  // Open booking modal for a doctor
  const handleOpenBooking = async (doc: DoctorWithProfile) => {
    setSelectedDoctor(doc);
    const todayStr = getLocalDateString();
    setBookingDate(todayStr);
    try {
      setAvailableSlots(await db.getSlots(doc.id, todayStr, true));
    } catch (error) {
      addToast('error', 'Unable to Load Availability', error instanceof Error ? error.message : 'Please try again.');
    }
    setSelectedSlot(null);
    setConsultationNotes('');
  };

  // Confirm appointment booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDoctor || !selectedSlot) {
      addToast('error', 'Selection Required', 'Please choose an available appointment slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await db.bookSlot(
        selectedDoctor.id,
        selectedSlot.id,
        consultationNotes || 'General clinical consultation'
      );

      if (res.success) {
        addToast(
          'success',
          'Appointment Requested!',
          `Your appointment with ${selectedDoctor.name} on ${selectedSlot.date} at ${selectedSlot.start_time} is reserved.`
        );
        setSelectedDoctor(null);
        setSelectedSlot(null);
        await loadData();
        setActiveTab('my-appointments');
      } else {
        addToast('error', 'Booking Conflict', res.error);
        // Refresh available slots for this doctor
        if (selectedDoctor && bookingDate) {
          setAvailableSlots(await db.getSlots(selectedDoctor.id, bookingDate, true));
        }
      }
    } catch (error) {
      addToast('error', 'Booking Failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel an appointment
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? The slot will be released.')) {
      return;
    }

    try {
      const res = await db.updateAppointmentStatus(appointmentId, 'cancelled');
      if (res.success) {
        addToast('info', 'Appointment Cancelled', 'Your appointment was cancelled and the slot was released.');
        await loadData();
      } else {
        addToast('error', 'Cancellation Error', res.error);
      }
    } catch (error) {
      addToast('error', 'Cancellation Error', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // Filtered doctors
  const specialties = ['All', 'Cardiology', 'Pediatrics', 'Dermatology', 'General Medicine', 'Orthopedics', 'Neurology'];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.details.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.details.clinic_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'All' || doc.details.specialization.toLowerCase() === selectedSpecialty.toLowerCase();

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Patient Welcome Header */}
      <div className="bg-linear-to-r from-teal-700 via-teal-600 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <HeartPulse className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-semibold tracking-wider uppercase text-teal-200 bg-teal-800/60 px-3 py-1 rounded-full border border-teal-500/40">
            Patient Care Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Welcome, {user?.name || 'Valued Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-2 leading-relaxed">
            Schedule verified clinical consultations at Ente Hospital. Choose your specialist, select a suitable time slot, and avoid clinic wait times.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('find-doctor')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'find-doctor' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Find Specialist Doctors</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
              {doctors.length}
            </span>
          </div>
          {activeTab === 'find-doctor' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('my-appointments')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'my-appointments' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            <span>My Appointments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
              {myAppointments.length}
            </span>
          </div>
          {activeTab === 'my-appointments' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: FIND DOCTORS */}
      {activeTab === 'find-doctor' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor by name, specialty, or clinic..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Specialty Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 shrink-0 font-medium">Specialty:</span>
              <div className="flex items-center gap-1">
                {specialties.map(spec => (
                  <button
                    key={spec}
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                      selectedSpecialty === spec
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No doctors matched your search</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Try searching for a different clinical specialty or clear your search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map(doc => {
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Doctor Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={doc.avatar_url || '/avatar-placeholder.svg'}
                          alt={doc.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{doc.details.rating.toFixed(1)}</span>
                            <span className="text-slate-400">({doc.details.review_count} reviews)</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{doc.name}</h3>
                          <span className="text-xs text-teal-700 font-semibold">{doc.details.specialization}</span>
                        </div>
                      </div>

                      {/* Credentials & Clinic */}
                      <div className="space-y-1.5 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.details.qualification}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.details.clinic_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.details.experience_years} years clinical practice</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {doc.details.bio}
                      </p>
                    </div>

                    {/* Footer strip: Platform Fee + Clinic Consultation Fee + Book Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-teal-700 tabular-nums">
                          Platform Fee: ₹{platformFee}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          Clinic Fee: ₹{doc.details.consultation_fee} (Pay at clinic)
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenBooking(doc)}
                        className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-teal-600/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Book Slot</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPOINTMENTS */}
      {activeTab === 'my-appointments' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            Automated appointment reminders are not enabled for this deployment.
          </div>

          {myAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No scheduled appointments</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                You have not booked any medical consultations yet. Browse our specialist doctors to schedule your visit.
              </p>
              <button
                onClick={() => setActiveTab('find-doctor')}
                className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Doctors</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-xs font-semibold text-teal-700">{apt.doctor_specialization}</span>
                        <h3 className="text-base font-bold text-slate-900">{apt.doctor_name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{apt.doctor_clinic}</span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
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
                    </div>

                    {/* Date & Time pill */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 tabular-nums my-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span>{apt.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span>{apt.start_time} - {apt.end_time}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">Reason: </span>
                      {apt.notes || 'Routine consultation'}
                    </div>

                  </div>

                  {/* Actions & Fee Breakdown */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <div className="font-bold text-teal-700 tabular-nums">
                        Online Platform Fee: ₹{apt.platform_fee || platformFee}
                      </div>
                      <div className="text-[11px] text-slate-600 tabular-nums font-medium">
                        Doctor Consultation Fee: ₹{apt.consultation_fee || apt.doctor_fee || 500} (Pay at clinic)
                      </div>
                    </div>

                    {(apt.status === 'confirmed' || apt.status === 'pending') && (
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="py-1.5 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Appointment</span>
                      </button>
                    )}

                    {apt.status === 'completed' && (
                      <span className="text-xs text-sky-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Visit Completed</span>
                      </span>
                    )}

                    {apt.status === 'cancelled' && (
                      <span className="text-xs text-rose-500 italic">Slot Released</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 my-8">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Doctor Info in Modal */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-5">
              <img
                src={selectedDoctor.avatar_url || '/avatar-placeholder.svg'}
                alt={selectedDoctor.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedDoctor.name}</h3>
                <p className="text-xs text-teal-700 font-semibold">{selectedDoctor.details.specialization}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedDoctor.details.clinic_name}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1. Select Appointment Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min={getLocalDateString()}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Slots Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Select Available Time Slot
                  </label>
                  <span className="text-[11px] text-teal-700 font-semibold tabular-nums">
                    {availableSlots.length} available
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200/80">
                    No open slots available for this doctor on the selected date. Please pick a different date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map(slot => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl text-xs font-semibold tabular-nums border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-teal-400 hover:bg-teal-50/50'
                          }`}
                        >
                          {slot.start_time} - {slot.end_time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Consultation Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  3. Reason for Consultation (Optional)
                </label>
                <input
                  type="text"
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="e.g. Follow-up checkup, fever, prescription renewal..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Summary strip with separate fees */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-700 font-semibold">1. Online Platform Booking Fee:</span>
                    <span className="text-[10px] text-slate-400 block">Pay online to reserve time slot</span>
                  </div>
                  <span className="text-base font-bold text-teal-700 tabular-nums">
                    ₹{platformFee}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <div>
                    <span className="text-slate-700 font-semibold">2. Doctor Consultation Fee:</span>
                    <span className="text-[10px] text-amber-700 font-medium block">
                      Pay separately at clinic reception during visit
                    </span>
                  </div>
                  <span className="text-base font-bold text-slate-900 tabular-nums">
                    ₹{selectedDoctor.details.consultation_fee}
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-1.5 mt-2">
                  <span className="font-bold shrink-0">ℹ</span>
                  <span>
                    Note: The doctor's consultation fee of ₹{selectedDoctor.details.consultation_fee} is payable separately at the clinic when you arrive for your consultation.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSlot || isSubmitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
