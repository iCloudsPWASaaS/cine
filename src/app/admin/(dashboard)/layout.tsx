import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <AdminShell
      email={session.profile.email || session.user.email || ""}
      displayName={session.profile.display_name || "Administrator"}
    >
      {children}
    </AdminShell>
  );
}
