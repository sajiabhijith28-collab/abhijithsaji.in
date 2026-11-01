"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Landmark,
  Loader2,
  Lock,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildUpiPaymentOptions, buildUpiPaymentUri } from "@/lib/payments/upi";
import type {
  AppointmentWithDetails,
  PlatformSettingsRecord,
} from "@/types/database";
import {
  formatINR,
  formatReadableDate,
  formatTime12h,
} from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface RazorpaySessionPayload {
  keyId: string | null;
  orderId: string;
  amountInPaise: number;
  currency: string;
  isLiveGateway: boolean;
  testSimPaymentId?: string;
  testSimSignature?: string;
}

export function CheckoutClient({
  initialAppointment,
  platformSettings,
  fallbackOrderPayload,
}: {
  initialAppointment: AppointmentWithDetails;
  platformSettings: PlatformSettingsRecord;
  fallbackOrderPayload: RazorpaySessionPayload;
}) {
  const router = useRouter();
  const [appointment, setAppointment] =
    useState<AppointmentWithDetails>(initialAppointment);
  const [rzpOrder, setRzpOrder] =
    useState<RazorpaySessionPayload>(fallbackOrderPayload);
  const [processing, setProcessing] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simMethod, setSimMethod] = useState<"upi" | "card" | "netbanking">(
    "upi"
  );
  const [secondsLeft, setSecondsLeft] = useState(600);

  // Direct UPI link & UTR submission state
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("any_upi");
  const [upiLaunched, setUpiLaunched] = useState(false);
  const [upiUtr, setUpiUtr] = useState("");
  const [upiPayerVpa, setUpiPayerVpa] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  const isUpiDirectMode =
    platformSettings.payment_gateway_mode !== "razorpay";
  const receivingUpiId = platformSettings.upi_id || "pksaji020@oksbi";
  const receivingPayeeName =
    platformSettings.upi_payee_name || "My Dr Healthcare";

  const upiLinkParams = {
    upiId: receivingUpiId,
    payeeName: receivingPayeeName,
    amountInr: appointment.platform_fee,
    bookingCode: appointment.booking_code,
  };
  const primaryUpiHref = buildUpiPaymentUri(upiLinkParams);
  const upiOptions = buildUpiPaymentOptions(upiLinkParams);

  useEffect(() => {
    setAppointment(initialAppointment);
  }, [initialAppointment]);

  useEffect(() => {
    try {
      const cached = window.sessionStorage.getItem(
        `mydr_rzp_${initialAppointment.id}`
      );
      if (cached) {
        setRzpOrder(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
  }, [initialAppointment.id]);

  // Countdown timer for 10-minute slot lock while pending_payment
  useEffect(() => {
    if (
      appointment.status !== "pending_payment" ||
      !appointment.lock_expires_at
    ) {
      return;
    }
    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor(
          (new Date(appointment.lock_expires_at!).getTime() - Date.now()) / 1000
        )
      );
      setSecondsLeft(diff);
    };
    updateTimer();
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [appointment.status, appointment.lock_expires_at]);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(receivingUpiId);
      setCopiedUpi(true);
      toast.success(`UPI ID copied: ${receivingUpiId}`);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      toast.info(`Pay to UPI ID: ${receivingUpiId}`);
    }
  };

  const handleSubmitUpiUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedUtr = upiUtr.replace(/\D/g, "");
    if (cleanedUtr.length !== 12) {
      toast.error(
        "Please enter the 12-digit UPI UTR / Transaction Reference Number from your UPI app."
      );
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/payments/upi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          upi_utr: cleanedUtr,
          upi_payer_vpa: upiPayerVpa.trim() || undefined,
          upi_app: selectedUpiApp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit UPI UTR");
      }

      setAppointment(data.appointment);
      if (data.appointment.status === "confirmed") {
        toast.success(
          `Payment verified! Booking ${data.appointment.booking_code} is confirmed.`
        );
      } else {
        toast.success(
          `UTR submitted! Your slot is held while Admin approves your payment.`
        );
      }
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit UPI UTR"
      );
    } finally {
      setProcessing(false);
    }
  };

  const verifyRazorpayOnServer = async (params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    payment_method: string;
  }) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          ...params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment verification failed");

      setAppointment(data.appointment);
      setSimModalOpen(false);
      toast.success(
        `Payment verified! Booking ${data.appointment.booking_code} is confirmed.`
      );
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not verify payment"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayClick = async () => {
    if (rzpOrder.isLiveGateway && rzpOrder.keyId) {
      setProcessing(true);
      try {
        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Failed to load Razorpay SDK"));
            document.body.appendChild(script);
          });
        }

        const rzp = new window.Razorpay!({
          key: rzpOrder.keyId,
          amount: rzpOrder.amountInPaise,
          currency: rzpOrder.currency,
          name: "My Dr Healthcare",
          description: `Platform Fee — ${appointment.doctor_name}`,
          order_id: rzpOrder.orderId,
          prefill: {
            name: appointment.patient_name,
            contact: appointment.patient_phone,
          },
          notes: {
            appointmentId: appointment.id,
            bookingCode: appointment.booking_code,
          },
          theme: { color: "#0b1f3a" },
          handler: (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            verifyRazorpayOnServer({
              ...response,
              payment_method: "razorpay_online",
            });
          },
        });
        rzp.open();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Razorpay initialization failed"
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    setSimModalOpen(true);
  };

  // =========================================================================
  // STATE 1: PAYMENT VERIFICATION PENDING (Slot held until Admin clicks Approve)
  // =========================================================================
  if (appointment.status === "verification_pending") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-amber-500/40 shadow-xl overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6 sm:p-8 text-center space-y-2.5 border-b border-amber-500/30">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
              <Clock className="h-7 w-7" />
            </div>
            <Badge variant="warning" className="font-semibold">
              Slot Reserved • Payment Verification Pending
            </Badge>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold pt-1">
              UPI Payment Submitted!
            </h1>
            <p className="text-sm text-primary-foreground/80 max-w-md mx-auto">
              Your slot is locked for you while our Admin team verifies your UPI
              transfer in the payment ledger.
            </p>
            <p className="text-xs font-mono pt-1 text-amber-300">
              Booking Reference: <strong>{appointment.booking_code}</strong>
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border bg-muted/35 p-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Doctor &amp; Specialty
                </span>
                <span className="font-heading font-bold">
                  {appointment.doctor_name}
                </span>
                <span className="text-xs text-primary block">
                  {appointment.specialty_name}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Held Date &amp; Time Slot
                </span>
                <span className="font-heading font-bold">
                  {formatReadableDate(appointment.appointment_date)}
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                  {formatTime12h(appointment.slot_time)} –{" "}
                  {formatTime12h(appointment.slot_end_time)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Hospital / Clinic
                </span>
                <span className="font-medium">{appointment.hospital_name}</span>
                <span className="text-xs text-muted-foreground block">
                  {appointment.hospital_address}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Patient Details
                </span>
                <span className="font-medium">
                  {appointment.patient_name} ({appointment.patient_age}y,{" "}
                  {appointment.patient_gender})
                </span>
                <span className="text-xs text-muted-foreground block">
                  {appointment.patient_phone}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border p-4 space-y-2.5 text-sm">
              <div className="font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Submitted UPI Transfer Details
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Paid To UPI ID</span>
                <span className="font-mono font-semibold">
                  {appointment.payment?.upi_paid_to || receivingUpiId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Submitted 12-Digit UTR
                </span>
                <span className="font-mono font-bold text-primary">
                  {appointment.payment?.upi_utr || "Submitted"}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2.5">
                <span className="text-muted-foreground">
                  Platform Booking Fee (Submitted Online)
                </span>
                <span className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatINR(appointment.platform_fee, true)} (Pending Approval)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Doctor Consultation Fee
                </span>
                <span className="font-semibold tabular-nums">
                  {formatINR(appointment.consultation_fee, true)} (Pay at Clinic)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  router.refresh();
                  toast.info("Checking latest verification status...");
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Approval Status
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/account/appointments">
                  <CalendarCheck2 className="h-4 w-4" />
                  Track in My Appointments
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: CONFIRMED BOOKING RECEIPT STATE
  // =========================================================================
  if (appointment.status === "confirmed" || appointment.status === "completed") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-emerald-500/35 shadow-xl overflow-hidden">
          <div className="bg-emerald-600 text-white p-6 sm:p-8 text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              Payment Verified • Booking Confirmed
            </Badge>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold pt-1">
              Appointment Confirmed!
            </h1>
            <p className="text-sm text-emerald-50">
              Booking Reference:{" "}
              <span className="font-mono font-bold underline">
                {appointment.booking_code}
              </span>
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border bg-muted/35 p-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Doctor &amp; Specialty
                </span>
                <span className="font-heading font-bold">
                  {appointment.doctor_name}
                </span>
                <span className="text-xs text-primary block">
                  {appointment.specialty_name}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Date &amp; Time Slot
                </span>
                <span className="font-heading font-bold">
                  {formatReadableDate(appointment.appointment_date)}
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">
                  {formatTime12h(appointment.slot_time)} –{" "}
                  {formatTime12h(appointment.slot_end_time)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Hospital / Clinic
                </span>
                <span className="font-medium">{appointment.hospital_name}</span>
                <span className="text-xs text-muted-foreground block">
                  {appointment.hospital_address}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Patient Details
                </span>
                <span className="font-medium">
                  {appointment.patient_name} ({appointment.patient_age}y,{" "}
                  {appointment.patient_gender})
                </span>
                <span className="text-xs text-muted-foreground block">
                  {appointment.patient_phone}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm border rounded-2xl p-4">
              <div className="font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-1">
                Official Booking &amp; Payment Receipt
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Platform Booking Fee (
                  {appointment.applied_fee_type === "percentage"
                    ? `${appointment.applied_fee_rate}%`
                    : "Flat"}
                  )
                </span>
                <span className="tabular-nums font-semibold text-emerald-600">
                  {formatINR(appointment.platform_fee, true)} (Paid Online)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Doctor Consultation Fee
                </span>
                <span className="tabular-nums font-semibold">
                  {formatINR(appointment.consultation_fee, true)} (Pay at Clinic)
                </span>
              </div>
              <div className="border-t pt-2.5 space-y-1">
                <div className="flex justify-between font-heading font-bold text-base">
                  <span>Paid Online Verified</span>
                  <span className="text-emerald-600 tabular-nums">
                    {formatINR(appointment.platform_fee, true)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-medium text-amber-700 dark:text-amber-400">
                  <span>Balance Payable at Clinic Counter</span>
                  <span className="tabular-nums font-bold">
                    {formatINR(appointment.consultation_fee, true)}
                  </span>
                </div>
              </div>
              {(appointment.payment?.upi_utr ||
                appointment.payment?.razorpay_payment_id) && (
                <div className="text-[11px] text-muted-foreground pt-1 flex flex-wrap justify-between gap-2">
                  <span>
                    {appointment.payment?.upi_utr
                      ? `UPI UTR: ${appointment.payment.upi_utr} (${
                          appointment.payment.upi_paid_to || receivingUpiId
                        })`
                      : `Txn ID: ${appointment.payment?.razorpay_payment_id}`}
                  </span>
                  <span className="uppercase">
                    Method: {appointment.payment?.payment_method || "UPI"}
                  </span>
                </div>
              )}
            </div>

            <div className="no-print flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Print / Download Receipt
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/account/appointments">
                  <CalendarCheck2 className="h-4 w-4" />
                  View My Appointments
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // STATE 3: PENDING PAYMENT CHECKOUT VIEW (Direct UPI Payment Links — No QR)
  // =========================================================================
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-12 items-start">
      {/* Left: Appointment Review */}
      <Card className="lg:col-span-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" />
              Slot Locked: {mm}:{ss} remaining
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              {appointment.booking_code}
            </span>
          </div>
          <CardTitle className="text-xl pt-2">
            Review Appointment Summary
          </CardTitle>
          <CardDescription>
            Verify your appointment time and patient details before completing
            your platform fee payment
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 rounded-2xl border bg-muted/35 p-4">
            <img
              src={appointment.doctor_photo}
              alt={appointment.doctor_name}
              className="h-16 w-16 rounded-xl object-cover border"
            />
            <div>
              <h3 className="font-heading font-bold text-base">
                {appointment.doctor_name}
              </h3>
              <p className="text-xs text-primary font-medium">
                {appointment.specialty_name}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="h-3.5 w-3.5" />
                {appointment.hospital_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border p-3.5">
              <span className="text-xs text-muted-foreground block">
                Appointment Date
              </span>
              <span className="font-heading font-semibold">
                {formatReadableDate(appointment.appointment_date)}
              </span>
            </div>
            <div className="rounded-xl border p-3.5">
              <span className="text-xs text-muted-foreground block">
                Selected Time Slot
              </span>
              <span className="font-heading font-semibold text-primary">
                {formatTime12h(appointment.slot_time)} –{" "}
                {formatTime12h(appointment.slot_end_time)}
              </span>
            </div>
            <div className="rounded-xl border p-3.5 col-span-2">
              <span className="text-xs text-muted-foreground block">
                Patient
              </span>
              <span className="font-medium">
                {appointment.patient_name} • {appointment.patient_age} yrs •{" "}
                <span className="capitalize">{appointment.patient_gender}</span>{" "}
                • {appointment.patient_phone}
              </span>
            </div>
          </div>

          {/* Fee Summary Box */}
          <div className="rounded-2xl border bg-muted/25 p-4 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                Consultation Fee
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Pay at Clinic
                </Badge>
              </span>
              <span className="font-medium tabular-nums">
                {formatINR(appointment.consultation_fee, true)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Platform Booking Fee (
                {appointment.applied_fee_type === "percentage"
                  ? `${appointment.applied_fee_rate}%`
                  : "Flat"}
                )
              </span>
              <span className="font-semibold text-primary tabular-nums">
                {formatINR(appointment.platform_fee, true)}
              </span>
            </div>
            <div className="border-t pt-2.5 flex justify-between items-baseline">
              <span className="font-heading font-bold text-base">
                Pay Online Now
              </span>
              <span className="font-heading font-extrabold text-2xl text-primary tabular-nums">
                {formatINR(appointment.platform_fee, true)}
              </span>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex justify-between items-center">
              <span>Pay at Clinic Reception:</span>
              <span className="font-heading font-bold tabular-nums">
                {formatINR(appointment.consultation_fee, true)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Direct UPI Payment Links + UTR Submission (No QR) */}
      <Card className="lg:col-span-6 border-primary/25 shadow-xl">
        <CardHeader className="border-b bg-primary/[0.04]">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {isUpiDirectMode ? "Pay via UPI App" : "Online Payment"}
            </CardTitle>
            <Badge variant="default" className="font-mono text-xs">
              {formatINR(appointment.platform_fee, true)}
            </Badge>
          </div>
          <CardDescription>
            {isUpiDirectMode
              ? "Click your preferred UPI payment option below to pay the platform fee, then submit your 12-digit UTR number."
              : "Complete online payment to confirm your slot."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {isUpiDirectMode ? (
            <>
              {/* Step 1: Clickable UPI Payment Option Deep Links (No QR Code) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
                    Step 1 — Choose UPI Payment Option
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-primary hover:underline"
                  >
                    {copiedUpi ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {receivingUpiId}
                  </button>
                </div>

                {/* Primary One-Click Universal UPI Payment Link */}
                <Button
                  size="xl"
                  className="w-full font-bold shadow-md justify-between px-5"
                  disabled={secondsLeft === 0}
                  asChild
                >
                  <a
                    href={primaryUpiHref}
                    onClick={() => {
                      setSelectedUpiApp("any_upi");
                      setUpiLaunched(true);
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Pay {formatINR(appointment.platform_fee, true)} via UPI App
                    </span>
                    <ExternalLink className="h-4 w-4 opacity-80" />
                  </a>
                </Button>

                {/* Specific UPI App Links (GPay, PhonePe, Paytm, BHIM) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {upiOptions
                    .filter((opt) => opt.id !== "any_upi")
                    .map((opt) => (
                      <a
                        key={opt.id}
                        href={opt.href}
                        onClick={() => {
                          setSelectedUpiApp(opt.id);
                          setUpiLaunched(true);
                        }}
                        className={`group rounded-xl border p-3 flex items-center justify-between text-left transition-all hover:border-primary hover:bg-primary/[0.04] ${
                          selectedUpiApp === opt.id && upiLaunched
                            ? "border-primary bg-primary/[0.06] ring-1 ring-primary"
                            : ""
                        }`}
                      >
                        <div>
                          <div className="font-heading font-bold text-xs sm:text-sm">
                            {opt.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatINR(appointment.platform_fee, true)}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </a>
                    ))}
                </div>

                {/* Desktop QR Code Accordion / Fallback */}
                <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold inline-flex items-center gap-1.5 text-foreground">
                      <QrCode className="h-4 w-4 text-primary" />
                      Paying from Desktop or Another Phone?
                    </span>
                    <Badge variant="outline" className="text-[10px]">Scan &amp; Pay</Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 rounded-lg p-3 border">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        primaryUpiHref
                      )}`}
                      alt="UPI QR Code"
                      className="h-28 w-28 rounded-md border shadow-xs shrink-0"
                    />
                    <div className="text-xs space-y-1.5 text-center sm:text-left">
                      <p className="font-medium text-foreground">
                        Scan with any UPI App: GPay, PhonePe, Paytm, or BHIM
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Exact amount <strong>{formatINR(appointment.platform_fee, true)}</strong> and reference are automatically filled.
                      </p>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="text-primary font-mono text-[11px] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copy VPA: {receivingUpiId}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/40 px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Receiving UPI ID ({receivingPayeeName}):
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="font-mono font-bold text-foreground inline-flex items-center gap-1.5 hover:text-primary"
                  >
                    {receivingUpiId}
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Step 2: Submit 12-Digit UPI UTR / Ref No. */}
              <form
                onSubmit={handleSubmitUpiUtr}
                className="space-y-4 border-t pt-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
                    Step 2 — Confirm Your 12-Digit UPI UTR
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {upiUtr.length}/12 digits
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="upi-utr">
                    12-Digit UPI UTR / Transaction Reference No. *
                  </Label>
                  <Input
                    id="upi-utr"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="e.g. 430518294012"
                    value={upiUtr}
                    onChange={(e) =>
                      setUpiUtr(e.target.value.replace(/\D/g, "").slice(0, 12))
                    }
                    className="font-mono text-base tracking-widest"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Found in your Google Pay / PhonePe / Paytm payment receipt
                    as <strong>UPI transaction ID</strong> or{" "}
                    <strong>UTR</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="upi-payer">
                    Your UPI ID or Sender Name (Optional)
                  </Label>
                  <Input
                    id="upi-payer"
                    placeholder="e.g. yourname@okicici"
                    value={upiPayerVpa}
                    onChange={(e) => setUpiPayerVpa(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold shadow-md bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={
                    processing || secondsLeft === 0 || upiUtr.length !== 12
                  }
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Submit Payment &amp; Hold My Slot
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  Once submitted, your slot is immediately locked and held as{" "}
                  <strong>Payment Verification Pending</strong> until Admin
                  approves your transfer.
                </p>
              </form>
            </>
          ) : (
            <>
              <Button
                size="xl"
                className="w-full font-bold shadow-md"
                disabled={processing || secondsLeft === 0}
                onClick={handleRazorpayClick}
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Pay {formatINR(appointment.platform_fee, true)} Online to Confirm
              </Button>

              <div className="space-y-2 text-[11px] text-muted-foreground text-center">
                <p className="inline-flex items-center gap-1 justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Server-verified Razorpay HMAC-SHA256 Checkout
                </p>
                <p>Supports UPI, Cards &amp; Netbanking</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Optional Razorpay Test Simulator Modal (only used when gateway mode = razorpay without live keys) */}
      <Dialog open={simModalOpen} onOpenChange={setSimModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <Badge variant="default">Razorpay Test Mode</Badge>
              <span className="font-heading font-bold text-lg text-primary tabular-nums">
                {formatINR(appointment.platform_fee, true)}
              </span>
            </div>
            <DialogTitle className="pt-1">
              My Dr Healthcare — Platform Fee Checkout
            </DialogTitle>
            <DialogDescription>
              Order <code className="text-xs">{rzpOrder.orderId}</code>. Pay the
              platform booking fee now; pay{" "}
              <strong>{formatINR(appointment.consultation_fee, true)}</strong>{" "}
              directly at the clinic.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 py-2">
            {[
              { id: "upi", label: "UPI App", icon: Smartphone },
              { id: "card", label: "Debit / Credit", icon: CreditCard },
              { id: "netbanking", label: "Netbanking", icon: Landmark },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  setSimMethod(m.id as "upi" | "card" | "netbanking")
                }
                className={`rounded-xl border p-3 flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                  simMethod === m.id
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted"
                }`}
              >
                <m.icon className="h-5 w-5" />
                {m.label}
              </button>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full font-semibold"
            disabled={processing}
            onClick={() => {
              if (!rzpOrder.testSimPaymentId || !rzpOrder.testSimSignature) {
                toast.error("Test signature token missing. Please re-lock slot.");
                return;
              }
              verifyRazorpayOnServer({
                razorpay_order_id: rzpOrder.orderId,
                razorpay_payment_id: rzpOrder.testSimPaymentId,
                razorpay_signature: rzpOrder.testSimSignature,
                payment_method: simMethod,
              });
            }}
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            Authorize Test Payment ({simMethod.toUpperCase()})
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
