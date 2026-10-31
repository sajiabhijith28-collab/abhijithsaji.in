"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Phone,
  Users,
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

  const todaysList = appointments
    .filter((a) => a.appointment_date === today && a.status !== "cancelled")
    .sort((a, b) => a.slot_time.localeCompare(b.slot_time));

  const upcomingCount = appointments.filter(
    (a) => a.appointment_date >= today && a.status === "confirmed"
  ).length;

  const completedCount = appointments.filter(
    (a) => a.status === "completed"
  ).length;

  const handleStatusChange = async (
    id: string,
    status: "completed" | "cancelled" | "no_show"
  ) => {
    try {
      const res = await fetch("/api/doctor/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: id,
          status,
          reason: status === "cancelled" ? "Cancelled by doctor" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? data.appointment : a))
      );
      toast.success(`Appointment marked as ${status.replace("_", " ")}`);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview for {formatReadableDate(today)}
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
                Upcoming Confirmed
              </p>
              <p className="font-heading text-3xl font-bold mt-1 tabular-nums">
                {upcomingCount}
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
                Completed Visits
              </p>
              <p className="font-heading text-3xl font-bold mt-1 tabular-nums">
                {completedCount}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
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
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Queue + Interactive Calendar View */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-lg">
              Today&apos;s Patient Appointments
            </CardTitle>
            <CardDescription>
              Mark visits completed as patients finish their consultation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysList.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No scheduled consultations remaining for today.
              </div>
            ) : (
              todaysList.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="tabular-nums">
                        {formatTime12h(appt.slot_time)}
                      </Badge>
                      <span className="font-heading font-bold text-sm">
                        {appt.patient_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({appt.patient_age}y, {appt.patient_gender})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {formatDisplayPhone(appt.patient_phone)}
                    </p>
                    {appt.symptoms_notes && (
                      <p className="text-xs text-foreground/80 bg-muted/60 rounded-lg px-2.5 py-1 mt-1">
                        Note: {appt.symptoms_notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {appt.status === "confirmed" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(appt.id, "completed")
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(appt.id, "cancelled")
                          }
                        >
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="success" className="capitalize">
                        {appt.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              14-Day Schedule Calendar
            </CardTitle>
            <CardDescription>
              Tap any date to inspect bookings on that day
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
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : isToday
                        ? "border-primary/50 bg-primary/5"
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
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "opacity-40"
                      }`}
                    >
                      {d.count}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">
                Bookings on {formatReadableDate(calendarDate)} (
                {selectedDayAppointments.length})
              </div>
              {selectedDayAppointments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">
                  No appointments booked on this date.
                </p>
              ) : (
                selectedDayAppointments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold tabular-nums mr-2">
                        {formatTime12h(a.slot_time)}
                      </span>
                      <span className="font-medium">{a.patient_name}</span>
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {a.status}
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

