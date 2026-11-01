import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck2,
  IndianRupee,
  Percent,
  Settings,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
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
  adminGetExecutiveAnalytics,
  getPlatformSettings,
} from "@/lib/db/store";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  const analytics = adminGetExecutiveAnalytics();
  const settings = getPlatformSettings();

  const maxBookings = Math.max(
    1,
    ...analytics.dailySeries.map((d) => d.bookings)
  );
  const maxRevenue = Math.max(
    1,
    ...analytics.dailySeries.map((d) => d.revenue)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="default" className="mb-1.5">
            Live Platform Telemetry
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Executive Control Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Current Global Platform Fee:{" "}
            <strong className="text-foreground">
              {settings.platform_fee_type === "percentage"
                ? `${settings.platform_fee_value}%`
                : `${formatINR(settings.platform_fee_value)} Flat`}
            </strong>{" "}
            • Receiving UPI:{" "}
            <code className="font-mono font-semibold text-primary">
              {settings.upi_id}
            </code>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/settings">
              <Settings className="h-4 w-4" />
              Configure Fee &amp; UPI
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/doctors">+ Onboard Doctor</Link>
          </Button>
        </div>
      </div>

      {analytics.kpis.totalDoctors === 0 && (
        <Card className="border-primary/35 bg-primary/[0.04]">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-heading font-bold text-base">
                Clean Production Workspace Ready — Start Adding Your Real Clinic Data
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your workspace is ready. Click <strong>Add Doctors</strong> to
                onboard specialists, assign Ponkunnam clinics, and issue login credentials.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button size="sm" asChild>
                <Link href="/admin/doctors">+ Add Doctor Now</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/hospitals">Manage Clinics &amp; Localities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.kpis.pendingUpiVerifications > 0 && (
        <Card className="border-amber-500/45 bg-amber-500/10">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-heading font-bold text-sm text-amber-950 dark:text-amber-200">
                {analytics.kpis.pendingUpiVerifications} Patient UPI Payment
                {analytics.kpis.pendingUpiVerifications > 1 ? "s" : ""} Waiting
                for Approval
              </p>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                Slots are currently held as &apos;Payment Verification
                Pending&apos;. Verify the 12-digit UTR and click Approve.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/admin/payments">
                Approve in Payments ({analytics.kpis.pendingUpiVerifications})
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Gross Patient Volume
              </p>
              <p className="font-heading text-2xl font-bold mt-1 tabular-nums">
                {formatINR(analytics.kpis.totalRevenue)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {analytics.kpis.totalBookings} total bookings
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                My Dr Platform Earnings
              </p>
              <p className="font-heading text-2xl font-extrabold text-primary mt-1 tabular-nums">
                {formatINR(analytics.kpis.platformEarnings)}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                Net convenience fee revenue
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Pending Doctor Payouts
              </p>
              <p className="font-heading text-2xl font-bold text-amber-600 mt-1 tabular-nums">
                {formatINR(analytics.kpis.pendingPayouts)}
              </p>
              <Link
                href="/admin/payouts"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5"
              >
                Settle payouts <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Active Doctors &amp; Patients
              </p>
              <p className="font-heading text-2xl font-bold mt-1 tabular-nums">
                {analytics.kpis.totalDoctors} Drs •{" "}
                {analytics.kpis.totalPatients} Pts
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {analytics.kpis.activeBookings} upcoming confirmed visits
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: Bookings Per Day & Daily Revenue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-primary" />
              Bookings Per Day (Last 7 Days)
            </CardTitle>
            <CardDescription>
              Daily confirmed &amp; completed appointment volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-end justify-between gap-3 pt-6">
              {analytics.dailySeries.map((day) => {
                const heightPct = Math.max(
                  8,
                  Math.round((day.bookings / maxBookings) * 100)
                );
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <span className="text-xs font-bold tabular-nums">
                      {day.bookings}
                    </span>
                    <div className="w-full bg-muted/60 rounded-t-xl h-36 flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-primary rounded-t-xl transition-all duration-300"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {day.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              Revenue &amp; Platform Earnings (7-Day Trend)
            </CardTitle>
            <CardDescription>
              Gross patient checkout volume vs platform fee share
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-end justify-between gap-3 pt-6">
              {analytics.dailySeries.map((day) => {
                const revPct = Math.max(
                  8,
                  Math.round((day.revenue / maxRevenue) * 100)
                );
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <span className="text-[10px] font-semibold tabular-nums text-emerald-600">
                      {day.revenue > 0 ? formatINR(day.revenue) : "₹0"}
                    </span>
                    <div className="w-full bg-muted/60 rounded-t-xl h-36 flex items-end overflow-hidden">
                      <div
                        style={{ height: `${revPct}%` }}
                        className="w-full bg-emerald-600/85 rounded-t-xl transition-all duration-300"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {day.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Doctors & Top Specialties */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Top Performing Doctors
            </CardTitle>
            <CardDescription>
              Ranked by total consultation booking value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.topDoctors.map((doc, idx) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-heading text-xs font-bold text-muted-foreground w-4">
                    #{idx + 1}
                  </span>
                  <img
                    src={doc.photo_url}
                    alt={doc.name}
                    className="h-10 w-10 rounded-xl object-cover border"
                  />
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.specialty} • {doc.hospital}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading font-bold text-sm text-primary tabular-nums">
                    {formatINR(doc.revenue)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {doc.bookingsCount} visits
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Clinical Specialties</CardTitle>
            <CardDescription>
              Booking demand and gross revenue by medical specialty
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {analytics.topSpecialties.slice(0, 6).map((spec) => {
              const maxSpecCount = Math.max(
                1,
                analytics.topSpecialties[0]?.bookingsCount || 1
              );
              const pct = Math.max(
                6,
                Math.round((spec.bookingsCount / maxSpecCount) * 100)
              );
              return (
                <div key={spec.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{spec.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      <strong>{spec.bookingsCount}</strong> bookings •{" "}
                      {formatINR(spec.revenue)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

