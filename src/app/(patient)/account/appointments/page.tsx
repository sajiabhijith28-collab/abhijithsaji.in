import { redirect } from "next/navigation";
import { AppointmentsClient } from "@/components/patient/appointments-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientAppointments, getPlatformSettings } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function PatientAppointmentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account/appointments");
  }

  const appointments = getPatientAppointments(user.id);
  const settings = getPlatformSettings();

  return (
    <AppointmentsClient
      initialAppointments={appointments}
      settings={settings}
    />
  );
}

