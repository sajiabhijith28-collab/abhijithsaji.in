import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { SlotPickerWidget } from "@/components/doctors/slot-picker-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDoctorById, getPlatformSettings } from "@/lib/db/store";
import { calculateBookingFees } from "@/lib/payments/fee-calculator";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = getDoctorById(id);
  if (!doctor) {
    notFound();
  }

  const settings = getPlatformSettings();
  const feeInfo = calculateBookingFees(doctor, settings);

  return (
    <div className="container py-8 md:py-12 space-y-8">
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Doctors Directory
      </Link>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left: Full Clinical Profile */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative shrink-0">
                  <img
                    src={doctor.photo_url}
                    alt={doctor.full_name}
                    className="h-32 w-32 rounded-2xl object-cover border shadow-sm"
                  />
                  <span className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{doctor.specialty.name}</Badge>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      {doctor.rating} ({doctor.review_count} verified patient
                      reviews)
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {doctor.full_name}
                  </h1>

                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    {doctor.qualifications.join(" • ")}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-1 text-xs sm:text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <Award className="h-4 w-4 text-primary" />
                      {doctor.experience_years} Years Experience
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Reg: {doctor.registration_number}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {doctor.slot_duration_mins} min slot
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Quick-Book Action Strip */}
              <div className="lg:hidden rounded-2xl border border-primary/25 bg-primary/[0.04] p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Pay Online: <strong>{formatINR(feeInfo.onlinePayable)}</strong>{" "}
                    • Clinic: <strong>{formatINR(feeInfo.clinicPayable)}</strong>
                  </span>
                  <span className="text-xs font-heading font-bold text-primary">
                    Instant UPI Slot Booking
                  </span>
                </div>
                <Button size="sm" asChild>
                  <a href="#book-slot">Pick Slot ↓</a>
                </Button>
              </div>

              {/* Bio */}
              <div className="border-t pt-5 space-y-2">
                <h2 className="font-heading text-base font-semibold">
                  Clinical Biography &amp; Expertise
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {doctor.bio}
                </p>
              </div>

              {/* Languages */}
              <div className="border-t pt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  Languages Spoken:
                </span>
                {doctor.languages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hospital & Transparent Fee Card */}
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Building2 className="h-3.5 w-3.5" />
                    Hospital / Clinic Location
                  </div>
                  <h3 className="font-heading text-lg font-bold">
                    {doctor.hospital.name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    {doctor.hospital.address}
                  </p>
                </div>
                <Badge variant="outline">★ {doctor.hospital.rating}</Badge>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Pay Online to Book ({feeInfo.feeLabel})
                  </span>
                  <span className="font-heading font-bold text-base text-primary tabular-nums">
                    {formatINR(feeInfo.onlinePayable)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Pay at Clinic (Consultation Fee)
                  </span>
                  <span className="font-heading font-bold text-base tabular-nums">
                    {formatINR(feeInfo.clinicPayable)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Combined Visit Total
                  </span>
                  <span className="font-heading font-semibold text-base text-muted-foreground tabular-nums">
                    {formatINR(feeInfo.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sticky Live Slot Picker */}
        <div id="book-slot" className="lg:col-span-5 lg:sticky lg:top-20 scroll-mt-20">
          <SlotPickerWidget
            doctorId={doctor.id}
            consultationFee={feeInfo.consultationFee}
            platformFeePreview={feeInfo.platformFee}
          />
        </div>
      </div>
    </div>
  );
}

