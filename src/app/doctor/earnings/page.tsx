import { redirect } from "next/navigation";
import { CheckCircle2, Clock, IndianRupee, Percent, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getDoctorByProfileId, getDoctorEarningsData } from "@/lib/db/store";
import { formatINR, formatReadableDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DoctorEarningsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?tab=doctor");
  const doctor = getDoctorByProfileId(user.id);
  if (!doctor) redirect("/login?tab=doctor");

  const earnings = getDoctorEarningsData(doctor.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Earnings &amp; Collections</h1>
        <p className="text-sm text-muted-foreground">
          Transparent ledger of clinic consultation collections (paid by
          patients at the clinic) and My Dr online booking fees
        </p>
      </div>

      {/* KPI Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Clinic Consultation Earnings
            </span>
            <p className="font-heading text-2xl font-extrabold text-primary tabular-nums">
              {formatINR(earnings.netPayableTotal, true)}
            </p>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              Collected directly at clinic ({earnings.billableCount} visits)
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-amber-600" />
              Online Platform Fee (Paid to My Dr)
            </span>
            <p className="font-heading text-2xl font-bold text-amber-600 tabular-nums">
              {formatINR(earnings.platformFeeDeducted, true)}
            </p>
            <span className="text-[11px] text-muted-foreground">
              Paid online by patients • ₹0 deducted from you
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
              Combined Visit Value
            </span>
            <p className="font-heading text-2xl font-bold tabular-nums">
              {formatINR(earnings.grossCollected, true)}
            </p>
            <span className="text-[11px] text-muted-foreground">
              Reconciled: {formatINR(earnings.settledAmount)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-sky-600" />
              Pending Reconciliation
            </span>
            <p className="font-heading text-2xl font-bold text-sky-600 tabular-nums">
              {formatINR(earnings.pendingPayoutAmount, true)}
            </p>
            <span className="text-[11px] text-muted-foreground">
              Unreconciled clinic consultations
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bank Settlement History</CardTitle>
          <CardDescription>
            Completed NEFT / UTR transfers settled by the Platform Administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No settled batches yet. Pending earnings will appear here once
              settled by Admin.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pr-4">Period</th>
                    <th className="py-2.5 pr-4">Visits</th>
                    <th className="py-2.5 pr-4">Gross Collected</th>
                    <th className="py-2.5 pr-4">Platform Fee</th>
                    <th className="py-2.5 pr-4">Net Settled</th>
                    <th className="py-2.5">UTR Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {earnings.payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4">
                        {formatReadableDate(p.period_start)} –{" "}
                        {formatReadableDate(p.period_end)}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {p.appointments_count}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatINR(p.gross_consultation_amount, true)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground tabular-nums">
                        {formatINR(p.platform_fee_deducted, true)}
                      </td>
                      <td className="py-3 pr-4 font-bold text-emerald-600 tabular-nums">
                        {formatINR(p.net_payout_amount, true)}
                      </td>
                      <td className="py-3 font-mono text-xs">
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {p.settlement_reference || "Settled"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Appointment Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Consultation-Wise Earnings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2.5 pr-4">Booking ID</th>
                  <th className="py-2.5 pr-4">Patient &amp; Date</th>
                  <th className="py-2.5 pr-4">Clinic Fee (Collect at Clinic)</th>
                  <th className="py-2.5 pr-4">Online Platform Fee</th>
                  <th className="py-2.5 pr-4">Your Net Fee</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {earnings.appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {a.booking_code}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{a.patient_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatReadableDate(a.appointment_date)}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-semibold tabular-nums">
                      {formatINR(a.consultation_fee, true)}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground tabular-nums">
                      {formatINR(a.platform_fee, true)} (Paid Online)
                    </td>
                    <td className="py-3 pr-4 font-bold text-primary tabular-nums">
                      {formatINR(a.net_doctor_earning, true)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          a.payout_status === "settled" ? "success" : "warning"
                        }
                        className="capitalize"
                      >
                        {a.payout_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

