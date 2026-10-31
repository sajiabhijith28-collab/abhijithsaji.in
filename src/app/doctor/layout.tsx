import { redirect } from "next/navigation";
import { DoctorShell } from "@/components/doctor/doctor-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { getDoctorByProfileId } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") {
    redirect("/login?tab=doctor");
  }

  const doctor = getDoctorByProfileId(user.id);
  if (!doctor) {
    redirect("/login?tab=doctor");
  }

  return (
    <DoctorShell user={user} doctor={doctor}>
      {children}
    </DoctorShell>
  );
}

