import { redirect } from "next/navigation";
import { DoctorDashboardClient } from "@/components/doctor/dashboard-client";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getDoctorAppointments,
  getDoctorByProfileId,
  getDoctorEarningsData,
} from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?tab=doctor");
  const doctor = getDoctorByProfileId(user.id);
  if (!doctor) redirect("/login?tab=doctor");

  const appointments = getDoctorAppointments(doctor.id);
  const earnings = getDoctorEarningsData(doctor.id);

  return (
    <DoctorDashboardClient
      initialAppointments={appointments}
      netEarnings={earnings.netPayableTotal}
    />
  );
}

