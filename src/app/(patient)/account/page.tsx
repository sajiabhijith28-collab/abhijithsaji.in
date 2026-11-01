import { redirect } from "next/navigation";
import { AccountClient } from "@/components/patient/account-client";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getLocations,
  getPatientAppointments,
  getUserNotifications,
} from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function PatientAccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account");
  }
  if (user.role === "doctor") {
    redirect("/doctor/dashboard");
  }

  const cities = Array.from(new Set(getLocations().map((l) => l.city)));
  const notifications = getUserNotifications(user.id);
  const appointments = getPatientAppointments(user.id);

  return (
    <AccountClient
      user={user}
      cities={cities}
      appointments={appointments}
      notifications={notifications}
    />
  );
}
