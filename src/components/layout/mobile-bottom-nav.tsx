"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  Home,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import type { PublicProfile } from "@/types/database";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ user }: { user: PublicProfile | null }) {
  const pathname = usePathname();

  // Dedicated portal shells (/admin, /doctor) & simulator (/mobile) render their own navigation
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/mobile")
  ) {
    return null;
  }

  const bookingsHref = !user
    ? "/login?next=/account/appointments"
    : user.role === "admin"
    ? "/admin/payments"
    : user.role === "doctor"
    ? "/doctor/appointments"
    : "/account/appointments";

  const accountHref = !user
    ? "/login"
    : user.role === "admin"
    ? "/admin"
    : user.role === "doctor"
    ? "/doctor/dashboard"
    : "/account";

  const accountLabel = !user
    ? "Login"
    : user.role === "admin"
    ? "Admin"
    : user.role === "doctor"
    ? "Portal"
    : "Profile";

  const AccountIcon = user?.role === "admin" ? ShieldCheck : User;

  const tabs = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/doctors",
      label: "Doctors",
      icon: Stethoscope,
      active: pathname.startsWith("/doctors") || pathname.startsWith("/book"),
    },
    {
      href: bookingsHref,
      label: "Bookings",
      icon: CalendarCheck2,
      active:
        pathname.startsWith("/account/appointments") ||
        pathname.startsWith("/checkout"),
    },
    {
      href: accountHref,
      label: accountLabel,
      icon: AccountIcon,
      active:
        pathname === "/account" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#c9a353]/35 bg-[#0b1f3a]/98 text-slate-300 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(8,23,44,0.28)]"
    >
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95",
                tab.active
                  ? "text-[#ebd396] font-semibold"
                  : "text-slate-300/80 hover:text-white"
              )}
            >
              {tab.active && (
                <span className="absolute top-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-[#c9a353] via-[#ebd396] to-[#c9a353]" />
              )}
              <div
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  tab.active ? "bg-[#c9a353]/20" : "bg-transparent"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

