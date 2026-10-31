"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  Building2,
  CalendarClock,
  CheckCircle2,
  Globe2,
  MapPin,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DoctorWithDetails } from "@/types/database";
import { formatINR } from "@/lib/utils";

export function DoctorCard({
  doctor,
  index = 0,
}: {
  doctor: DoctorWithDetails;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.24) }}
    >
      <Card className="group h-full overflow-hidden border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg flex flex-col justify-between">
        <CardContent className="p-5 space-y-4">
          {/* Header: Avatar + Core Info */}
          <div className="flex gap-4">
            <div className="relative shrink-0">
              <img
                src={doctor.photo_url}
                alt={doctor.full_name}
                loading="lazy"
                className="h-20 w-20 rounded-2xl object-cover border bg-muted"
              />
              <span
                title="NMC Verified Medical Practitioner"
                className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-card"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <Badge variant="default" className="text-[11px]">
                  {doctor.specialty.name}
                </Badge>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {doctor.rating} ({doctor.review_count})
                </span>
              </div>

              <Link
                href={`/doctors/${doctor.id}`}
                className="block font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors truncate"
              >
                {doctor.full_name}
              </Link>

              <p className="text-xs text-muted-foreground line-clamp-1">
                {doctor.qualifications.join(", ")}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  {doctor.experience_years} yrs exp
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 truncate">
                  <Globe2 className="h-3 w-3" />
                  {doctor.languages.slice(0, 2).join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Hospital & Location */}
          <div className="rounded-xl bg-muted/50 px-3.5 py-2.5 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{doctor.hospital.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {doctor.location.area}, {doctor.location.city}
              </span>
            </div>
          </div>

          {/* Next Slot & Fee */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Clinic Consultation
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-lg font-bold text-foreground tabular-nums">
                  {formatINR(doctor.consultation_fee)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Pay at Clinic
                </span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">
                Next Available
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CalendarClock className="h-3.5 w-3.5" />
                {doctor.next_available_label || "Available Today"}
              </span>
            </div>
          </div>
        </CardContent>

        {/* Actions Footer */}
        <div className="border-t bg-muted/20 px-5 py-3 flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/doctors/${doctor.id}`}>View Profile</Link>
          </Button>
          <Button size="sm" className="flex-1 font-semibold shadow-sm" asChild>
            <Link href={`/book/${doctor.id}`}>Book Now</Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

