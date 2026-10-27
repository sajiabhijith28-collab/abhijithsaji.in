import React, { lazy, Suspense, useState, useEffect } from 'react';
import { db } from '../../services/db';
import { UserProfile, Appointment, DoctorWithProfile } from '../../types';
import { useToast } from '../common/Toast';
import {
  Users,
  CalendarCheck,
  Stethoscope,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Ban,
  TrendingUp,
  Filter,
  Check,
  Activity,
  AlertCircle,
  IndianRupee,
  Save
} from 'lucide-react';

const BookingTrends = lazy(() =>
  import('./BookingTrends').then(module => ({ default: module.BookingTrends }))
);

type AdminStats = Awaited<ReturnType<typeof db.getAdminStats>>;

const EMPTY_STATS: AdminStats = {
  totalDoctors: 0,
  approvedDoctors: 0,
  pendingDoctorsCount: 0,
  totalPatients: 0,
  totalAppointments: 0,
  todayAppointmentsCount: 0,
  activeBookingsCount: 0,
  completedCount: 0,
  cancelledCount: 0,
  platformFee: 0,
  chartData: []
};

export const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users' | 'appointments'>('overview');

  // Admin stats
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);

  // Pending doctors
  const [pendingDoctors, setPendingDoctors] = useState<DoctorWithProfile[]>([]);

  // Users list
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Appointments master list
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aptStatusFilter, setAptStatusFilter] = useState<string>('all');
  const [aptSearch, setAptSearch] = useState('');

  // Platform Fee Management (Admin Only)
  const [platformFee, setPlatformFee] = useState(0);
  const [editingFee, setEditingFee] = useState('0');
  const [isSavingFee, setIsSavingFee] = useState(false);

  const loadData = async () => {
    const [nextStats, allDocs, nextUsers, nextAppointments, nextFee] = await Promise.all([
      db.getAdminStats(),
      db.getAllDoctors(false),
      db.getProfiles(),
      db.getAppointments(),
      db.getPlatformFee()
    ]);
    setStats(nextStats);
    setPendingDoctors(allDocs.filter(d => !d.is_approved));
    setUsers(nextUsers);
    setAppointments(nextAppointments);
    setPlatformFee(nextFee);
    setEditingFee(nextFee.toString());
  };

  useEffect(() => {
    void loadData().catch(error => {
      addToast('error', 'Unable to Load Admin Data', error instanceof Error ? error.message : 'Please try again.');
    });
  }, []);

  // Update Platform Booking Fee (Admin Exclusive)
  const handleUpdatePlatformFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(editingFee);
    if (isNaN(num) || num < 0) {
      addToast('error', 'Invalid Amount', 'Please provide a valid non-negative platform fee.');
      return;
    }

    setIsSavingFee(true);
    try {
      const updated = await db.setPlatformFee(num);
      setPlatformFee(updated);
      addToast('success', 'Platform Fee Saved', `Hospital platform booking fee is now ₹${updated}.`);
      await loadData();
    } catch (error) {
      addToast('error', 'Unable to Save Platform Fee', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSavingFee(false);
    }
  };

  // Approve or Reject Doctor
  const handleDoctorApproval = async (doctorId: string, approve: boolean) => {
    try {
      await db.approveDoctor(doctorId, approve);
      addToast(
        approve ? 'success' : 'info',
        approve ? 'Doctor Approved' : 'Doctor Rejected',
        approve
          ? 'Doctor can now generate bookable consultation slots for patients.'
          : 'Doctor registration status set to unapproved.'
      );
      await loadData();
    } catch (error) {
      addToast('error', 'Unable to Update Doctor', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // Toggle User Block
  const handleToggleBlock = async (userId: string) => {
    try {
      const isNowBlocked = await db.toggleUserBlock(userId);
      addToast(
        isNowBlocked ? 'error' : 'success',
        isNowBlocked ? 'Account Blocked' : 'Account Restored',
        isNowBlocked ? 'User login access suspended.' : 'User login restored.'
      );
      await loadData();
    } catch (error) {
      addToast('error', 'Unable to Update Account', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = aptStatusFilter === 'all' || a.status === aptStatusFilter;
    const matchesSearch =
      (a.doctor_name || '').toLowerCase().includes(aptSearch.toLowerCase()) ||
      (a.patient_name || '').toLowerCase().includes(aptSearch.toLowerCase()) ||
      (a.doctor_specialization || '').toLowerCase().includes(aptSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Chart calculation
  const maxDayCount = Math.max(...stats.chartData.map(d => d.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Title Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800">
            Hospital Administration Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Ente Hospital Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centralized governance for clinical staffing, patient records, and appointment flow.
          </p>
        </div>

        {/* Quick Pending Doctor Alert Button if any */}
        {pendingDoctors.length > 0 && (
          <button
            onClick={() => setActiveTab('approvals')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-2xl text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{pendingDoctors.length} Doctor Approvals Pending</span>
          </button>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'overview' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Hospital Overview</span>
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-all relative flex items-center gap-1.5 ${
            activeTab === 'approvals' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Doctor Approvals</span>
          {pendingDoctors.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
              {pendingDoctors.length}
            </span>
          )}
          {activeTab === 'approvals' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'users' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>User Directory ({users.length})</span>
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'appointments' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Global Bookings ({appointments.length})</span>
          {activeTab === 'appointments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Doctors
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums mt-1 block">
                  {stats.totalDoctors}
                </span>
                <span className="text-[11px] text-teal-700 font-medium">
                  {stats.approvedDoctors} active · {stats.pendingDoctorsCount} pending
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Registered Patients
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums mt-1 block">
                  {stats.totalPatients}
                </span>
                <span className="text-[11px] text-sky-700 font-medium">
                  Verified patient profiles
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Appointments
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums mt-1 block">
                  {stats.totalAppointments}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {stats.activeBookingsCount} active · {stats.completedCount} completed
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Today's Bookings
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums mt-1 block">
                  {stats.todayAppointmentsCount}
                </span>
                <span className="text-[11px] text-amber-700 font-medium">
                  Scheduled for consultation today
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* EXCLUSIVE ADMIN PLATFORM BOOKING FEE CONTROLLER */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">Hospital Platform Booking Fee Management</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Admin Exclusive Control
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    Only administrators have the authorization to add or modify the Platform Booking Fee. This amount is automatically applied hospital-wide to every patient appointment.
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right shrink-0 bg-slate-50 md:bg-transparent p-3.5 md:p-0 rounded-2xl border md:border-0 border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Platform Fee
                </span>
                <span className="text-3xl font-extrabold text-teal-700 tabular-nums">
                  ₹{platformFee}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdatePlatformFee} className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
                {[20, 50, 75, 100, 150].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditingFee(preset.toString())}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      editingFee === preset.toString()
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={editingFee}
                    onChange={(e) => setEditingFee(e.target.value)}
                    required
                    className="w-32 pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 tabular-nums"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingFee}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingFee ? 'Saving...' : 'Set Platform Fee'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recharts Booking Trends Component */}
          <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-50 animate-pulse" />}>
            <BookingTrends data={stats.chartData} platformFee={platformFee} />
          </Suspense>
        </div>
      )}

      {/* TAB 2: DOCTOR APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Doctor Credential Verification Queue</h2>
                <p className="text-xs text-slate-500">
                  Verify qualifications, medical degrees, and hospital departments before allowing doctors to accept patient bookings.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 tabular-nums">
                {pendingDoctors.length} Pending Verification
              </span>
            </div>

            {pendingDoctors.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">All doctors verified!</h3>
                <p className="text-xs text-slate-500 mt-1">There are no pending doctor registration requests right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingDoctors.map(doc => (
                  <div
                    key={doc.id}
                    className="p-6 rounded-2xl border-2 border-amber-200 bg-amber-50/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={doc.avatar_url || '/avatar-placeholder.svg'}
                          alt={doc.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-amber-200 shrink-0"
                        />
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">
                            Pending Approval
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{doc.name}</h3>
                          <p className="text-xs text-teal-700 font-semibold">{doc.details.specialization}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 mb-4 bg-white p-3.5 rounded-xl border border-amber-100">
                        <div>
                          <span className="font-semibold text-slate-900">Email: </span>
                          <span>{doc.email}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Phone: </span>
                          <span>{doc.phone}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Qualifications: </span>
                          <span>{doc.details.qualification}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Experience: </span>
                          <span>{doc.details.experience_years} years</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Clinic / Wing: </span>
                          <span>{doc.details.clinic_name}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Platform Fee: </span>
                          <span className="font-bold text-teal-700">₹50</span>
                        </div>
                        {doc.details.bio && (
                          <div className="pt-1 border-t border-slate-100 text-slate-500 italic">
                            "{doc.details.bio}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleDoctorApproval(doc.id, false)}
                        className="px-4 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleDoctorApproval(doc.id, true)}
                        className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Verify</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name, email or phone..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {['all', 'patient', 'doctor', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    userRoleFilter === r
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || '/avatar-placeholder.svg'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                        />
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize font-semibold text-slate-700">{u.role}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{u.phone}</td>
                    <td className="py-4 px-6">
                      {u.is_blocked ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Suspended
                        </span>
                      ) : u.role === 'doctor' && !u.is_approved ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Approval
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => void handleToggleBlock(u.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                              u.is_blocked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                            <span>{u.is_blocked ? 'Unblock' : 'Block'}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                placeholder="Search appointments by doctor, patient, specialty..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setAptStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    aptStatusFilter === st
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Doctor</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Date & Slot</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Platform Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div>{a.doctor_name}</div>
                      <div className="text-[11px] text-teal-700 font-normal">{a.doctor_specialization}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-800">
                      <div className="font-semibold">{a.patient_name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{a.patient_email}</div>
                    </td>
                    <td className="py-4 px-6 tabular-nums">
                      <div className="font-medium text-slate-800">{a.date}</div>
                      <div className="text-[11px] text-slate-500">{a.start_time} - {a.end_time}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          a.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : a.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : a.status === 'completed'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900 tabular-nums">
                      ₹{a.platform_fee ?? platformFee}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
