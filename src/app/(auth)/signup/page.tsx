"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Phone,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useLocationContext } from "@/components/providers/location-provider";
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
import type { GenderType } from "@/types/database";

export default function SignupPage() {
  const router = useRouter();
  const { availableCities } = useLocationContext();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState<GenderType>("male");
  const [city, setCity] = useState("Ponkunnam");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [step, setStep] = useState<"details" | "otp" | "password">("details");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const sendSignupOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, fullName, mode: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send OTP");

      setOtp("");
      setStep("otp");
      setMaskedPhone(data.maskedPhone || `+91 ${phone}`);
      setResendCooldown(data.resendAfterSeconds || 30);

      if (data.liveSmsSent) {
        toast.success(`6-digit OTP sent directly to ${data.maskedPhone} via SMS!`);
      } else if (data.fallbackSmsCode) {
        toast.message(`SMS Test Mode • ${data.maskedPhone}`, {
          description: `Code: ${data.fallbackSmsCode}. Note: To deliver cellular SMS directly to your mobile phone SIM, connect Fast2SMS or 2Factor in Admin Settings.`,
          duration: 15000,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendSignupOtp();
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, fullName, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      // Persist age & gender immediately onto the verified personal account
      await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          age: Number(age),
          gender,
          city,
        }),
      });

      toast.success("Mobile verified & Personal Account created!");
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save password");
      toast.success("Password enabled on your Personal Account!");
      router.push("/account");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-grid-bg min-h-[calc(100vh-5rem)] flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto">
            <BrandLogo size="xl" showText={false} />
          </div>
          <CardTitle className="text-2xl">
            {step === "password"
              ? "Set Account Password"
              : "Create Personal Account"}
          </CardTitle>
          <CardDescription>
            {step === "password"
              ? "Optional: add a password so you can sign in with OTP or Password"
              : "Verify your mobile number via 6-digit SMS OTP to activate your personal health account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "details" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name *</Label>
                <Input
                  id="full-name"
                  placeholder="e.g. Anjali Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone">Mobile Number *</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 bg-muted px-3.5 text-sm font-semibold text-foreground">
                    +91
                  </span>
                  <Input
                    id="signup-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="rounded-l-none text-base font-medium"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-age">Age (Years) *</Label>
                  <Input
                    id="signup-age"
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-gender">Gender *</Label>
                  <select
                    id="signup-gender"
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
                <Label htmlFor="signup-city">Your City *</Label>
                <select
                  id="signup-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                Send 6-Digit Verification OTP
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Already have a personal account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <div className="rounded-xl border bg-primary/[0.04] p-3 flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    OTP sent to{" "}
                    <strong className="font-mono text-foreground">
                      {maskedPhone}
                    </strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setOtp("");
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enter 6-Digit Verification Code
                </Label>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || otp.length !== 6}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify &amp; Activate Personal Account
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">
                  Didn&apos;t receive the code?
                </span>
                {resendCooldown > 0 ? (
                  <span className="font-mono text-muted-foreground">
                    Resend in 00:{String(resendCooldown).padStart(2, "0")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendSignupOtp}
                    disabled={loading}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Personal Account verified for {fullName}!
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-pw">Set Password</Label>
                <Input
                  id="s-pw"
                  type="password"
                  placeholder="Min 8 chars, include letter & number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-cpw">Confirm Password</Label>
                <Input
                  id="s-cpw"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Password &amp; Open Personal Account
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  router.push("/account");
                  router.refresh();
                }}
              >
                Skip &amp; Go to Personal Account
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
