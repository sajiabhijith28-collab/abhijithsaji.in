"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SlotItem } from "@/types/database";
import { formatINR, getLocalISODate } from "@/lib/utils";

export function SlotPickerWidget({
  doctorId,
  consultationFee,
  platformFeePreview,
}: {
  doctorId: string;
  consultationFee: number;
  platformFeePreview: number;
}) {
  const router = useRouter();
  const dates = Array.from({ length: 7 }).map((_, idx) => {
    const iso = getLocalISODate(idx);
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return {
      iso,
      dayShort:
        idx === 0
          ? "Today"
          : idx === 1
          ? "Tomorrow"
          : dt.toLocaleDateString("en-IN", { weekday: "short" }),
      dateNum: dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [leaveReason, setLeaveReason] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSelectedSlot("");
    fetch(`/api/doctors/${doctorId}/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setSlots(data.slots || []);
        setLeaveReason(data.onLeaveReason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [doctorId, selectedDate]);

  const morningSlots = slots.filter((s) => s.period === "Morning");
  const eveningSlots = slots.filter((s) => s.period === "Evening");

  const handleProceed = () => {
    const q = new URLSearchParams({ date: selectedDate });
    if (selectedSlot) q.set("slot", selectedSlot);
    router.push(`/book/${doctorId}?${q.toString()}`);
  };

  return (
    <Card className="border-primary/25 shadow-lg">
      <CardHeader className="pb-4 border-b bg-primary/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Book Clinic Visit</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant confirmed slot • Zero waiting queue
            </p>
          </div>
          <div className="text-right">
            <div className="font-heading text-xl font-bold text-primary tabular-nums">
              {formatINR(consultationFee + platformFeePreview)}
            </div>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block">
              Pay Doctor at Clinic
            </span>
            <span className="text-[10px] text-muted-foreground">
              ₹0 Online • Direct to Doctor
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* 7-Day Date Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            Select Appointment Date
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-2">
            {dates.map((d) => {
              const active = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`rounded-xl border px-2 py-2 text-center transition-all ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="text-[11px] font-medium opacity-85">
                    {d.dayShort}
                  </div>
                  <div className="text-xs font-bold mt-0.5">{d.dateNum}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : leaveReason ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
            Doctor unavailable on this date: <strong>{leaveReason}</strong>.
            Please choose another date above.
          </div>
        ) : slots.filter((s) => s.available).length === 0 ? (
          <div className="rounded-xl border bg-muted/50 p-4 text-center text-xs text-muted-foreground">
            No remaining open slots on this date. Please select tomorrow or
            another date above.
          </div>
        ) : (
          <div className="space-y-4">
            {morningSlots.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Morning Session
                  </span>
                  <span>
                    {morningSlots.filter((s) => s.available).length} open
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {morningSlots.slice(0, 6).map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`rounded-lg border py-2 text-xs font-medium tabular-nums transition-all ${
                        !slot.available
                          ? "opacity-40 line-through cursor-not-allowed bg-muted"
                          : selectedSlot === slot.time
                          ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {eveningSlots.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Moon className="h-3.5 w-3.5 text-sky-500" />
                    Evening Session
                  </span>
                  <span>
                    {eveningSlots.filter((s) => s.available).length} open
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {eveningSlots.slice(0, 6).map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`rounded-lg border py-2 text-xs font-medium tabular-nums transition-all ${
                        !slot.available
                          ? "opacity-40 line-through cursor-not-allowed bg-muted"
                          : selectedSlot === slot.time
                          ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          size="lg"
          className="w-full font-semibold"
          onClick={handleProceed}
        >
          <Clock className="h-4 w-4" />
          {selectedSlot
            ? `Continue with ${
                slots.find((s) => s.time === selectedSlot)?.label
              }`
            : "Choose Slot & Book Now"}
        </Button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="success" className="text-[10px]">
            Instant SMS Confirmation
          </Badge>
          <span>•</span>
          <span>100% Verified Clinic Slot</span>
        </div>
      </CardContent>
    </Card>
  );
}

