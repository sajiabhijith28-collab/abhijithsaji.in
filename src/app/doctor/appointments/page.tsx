import { redirect } from "next/navigation";
import { DoctorAppointmentsClient } from "@/components/doctor/doctor-appointments-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getDoctorAppointments, getDoctorByProfileId } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function DoctorAppointmentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?tab=doctor");
  const doctor = getDoctorByProfileId(user.id);
  if (!doctor) redirect("/login?tab=doctor");

  const appointments = getDoctorAppointments(doctor.id);
  return <DoctorAppointmentsClient initialAppointments={appointments} />;
}

