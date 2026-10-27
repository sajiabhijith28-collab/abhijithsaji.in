import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, role, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
          {/* Zone 1: Single Brand element */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer" 
            onClick={() => onSelectTab(role === 'doctor' ? 'doctor-bookings' : role === 'admin' ? 'admin-overview' : 'find-doctor')}
          >
            <img
              src="/assets/aistudio/image_758d1889.png"
              alt="Ente Hospital"
              className="h-9 sm:h-10 w-auto object-contain"
            />
            <span className="hidden sm:inline-block text-[11px] tracking-wider uppercase font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
              Care Portal
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {role === 'patient' && (
              <>
                <button
                  onClick={() => onSelectTab('find-doctor')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'find-doctor' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  Find Doctors
                </button>
                <button
                  onClick={() => onSelectTab('my-appointments')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                    currentTab === 'my-appointments' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  <span>My Appointments</span>
                </button>
                <button
                  onClick={() => onSelectTab('health-records')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'health-records' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  Hospital Services
                </button>
              </>
            )}

            {role === 'doctor' && (
              <>
                <button
                  onClick={() => onSelectTab('doctor-bookings')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'doctor-bookings' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  Patient Bookings
                </button>
                <button
                  onClick={() => onSelectTab('doctor-slots')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'doctor-slots' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  Add & Manage Slots
                </button>
                <button
                  onClick={() => onSelectTab('doctor-profile')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'doctor-profile' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  My Practice Profile
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <button
                  onClick={() => onSelectTab('admin-overview')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'admin-overview' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  Hospital Overview
                </button>
                <button
                  onClick={() => onSelectTab('admin-doctors')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'admin-doctors' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  Doctor Approvals
                </button>
                <button
                  onClick={() => onSelectTab('admin-users')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'admin-users' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  User Directory
                </button>
                <button
                  onClick={() => onSelectTab('admin-appointments')}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                    currentTab === 'admin-appointments' ? 'text-teal-700 font-semibold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
                >
                  All Bookings
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: User Profile & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* User info & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{user.name}</span>
                  <span className="text-[10px] text-teal-600 capitalize font-medium">{user.role}</span>
                </div>
                <img
                  src={user.avatar_url || '/avatar-placeholder.svg'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-teal-200 object-cover"
                />
                <button
                  onClick={() => {
                    void logout().catch(error => console.error('Unable to sign out.', error));
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

    </>
  );
};
