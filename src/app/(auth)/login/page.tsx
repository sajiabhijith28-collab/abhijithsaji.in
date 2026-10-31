"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  MessageSquareText,
  Phone,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useLocationContext } from "@/components/providers/location-provider";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GenderType } from "@/types/database";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { availableCities } = useLocationContext();

  const initialTab =
    searchParams.get("tab") === "doctor" ? "doctor" : "patient";
  const nextPath = searchParams.get("next") || "";

  const [roleTab, setRoleTab] = useState<"patient" | "doctor">(initialTab);
  const [patientMethod, setPatientMethod] = useState<"otp" | "password">("otp");

  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Seamless Personal Account Onboarding Step (for brand-new mobile numbers)
  const [onboardingStep, setOnboardingStep] = useState<
    "none" | "profile" | "password"
  >("none");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState<GenderType>("male");
  const [city, setCity] = useState("Ponkunnam");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (searchParams.get("tab") === "doctor") {
      setRoleTab("doctor");
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtpToMobile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, mode: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setOtp("");
      setOtpSent(true);
      setMaskedPhone(data.maskedPhone || `+91 ${phone}`);
      setResendCooldown(data.resendAfterSeconds || 30);

      if (data.liveSmsSent) {
        toast.success(`6-digit OTP sent via SMS to ${data.maskedPhone}`);
      } else if (data.fallbackSmsCode) {
        toast.message(`SMS • MYDRIN to +91 ${phone.replace(/\D/g, "").slice(-10)}`, {
          description: `Your My Dr verification code is ${data.fallbackSmsCode}. Enter this 6-digit code to access your personal account.`,
          duration: 15000,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtpToMobile();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      if (data.needsProfileSetup) {
        setFullName(
          data.user.full_name?.startsWith("Patient ")
            ? ""
            : data.user.full_name || ""
        );
        setCity(data.user.city || availableCities[0] || "Ponkunnam");
        setOnboardingStep("profile");
        toast.success("Mobile number verified! Complete your personal profile.");
      } else {
        toast.success(`Welcome back, ${data.user.full_name}!`);
        router.push(nextPath || "/account");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePersonalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          age: Number(age),
          gender,
          city,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save profile");

      if (newPassword.trim()) {
        const pwRes = await fetch("/api/auth/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPassword,
            confirmPassword: confirmPassword || newPassword,
          }),
        });
        const pwData = await pwRes.json();
        if (!pwRes.ok) throw new Error(pwData.error || "Password setup failed");
      }

      toast.success("Personal healthcare account ready!");
      router.push(nextPath || "/account");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (
    e: React.FormEvent,
    expectedRole: "patient" | "doctor"
  ) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, expectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      toast.success(`Signed in as ${data.user.full_name}`);
      if (data.user.role === "doctor") {
        router.push(nextPath || "/doctor/dashboard");
      } else {
        router.push(nextPath || "/account");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (onboardingStep === "profile") {
    return (
      <Card className="w-full max-w-md border-primary/25 shadow-xl">
        <CardHeader className="space-y-2">
          <Badge variant="success" className="w-fit gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified Mobile • +91 {phone.replace(/\D/g, "").slice(-10)}
          </Badge>
          <CardTitle className="text-2xl">
            Set Up Your Personal Account
          </CardTitle>
          <CardDescription>
            Your mobile number is now linked to your personal My Dr health ID.
            Add your details for instant 1-tap appointment booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompletePersonalProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="onb-name">Full Name *</Label>
              <Input
                id="onb-name"
                placeholder="e.g. Rahul Menon"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="onb-age">Age (Years) *</Label>
                <Input
                  id="onb-age"
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onb-gender">Gender *</Label>
                <select
                  id="onb-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as GenderType)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onb-city">Preferred City *</Label>
              <select
                id="onb-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="onb-pw" className="text-xs font-semibold">
                  Optional Password (for password login)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Optional
                </span>
              </div>
              <Input
                id="onb-pw"
                type="password"
                placeholder="Min 8 chars with letter & number"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setConfirmPassword(e.target.value);
                }}
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Open My Personal Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <Card className="shadow-xl border-border/80">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto">
            <BrandLogo size="xl" showText={false} />
          </div>
          <CardTitle className="text-2xl">
            {roleTab === "doctor"
              ? "Doctor Portal Sign In"
              : "Personal Health Account"}
          </CardTitle>
          <CardDescription>
            {roleTab === "doctor"
              ? "Sign in with your registered doctor mobile number and password"
              : "Enter your mobile number to receive a 6-digit OTP and open your personal account"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <Tabs
            value={roleTab}
            onValueChange={(v) => {
              setRoleTab(v as "patient" | "doctor");
              setOtpSent(false);
              setOtp("");
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patient" className="gap-1.5">
                <UserCheck className="h-4 w-4" />
                Personal Account
              </TabsTrigger>
              <TabsTrigger value="doctor" className="gap-1.5">
                <Stethoscope className="h-4 w-4" />
                Doctor Portal
              </TabsTrigger>
            </TabsList>

            {/* PATIENT PERSONAL ACCOUNT LOGIN / OTP */}
            <TabsContent value="patient" className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPatientMethod("otp");
                    setOtp("");
                  }}
                  className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                    patientMethod === "otp"
                      ? "bg-card text-primary shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mobile + 6-Digit OTP
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMethod("password")}
                  className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                    patientMethod === "password"
                      ? "bg-card text-primary shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mobile + Password
                </button>
              </div>

              {patientMethod === "otp" ? (
                !otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pat-phone">Mobile Number</Label>
                      <div className="flex">
                        <span className="inline-flex items-center rounded-l-xl border border-r-0 bg-muted px-3.5 text-sm font-semibold text-foreground">
                          +91
                        </span>
                        <Input
                          id="pat-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          className="rounded-l-none text-base font-medium tracking-wide"
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          required
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        New and existing patients are both supported — your
                        mobile number is your personal My Dr account.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={loading || phone.replace(/\D/g, "").length !== 10}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                      Get 6-Digit OTP
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="rounded-xl border bg-primary/[0.04] p-3 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          OTP sent to{" "}
                          <strong className="font-mono text-foreground">
                            {maskedPhone || `+91 ${phone}`}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                        }}
                        className="font-semibold text-primary hover:underline shrink-0"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Enter 6-Digit Verification Code
                      </Label>
                      <OtpInput
                        value={otp}
                        onChange={setOtp}
                        disabled={loading}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Verify &amp; Open Personal Account
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">
                        Didn&apos;t receive the SMS?
                      </span>
                      {resendCooldown > 0 ? (
                        <span className="font-mono text-muted-foreground">
                          Resend in 00:{String(resendCooldown).padStart(2, "0")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={sendOtpToMobile}
                          disabled={loading}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                )
              ) : (
                <form
                  onSubmit={(e) => handlePasswordLogin(e, "patient")}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="pw-phone">Mobile Number</Label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-xl border border-r-0 bg-muted px-3.5 text-sm font-semibold text-foreground">
                        +91
                      </span>
                      <Input
                        id="pw-phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        className="rounded-l-none"
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pat-pw">Account Password</Label>
                    <Input
                      id="pat-pw"
                      type="password"
                      placeholder="Enter your personal password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Sign In to Personal Account
                  </Button>
                </form>
              )}

              <div className="flex items-center justify-center gap-4 border-t pt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  OTP Verified Identity
                </span>
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Encrypted Health Records
                </span>
              </div>
            </TabsContent>

            {/* DOCTOR PORTAL LOGIN */}
            <TabsContent value="doctor" className="space-y-4 pt-3">
              <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
                Doctors sign in using the registered mobile number and password
                issued by the My Dr Hospital Administrator.
              </div>
              <form
                onSubmit={(e) => handlePasswordLogin(e, "doctor")}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="doc-phone">Registered Doctor Mobile</Label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 bg-muted px-3.5 text-sm font-semibold text-foreground">
                      +91
                    </span>
                    <Input
                      id="doc-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit doctor mobile"
                      className="rounded-l-none"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-pw">Portal Password</Label>
                  <Input
                    id="doc-pw"
                    type="password"
                    placeholder="Enter doctor portal password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Stethoscope className="h-4 w-4" />
                  )}
                  Enter Doctor Portal
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Need to register with full details upfront?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:underline"
        >
          Create Personal Account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="medical-grid-bg min-h-[calc(100vh-5rem)] flex items-center justify-center py-10 px-4">
      <Suspense
        fallback={
          <div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-muted" />
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
