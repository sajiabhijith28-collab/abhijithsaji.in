"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, PhoneCall, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

export function Footer() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/doctor/") ||
    pathname.startsWith("/mobile")
  ) {
    return null;
  }

  return (
    <footer className="no-print border-t border-[#c9a353]/30 bg-[#08172c] text-slate-200 mt-12 sm:mt-16 pb-20 lg:pb-0">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="group inline-block">
              <BrandLogo
                size="lg"
                subtitle="Hospital & Specialist Care"
                lightText
              />
            </Link>
            <p className="text-sm text-slate-300/85 leading-relaxed">
              Ponkunnam &amp; Palai, Kerala&apos;s dedicated hospital &amp; specialist
              appointment booking platform. Instant confirmed slots, transparent
              fees, and verified medical practitioners in Ponkunnam and Palai.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-200 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a353]/35 bg-white/[0.06] px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#dfc074]" />
                NMC Verified Doctors
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a353]/35 bg-white/[0.06] px-2.5 py-1">
                <Lock className="h-3.5 w-3.5 text-[#dfc074]" />
                Direct UPI &amp; Bank Verified
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#ebd396] mb-4">
              For Patients
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/doctors" className="hover:text-[#ebd396] transition-colors">
                  Search Doctors Near Me
                </Link>
              </li>
              <li>
                <Link href="/doctors?specialty=cardiology" className="hover:text-[#ebd396] transition-colors">
                  Cardiologists
                </Link>
              </li>
              <li>
                <Link href="/doctors?specialty=dermatology" className="hover:text-[#ebd396] transition-colors">
                  Dermatologists
                </Link>
              </li>
              <li>
                <Link href="/doctors?specialty=pediatrics" className="hover:text-[#ebd396] transition-colors">
                  Pediatricians
                </Link>
              </li>
              <li>
                <Link href="/account/appointments" className="hover:text-[#ebd396] transition-colors">
                  Manage My Appointments
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#ebd396] mb-4">
              Portals &amp; Partners
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/login?tab=doctor" className="hover:text-[#ebd396] transition-colors">
                  Doctor Portal Login
                </Link>
              </li>
              <li>
                <Link href="/doctor/dashboard" className="hover:text-[#ebd396] transition-colors">
                  Doctor Schedule &amp; Earnings
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#ebd396] transition-colors">
                  Platform Admin Console
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#ebd396] transition-colors">
                  Cancellation &amp; Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#ebd396] mb-4">
              24x7 Patient Care Desk
            </h4>
            <div className="rounded-2xl border border-[#c9a353]/30 bg-white/[0.06] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <PhoneCall className="h-4 w-4 text-[#dfc074]" />
                +91-1800-108-6937
              </div>
              <p className="text-xs text-slate-300">
                Need help rescheduling or verifying payment receipts? Email us
                anytime at{" "}
                <span className="font-medium text-[#ebd396]">care@mydr.in</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} My Dr Healthcare Technologies Pvt. Ltd. All rights reserved.</p>
          <p>Built with Next.js, Supabase RLS &amp; Direct UPI Payments</p>
        </div>
      </div>
    </footer>
  );
}
