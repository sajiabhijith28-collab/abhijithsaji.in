import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/auth/LoginScreen';
import { SignupScreen } from './components/auth/SignupScreen';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Shield, Phone, MapPin } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  // Auth screen state ('login' | 'signup')
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // Navigation tab for the active role
  const [currentTab, setCurrentTab] = useState<string>('home');

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading your account...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation Bar */}
      <Navbar currentTab={currentTab} onSelectTab={handleTabChange} />

      {/* Main Viewport */}
      <main className="flex-1">
        {!isAuthenticated ? (
          /* Unauthenticated Flow: Login / Signup */
          authView === 'login' ? (
            <LoginScreen
              onGoToSignup={() => setAuthView('signup')}
              onSuccess={(userRole) => {
                if (userRole === 'patient') setCurrentTab('find-doctor');
                else if (userRole === 'doctor') setCurrentTab('doctor-bookings');
                else setCurrentTab('admin-overview');
              }}
            />
          ) : (
            <SignupScreen
              onGoToLogin={() => setAuthView('login')}
              onSuccess={(userRole) => {
                if (userRole === 'patient') setCurrentTab('find-doctor');
                else if (userRole === 'doctor') setCurrentTab('doctor-bookings');
                else setCurrentTab('admin-overview');
              }}
            />
          )
        ) : (
          /* Role-Protected Dashboards */
          <>
            {role === 'patient' && (
              <PatientDashboard
                initialTab={currentTab === 'my-appointments' ? 'my-appointments' : 'find-doctor'}
              />
            )}

            {role === 'doctor' && (
              <DoctorDashboard />
            )}

            {role === 'admin' && (
              <AdminDashboard />
            )}
          </>
        )}
      </main>

      {/* Clinical Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_758d1889.png"
              alt="Ente Hospital"
              className="h-7 w-auto object-contain opacity-80"
            />
            <span>·</span>
            <span>Appointment scheduling and clinical practice portal</span>
          </div>

          <div className="flex items-center gap-6 text-xs flex-wrap justify-center">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>For emergencies, contact your local emergency services</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Contact the hospital for location details</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data handling depends on your configured deployment</span>
            </span>
          </div>

          <div className="text-slate-400">
            © {new Date().getFullYear()} Ente Hospital. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
