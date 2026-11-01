"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppointmentWithDetails, PublicProfile } from "@/types/database";
import {
  formatDisplayPhone,
  formatINR,
  formatReadableDate,
  formatTime12h,
} from "@/lib/utils";

export function BookingsManagerClient({
  initialBookings,
  initialPatients,
}: {
  initialBookings: AppointmentWithDetails[];
  initialPatients: (PublicProfile & {
    bookingsCount: number;
    totalSpent: number;
  })[];
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return `${b.booking_code} ${b.patient_name} ${b.patient_phone} ${b.doctor_name} ${b.hospital_name}`
        .toLowerCase()
        .includes(q);
    });
  }, [bookings, search, statusFilter]);

  const handleAdminStatus = async (
    id: string,
    status: "confirmed" | "completed" | "cancelled"
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
              ? "Admin cancelled & issued 100% refund"
              : status === "confirmed"
              ? "Admin approved & confirmed booking"
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? data.appointment : b))
      );
      toast.success(
        status === "confirmed"
          ? "Booking approved and confirmed!"
          : status === "cancelled"
          ? "Booking cancelled & full refund triggered!"
          : "Marked completed"
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const togglePatient = async (patientId: string, isActive: boolean) => {
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "patient_status",
        payload: { patientId, isActive },
      }),
    });
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, is_active: isActive } : p))
    );
    toast.success(`Patient account ${isActive ? "activated" : "deactivated"}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Master Bookings, Refunds &amp; Patients
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor every appointment across the platform, trigger instant 100%
          refunds, and manage patient accounts
        </p>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">
            All Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-1.5">
            <Users className="h-4 w-4" />
            Patients Directory ({patients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-2">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  placeholder="Search booking code, patient, doctor, or hospital..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="verification_pending">
                  Payment Verification Pending
                </option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </CardContent>
          </Card>

          {/* Mobile Stacked Booking Cards */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map((b) => (
              <Card key={`mob-bk-${b.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-semibold text-muted-foreground">
                        {b.booking_code}
                      </div>
                      <div className="font-heading font-bold text-sm">
                        {b.patient_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDisplayPhone(b.patient_phone)}
                      </div>
                    </div>
                    <Badge
                      variant={
                        b.status === "confirmed"
                          ? "success"
                          : b.status === "completed"
                          ? "default"
                          : b.status === "cancelled"
                          ? "destructive"
                          : "warning"
                      }
                      className="capitalize shrink-0"
                    >
                      {b.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-2.5 text-xs space-y-1">
                    <div className="font-semibold">{b.doctor_name}</div>
                    <div className="text-primary font-medium">
                      {formatReadableDate(b.appointment_date)} •{" "}
                      {formatTime12h(b.slot_time)}
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span>Online: {formatINR(b.platform_fee, true)}</span>
                      <span>At Clinic: {formatINR(b.consultation_fee)}</span>
                    </div>
                  </div>

                  {b.status === "verification_pending" ||
                  b.status === "pending_payment" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                        onClick={() => handleAdminStatus(b.id, "confirmed")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve Booking
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleAdminStatus(b.id, "cancelled")}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : b.status === "confirmed" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdminStatus(b.id, "completed")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAdminStatus(b.id, "cancelled")}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Cancel &amp; Refund
                      </Button>
                    </div>
                  ) : b.status === "cancelled" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-primary border-primary/40 hover:bg-primary/5 gap-1.5"
                      onClick={() => handleAdminStatus(b.id, "confirmed")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Restore &amp; Confirm Booking
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor &amp; Slot</th>
                    <th className="px-4 py-3">Fee Snapshot</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/25">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold">
                        {b.booking_code}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium">{b.patient_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDisplayPhone(b.patient_phone)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium">{b.doctor_name}</div>
                        <div className="text-xs text-primary">
                          {formatReadableDate(b.appointment_date)} •{" "}
                          {formatTime12h(b.slot_time)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs tabular-nums">
                        <div className="font-bold text-sm text-primary">
                          Online: {formatINR(b.platform_fee, true)}
                        </div>
                        <div className="text-muted-foreground">
                          At Clinic: {formatINR(b.consultation_fee)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            b.status === "confirmed"
                              ? "success"
                              : b.status === "completed"
                              ? "default"
                              : b.status === "cancelled"
                              ? "destructive"
                              : "warning"
                          }
                          className="capitalize"
                        >
                          {b.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {b.status === "verification_pending" ||
                        b.status === "pending_payment" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                              onClick={() =>
                                handleAdminStatus(b.id, "confirmed")
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              title="Cancel & Refund"
                              onClick={() =>
                                handleAdminStatus(b.id, "cancelled")
                              }
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : b.status === "confirmed" ? (
                          <div className="inline-flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleAdminStatus(b.id, "completed")
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleAdminStatus(b.id, "cancelled")
                              }
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Cancel &amp; Refund
                            </Button>
                          </div>
                        ) : b.status === "cancelled" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-primary border-primary/40 hover:bg-primary/5 gap-1"
                            onClick={() =>
                              handleAdminStatus(b.id, "confirmed")
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Restore
                          </Button>
                        ) : b.payment?.status === "refunded" ? (
                          <span className="text-xs text-emerald-600 font-medium">
                            Refunded {formatINR(b.payment.refund_amount || 0)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-3">
          {/* Mobile Stacked Patient Cards */}
          <div className="md:hidden space-y-3">
            {patients.map((p) => (
              <Card key={`mob-pat-${p.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-heading font-bold text-sm">
                      {p.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {formatDisplayPhone(p.phone)} • {p.city || "India"}
                    </div>
                    <div className="text-xs text-primary font-semibold mt-1">
                      {p.bookingsCount} bookings • Paid {formatINR(p.totalSpent)}
                    </div>
                  </div>
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(v) => togglePatient(p.id, v)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">Mobile Number</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Bookings</th>
                    <th className="px-4 py-3">Total Paid</th>
                    <th className="px-4 py-3 text-right">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3.5 font-heading font-semibold">
                        {p.full_name}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">
                        {formatDisplayPhone(p.phone)}
                      </td>
                      <td className="px-4 py-3.5">{p.city || "—"}</td>
                      <td className="px-4 py-3.5 tabular-nums">
                        {p.bookingsCount}
                      </td>
                      <td className="px-4 py-3.5 font-semibold tabular-nums">
                        {formatINR(p.totalSpent)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Switch
                          checked={p.is_active}
                          onCheckedChange={(v) => togglePatient(p.id, v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

