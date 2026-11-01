"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Building2,
  CalendarRange,
  CreditCard,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Stethoscope,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";
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
import type { PublicProfile } from "@/types/database";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Analytics Overview", icon: BarChart3 },
  { href: "/admin/doctors", label: "Doctors & Credentials", icon: Stethoscope },
  { href: "/admin/hospitals", label: "Hospitals & Catalog", icon: Building2 },
  { href: "/admin/bookings", label: "Bookings & Patients", icon: CalendarRange },
  { href: "/admin/payments", label: "Payments & CSV", icon: CreditCard },
  { href: "/admin/payouts", label: "Doctor Payouts", icon: Wallet },
  { href: "/admin/settings", label: "Platform Fee & Settings", icon: Settings },
];

export function AdminShell({
  user,
  children,
}: {
  user: PublicProfile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Admin Login Form State
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password,
          expectedRole: "admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid admin credentials");
      toast.success("Authenticated as Platform Administrator");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out of Admin Console");
    window.location.href = "/admin";
  };

  // Dedicated Secure Admin Login Gate at /admin
  if (!user || user.role !== "admin") {
    return (
      <div className="medical-grid-bg min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="shadow-2xl border-[#c9a353]/35">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto">
                <BrandLogo size="xl" showText={false} />
              </div>
              <Badge variant="default" className="mx-auto w-fit">
                Restricted Access
              </Badge>
              <CardTitle className="text-2xl">My Dr Admin Console</CardTitle>
              <CardDescription>
                Sign in with administrator credentials to manage doctors,
                platform fees, payments, and settlements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adm-phone">Admin Mobile Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="adm-phone"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className="rounded-l-none"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-pw">Master Password</Label>
                  <Input
                    id="adm-pw"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Unlock Admin Control Center
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/25">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-68 shrink-0 flex-col border-r bg-card">
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#c9a353]/30 bg-[#0b1f3a] text-white">
          <Link href="/admin" className="group">
            <BrandLogo size="sm" subtitle="Admin Control Center" lightText />
          </Link>
          <span className="rounded-full border border-[#c9a353]/50 bg-[#c9a353]/20 px-2 py-0.5 text-[10px] font-bold text-[#ebd396]">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => {
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
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/" target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              Open Patient Site
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-15 border-b border-[#c9a353]/30 bg-[#0b1f3a] text-white px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <BrandLogo size="sm" subtitle="Admin Console" lightText />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden border-b bg-card p-4 space-y-1 shadow-lg">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
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

        <div className="flex-1 p-4 sm:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </div>

        {/* Mobile Bottom Tab Bar for Admin */}
        <nav
          aria-label="Admin Mobile Navigation"
          className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[#c9a353]/35 bg-[#0b1f3a]/98 text-slate-300 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
        >
          <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
            {[
              { href: "/admin", label: "Overview", icon: BarChart3 },
              { href: "/admin/payments", label: "Payments", icon: CreditCard },
              { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
              { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
              { href: "/admin/settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
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
      </div>
    </div>
  );
}

