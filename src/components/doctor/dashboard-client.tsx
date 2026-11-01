"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Phone,
  RotateCcw,
  Sparkles,
  UserCheck,
  Users,
  UserX,
  XCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppointmentWithDetails } from "@/types/database";
import {
  formatDisplayPhone,
  formatINR,
  formatReadableDate,
  formatTime12h,
  getLocalISODate,
} from "@/lib/utils";

export function DoctorDashboardClient({
  initialAppointments,
  netEarnings,
}: {
  initialAppointments: AppointmentWithDetails[];
  netEarnings: number;
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const today = getLocalISODate(0);
  const [calendarDate, setCalendarDate] = useState(today);

  // Today's list
  const todaysList = useMemo(
    () =>
      appointments
        .filter((a) => a.appointment_date === today && a.status !== "cancelled")
        .sort((a, b) => a.slot_time.localeCompare(b.slot_time)),
    [appointments, today]
  );

  // All upcoming appointments (from today onwards, active/not cancelled)
  const upcomingList = useMemo(
    () =>
      appointments
        .filter((a) => a.appointment_date >= today && a.status !== "cancelled")
        .sort((a, b) =>
          `${a.appointment_date} ${a.slot_time}`.localeCompare(
            `${b.appointment_date} ${b.slot_time}`
          )
        ),
    [appointments, today]
  );

  // New bookings requiring review / confirmation
  const pendingActionList = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.status === "verification_pending" || a.status === "pending_payment"
      ),
    [appointments]
  );

  // Completed appointments count
  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "completed").length,
    [appointments]
  );

  const handleStatusChange = async (
    id: string,
    status: "confirmed" | "completed" | "cancelled" | "no_show"
  ) => {
    try {
      const res = await fetch("/api/doctor/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: id,
          status,
          reason:
            status === "cancelled"
              ? "Cancelled by doctor"
              : status === "confirmed"
              ? "Confirmed by doctor"
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? data.appointment : a))
      );
      toast.success(
        status === "confirmed"
          ? "Appointment confirmed & accepted!"
          : `Appointment marked as ${status.replace("_", " ")}`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  };

  // Build 14-day interactive mini calendar
  const calendarDays = Array.from({ length: 14 }).map((_, idx) => {
    const dt = getLocalISODate(idx - 2);
    const count = appointments.filter(
      (a) => a.appointment_date === dt && a.status !== "cancelled"
    ).length;
    const [y, m, d] = dt.split("-").map(Number);
    const dateObj = new Date(y, (m || 1) - 1, d || 1);
    return {
      iso: dt,
      weekday: dateObj.toLocaleDateString("en-IN", { weekday: "short" }),
      dayNum: dateObj.getDate(),
      monthShort: dateObj.toLocaleDateString("en-IN", { month: "short" }),
      count,
    };
  });

  const selectedDayAppointments = appointments
    .filter((a) => a.appointment_date === calendarDate)
    .sort((a, b) => a.slot_time.localeCompare(b.slot_time));

  const renderAppointmentItem = (appt: AppointmentWithDetails) => {
    const isToday = appt.appointment_date === today;
    const isPending =
      appt.status === "verification_pending" ||
      appt.status === "pending_payment";

    return (
      <div
        key={appt.id}
        className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-muted/20"
      >
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={isToday ? "default" : "outline"}
              className="tabular-nums font-semibold"
            >
              {isToday ? "Today" : formatReadableDate(appt.appointment_date)} •{" "}
              {formatTime12h(appt.slot_time)}
            </Badge>

            <span className="font-heading font-bold text-base truncate">
              {appt.patient_name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              ({appt.patient_age}y, {appt.patient_gender})
            </span>

            <Badge
              variant={
                appt.status === "confirmed"
                  ? "success"
                  : appt.status === "verification_pending"
                  ? "warning"
                  : appt.status === "pending_payment"
                  ? "secondary"
                  : appt.status === "completed"
                  ? "default"
                  : "destructive"
              }
              className="capitalize text-xs font-semibold ml-auto sm:ml-0"
            >
              {appt.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <a
              href={`tel:${appt.patient_phone}`}
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
            >
              <Phone className="h-3 w-3" />
              {formatDisplayPhone(appt.patient_phone)}
            </a>
            <span className="font-mono text-muted-foreground/80">
              Ref: {appt.booking_code}
            </span>
            <span>
              To Collect:{" "}
              <strong className="text-foreground">
                {formatINR(appt.total_amount || appt.net_doctor_earning)}
              </strong>{" "}
              <span className="text-muted-foreground text-[11px]">
                ({formatINR(appt.consultation_fee)} + {formatINR(appt.platform_fee)})
              </span>
            </span>
            {appt.payment?.upi_utr && (
              <span className="font-mono text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                UTR: {appt.payment.upi_utr}
              </span>
            )}
          </div>

          {appt.symptoms_notes && (
            <p className="text-xs text-foreground/85 bg-muted/60 rounded-lg px-2.5 py-1 mt-1 border border-border/40">
              <strong className="text-muted-foreground font-medium">Note:</strong>{" "}
              {appt.symptoms_notes}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          {isPending ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 flex-1 sm:flex-initial shadow-xs"
                onClick={() => handleStatusChange(appt.id, "confirmed")}
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept &amp; Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                title="Cancel Booking"
                onClick={() => handleStatusChange(appt.id, "cancelled")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : appt.status === "confirmed" ? (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Button
                size="sm"
                className="flex-1 sm:flex-initial gap-1.5"
                onClick={() => handleStatusChange(appt.id, "completed")}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete Visit
              </Button>
              <Button
                size="sm"
                variant="outline"
                title="Mark No-Show"
                className="px-2.5"
                onClick={() => handleStatusChange(appt.id, "no_show")}
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="px-2 text-destructive hover:bg-destructive/10"
                title="Cancel Appointment"
                onClick={() => handleStatusChange(appt.id, "cancelled")}
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Badge variant="outline" className="capitalize text-xs">
              {appt.status.replace("_", " ")}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Consultations queue &amp; patient bookings for{" "}
            {formatReadableDate(today)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/doctor/availability">Manage Schedule</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/doctor/appointments">All Bookings</Link>
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Today&apos;s Queue
              </p>
              <p className="font-heading text-3xl font-bold mt-1 tabular-nums">
                {todaysList.length}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                All Upcoming Visits
              </p>
              <p className="font-heading text-3xl font-bold mt-1 tabular-nums text-sky-600">
                {upcomingList.length}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pending Approval
              </p>
              <p
                className={`font-heading text-3xl font-bold mt-1 tabular-nums ${
                  pendingActionList.length > 0
                    ? "text-amber-600"
                    : "text-muted-foreground"
                }`}
              >
                {pendingActionList.length}
              </p>
            </div>
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                pendingActionList.length > 0
                  ? "bg-amber-500/15 text-amber-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Net Earnings
              </p>
              <p className="font-heading text-2xl font-bold mt-1 text-primary tabular-nums">
                {formatINR(netEarnings)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Consultations Queue Tabs + 14-Day Calendar */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Section: Tabs for Upcoming, Today, and Pending */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="upcoming" className="gap-1.5 text-xs sm:text-sm">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                Upcoming ({upcomingList.length})
              </TabsTrigger>
              <TabsTrigger value="today" className="gap-1.5 text-xs sm:text-sm">
                <Clock className="h-3.5 w-3.5" />
                Today ({todaysList.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1.5 text-xs sm:text-sm">
                <AlertCircle className="h-3.5 w-3.5" />
                Pending ({pendingActionList.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ALL UPCOMING CONSULTATIONS (DEFAULT) */}
            <TabsContent value="upcoming" className="pt-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        All Upcoming Patient Appointments
                      </CardTitle>
                      <CardDescription>
                        All confirmed and scheduled consultations sorted by date
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      {upcomingList.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingList.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground space-y-2">
                      <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/60" />
                      <p className="font-semibold text-foreground">
                        No upcoming patient appointments scheduled
                      </p>
                      <p className="text-xs">
                        New patient bookings from the website will appear right here.
                      </p>
                    </div>
                  ) : (
                    upcomingList.map((appt) => renderAppointmentItem(appt))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: TODAY'S QUEUE */}
            <TabsContent value="today" className="pt-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Today&apos;s Consultation Queue
                      </CardTitle>
                      <CardDescription>
                        Patients scheduled for {formatReadableDate(today)}
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="tabular-nums">
                      {todaysList.length} Today
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaysList.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground space-y-2">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground/60" />
                      <p className="font-semibold text-foreground">
                        No appointments scheduled for today
                      </p>
                      <p className="text-xs">
                        Check the <strong>Upcoming ({upcomingList.length})</strong>{" "}
                        tab for future booked consultations.
                      </p>
                    </div>
                  ) : (
                    todaysList.map((appt) => renderAppointmentItem(appt))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: PENDING APPROVAL / REVIEW */}
            <TabsContent value="pending" className="pt-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Bookings Awaiting Confirmation
                      </CardTitle>
                      <CardDescription>
                        Review new bookings or UPI payments and accept them with 1-click
                      </CardDescription>
                    </div>
                    <Badge variant="warning" className="tabular-nums">
                      {pendingActionList.length} Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingActionList.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground space-y-2">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600" />
                      <p className="font-semibold text-foreground">
                        All bookings are up to date!
                      </p>
                      <p className="text-xs">
                        No pending appointments require review right now.
                      </p>
                    </div>
                  ) : (
                    pendingActionList.map((appt) => renderAppointmentItem(appt))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Section: 14-Day Calendar View */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              14-Day Schedule Calendar
            </CardTitle>
            <CardDescription>
              Tap any date to inspect booked appointments on that specific day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d) => {
                const selected = calendarDate === d.iso;
                const isToday = d.iso === today;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setCalendarDate(d.iso)}
                    className={`rounded-xl border p-2 text-center transition-all ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary"
                        : isToday
                        ? "border-primary/50 bg-primary/5 font-semibold"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="text-[10px] opacity-80">{d.weekday}</div>
                    <div className="text-sm font-bold">{d.dayNum}</div>
                    <div
                      className={`mt-1 text-[10px] rounded-full px-1 font-semibold ${
                        d.count > 0
                          ? selected
                            ? "bg-white/20 text-white"
                            : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold"
                          : "opacity-35"
                      }`}
                    >
                      {d.count}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  Consultations on {formatReadableDate(calendarDate)}:
                </span>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {selectedDayAppointments.length} Booked
                </Badge>
              </div>

              {selectedDayAppointments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center border rounded-lg border-dashed">
                  No appointments booked on {formatReadableDate(calendarDate)}.
                </p>
              ) : (
                selectedDayAppointments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold tabular-nums text-primary">
                          {formatTime12h(a.slot_time)}
                        </span>
                        <span className="font-semibold">{a.patient_name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDisplayPhone(a.patient_phone)}
                      </div>
                    </div>
                    <Badge
                      variant={
                        a.status === "confirmed"
                          ? "success"
                          : a.status === "verification_pending"
                          ? "warning"
                          : a.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize text-[10px]"
                    >
                      {a.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
