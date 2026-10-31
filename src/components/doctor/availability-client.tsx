"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Clock, Loader2, Plus, Save, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  DoctorAvailabilityRecord,
  DoctorLeaveRecord,
} from "@/types/database";
import { formatReadableDate, getLocalISODate } from "@/lib/utils";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AvailabilityClient({
  initialDays,
  initialLeaves,
  initialSlotDuration,
}: {
  initialDays: DoctorAvailabilityRecord[];
  initialLeaves: DoctorLeaveRecord[];
  initialSlotDuration: number;
}) {
  const router = useRouter();
  const [slotDurationMins, setSlotDurationMins] = useState(initialSlotDuration);
  const [days, setDays] = useState(
    Array.from({ length: 7 }).map((_, dayIdx) => {
      const found = initialDays.find((d) => d.day_of_week === dayIdx);
      return (
        found || {
          id: `temp-${dayIdx}`,
          doctor_id: "",
          day_of_week: dayIdx,
          is_working: dayIdx !== 0,
          morning_start: "09:30",
          morning_end: "13:30",
          evening_start: "17:00",
          evening_end: "20:30",
          slot_duration_mins: initialSlotDuration,
        }
      );
    })
  );

  const [leaves, setLeaves] = useState(initialLeaves);
  const [leaveDate, setLeaveDate] = useState(getLocalISODate(3));
  const [leaveReason, setLeaveReason] = useState("");
  const [saving, setSaving] = useState(false);

  const updateDay = (
    idx: number,
    patch: Partial<DoctorAvailabilityRecord>
  ) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d))
    );
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotDurationMins,
          days: days.map((d) => ({
            day_of_week: d.day_of_week,
            is_working: d.is_working,
            morning_start: d.morning_start || null,
            morning_end: d.morning_end || null,
            evening_start: d.evening_start || null,
            evening_end: d.evening_end || null,
            slot_duration_mins: slotDurationMins,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save schedule");
      toast.success("Weekly availability & slot duration updated!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/doctor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leave_date: leaveDate,
          reason: leaveReason || "Blocked / Personal Leave",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not block date");
      setLeaves((prev) => [...prev, data.leave]);
      setLeaveReason("");
      toast.success("Blocked leave date added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error adding leave");
    }
  };

  const handleDeleteLeave = async (id: string) => {
    await fetch(`/api/doctor/availability?id=${id}`, { method: "DELETE" });
    setLeaves((prev) => prev.filter((l) => l.id !== id));
    toast.success("Leave date removed");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Availability &amp; Blocked Dates
          </h1>
          <p className="text-sm text-muted-foreground">
            Changes immediately reflect in patient live slot pickers
          </p>
        </div>

        <Button onClick={handleSaveSchedule} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Weekly Schedule
        </Button>
      </div>

      {/* Slot Duration Selector */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Consultation Slot Duration
            </h3>
            <p className="text-xs text-muted-foreground">
              Determines how morning &amp; evening shifts are divided into
              bookable slots
            </p>
          </div>
          <div className="flex gap-2">
            {[15, 20, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSlotDurationMins(mins)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  slotDurationMins === mins
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule + Blocked Leaves */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Working Hours</CardTitle>
            <CardDescription>
              Toggle working days and customize morning &amp; evening shifts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {days.map((day, idx) => (
              <div
                key={day.day_of_week}
                className="rounded-xl border p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-[140px]">
                  <Switch
                    checked={day.is_working}
                    onCheckedChange={(v) => updateDay(idx, { is_working: v })}
                  />
                  <span className="font-heading font-semibold text-sm">
                    {DAY_NAMES[day.day_of_week]}
                  </span>
                </div>

                {day.is_working ? (
                  <div className="grid sm:grid-cols-2 gap-3 flex-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground w-14">AM:</span>
                      <Input
                        type="time"
                        className="h-8 text-xs"
                        value={day.morning_start || ""}
                        onChange={(e) =>
                          updateDay(idx, { morning_start: e.target.value })
                        }
                      />
                      <span>–</span>
                      <Input
                        type="time"
                        className="h-8 text-xs"
                        value={day.morning_end || ""}
                        onChange={(e) =>
                          updateDay(idx, { morning_end: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground w-14">PM:</span>
                      <Input
                        type="time"
                        className="h-8 text-xs"
                        value={day.evening_start || ""}
                        onChange={(e) =>
                          updateDay(idx, {
                            evening_start: e.target.value || null,
                          })
                        }
                      />
                      <span>–</span>
                      <Input
                        type="time"
                        className="h-8 text-xs"
                        value={day.evening_end || ""}
                        onChange={(e) =>
                          updateDay(idx, {
                            evening_end: e.target.value || null,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <Badge variant="secondary" className="w-fit">
                    Weekly Off / Closed
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leave / Blocked Dates */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-primary" />
              Leave &amp; Blocked Dates
            </CardTitle>
            <CardDescription>
              Block holidays or conference days from patient bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddLeave} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="lv-date" className="text-xs">
                  Date to Block
                </Label>
                <Input
                  id="lv-date"
                  type="date"
                  min={getLocalISODate(0)}
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lv-reason" className="text-xs">
                  Reason (shown to patients)
                </Label>
                <Input
                  id="lv-reason"
                  placeholder="e.g. Medical Conference"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" className="w-full">
                <Plus className="h-4 w-4" />
                Block Date
              </Button>
            </form>

            <div className="border-t pt-3 space-y-2">
              {leaves.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No upcoming blocked dates.
                </p>
              ) : (
                leaves.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-xl border bg-muted/35 p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold">
                        {formatReadableDate(l.leave_date)}
                      </div>
                      <div className="text-muted-foreground">{l.reason}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteLeave(l.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

