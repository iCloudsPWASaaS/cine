import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminSession {
  user: {
    id: string;
    email?: string | null;
  };
  profile: {
    id: string;
    email: string | null;
    display_name: string | null;
    role: string;
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return null;

  return { user: { id: user.id, email: user.email }, profile };
}

export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login?error=auth");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_admin");
  }

  return { user: { id: user.id, email: user.email }, profile };
}
