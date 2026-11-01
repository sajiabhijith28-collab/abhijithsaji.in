import { redirect } from "next/navigation";
import { DoctorShell } from "@/components/doctor/doctor-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { getDoctorById, getDoctorByProfileId } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "doctor" && user.role !== "admin")) {
    redirect("/login?tab=doctor");
  }

  const doctor =
    getDoctorByProfileId(user.id) ||
    (user.role === "admin" ? getDoctorById("doc-admin-saji") : null);
  if (!doctor) {
    if (user.role === "admin") {
      redirect("/admin");
    }
    redirect("/login?tab=doctor");
  }

  return (
    <DoctorShell user={user} doctor={doctor}>
      {children}
    </DoctorShell>
  );
}

