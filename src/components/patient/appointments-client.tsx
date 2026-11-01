"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AppointmentWithDetails,
  PlatformSettingsRecord,
  SlotItem,
} from "@/types/database";
import {
  formatINR,
  formatReadableDate,
  formatTime12h,
  getLocalISODate,
} from "@/lib/utils";

export function AppointmentsClient({
  initialAppointments,
  settings,
}: {
  initialAppointments: AppointmentWithDetails[];
  settings: PlatformSettingsRecord;
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);

  // Sync with client-side local cache for instant resilience across serverless cold starts
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mydr_user_bookings");
      if (raw) {
        const stored = JSON.parse(raw) as AppointmentWithDetails[];
        if (Array.isArray(stored) && stored.length > 0) {
          setAppointments((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const missing = stored.filter((a) => !existingIds.has(a.id));
            if (missing.length > 0) {
              fetch("/api/bookings/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookings: missing }),
              }).catch(() => {});
              return [...missing, ...prev];
            }
            return prev;
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (appointments.length > 0) {
      try {
        window.localStorage.setItem(
          "mydr_user_bookings",
          JSON.stringify(appointments)
        );
      } catch {
        // ignore
      }
    }
  }, [appointments]);
  const [receiptTarget, setReceiptTarget] =
    useState<AppointmentWithDetails | null>(null);
  const [cancelTarget, setCancelTarget] =
    useState<AppointmentWithDetails | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AppointmentWithDetails | null>(null);
  const [newDate, setNewDate] = useState(getLocalISODate(1));
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [newSlot, setNewSlot] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const today = getLocalISODate(0);
  const upcoming = appointments.filter(
    (a) =>
      (a.status === "confirmed" ||
        a.status === "verification_pending" ||
        a.status === "pending_payment") &&
      a.appointment_date >= today
  );
  const history = appointments.filter((a) => !upcoming.includes(a));

  const openReschedule = async (appt: AppointmentWithDetails) => {
    setRescheduleTarget(appt);
    const defaultDate = getLocalISODate(1);
    setNewDate(defaultDate);
    setNewSlot("");
    const res = await fetch(
      `/api/doctors/${appt.doctor_id}/slots?date=${defaultDate}`
    );
    const data = await res.json();
    setAvailableSlots(data.slots || []);
  };

  const handleRescheduleDateChange = async (dt: string) => {
    setNewDate(dt);
    setNewSlot("");
    if (!rescheduleTarget) return;
    const res = await fetch(
      `/api/doctors/${rescheduleTarget.doctor_id}/slots?date=${dt}`
    );
    const data = await res.json();
    setAvailableSlots(data.slots || []);
  };

  const submitCancel = async () => {
    if (!cancelTarget) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: cancelReason || "Cancelled by patient",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      setAppointments((prev) =>
        prev.map((a) => (a.id === data.appointment.id ? data.appointment : a))
      );
      toast.success(
        data.refundAmount > 0
          ? `Booking cancelled. Refund of ${formatINR(
              data.refundAmount,
              true
            )} initiated!`
          : "Booking cancelled."
      );
      setCancelTarget(null);
      setCancelReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setLoadingAction(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !newSlot) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/bookings/${rescheduleTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          newDate,
          newSlotTime: newSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reschedule failed");

      setAppointments((prev) =>
        prev.map((a) => (a.id === data.appointment.id ? data.appointment : a))
      );
      toast.success("Appointment rescheduled successfully!");
      setRescheduleTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const statusBadge = (status: AppointmentWithDetails["status"]) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success">Confirmed</Badge>;
      case "verification_pending":
        return (
          <Badge variant="warning">Payment Verification Pending</Badge>
        );
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "pending_payment":
        return <Badge variant="warning">Pending Payment</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="secondary">No-Show</Badge>;
    }
  };

  const renderCard = (appt: AppointmentWithDetails) => (
    <Card key={appt.id} className="overflow-hidden">
      <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex gap-4">
          <img
            src={appt.doctor_photo}
            alt={appt.doctor_name}
            className="h-16 w-16 rounded-2xl object-cover border shrink-0"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge(appt.status)}
              <span className="text-xs font-mono text-muted-foreground">
                {appt.booking_code}
              </span>
              {appt.payment?.status === "refunded" && (
                <Badge variant="outline" className="text-emerald-600">
                  Refunded {formatINR(appt.payment.refund_amount || 0)}
                </Badge>
              )}
            </div>
            <h3 className="font-heading text-base font-bold">
              {appt.doctor_name}{" "}
              <span className="text-xs font-normal text-primary">
                • {appt.specialty_name}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {appt.hospital_name} ({appt.city})
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium text-foreground">
              <span className="inline-flex items-center gap-1 text-primary">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatReadableDate(appt.appointment_date)} at{" "}
                {formatTime12h(appt.slot_time)}
              </span>
              <span>•</span>
              <span className="tabular-nums">
                Paid Online: {formatINR(appt.platform_fee, true)} •{" "}
                <span className="text-emerald-700 dark:text-emerald-400">
                  At Clinic: {formatINR(appt.consultation_fee, true)}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {appt.status === "pending_payment" && (
            <Button size="sm" asChild>
              <Link href={`/checkout?bookingId=${appt.id}`}>Complete Payment</Link>
            </Button>
          )}
          {appt.status === "verification_pending" && (
            <>
              <Button size="sm" variant="secondary" asChild>
                <Link href={`/checkout?bookingId=${appt.id}`}>
                  Verification Status
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelTarget(appt)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
          {appt.payment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReceiptTarget(appt)}
            >
              <FileText className="h-3.5 w-3.5" />
              Receipt
            </Button>
          )}
          {appt.status === "confirmed" && appt.appointment_date >= today && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openReschedule(appt)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reschedule
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelTarget(appt)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-8 md:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Profile
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">My Appointments</h1>
          <p className="text-sm text-muted-foreground">
            View upcoming consultations, reschedule slots, cancel with instant
            refunds, or download receipts
          </p>
        </div>
        <Button asChild>
          <Link href="/doctors">+ Book New Appointment</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Booking History ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center space-y-3">
                <p className="font-heading font-semibold">
                  No upcoming appointments
                </p>
                <p className="text-sm text-muted-foreground">
                  Need a checkup? Browse top specialists near your city.
                </p>
                <Button asChild>
                  <Link href="/doctors">Find a Doctor</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcoming.map(renderCard)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No past appointments yet.
              </CardContent>
            </Card>
          ) : (
            history.map(renderCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment?</DialogTitle>
            <DialogDescription>
              Free 100% refund applies when cancelled at least{" "}
              {settings.free_cancellation_hours} hours before the slot (
              otherwise {settings.cancellation_refund_percent}% refund).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="c-reason">Reason for Cancellation</Label>
            <Input
              id="c-reason"
              placeholder="e.g. Schedule conflict"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep Slot
            </Button>
            <Button
              variant="destructive"
              disabled={loadingAction}
              onClick={submitCancel}
            >
              {loadingAction && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Cancellation &amp; Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(o) => !o && setRescheduleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Pick a new date and open time slot with{" "}
              {rescheduleTarget?.doctor_name}. No extra payment required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-date">New Date</Label>
              <Input
                id="r-date"
                type="date"
                min={getLocalISODate(0)}
                value={newDate}
                onChange={(e) => handleRescheduleDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Available Time Slots</Label>
              <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                {availableSlots
                  .filter((s) => s.available)
                  .map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setNewSlot(s.time)}
                      className={`rounded-lg border py-2 text-xs font-medium ${
                        newSlot === s.time
                          ? "border-primary bg-primary text-primary-foreground font-bold"
                          : "hover:border-primary/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!newSlot || loadingAction}
              onClick={submitReschedule}
            >
              {loadingAction && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm New Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Payment Receipt Modal */}
      <Dialog
        open={Boolean(receiptTarget)}
        onOpenChange={(o) => !o && setReceiptTarget(null)}
      >
        <DialogContent className="max-w-lg">
          {receiptTarget && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Official Tax / Payment Receipt
                  </Badge>
                  <span className="text-xs font-mono">
                    {receiptTarget.booking_code}
                  </span>
                </div>
                <DialogTitle className="pt-2">
                  My Dr Healthcare Payment Receipt
                </DialogTitle>
                <DialogDescription>
                  {receiptTarget.hospital_name} • {receiptTarget.hospital_address}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold">
                    {receiptTarget.patient_name} ({receiptTarget.patient_phone})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="font-semibold">
                    {receiptTarget.doctor_name} ({receiptTarget.specialty_name})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consultation Slot:</span>
                  <span className="font-medium">
                    {formatReadableDate(receiptTarget.appointment_date)},{" "}
                    {formatTime12h(receiptTarget.slot_time)}
                  </span>
                </div>
                <div className="border-t pt-2.5 flex justify-between">
                  <span className="text-muted-foreground">
                    Platform Booking Fee (
                    {receiptTarget.applied_fee_type === "percentage"
                      ? `${receiptTarget.applied_fee_rate}%`
                      : "Flat"}
                    ):
                  </span>
                  <span className="tabular-nums font-semibold text-emerald-600">
                    {formatINR(receiptTarget.platform_fee, true)} (Paid Online)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Doctor Consultation Fee:
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatINR(receiptTarget.consultation_fee, true)} (Pay at
                    Clinic)
                  </span>
                </div>
                <div className="border-t pt-2.5 space-y-1">
                  <div className="flex justify-between font-heading font-bold text-base">
                    <span>Paid Online (Platform Fee):</span>
                    <span className="text-primary tabular-nums">
                      {formatINR(receiptTarget.platform_fee, true)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-amber-700 dark:text-amber-400">
                    <span>Payable at Clinic Counter:</span>
                    <span className="font-bold tabular-nums">
                      {formatINR(receiptTarget.consultation_fee, true)}
                    </span>
                  </div>
                </div>
                {(receiptTarget.payment?.upi_utr ||
                  receiptTarget.payment?.razorpay_payment_id) && (
                  <div className="text-xs text-muted-foreground pt-1">
                    {receiptTarget.payment?.upi_utr ? (
                      <>
                        UPI UTR:{" "}
                        <code>{receiptTarget.payment.upi_utr}</code>
                        {receiptTarget.payment.upi_paid_to
                          ? ` • Paid to ${receiptTarget.payment.upi_paid_to}`
                          : ""}
                      </>
                    ) : (
                      <>
                        Payment ID:{" "}
                        <code>{receiptTarget.payment?.razorpay_payment_id}</code>
                      </>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="no-print">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </Button>
                <Button onClick={() => setReceiptTarget(null)}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

