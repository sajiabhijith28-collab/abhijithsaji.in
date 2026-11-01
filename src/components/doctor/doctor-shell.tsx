"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CalendarCheck2,
  Camera,
  Clock,
  ExternalLink,
  HeartPulse,
  IndianRupee,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DoctorWithDetails, PublicProfile } from "@/types/database";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/doctor/dashboard", label: "Dashboard & Calendar", icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "Patient Bookings", icon: CalendarCheck2 },
  { href: "/doctor/availability", label: "Availability & Leave", icon: Clock },
  { href: "/doctor/earnings", label: "Earnings & Payouts", icon: IndianRupee },
];

export function DoctorShell({
  user,
  doctor,
  children,
}: {
  user: PublicProfile;
  doctor: DoctorWithDetails;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [editPhotoOpen, setEditPhotoOpen] = useState(false);
  const [doctorPhoto, setDoctorPhoto] = useState(doctor.photo_url);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const handleSaveDoctorPhoto = async () => {
    if (!doctorPhoto) {
      toast.error("Please choose or upload a photo");
      return;
    }
    setSavingPhoto(true);
    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: doctorPhoto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update photo");
      toast.success("Profile photo updated successfully!");
      setEditPhotoOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update photo");
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out of Doctor Portal");
    router.push("/login?tab=doctor");
    router.refresh();
  };

  const handleForcedPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update password");
      toast.success("New personal password set! Welcome to your Doctor Portal.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save password");
    } finally {
      setSavingPw(false);
    }
  };

  // Forced Password Change Gate on First Login
  if (user.must_change_password) {
    return (
      <div className="medical-grid-bg min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/30">
          <CardHeader className="space-y-2">
            <Badge variant="warning" className="w-fit">
              First Login Security Requirement
            </Badge>
            <CardTitle className="text-2xl flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Update Your Temporary Password
            </CardTitle>
            <CardDescription>
              Welcome, <strong>{doctor.full_name}</strong>. Please replace the
              temporary password created by the Admin with your personal strong
              password before accessing patient records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForcedPasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-new-pw">New Personal Password</Label>
                <Input
                  id="doc-new-pw"
                  type="password"
                  placeholder="Min 8 chars, include letter & number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-conf-pw">Confirm New Password</Label>
                <Input
                  id="doc-conf-pw"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={savingPw}>
                {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Password &amp; Unlock Portal
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/25">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-68 shrink-0 flex-col border-r bg-card">
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#c9a353]/30 bg-[#0b1f3a] text-white">
          <Link href="/doctor/dashboard" className="group">
            <BrandLogo size="sm" subtitle="Doctor Portal" lightText />
          </Link>
          <span className="rounded-full border border-[#c9a353]/50 bg-[#c9a353]/20 px-2 py-0.5 text-[10px] font-bold text-[#ebd396]">
            MD
          </span>
        </div>

        {/* Doctor Badge */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="relative group shrink-0">
              <img
                src={doctorPhoto || doctor.photo_url}
                alt={doctor.full_name}
                className="h-11 w-11 rounded-xl object-cover border"
              />
              <button
                type="button"
                onClick={() => setEditPhotoOpen(true)}
                title="Change Doctor Photo"
                className="absolute inset-0 bg-black/60 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold truncate">
                {doctor.full_name}
              </p>
              <button
                type="button"
                onClick={() => setEditPhotoOpen(true)}
                className="text-xs text-primary font-medium truncate hover:underline flex items-center gap-1"
              >
                <Camera className="h-3 w-3" />
                Change Photo
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          {user.role === "admin" && (
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start bg-primary/90 text-primary-foreground font-semibold"
              asChild
            >
              <Link href="/admin">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                Admin Console
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <Link href={`/doctors/${doctor.id}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              View Public Profile
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Topbar */}
        <header className="lg:hidden h-15 border-b border-[#c9a353]/30 bg-[#0b1f3a] text-white px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 shrink-0"
              onClick={() => setMobileMenu((v) => !v)}
            >
              {mobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <BrandLogo size="sm" subtitle={doctor.full_name} lightText />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-200 hover:bg-white/10 hover:text-white shrink-0"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {mobileMenu && (
          <div className="lg:hidden border-b bg-card p-4 space-y-1 shadow-lg">
            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-primary text-primary-foreground mb-2"
              >
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                Admin Console
              </Link>
            )}
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenu(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex-1 p-4 sm:p-8 pb-24 lg:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </div>

        {/* Mobile Bottom Tab Bar for Doctor Portal */}
        <nav
          aria-label="Doctor Mobile Navigation"
          className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[#c9a353]/35 bg-[#0b1f3a]/98 text-slate-300 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
        >
          <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1">
            {[
              { href: "/doctor/dashboard", label: "Today", icon: LayoutDashboard },
              { href: "/doctor/appointments", label: "Bookings", icon: CalendarCheck2 },
              { href: "/doctor/availability", label: "Schedule", icon: Clock },
              { href: "/doctor/earnings", label: "Earnings", icon: IndianRupee },
            ].map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-[#ebd396] font-semibold" : "text-slate-300/80"
                  )}
                >
                  {active && (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#dfc074]" />
                  )}
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Change Doctor Profile Photo Dialog */}
        <Dialog open={editPhotoOpen} onOpenChange={setEditPhotoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Update Profile Photo
              </DialogTitle>
              <DialogDescription>
                This photo will be displayed on your public booking profile and patient appointment slips.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <ImageUpload
                value={doctorPhoto}
                onChange={setDoctorPhoto}
                label="Doctor Portrait"
                description="Upload an image from your device or pick a professional preset avatar."
                fallbackInitials={doctor.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                category="doctor"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPhotoOpen(false)}
                disabled={savingPhoto}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveDoctorPhoto}
                disabled={savingPhoto || !doctorPhoto}
              >
                {savingPhoto && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Save Photo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

