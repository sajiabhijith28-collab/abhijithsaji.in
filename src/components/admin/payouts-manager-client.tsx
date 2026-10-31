"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DoctorPayoutRecord } from "@/types/database";
import { formatDisplayPhone, formatINR, formatReadableDate } from "@/lib/utils";

interface DoctorPayoutRow {
  doctor_id: string;
  doctor_name: string;
  doctor_phone: string;
  specialty_name: string;
  hospital_name: string;
  pendingCount: number;
  pendingGross: number;
  pendingPlatformFee: number;
  pendingNetPayable: number;
  settledCount: number;
  settledNetTotal: number;
}

export function PayoutsManagerClient({
  doctorsSummary,
  payoutBatches,
}: {
  doctorsSummary: DoctorPayoutRow[];
  payoutBatches: (DoctorPayoutRecord & { doctor_name: string })[];
}) {
  const router = useRouter();
  const [settleTarget, setSettleTarget] = useState<DoctorPayoutRow | null>(
    null
  );
  const [utrRef, setUtrRef] = useState("");
  const [notes, setNotes] = useState("NEFT Bank Transfer");
  const [loading, setLoading] = useState(false);

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: settleTarget.doctor_id,
          settlementReference: utrRef,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Settlement failed");
      toast.success(
        `Settled ${formatINR(
          settleTarget.pendingNetPayable,
          true
        )} for ${settleTarget.doctor_name}!`
      );
      setSettleTarget(null);
      setUtrRef("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not settle");
    } finally {
      setLoading(false);
    }
  };

  const totalPending = doctorsSummary.reduce(
    (s, d) => s + d.pendingNetPayable,
    0
  );
  const totalSettled = doctorsSummary.reduce(
    (s, d) => s + d.settledNetTotal,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Doctor Payout Tracking
        </h1>
        <p className="text-sm text-muted-foreground">
          Reconcile pending vs settled consultation balances per doctor and mark
          batches settled
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-amber-500/30 bg-amber-500/[0.03]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Total Unsettled Doctor Payables
              </p>
              <p className="font-heading text-2xl font-bold text-amber-600 mt-1 tabular-nums">
                {formatINR(totalPending, true)}
              </p>
            </div>
            <Wallet className="h-6 w-6 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/[0.03]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Cumulative Settled Payouts
              </p>
              <p className="font-heading text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
                {formatINR(totalSettled, true)}
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      {/* Per-Doctor Balances */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Doctor Payout Ledger</CardTitle>
          <CardDescription>
            Click &ldquo;Mark as Settled&rdquo; after transferring funds to the
            doctor&apos;s bank account
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Pending Visits</th>
                <th className="px-4 py-3">Pending Net Payable</th>
                <th className="px-4 py-3">Platform Fee Deducted</th>
                <th className="px-4 py-3">Settled To Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctorsSummary.map((d) => (
                <tr key={d.doctor_id} className="hover:bg-muted/25">
                  <td className="px-4 py-3.5">
                    <div className="font-heading font-bold">{d.doctor_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.specialty_name} • {formatDisplayPhone(d.doctor_phone)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">{d.pendingCount}</td>
                  <td className="px-4 py-3.5 font-heading font-bold text-amber-600 tabular-nums">
                    {formatINR(d.pendingNetPayable, true)}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
                    {formatINR(d.pendingPlatformFee, true)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-600 tabular-nums">
                    {formatINR(d.settledNetTotal, true)} ({d.settledCount})
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {d.pendingNetPayable > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSettleTarget(d);
                          setUtrRef(`UTR${Date.now()}`);
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark as Settled
                      </Button>
                    ) : (
                      <Badge variant="success">All Settled</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Historical Batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completed Settlement Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2.5 pr-4">Doctor</th>
                  <th className="py-2.5 pr-4">Period</th>
                  <th className="py-2.5 pr-4">Visits</th>
                  <th className="py-2.5 pr-4">Net Settled</th>
                  <th className="py-2.5">UTR / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payoutBatches.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4 font-semibold">{b.doctor_name}</td>
                    <td className="py-3 pr-4 text-xs">
                      {formatReadableDate(b.period_start)} –{" "}
                      {formatReadableDate(b.period_end)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {b.appointments_count}
                    </td>
                    <td className="py-3 pr-4 font-bold text-emerald-600 tabular-nums">
                      {formatINR(b.net_payout_amount, true)}
                    </td>
                    <td className="py-3 font-mono text-xs">
                      {b.settlement_reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Settlement Dialog */}
      <Dialog
        open={Boolean(settleTarget)}
        onOpenChange={(o) => !o && setSettleTarget(null)}
      >
        <DialogContent>
          {settleTarget && (
            <form onSubmit={handleSettle} className="space-y-4">
              <DialogHeader>
                <DialogTitle>
                  Settle Payout for {settleTarget.doctor_name}
                </DialogTitle>
                <DialogDescription>
                  Marks {settleTarget.pendingCount} pending consultations (Net:{" "}
                  <strong>
                    {formatINR(settleTarget.pendingNetPayable, true)}
                  </strong>
                  ) as settled.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label>Bank UTR / Reference Number</Label>
                <Input
                  value={utrRef}
                  onChange={(e) => setUtrRef(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Settlement Note</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettleTarget(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Settlement
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

