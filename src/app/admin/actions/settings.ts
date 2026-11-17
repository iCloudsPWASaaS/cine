"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/settings";

  const site = {
    name: String(formData.get("name") || "").trim() || "Cinewood",
    tagline: String(formData.get("tagline") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    logo_text:
      String(formData.get("logo_text") || "").trim().toUpperCase() || "CINEWOOD",
  };

  if (site.name.length > 60 || site.logo_text.length > 30) {
    redirect(`${path}?error=${encodeURIComponent("Name is too long.")}`);
  }

  const player = {
    autoplay: formData.get("autoplay") === "on",
    default_quality: String(formData.get("default_quality") || "auto"),
  };

  const tmdb = {
    region: String(formData.get("region") || "BD").toUpperCase(),
  };

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    [
      { key: "site", value: site },
      { key: "player", value: player },
      { key: "tmdb", value: tmdb },
    ],
    { onConflict: "key" },
  );

  if (error) {
    redirect(`${path}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(`${path}?ok=${encodeURIComponent("Settings saved.")}`);
}
