"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { FeeBreakdown } from "@/lib/payments/fee-calculator";
import type {
  DoctorWithDetails,
  GenderType,
  PublicProfile,
  SlotItem,
} from "@/types/database";
import { formatINR, getLocalISODate } from "@/lib/utils";

export function BookingWizard({
  doctor,
  feeBreakdown,
  currentUser,
}: {
  doctor: DoctorWithDetails;
  feeBreakdown: FeeBreakdown;
  currentUser: PublicProfile | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateOptions = Array.from({ length: 10 }).map((_, idx) => {
    const iso = getLocalISODate(idx);
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return {
      iso,
      dayLabel:
        idx === 0
          ? "Today"
          : idx === 1
          ? "Tomorrow"
          : dt.toLocaleDateString("en-IN", { weekday: "short" }),
      numLabel: dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
    };
  });

  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || dateOptions[0].iso
  );
  const [selectedSlot, setSelectedSlot] = useState(
    searchParams.get("slot") || ""
  );
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [leaveReason, setLeaveReason] = useState<string | undefined>();
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [patientName, setPatientName] = useState(currentUser?.full_name || "");
  const [patientAge, setPatientAge] = useState(
    currentUser?.age ? String(currentUser.age) : "30"
  );
  const [patientGender, setPatientGender] = useState<GenderType>(
    currentUser?.gender || "male"
  );
  const [patientPhone, setPatientPhone] = useState(
    currentUser?.phone ? currentUser.phone.replace(/^\+91/, "") : ""
  );
  const [symptomsNotes, setSymptomsNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    fetch(`/api/doctors/${doctor.id}/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const fetched = (data.slots || []) as SlotItem[];
        setSlots(fetched);
        setLeaveReason(data.onLeaveReason);
        if (
          selectedSlot &&
          !fetched.some((s) => s.time === selectedSlot && s.available)
        ) {
          setSelectedSlot("");
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [doctor.id, selectedDate]);

  const handleLockAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      const nextUrl = `/book/${doctor.id}?date=${selectedDate}&slot=${selectedSlot}`;
      toast.info("Please sign in with Mobile OTP or Password to lock your slot");
      router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select an available time slot");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          appointmentDate: selectedDate,
          slotTime: selectedSlot,
          patientName,
          patientAge: Number(patientAge),
          patientGender,
          patientPhone,
          symptomsNotes,
          payAtClinic: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not lock slot");

      // Save to localStorage immediately so appointment persists across serverless instances
      try {
        const raw = window.localStorage.getItem("mydr_user_bookings");
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [
          data.appointment,
          ...existing.filter((a: any) => a.id !== data.appointment.id),
        ];
        window.localStorage.setItem(
          "mydr_user_bookings",
          JSON.stringify(updated)
        );
        fetch("/api/bookings/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [data.appointment] }),
        }).catch(() => {});
      } catch {
        // ignore
      }

      toast.success(
        `Appointment confirmed! Token ${data.appointment.booking_code} generated. Please give ${formatINR(
          feeBreakdown.totalAmount,
          true
        )} directly to Dr. ${doctor.full_name} at the clinic.`
      );
      router.push("/account/appointments");
      return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Slot booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const morningSlots = slots.filter((s) => s.period === "Morning");
  const eveningSlots = slots.filter((s) => s.period === "Evening");

  return (
    <form
      onSubmit={handleLockAndProceed}
      className="grid gap-8 lg:grid-cols-12 items-start"
    >
      {/* Left Steps: Date + Slot + Patient Details */}
      <div className="lg:col-span-8 space-y-6">
        {/* Step 1: Date & Slot */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">Step 1 of 2</Badge>
              <span className="text-xs text-muted-foreground">
                {doctor.slot_duration_mins} min consultation
              </span>
            </div>
            <CardTitle className="text-xl pt-1">
              Choose Date &amp; Time Slot
            </CardTitle>
            <CardDescription>
              Select an open clinic time slot with {doctor.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Horizontal Date Strip */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Appointment Date
              </Label>
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {dateOptions.map((d) => {
                  const isSelected = selectedDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`rounded-xl border p-2 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className="text-[10px] opacity-85">{d.dayLabel}</div>
                      <div className="text-xs font-bold mt-0.5">{d.numLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Time Slots */}
            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : leaveReason ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
                Doctor is on scheduled leave ({leaveReason}). Please pick
                another date.
              </div>
            ) : (
              <div className="space-y-5">
                {morningSlots.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Sun className="h-4 w-4 text-amber-500" />
                      Morning Slots
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {morningSlots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setSelectedSlot(s.time)}
                          className={`rounded-xl border py-2.5 text-xs font-medium tabular-nums transition-all ${
                            !s.available
                              ? "opacity-35 line-through cursor-not-allowed bg-muted"
                              : selectedSlot === s.time
                              ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm scale-[1.02]"
                              : "bg-background hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {eveningSlots.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Moon className="h-4 w-4 text-sky-500" />
                      Evening Slots
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {eveningSlots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setSelectedSlot(s.time)}
                          className={`rounded-xl border py-2.5 text-xs font-medium tabular-nums transition-all ${
                            !s.available
                              ? "opacity-35 line-through cursor-not-allowed bg-muted"
                              : selectedSlot === s.time
                              ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm scale-[1.02]"
                              : "bg-background hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Patient Details */}
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Step 2 of 2
            </Badge>
            <CardTitle className="text-xl pt-1">
              Confirm Patient Details
            </CardTitle>
            <CardDescription>
              The doctor will see these details on their appointment queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentUser && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span>
                  You&apos;ll be asked to sign in via Mobile OTP before payment
                  so your receipt is saved to your account.
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/login?next=${encodeURIComponent(
                      `/book/${doctor.id}?date=${selectedDate}&slot=${selectedSlot}`
                    )}`}
                  >
                    Sign In Now
                  </Link>
                </Button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-name">Patient Full Name</Label>
                <Input
                  id="p-name"
                  placeholder="e.g. Aarav Sharma"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-phone">Mobile Number (for SMS updates)</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="p-phone"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    className="rounded-l-none"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-age">Patient Age (Years)</Label>
                <Input
                  id="p-age"
                  type="number"
                  min={0}
                  max={120}
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-gender">Gender</Label>
                <select
                  id="p-gender"
                  value={patientGender}
                  onChange={(e) =>
                    setPatientGender(e.target.value as GenderType)
                  }
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-notes">
                Symptoms / Reason for Visit (Optional)
              </Label>
              <Textarea
                id="p-notes"
                placeholder="Briefly describe symptoms, duration, or reports you are bringing..."
                value={symptomsNotes}
                onChange={(e) => setSymptomsNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Summary Card — Single Direct Booking Option */}
      <div className="lg:col-span-4 lg:sticky lg:top-20">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <img
                src={doctor.photo_url}
                alt={doctor.full_name}
                className="h-14 w-14 rounded-xl object-cover border"
              />
              <div className="min-w-0">
                <CardTitle className="text-base truncate">
                  {doctor.full_name}
                </CardTitle>
                <p className="text-xs text-primary font-medium">
                  {doctor.specialty.name}
                </p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {doctor.hospital.name}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="rounded-xl bg-muted/50 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-semibold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Slot</span>
                <span className="font-semibold text-primary">
                  {selectedSlot
                    ? slots.find((s) => s.time === selectedSlot)?.label ||
                      selectedSlot
                    : "Select a slot"}
                </span>
              </div>
            </div>

            {/* Transparent Fee Breakdown — Platform Fee & Consultation Fee Given to Doctor */}
            <div className="space-y-2.5 text-sm border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  Doctor Consultation Fee
                </span>
                <span className="font-medium tabular-nums">
                  {formatINR(feeBreakdown.consultationFee, true)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Platform Booking Fee ({feeBreakdown.appliedFeeRate}%)
                </span>
                <span className="font-medium tabular-nums">
                  {formatINR(feeBreakdown.platformFee, true)}
                </span>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5 space-y-2 mt-2">
                <div className="flex justify-between font-heading font-bold text-base">
                  <span>Total to Give to Doctor</span>
                  <span className="text-primary tabular-nums font-extrabold text-lg">
                    {formatINR(feeBreakdown.totalAmount, true)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-1.5">
                  <span>Online Advance Payment:</span>
                  <span className="font-bold text-emerald-600">
                    ₹0.00 (Cancelled — Free Online Booking)
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/[0.08] p-3 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Consultation fee ({formatINR(feeBreakdown.consultationFee, true)}) + platform fee ({formatINR(feeBreakdown.platformFee, true)}) are given directly to Dr. {doctor.full_name} at the clinic.
                </span>
              </div>
            </div>

            {/* Single 1-Click Action Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full font-bold shadow-md text-sm py-6 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={submitting || !selectedSlot}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Building2 className="h-5 w-5 mr-2" />
              )}
              Confirm Booking (Pay {formatINR(feeBreakdown.totalAmount, true)} to Doctor at Clinic)
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center pt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              Instant Confirmation • Official Booking Slip Generated
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

