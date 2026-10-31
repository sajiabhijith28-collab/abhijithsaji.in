"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  IndianRupee,
  Loader2,
  Percent,
  Search,
  Wallet,
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
import { formatINR, formatReadableDate } from "@/lib/utils";

interface LedgerRow {
  id: string;
  booking_code: string;
  appointment_date: string;
  doctor_id: string;
  doctor_name: string;
  patient_name: string;
  patient_phone: string;
  consultation_fee: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  upi_utr?: string;
  upi_payer_vpa?: string;
  upi_paid_to?: string;
  rejection_reason?: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  refund_amount?: number;
  created_at: string;
}

export function PaymentsLedgerClient({
  rows: initialRows,
  doctors,
}: {
  rows: LedgerRow[];
  doctors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<LedgerRow[]>(initialRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<LedgerRow | null>(null);
  const [rejectReason, setRejectReason] = useState(
    "UPI UTR not found in pksaji020@oksbi bank statement"
  );

  const pendingVerificationCount = useMemo(
    () => rows.filter((r) => r.status === "verification_pending").length,
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (doctorFilter !== "all" && r.doctor_id !== doctorFilter) return false;
      if (dateFilter && r.appointment_date !== dateFilter) return false;
      if (q) {
        const hay = `${r.booking_code} ${r.patient_name} ${r.patient_phone} ${r.doctor_name
          } ${r.upi_utr || ""} ${r.upi_payer_vpa || ""} ${r.razorpay_order_id} ${r.razorpay_payment_id || ""
          }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, doctorFilter, dateFilter]);

  const paidFiltered = filtered.filter((r) => r.status === "paid");
  const platformEarnings = paidFiltered.reduce((s, r) => s + r.platform_fee, 0);
  const doctorPayouts = paidFiltered.reduce(
    (s, r) => s + r.consultation_fee,
    0
  );

  const copyUtr = async (id: string, utr: string) => {
    try {
      await navigator.clipboard.writeText(utr);
      setCopiedId(id);
      toast.success(`Copied UTR: ${utr}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.info(`UTR: ${utr}`);
    }
  };

  const handleVerifyAction = async (
    paymentId: string,
    action: "approve" | "reject",
    reason?: string
  ) => {
    setProcessingId(paymentId);
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === paymentId
            ? {
              ...r,
              status: data.payment.status,
              rejection_reason: data.payment.rejection_reason,
            }
            : r
        )
      );

      if (action === "approve") {
        toast.success(
          `Payment approved! Booking ${data.appointment.booking_code} is now Confirmed.`
        );
      } else {
        toast.success(
          `UTR rejected and slot released for ${data.appointment.booking_code}.`
        );
        setRejectTarget(null);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update payment");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Payments Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Verify patient UPI UTR transfers, monitor revenue splits, and export
            audit-ready CSV reports
          </p>
        </div>

        <Button asChild>
          <a href="/api/admin/export-payments" download>
            <Download className="h-4 w-4" />
            Export CSV Ledger
          </a>
        </Button>
      </div>

      {/* Pending UPI Approval Banner */}
      {pendingVerificationCount > 0 && (
        <Card className="border-amber-500/45 bg-amber-500/10">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-amber-950 dark:text-amber-200">
                  {pendingVerificationCount} UPI Payment
                  {pendingVerificationCount > 1 ? "s" : ""} Awaiting Your
                  Approval
                </p>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                  Check the 12-digit UTR in your UPI / bank app (
                  <code className="font-mono font-semibold">
                    pksaji020@oksbi
                  </code>
                  ) and click <strong>Approve</strong> to confirm the patient
                  slot.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={
                statusFilter === "verification_pending" ? "outline" : "default"
              }
              onClick={() =>
                setStatusFilter(
                  statusFilter === "verification_pending"
                    ? "all"
                    : "verification_pending"
                )
              }
            >
              {statusFilter === "verification_pending"
                ? "Show All Payments"
                : `Filter Pending (${pendingVerificationCount})`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Live Filtered Totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Online Approved (My Dr Platform Earnings)
              </p>
              <p className="font-heading text-2xl font-extrabold text-primary mt-1 tabular-nums">
                {formatINR(platformEarnings, true)}
              </p>
            </div>
            <Percent className="h-6 w-6 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Consultation Fees (Payable at Clinic)
              </p>
              <p className="font-heading text-2xl font-bold mt-1 tabular-nums">
                {formatINR(doctorPayouts, true)}
              </p>
            </div>
            <Wallet className="h-6 w-6 text-sky-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Combined Approved GMV
              </p>
              <p className="font-heading text-2xl font-bold mt-1 tabular-nums">
                {formatINR(platformEarnings + doctorPayouts, true)}
              </p>
            </div>
            <IndianRupee className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-4">
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="12-digit UTR, Patient, Booking ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Payment Statuses</option>
            <option value="verification_pending">
              Pending UPI Approval ({pendingVerificationCount})
            </option>
            <option value="paid">Paid / Approved</option>
            <option value="created">Checkout Open (Unpaid)</option>
            <option value="failed">Rejected / Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Mobile Stacked Cards (Zero Horizontal Scroll on Phones) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No payment records match your filter.
            </CardContent>
          </Card>
        ) : (
          filtered.map((r) => (
            <Card
              key={`mob-${r.id}`}
              className={
                r.status === "verification_pending"
                  ? "border-amber-500/50 bg-amber-500/[0.04]"
                  : ""
              }
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-bold">
                      {r.booking_code}
                    </div>
                    <div className="font-heading font-bold text-sm mt-0.5">
                      {r.patient_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.patient_phone} •{" "}
                      {formatReadableDate(r.appointment_date)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      r.status === "paid"
                        ? "success"
                        : r.status === "verification_pending"
                          ? "warning"
                          : r.status === "refunded"
                            ? "secondary"
                            : r.status === "failed"
                              ? "destructive"
                              : "outline"
                    }
                    className="uppercase text-[10px] shrink-0"
                  >
                    {r.status === "verification_pending"
                      ? "Awaiting Approval"
                      : r.status}
                  </Badge>
                </div>

                {r.upi_utr && (
                  <button
                    type="button"
                    onClick={() => copyUtr(r.id, r.upi_utr!)}
                    className="w-full rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2 flex items-center justify-between font-mono text-xs font-bold text-primary"
                  >
                    <span>UTR: {r.upi_utr}</span>
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      {copiedId === r.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Tap to Copy
                        </>
                      )}
                    </span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block">
                      Online UPI Fee
                    </span>
                    <span className="font-heading font-bold text-sm text-primary tabular-nums">
                      {formatINR(r.total_amount, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      At Clinic ({r.doctor_name.split(" ").slice(0, 2).join(" ")})
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatINR(r.consultation_fee, true)}
                    </span>
                  </div>
                </div>

                {r.status === "verification_pending" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={processingId === r.id}
                      onClick={() => handleVerifyAction(r.id, "approve")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {processingId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === r.id}
                      onClick={() => {
                        setRejectTarget(r);
                        setRejectReason(
                          "UPI UTR not found in pksaji020@oksbi bank statement"
                        );
                      }}
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Transactions Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Booking / UPI UTR</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">At Clinic</th>
                <th className="px-4 py-3">Online UPI Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Admin Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No payment records match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-muted/25 ${r.status === "verification_pending"
                        ? "bg-amber-500/[0.06]"
                        : ""
                      }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-xs font-semibold">
                        {r.booking_code}
                      </div>
                      {r.upi_utr ? (
                        <button
                          type="button"
                          onClick={() => copyUtr(r.id, r.upi_utr!)}
                          className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary hover:bg-primary/15"
                          title="Click to copy 12-digit UTR"
                        >
                          UTR: {r.upi_utr}
                          {copiedId === r.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {r.razorpay_payment_id || r.razorpay_order_id}
                        </div>
                      )}
                      {r.upi_payer_vpa && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          From: {r.upi_payer_vpa}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{r.patient_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.patient_phone} •{" "}
                        {formatReadableDate(r.appointment_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{r.doctor_name}</td>
                    <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                      {formatINR(r.consultation_fee, true)}
                    </td>
                    <td className="px-4 py-3.5 font-heading font-bold text-primary tabular-nums">
                      {formatINR(r.total_amount, true)}
                      {r.upi_paid_to && (
                        <span className="block font-mono text-[10px] font-normal text-muted-foreground">
                          → {r.upi_paid_to}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          r.status === "paid"
                            ? "success"
                            : r.status === "verification_pending"
                              ? "warning"
                              : r.status === "refunded"
                                ? "secondary"
                                : r.status === "failed"
                                  ? "destructive"
                                  : "outline"
                        }
                        className="uppercase text-[10px]"
                      >
                        {r.status === "verification_pending"
                          ? "Awaiting Approval"
                          : r.status}
                      </Badge>
                      {r.rejection_reason && r.status === "failed" && (
                        <div className="text-[10px] text-destructive mt-1 max-w-[180px]">
                          {r.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.status === "verification_pending" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            disabled={processingId === r.id}
                            onClick={() => handleVerifyAction(r.id, "approve")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {processingId === r.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId === r.id}
                            onClick={() => {
                              setRejectTarget(r);
                              setRejectReason(
                                "UPI UTR not found in pksaji020@oksbi bank statement"
                              );
                            }}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : r.status === "paid" ? (
                        <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approved
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject UPI UTR Dialog */}
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(o) => !o && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject UPI Payment UTR?</DialogTitle>
            <DialogDescription>
              Rejecting UTR{" "}
              <code className="font-mono font-bold">
                {rejectTarget?.upi_utr}
              </code>{" "}
              will cancel booking <strong>{rejectTarget?.booking_code}</strong>{" "}
              and release the doctor&apos;s time slot back to public
              availability.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rej-reason">Reason shown to Patient</Label>
            <Input
              id="rej-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectTarget || processingId === rejectTarget.id}
              onClick={() =>
                rejectTarget &&
                handleVerifyAction(rejectTarget.id, "reject", rejectReason)
              }
            >
              {rejectTarget && processingId === rejectTarget.id && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Reject UTR &amp; Release Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
