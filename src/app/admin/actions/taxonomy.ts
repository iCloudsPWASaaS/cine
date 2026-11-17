"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function done(path: string, message: string): never {
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}

function revalidateAdmin(...paths: string[]) {
  revalidatePath("/", "layout");
  for (const path of paths) revalidatePath(path);
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/categories";
  const name = text(formData, "name");
  if (!name) fail(path, "Category name is required.");

  const slug = slugify(text(formData, "slug") || name);
  if (!slug) fail(path, "Category slug is required.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: text(formData, "description") || null,
    image_url: text(formData, "image_url") || null,
    sort_order: Number(formData.get("sort_order")) || 0,
    is_active: formData.get("is_active") === "on",
  });

  if (error) fail(path, error.message);
  revalidateAdmin(path);
  done(path, "Category created.");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/categories";
  const id = text(formData, "id");
  if (!id) fail(path, "Missing category id.");

  const name = text(formData, "name");
  if (!name) fail(path, "Category name is required.");
  const slug = slugify(text(formData, "slug") || name);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      description: text(formData, "description") || null,
      image_url: text(formData, "image_url") || null,
      sort_order: Number(formData.get("sort_order")) || 0,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) fail(path, error.message);
  revalidateAdmin(path);
  done(path, "Category updated.");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/categories";
  const id = text(formData, "id");
  if (!id) fail(path, "Missing category id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) fail(path, error.message);
  revalidateAdmin(path);
  done(path, "Category deleted.");
}

export async function createGenreAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/genres";
  const name = text(formData, "name");
  if (!name) fail(path, "Genre name is required.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("genres").insert({
    name,
    slug: slugify(text(formData, "slug") || name),
    tmdb_id: Number(formData.get("tmdb_id")) || null,
  });

  if (error) fail(path, error.message);
  revalidateAdmin(path);
  done(path, "Genre created.");
}

export async function updateGenreAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/genres";
  const id = text(formData, "id");
  if (!id) fail(path, "Missing genre id.");

  const name = text(formData, "name");
  if (!name) fail(path, "Genre name is required.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("genres")
    .update({
      name,
      slug: slugify(text(formData, "slug") || name),
      tmdb_id: Number(formData.get("tmdb_id")) || null,
    })
    .eq("id", id);

  if (error) fail(path, error.message);
  revalidateAdmin(path);
  done(path, "Genre updated.");
}

export async function deleteGenreAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/genres";
  const id = text(formData, "id");
  if (!id) fail(path, "Missing genre id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("genres").delete().eq("id", id);
  if (error) fail(path, error.message);
  revalidateAdmin(path);
  done(path, "Genre deleted.");
}

export async function createSourceAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/sources";
  const name = text(formData, "name");
  if (!name) fail(path, "Source name is required.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("sources").insert({
    name,
    slug: slugify(text(formData, "slug") || name),
    type: text(formData, "type") || "embed",
    base_url: text(formData, "base_url") || null,
    region: text(formData, "region") || null,
    notes: text(formData, "notes") || null,
    is_active: formData.get("is_active") === "on",
  });

  if (error) fail(path, error.message);
  done(path, "Source created.");
}

export async function updateSourceAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/sources";
  const id = text(formData, "id");
  if (!id) fail(path, "Missing source id.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sources")
    .update({
      name: text(formData, "name"),
      slug: slugify(text(formData, "slug") || text(formData, "name")),
      type: text(formData, "type") || "embed",
      base_url: text(formData, "base_url") || null,
      region: text(formData, "region") || null,
      notes: text(formData, "notes") || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) fail(path, error.message);
  done(path, "Source updated.");
}

export async function deleteSourceAction(formData: FormData) {
  await requireAdmin();
  const path = "/admin/sources";
  const id = text(formData, "id");
  if (!id) fail(path, "Missing source id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("sources").delete().eq("id", id);
  if (error) fail(path, error.message);
  done(path, "Source deleted.");
}
