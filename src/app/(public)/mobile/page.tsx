"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck2,
  Check,
  Copy,
  ExternalLink,
  Home,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SCREEN_PRESETS = [
  { label: "Patient Home", path: "/", icon: Home },
  { label: "Find Doctors", path: "/doctors", icon: Stethoscope },
  {
    label: "My Bookings",
    path: "/account/appointments",
    icon: CalendarCheck2,
  },
  {
    label: "Doctor Portal",
    path: "/doctor/dashboard",
    icon: Stethoscope,
  },
  {
    label: "Admin Approve UPI",
    path: "/admin/payments",
    icon: ShieldCheck,
  },
];

export default function MobilePreviewPage() {
  const [activePath, setActivePath] = useState("/");
  const [frameKey, setFrameKey] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const phoneUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${activePath}`
      : `http://192.168.1.3:3000${activePath}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText("http://192.168.1.3:3000");
      setCopiedUrl(true);
      toast.success("Copied mobile URL: http://192.168.1.3:3000");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.info("Open http://192.168.1.3:3000 on your phone");
    }
  };

  return (
    <div className="min-h-screen royal-navy-hero text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-[#c9a353]/30 bg-[#0b1f3a]/90 backdrop-blur-md">
        <div className="container h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" subtitle="Mobile Website Studio" lightText />
            <Badge className="hidden sm:inline-flex bg-[#c9a353]/20 text-[#ebd396] border-[#c9a353]/40">
              390 × 820 Smartphone Viewport
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyLink}
              className="border-[#c9a353]/45 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              {copiedUrl ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-[#ebd396]" />
              )}
              <span className="hidden sm:inline">Phone Wi-Fi URL:</span>{" "}
              192.168.1.3:3000
            </Button>

            <Button
              size="sm"
              className="bg-gradient-to-r from-[#c9a353] to-[#dfc074] text-[#08172c] font-bold"
              asChild
            >
              <Link href={activePath}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Full Screen
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="container flex-1 py-6 lg:py-8 grid gap-8 lg:grid-cols-12 items-center">
        {/* Left Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a353]/45 bg-[#c9a353]/15 px-3 py-1 text-xs font-semibold text-[#ebd396]">
              <Smartphone className="h-3.5 w-3.5" />
              Interactive Mobile Website
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              My Dr Mobile Experience
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every Patient, Doctor, and Admin screen is engineered mobile-first
              with bottom tab bars, horizontal specialty chips, slide-up filter
              sheets, direct UPI app launch links, and thumb-friendly approval
              cards.
            </p>
          </div>

          {/* Quick Screen Switcher */}
          <div className="space-y-2">
            <p className="text-xs font-heading font-bold uppercase tracking-wider text-[#ebd396]">
              Jump to Mobile Screen
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {SCREEN_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const active = activePath === preset.path;
                return (
                  <button
                    key={preset.path}
                    type="button"
                    onClick={() => setActivePath(preset.path)}
                    className={`rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      active
                        ? "border-[#ebd396] bg-[#c9a353] text-[#08172c] shadow-md"
                        : "border-white/15 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {preset.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open on Real Smartphone Box */}
          <div className="rounded-2xl border border-[#c9a353]/35 bg-white/[0.06] p-4 space-y-2 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-[#ebd396]">
                Open on Your Real Phone (Same Wi-Fi)
              </span>
              <button
                type="button"
                onClick={() => setFrameKey((k) => k + 1)}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reload Phone
              </button>
            </div>
            <p className="text-slate-300">
              Type{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[#ebd396]">
                http://192.168.1.3:3000
              </code>{" "}
              in Chrome or Safari on your mobile phone to test native UPI app
              launch (<code className="font-mono">{phoneUrl}</code>).
            </p>
          </div>
        </div>

        {/* Right: Realistic Smartphone Hardware Frame */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative rounded-[3rem] border-[10px] border-[#162b49] bg-[#08172c] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.6),0_0_0_2px_rgba(201,163,83,0.5)]">
            {/* Dynamic Island Notch */}
            <div className="mx-auto mb-1.5 h-5 w-28 rounded-full bg-black/90 flex items-center justify-end px-3">
              <span className="h-2 w-2 rounded-full bg-[#1e3a5f]" />
            </div>

            {/* Live 390x780 Mobile Viewport */}
            <div className="w-[340px] sm:w-[390px] h-[720px] sm:h-[780px] overflow-hidden rounded-[2.2rem] bg-background">
              <iframe
                key={`${activePath}-${frameKey}`}
                src={activePath}
                title="My Dr Live Mobile Website"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

