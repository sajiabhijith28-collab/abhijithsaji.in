"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { ImageUpload } from "@/components/ui/image-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AppointmentWithDetails,
  GenderType,
  NotificationRecord,
  PublicProfile,
} from "@/types/database";
import {
  formatDisplayPhone,
  formatINR,
  formatReadableDate,
  formatTime12h,
  getInitials,
} from "@/lib/utils";

const BLOOD_GROUPS = ["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export function AccountClient({
  user,
  cities,
  appointments,
  notifications,
}: {
  user: PublicProfile;
  cities: string[];
  appointments: AppointmentWithDetails[];
  notifications: NotificationRecord[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Profile fields
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email || "");
  const [age, setAge] = useState(user.age ? String(user.age) : "28");
  const [gender, setGender] = useState<GenderType>(user.gender || "male");
  const [bloodGroup, setBloodGroup] = useState(user.blood_group || "");
  const [emergencyContact, setEmergencyContact] = useState(
    user.emergency_contact || ""
  );
  const [city, setCity] = useState(user.city || cities[0] || "Ponkunnam");
  const [area, setArea] = useState(user.area || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Change Mobile via OTP fields
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [maskedNewPhone, setMaskedNewPhone] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const id = setInterval(() => {
      setPhoneCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phoneCooldown]);

  const activeBookings = appointments.filter(
    (a) =>
      a.status === "confirmed" ||
      a.status === "verification_pending" ||
      a.status === "pending_payment"
  );
  const pendingUpiCount = appointments.filter(
    (a) => a.status === "verification_pending"
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "completed"
  ).length;

  const memberCode = `MYDR-ID-${user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out of your personal account");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          age: Number(age),
          gender,
          blood_group: bloodGroup,
          emergency_contact: emergencyContact,
          city,
          area,
          avatar_url: avatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      toast.success("Personal health profile saved!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: user.has_password ? currentPassword : "",
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password update failed");
      toast.success(
        user.has_password
          ? "Password updated!"
          : "Password enabled! You can now sign in with Mobile + Password."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set password");
    } finally {
      setSavingPassword(false);
    }
  };

  const sendChangePhoneOtp = async () => {
    setVerifyingPhone(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone, mode: "change_phone" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send OTP");

      setPhoneOtp("");
      setPhoneOtpSent(true);
      setMaskedNewPhone(data.maskedPhone || `+91 ${newPhone}`);
      setPhoneCooldown(data.resendAfterSeconds || 30);

      if (data.liveSmsSent) {
        toast.success(`6-digit OTP sent directly to ${data.maskedPhone} via SMS!`);
      } else if (data.fallbackSmsCode) {
        toast.message(`SMS Test Mode • ${data.maskedPhone}`, {
          description: `Code: ${data.fallbackSmsCode}. Note: To deliver cellular SMS directly to your mobile phone SIM, connect Fast2SMS or 2Factor in Admin Settings.`,
          duration: 15000,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleVerifyNewPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtp.length !== 6) {
      toast.error("Enter the complete 6-digit OTP");
      return;
    }
    setVerifyingPhone(true);
    try {
      const res = await fetch("/api/account/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPhone, otp: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      toast.success("Mobile number updated & verified on your Personal Account!");
      setEditingPhone(false);
      setPhoneOtpSent(false);
      setNewPhone("");
      setPhoneOtp("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyingPhone(false);
    }
  };

  return (
    <div className="container py-6 md:py-10 space-y-6">
      {/* 1. ROYAL NAVY + CHAMPAGNE GOLD PERSONAL HEALTH ID CARD */}
      <div className="royal-navy-hero rounded-3xl border border-[#c9a353]/45 p-5 sm:p-7 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative group flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-[#c9a353]/65 bg-gradient-to-br from-[#c9a353]/25 to-[#0b1f3a] font-heading text-xl sm:text-2xl font-extrabold text-[#ebd396] shadow-inner overflow-hidden">
              {avatarUrl || user.avatar_url ? (
                <img
                  src={avatarUrl || user.avatar_url}
                  alt={user.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(user.full_name)
              )}
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                title="Change Profile Photo"
                className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-semibold"
              >
                <Camera className="h-4 w-4 mb-0.5" />
                Change
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Mobile: {formatDisplayPhone(user.phone)}
                </span>
                <span className="rounded-full border border-[#c9a353]/40 bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-[#ebd396]">
                  {memberCode}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {user.full_name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200/90">
                {user.age && (
                  <span className="rounded-lg bg-white/10 px-2 py-0.5">
                    {user.age} yrs •{" "}
                    <span className="capitalize">{user.gender || "Patient"}</span>
                  </span>
                )}
                {user.blood_group && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 border border-rose-400/30 px-2 py-0.5 text-rose-200 font-semibold">
                    <Droplets className="h-3 w-3" />
                    Blood: {user.blood_group}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5">
                  <MapPin className="h-3 w-3 text-[#dfc074]" />
                  {user.area ? `${user.area}, ${user.city}` : user.city || "India"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="default"
              className="bg-gradient-to-r from-[#c9a353] to-[#dfc074] text-[#08172c] font-bold hover:brightness-105"
              asChild
            >
              <Link href="/doctors">
                <Stethoscope className="h-4 w-4" />
                Book Doctor
              </Link>
            </Button>
            <Button
              size="default"
              variant="outline"
              onClick={handleLogout}
              className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* 2. PERSONAL ACCOUNT KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Bookings</p>
            <p className="text-2xl font-extrabold font-heading mt-0.5 text-primary tabular-nums">
              {activeBookings.length}
            </p>
          </CardContent>
        </Card>
        <Card className={pendingUpiCount > 0 ? "border-amber-500/40" : ""}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              UPI Verification Hold
            </p>
            <p className="text-2xl font-extrabold font-heading mt-0.5 text-amber-600 tabular-nums">
              {pendingUpiCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed Visits</p>
            <p className="text-2xl font-extrabold font-heading mt-0.5 text-emerald-600 tabular-nums">
              {completedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Login Protection</p>
            <p className="text-sm font-bold font-heading mt-1.5 text-foreground">
              {user.has_password ? "OTP + Password" : "Mobile OTP Verified"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. PRO TABBED PERSONAL ACCOUNT WORKSPACE */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="overview" className="py-2 text-xs sm:text-sm gap-1.5">
            <CalendarCheck2 className="h-4 w-4" />
            Overview &amp; Visits
          </TabsTrigger>
          <TabsTrigger value="profile" className="py-2 text-xs sm:text-sm gap-1.5">
            <User className="h-4 w-4" />
            Health Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="py-2 text-xs sm:text-sm gap-1.5">
            <Smartphone className="h-4 w-4" />
            Mobile &amp; Security
          </TabsTrigger>
          <TabsTrigger value="alerts" className="py-2 text-xs sm:text-sm gap-1.5">
            <Bell className="h-4 w-4" />
            SMS Alerts ({notifications.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & ACTIVE VISITS */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                Your Upcoming &amp; Recent Appointments
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Live slot status, UPI verification updates, and clinic fee
                reminders
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/account/appointments">
                All Bookings &amp; Receipts
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <CalendarCheck2 className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="font-heading text-lg font-bold">
                  No Consultations Yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Find verified specialists in {user.city || "your city"}, lock
                  a confirmed slot online, and pay your consultation fee at the
                  clinic.
                </p>
                <Button asChild>
                  <Link href="/doctors">Browse Verified Doctors</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {appointments.slice(0, 4).map((appt) => (
                <Card key={appt.id} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={appt.doctor_photo}
                          alt={appt.doctor_name}
                          className="h-12 w-12 rounded-2xl object-cover border"
                        />
                        <div>
                          <div className="font-heading font-bold text-sm sm:text-base">
                            {appt.doctor_name}
                          </div>
                          <div className="text-xs text-primary font-medium">
                            {appt.specialty_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="line-clamp-1">
                              {appt.hospital_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={
                          appt.status === "confirmed"
                            ? "success"
                            : appt.status === "verification_pending"
                            ? "warning"
                            : appt.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {appt.status === "verification_pending"
                          ? "Awaiting Admin Approval"
                          : appt.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/35 p-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">
                          Date &amp; Time
                        </span>
                        <span className="font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-primary" />
                          {formatReadableDate(appt.appointment_date)} •{" "}
                          {formatTime12h(appt.slot_time)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">
                          Fee Breakdown
                        </span>
                        <span className="font-semibold block mt-0.5">
                          Online {formatINR(appt.platform_fee)} •{" "}
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Clinic {formatINR(appt.consultation_fee)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {appt.booking_code}
                      </span>
                      <div className="flex gap-2">
                        {appt.status === "pending_payment" && (
                          <Button size="sm" className="h-8 text-xs" asChild>
                            <Link href={`/checkout?appointmentId=${appt.id}`}>
                              Complete UPI Payment
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          asChild
                        >
                          <Link href="/account/appointments">
                            Receipt / Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: HEALTH & PERSONAL PROFILE */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal &amp; Medical Profile
              </CardTitle>
              <CardDescription>
                Automatically pre-fills your patient details during hospital
                appointment booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <ImageUpload
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  label="Profile Photo"
                  description="Upload a photo from your device or select an avatar. Your photo will appear on your Personal Health ID card."
                  fallbackInitials={getInitials(fullName || user.full_name)}
                  category="patient"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="acc-name">Full Name *</Label>
                    <Input
                      id="acc-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-email">Email Address</Label>
                    <Input
                      id="acc-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-age">Age (Years) *</Label>
                    <Input
                      id="acc-age"
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-gender">Gender *</Label>
                    <select
                      id="acc-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as GenderType)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-blood">Blood Group</Label>
                    <select
                      id="acc-blood"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg || "none"} value={bg}>
                          {bg ? bg : "Select Blood Group (Optional)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-emerg">Emergency Family Contact</Label>
                    <Input
                      id="acc-emerg"
                      type="tel"
                      placeholder="+91 98XXX XXXXX"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-city">City *</Label>
                    <select
                      id="acc-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-area">Locality / Area</Label>
                    <Input
                      id="acc-area"
                      placeholder="e.g. Ponkunnam Town / PP Road"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Health Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: MOBILE OTP IDENTITY & PASSWORD SECURITY */}
        <TabsContent value="security" className="grid gap-6 lg:grid-cols-2">
          {/* Card A: Registered Mobile Number + Change via OTP */}
          <Card className="border-primary/25">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Registered Mobile Number
                </CardTitle>
                <Badge variant="success">OTP Verified</Badge>
              </div>
              <CardDescription>
                Your mobile number is the primary login key for your personal My
                Dr account and SMS appointment alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/35 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Current Mobile Number
                  </div>
                  <div className="font-mono text-base font-bold mt-0.5">
                    {formatDisplayPhone(user.phone)}
                  </div>
                </div>
                {!editingPhone && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPhone(true)}
                  >
                    Change via OTP
                  </Button>
                )}
              </div>

              {editingPhone && (
                <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-4 space-y-4">
                  {!phoneOtpSent ? (
                    <div className="space-y-3">
                      <Label htmlFor="chg-phone">New 10-Digit Mobile Number</Label>
                      <div className="flex">
                        <span className="inline-flex items-center rounded-l-xl border border-r-0 bg-muted px-3 text-sm font-semibold">
                          +91
                        </span>
                        <Input
                          id="chg-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Enter new mobile number"
                          className="rounded-l-none"
                          value={newPhone}
                          onChange={(e) =>
                            setNewPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={sendChangePhoneOtp}
                          disabled={
                            verifyingPhone ||
                            newPhone.replace(/\D/g, "").length !== 10
                          }
                        >
                          {verifyingPhone ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Phone className="h-3.5 w-3.5" />
                          )}
                          Send 6-Digit OTP
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPhone(false);
                            setNewPhone("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyNewPhone} className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          Code sent to <strong>{maskedNewPhone}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhoneOtpSent(false)}
                          className="text-primary font-semibold hover:underline"
                        >
                          Edit number
                        </button>
                      </div>

                      <OtpInput
                        value={phoneOtp}
                        onChange={setPhoneOtp}
                        disabled={verifyingPhone}
                      />

                      <div className="flex items-center justify-between text-xs">
                        {phoneCooldown > 0 ? (
                          <span className="font-mono text-muted-foreground">
                            Resend in 00:
                            {String(phoneCooldown).padStart(2, "0")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={sendChangePhoneOtp}
                            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Resend OTP
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={verifyingPhone || phoneOtp.length !== 6}
                        >
                          {verifyingPhone && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          Verify &amp; Update Mobile
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPhone(false);
                            setPhoneOtpSent(false);
                            setPhoneOtp("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <div className="border-t pt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 inline mr-1 text-primary" />
                  Signed in on this device
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card B: Password Login Setup */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <KeyRound className="h-5 w-5 text-primary" />
                  {user.has_password
                    ? "Change Account Password"
                    : "Enable Password Login"}
                </CardTitle>
                <Badge variant={user.has_password ? "success" : "warning"}>
                  {user.has_password ? "Enabled" : "OTP Only"}
                </Badge>
              </div>
              <CardDescription>
                {user.has_password
                  ? "Sign in anytime with either Mobile + 6-Digit OTP or Mobile + Password."
                  : "Add an optional password to sign in even when cellular SMS signal is unavailable."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4">
                {user.has_password && (
                  <div className="space-y-2">
                    <Label htmlFor="cur-pw">Current Password</Label>
                    <Input
                      id="cur-pw"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    placeholder="Min 8 chars, letter + number"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conf-pw">Confirm Password</Label>
                  <Input
                    id="conf-pw"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {user.has_password ? "Update Password" : "Enable Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: SMS & BOOKING NOTIFICATIONS */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Personal SMS &amp; Appointment Alerts
              </CardTitle>
              <CardDescription>
                All OTP security events, UPI payment verifications, and booking
                confirmations sent to {formatDisplayPhone(user.phone)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No alerts yet. Booking confirmations and UPI approvals appear
                  here automatically.
                </p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border bg-muted/35 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading text-xs sm:text-sm font-bold">
                        {n.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {n.channel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
