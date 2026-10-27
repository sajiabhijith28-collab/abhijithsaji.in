import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useToast } from '../common/Toast';
import { HeartPulse, Stethoscope, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';

interface SignupScreenProps {
  onGoToLogin: () => void;
  onSuccess: (role: UserRole) => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onGoToLogin, onSuccess }) => {
  const { signup } = useAuth();
  const { addToast } = useToast();

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Doctor-specific fields
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Common validations
    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Valid email address is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Contact phone number is required.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Role specific validations
    if (role === 'doctor') {
      if (!qualification.trim()) {
        setErrorMessage('Please state your medical qualifications (e.g. MBBS, MD).');
        return;
      }
      if (!clinicName.trim()) {
        setErrorMessage('Clinic or hospital department name is required.');
        return;
      }
      if (!fee || Number(fee) < 0) {
        setErrorMessage('Please provide a valid consultation fee.');
        return;
      }
      if (!Number.isInteger(Number(experience)) || Number(experience) < 0 || Number(experience) > 80) {
        setErrorMessage('Enter clinical experience between 0 and 80 years.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await signup({
        name,
        email,
        phone,
        role,
        password,
        doctorInfo: role === 'doctor' ? {
          specialization,
          experience_years: Number(experience),
          qualification,
          clinic_name: clinicName,
          consultation_fee: Number(fee),
          bio: bio || `Specialist in ${specialization} with ${experience} years clinical practice.`
        } : undefined
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
        addToast('error', 'Registration Error', res.error);
      } else if (!res.user) {
        addToast('info', 'Verify Your Email', 'Check your email for the Supabase confirmation link, then sign in.');
        onGoToLogin();
      } else {
        if (role === 'doctor') {
          addToast(
            'info',
            'Doctor Account Submitted',
            'Your medical registration is pending Admin verification before public slot booking.'
          );
        } else {
          addToast('success', 'Account Created!', `Welcome to Ente Hospital, ${name}!`);
        }
        onSuccess(role);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-teal-50/40 via-slate-50 to-slate-100">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-teal-500 via-sky-500 to-emerald-500" />

          {/* Logo & Headline */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img
                src="/assets/aistudio/image_758d1889.png"
                alt="Ente Hospital"
                className="h-11 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Ente Hospital Account</h1>
            <p className="text-xs text-slate-500 mt-1">Select your account type to access specialized care tools</p>
          </div>

          {/* 3 Selectable Account Type Cards with Icons */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Patient Card */}
              <div
                onClick={() => {
                  setRole('patient');
                  setErrorMessage('');
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center relative ${
                  role === 'patient'
                    ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {role === 'patient' && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900">Patient</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Book visits</span>
              </div>

              {/* Doctor Card */}
              <div
                onClick={() => {
                  setRole('doctor');
                  setErrorMessage('');
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center relative ${
                  role === 'doctor'
                    ? 'border-sky-500 bg-sky-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {role === 'doctor' && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900">Doctor</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Manage slots</span>
              </div>

            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'Dr. Elizabeth Warren' : 'John Doe'}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* DOCTOR SPECIFIC EXTRA FIELDS */}
            {role === 'doctor' && (
              <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200/80 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 uppercase tracking-wide">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                  <span>Doctor Credentials & Clinical Profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Specialization
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    >
                      <option value="" disabled>Select specialization</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="ENT Specialist">ENT Specialist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="80"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Qualifications
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. MBBS, MD, FRCP"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Doctor Consultation Fee (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fee}
                        onChange={(e) => setFee(e.target.value)}
                        placeholder="500"
                        required
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                    <span className="text-[10px] text-teal-700 font-medium mt-0.5 block">Payable separately at the clinic counter</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Clinic / Hospital Department
                    </label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Ente Hospital Outpatient Dept, Floor 2"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Platform Booking Fee (₹)
                    </label>
                    <input
                      type="text"
                      value="Set by hospital administration"
                      disabled
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Configured exclusively by Hospital Admin</span>
                  </div>
                </div>


                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Professional Bio & Highlights
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief background on your clinical expertise..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <span>Complete {role.charAt(0).toUpperCase() + role.slice(1)} Registration</span>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="font-semibold text-teal-600 hover:text-teal-700 underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
