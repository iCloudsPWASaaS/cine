"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UploadResult {
  url?: string;
  error?: string;
}

export async function uploadImageAction(
  formData: FormData,
): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  const folder = String(formData.get("folder") || "uploads").replace(
    /[^a-z0-9/_-]/gi,
    "",
  );

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are supported." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Image must be smaller than 10 MB." };
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "cinewood";
  const extension =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${folder}/${randomUUID()}.${extension}`;

  try {
    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) return { error: error.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}
