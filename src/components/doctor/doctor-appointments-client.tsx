"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Phone, Search, UserX, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AppointmentWithDetails } from "@/types/database";
import {
  formatDisplayPhone,
  formatINR,
  formatReadableDate,
  formatTime12h,
} from "@/lib/utils";

export function DoctorAppointmentsClient({
  initialAppointments,
}: {
  initialAppointments: AppointmentWithDetails[];
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (dateFilter && a.appointment_date !== dateFilter) return false;
      if (q) {
        const hay = `${a.patient_name} ${a.patient_phone} ${a.booking_code}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [appointments, search, statusFilter, dateFilter]);

  const updateStatus = async (
    id: string,
    status: "confirmed" | "completed" | "cancelled" | "no_show"
  ) => {
    try {
      const res = await fetch("/api/doctor/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? data.appointment : a))
      );
      toast.success(`Updated status to ${status.replace("_", " ")}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Patient Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Inspect patient details, consultation notes, and manage visit status
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search patient name, phone or booking ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="verification_pending">Verification Pending</option>
            <option value="completed">Completed</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Mobile Stacked Patient Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No appointments match your current filter.
            </CardContent>
          </Card>
        ) : (
          filtered.map((a) => (
            <Card key={`mob-doc-${a.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-heading font-bold text-sm">
                      {a.patient_name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({a.patient_age}y, {a.patient_gender})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />
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
                            : a.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                    }
                    className="capitalize shrink-0"
                  >
                    {a.status.replace("_", " ")}
                  </Badge>
                </div>

                {a.symptoms_notes && (
                  <p className="text-xs text-primary bg-primary/[0.04] rounded-lg px-2.5 py-1.5">
                    “{a.symptoms_notes}”
                  </p>
                )}

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs">
                  <div>
                    <span className="font-semibold block">
                      {formatReadableDate(a.appointment_date)}
                    </span>
                    <span className="text-primary font-bold">
                      {formatTime12h(a.slot_time)} –{" "}
                      {formatTime12h(a.slot_end_time)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block">
                      Clinic Fee
                    </span>
                    <span className="font-heading font-bold text-sm tabular-nums">
                      {formatINR(a.net_doctor_earning)}
                    </span>
                  </div>
                </div>

                {a.status === "verification_pending" ||
                  a.status === "pending_payment" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={() => updateStatus(a.id, "confirmed")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Accept &amp; Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => updateStatus(a.id, "cancelled")}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : a.status === "confirmed" ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      className="col-span-2"
                      onClick={() => updateStatus(a.id, "completed")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 px-2"
                        title="No-Show"
                        onClick={() => updateStatus(a.id, "no_show")}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 px-2 text-destructive"
                        title="Cancel"
                        onClick={() => updateStatus(a.id, "cancelled")}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Date &amp; Slot</th>
                <th className="px-4 py-3">Net Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No appointments match your current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/25">
                    <td className="px-4 py-3.5">
                      <div className="font-heading font-semibold">
                        {a.patient_name}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({a.patient_age}y, {a.patient_gender})
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {formatDisplayPhone(a.patient_phone)} •{" "}
                        <span className="font-mono">{a.booking_code}</span>
                      </div>
                      {a.symptoms_notes && (
                        <div className="text-xs text-primary mt-1">
                          “{a.symptoms_notes}”
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium">
                        {formatReadableDate(a.appointment_date)}
                      </div>
                      <div className="text-xs text-primary font-semibold tabular-nums">
                        {formatTime12h(a.slot_time)} –{" "}
                        {formatTime12h(a.slot_end_time)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">
                      {formatINR(a.net_doctor_earning)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          a.status === "confirmed"
                            ? "success"
                            : a.status === "verification_pending"
                              ? "warning"
                              : a.status === "completed"
                                ? "default"
                                : a.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                        }
                        className="capitalize"
                      >
                        {a.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {a.status === "verification_pending" ||
                        a.status === "pending_payment" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={() => updateStatus(a.id, "confirmed")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accept &amp; Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            title="Cancel Booking"
                            onClick={() => updateStatus(a.id, "cancelled")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : a.status === "confirmed" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => updateStatus(a.id, "completed")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Mark No-Show"
                            onClick={() => updateStatus(a.id, "no_show")}
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Cancel & Refund Patient"
                            onClick={() => updateStatus(a.id, "cancelled")}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
    </div>
  );
}

