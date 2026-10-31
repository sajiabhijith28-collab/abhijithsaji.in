import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}

