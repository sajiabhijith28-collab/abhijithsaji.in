"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CalendarCheck2,
  HeartPulse,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  Moon,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Sun,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useLocationContext } from "@/components/providers/location-provider";
import { Button } from "@/components/ui/button";
import type { PublicProfile } from "@/types/database";
import { cn } from "@/lib/utils";

export function Navbar({ user }: { user: PublicProfile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { city, setCity, detectLocation, isDetecting, availableCities } =
    useLocationContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide consumer topbar inside dedicated Admin/Doctor portal shells?
  // Keeping a slim or hidden bar inside /admin and /doctor makes their sidebar layouts cleaner!
  const isPortalRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/doctor/") ||
    pathname.startsWith("/mobile");

  if (isPortalRoute) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const portalHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "doctor"
      ? "/doctor/dashboard"
      : "/account";

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-[#c9a353]/30 bg-[#0b1f3a]/95 text-white shadow-md backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-3">
        {/* Brand Logo + Mobile City Pill */}
        <div className="flex items-center gap-2.5 sm:gap-5 min-w-0">
          <Link href="/" className="group shrink-0">
            <BrandLogo size="sm" subtitle="Verified Care" lightText />
          </Link>

          {/* Compact Mobile City + GPS Pill */}
          <div className="flex md:hidden items-center gap-1 rounded-xl border border-[#c9a353]/35 bg-white/[0.08] px-2 py-1 max-w-[162px]">
            <MapPin className="h-3 w-3 text-[#dfc074] shrink-0" />
            <select
              aria-label="Select Location Mobile Quick"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-[11px] font-medium text-white focus:outline-none truncate w-full"
            >
              {availableCities.length > 1 && (
                <option value="All Cities" className="bg-[#0b1f3a] text-white">
                  All Kerala
                </option>
              )}
              {availableCities.map((c) => (
                <option key={c} value={c} className="bg-[#0b1f3a] text-white">
                  {c}, Kerala
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetecting}
              title="Verify Ponkunnam GPS"
              className="text-[#ebd396] p-0.5 shrink-0"
            >
              <LocateFixed
                className={cn("h-3 w-3", isDetecting && "animate-spin")}
              />
            </button>
          </div>

          {/* Desktop City Selector + Geolocation */}
          <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#c9a353]/30 bg-white/[0.08] px-2.5 py-1">
            <MapPin className="h-3.5 w-3.5 text-[#dfc074] shrink-0" />
            <select
              aria-label="Select Location"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer pr-1"
            >
              {availableCities.length > 1 && (
                <option value="All Cities" className="bg-[#0b1f3a] text-white">
                  All Towns (Kerala)
                </option>
              )}
              {availableCities.map((c) => (
                <option key={c} value={c} className="bg-[#0b1f3a] text-white">
                  {c}, Kerala
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetecting}
              title="Detect my current city"
              className="ml-1 inline-flex items-center gap-1 rounded-lg bg-[#c9a353]/20 px-2 py-0.5 text-[11px] font-medium text-[#ebd396] hover:bg-[#c9a353]/30 transition-colors disabled:opacity-50"
            >
              <LocateFixed
                className={cn("h-3 w-3", isDetecting && "animate-spin")}
              />
              {isDetecting ? "Locating..." : "Near Me"}
            </button>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/doctors"
            className={cn(
              "transition-colors hover:text-[#ebd396]",
              pathname.startsWith("/doctors")
                ? "text-[#ebd396] font-semibold"
                : "text-slate-200"
            )}
          >
            Find Doctors
          </Link>
          <Link
            href="/doctors?specialty=cardiology"
            className="text-slate-200 transition-colors hover:text-[#ebd396]"
          >
            Specialties
          </Link>
          <Link
            href="/#how-it-works"
            className="text-slate-200 transition-colors hover:text-[#ebd396]"
          >
            How It Works
          </Link>
          <Link
            href="/login?tab=doctor"
            className="inline-flex items-center gap-1.5 text-slate-200 transition-colors hover:text-[#ebd396]"
          >
            <Stethoscope className="h-3.5 w-3.5 text-[#dfc074]" />
            For Doctors
          </Link>
          <Link
            href="/mobile"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a353]/45 bg-[#c9a353]/15 px-3 py-1 text-xs font-semibold text-[#ebd396] transition-colors hover:bg-[#c9a353]/25"
          >
            <Smartphone className="h-3.5 w-3.5 text-[#dfc074]" />
            Mobile View
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl text-slate-200 hover:bg-white/10 hover:text-[#ebd396]"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              {user.role === "patient" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#c9a353]/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link href="/account/appointments">
                    <CalendarCheck2 className="h-3.5 w-3.5 text-[#ebd396]" />
                    My Bookings
                  </Link>
                </Button>
              )}
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#c9a353] to-[#dfc074] text-[#08172c] font-semibold border border-[#ebd396]/60 hover:brightness-105"
                asChild
              >
                <Link href={portalHref}>
                  {user.role === "admin" ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  <span className="max-w-[120px] truncate">
                    {user.role === "admin"
                      ? "Admin Console"
                      : user.role === "doctor"
                      ? "Doctor Portal"
                      : user.full_name.split(" ")[0]}
                  </span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Sign out"
                className="text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-100 hover:bg-white/10 hover:text-[#ebd396]"
                asChild
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#c9a353] to-[#dfc074] text-[#08172c] font-bold border border-[#ebd396]/60 hover:brightness-105"
                asChild
              >
                <Link href="/signup">Book Appointment</Link>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10 hover:text-[#ebd396]"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#c9a353]/25 bg-card text-card-foreground px-5 py-4 lg:hidden space-y-4">
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 p-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <select
                aria-label="Select Location Mobile"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none"
              >
                {availableCities.length > 1 && (
                  <option value="All Cities">All Towns (Kerala)</option>
                )}
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}, Kerala
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={detectLocation}
              disabled={isDetecting}
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Near Me
            </Button>
          </div>

          <div className="grid gap-2 text-sm font-medium">
            <Link
              href="/doctors"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-muted"
            >
              Find Verified Doctors
            </Link>
            <Link
              href="/#specialties"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-muted"
            >
              Browse Specialties
            </Link>
            <Link
              href="/login?tab=doctor"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-muted"
            >
              Doctor Portal Login
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-muted"
            >
              Admin Console
            </Link>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t">
            {user ? (
              <>
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link href={portalHref}>Go to My Account ({user.full_name})</Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/signup">Sign Up with Mobile OTP</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/login">Log In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

