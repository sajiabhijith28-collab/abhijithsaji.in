import { redirect } from "next/navigation";
import { AvailabilityClient } from "@/components/doctor/availability-client";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getDoctorAvailabilitySchedule,
  getDoctorByProfileId,
} from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function DoctorAvailabilityPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?tab=doctor");
  const doctor = getDoctorByProfileId(user.id);
  if (!doctor) redirect("/login?tab=doctor");

  const schedule = getDoctorAvailabilitySchedule(doctor.id);
  return (
    <AvailabilityClient
      initialDays={schedule.days}
      initialLeaves={schedule.leaves}
      initialSlotDuration={schedule.slotDurationMins}
    />
  );
}

