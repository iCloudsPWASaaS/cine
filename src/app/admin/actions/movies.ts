"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { canonicalLanguage } from "@/lib/languages";
import {
  ensureDefaultProvidersInRegistry,
  grabAndSaveMovieSources,
} from "@/lib/source-grabber";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  detectSourceProvider,
  slugify,
  youtubeEmbed,
} from "@/lib/utils";

const ALLOWED_TYPES = ["hls", "mp4", "embed", "youtube", "external"];

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function done(path: string, message: string): never {
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}

async function uniqueSlug(base: string, excludeId?: string) {
  const supabase = createAdminClient();
  const root = slugify(base) || `title-${Date.now().toString(36)}`;
  let candidate = root;

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const { data } = await supabase
      .from("movies")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === excludeId) return candidate;
    candidate = `${root}-${attempt + 1}`;
  }

  return `${root}-${Date.now().toString(36)}`;
}

async function hasUpcomingColumn(
  supabase: ReturnType<typeof createAdminClient>,
) {
  const { error } = await supabase.from("movies").select("upcoming").limit(1);
  return !error;
}

async function parseMovie(formData: FormData, excludeId?: string) {
  const title = text(formData, "title");
  if (!title) throw new Error("Title is required.");

  const slug = await uniqueSlug(text(formData, "slug") || title, excludeId);
  const type = text(formData, "type") === "series" ? "series" : "movie";
  const trailer = text(formData, "trailer_url");

  return {
    payload: {
      title,
      slug,
      type,
      original_title: text(formData, "original_title") || null,
      tagline: text(formData, "tagline") || null,
      overview: text(formData, "overview") || null,
      release_date: text(formData, "release_date") || null,
      runtime: Number(formData.get("runtime")) || null,
      status: text(formData, "status") || null,
      vote_average: formData.get("vote_average")
        ? Number(formData.get("vote_average"))
        : null,
      imdb_id: text(formData, "imdb_id") || null,
      poster_url: text(formData, "poster_url") || null,
      backdrop_url: text(formData, "backdrop_url") || null,
      trailer_url: trailer ? youtubeEmbed(trailer) : null,
      category_id: text(formData, "category_id") || null,
      featured: formData.get("featured") === "on",
      trending: formData.get("trending") === "on",
      upcoming: formData.get("upcoming") === "on",
      published: formData.get("published") === "on",
    },
    genreIds: formData
      .getAll("genre_ids")
      .map((value) => String(value))
      .filter(Boolean),
  };
}

function revalidateAll(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/movies");
  revalidatePath("/series");
  revalidatePath("/genres");
  if (slug) revalidatePath(`/watch/${slug}`);
}

export async function createMovieAction(formData: FormData) {
  await requireAdmin();
  const back = "/admin/movies/new";

  let parsed;
  try {
    parsed = await parseMovie(formData);
  } catch (error) {
    fail(back, error instanceof Error ? error.message : "Invalid form data.");
  }

  const supabase = createAdminClient();
  const payload = { ...parsed.payload };
  if (!(await hasUpcomingColumn(supabase))) {
    delete (payload as { upcoming?: boolean }).upcoming;
  }
  const { data: saved, error } = await supabase
    .from("movies")
    .insert({ ...payload, metadata: { manual: true } })
    .select("id, slug")
    .single();

  if (error || !saved) fail(back, error?.message || "Could not create movie.");

  if (parsed.genreIds.length > 0) {
    await supabase.from("movie_genres").insert(
      parsed.genreIds.map((genreId) => ({
        movie_id: saved.id,
        genre_id: genreId,
      })),
    );
  }

  if (parsed.payload.trailer_url) {
    await supabase.from("movie_sources").insert({
      movie_id: saved.id,
      label: "Official Trailer",
      url: parsed.payload.trailer_url,
      type: "youtube",
      quality: "HD",
      priority: 1,
      is_active: true,
    });
  }

  revalidateAll(saved.slug);
  done(`/admin/movies/${saved.id}`, "Movie created.");
}

export async function updateMovieAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const back = id ? `/admin/movies/${id}` : "/admin/movies";
  if (!id) fail(back, "Missing movie id.");

  let parsed;
  try {
    parsed = await parseMovie(formData, id);
  } catch (error) {
    fail(back, error instanceof Error ? error.message : "Invalid form data.");
  }

  const supabase = createAdminClient();
  const payload = { ...parsed.payload };
  if (!(await hasUpcomingColumn(supabase))) {
    delete (payload as { upcoming?: boolean }).upcoming;
  }
  const { error } = await supabase
    .from("movies")
    .update(payload)
    .eq("id", id);

  if (error) fail(back, error.message);

  await supabase.from("movie_genres").delete().eq("movie_id", id);
  if (parsed.genreIds.length > 0) {
    await supabase.from("movie_genres").insert(
      parsed.genreIds.map((genreId) => ({
        movie_id: id,
        genre_id: genreId,
      })),
    );
  }

  revalidateAll(parsed.payload.slug);
  done(back, "Movie updated.");
}

export async function deleteMovieAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (!id) fail("/admin/movies", "Missing movie id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) fail(`/admin/movies/${id}`, error.message);

  revalidateAll();
  done("/admin/movies", "Movie deleted.");
}

export async function toggleMovieFieldAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const field = text(formData, "field");
  const value = text(formData, "value") === "true";
  const redirectTo = text(formData, "redirect_to") || "/admin/movies";
  const back = redirectTo.startsWith("/admin") ? redirectTo : "/admin/movies";

  if (!id) fail(back, "Missing movie id.");
  if (!["published", "featured", "trending", "upcoming"].includes(field)) {
    fail(back, "Invalid field.");
  }

  const supabase = createAdminClient();
  if (field === "upcoming" && !(await hasUpcomingColumn(supabase))) {
    fail(back, "Run the database setup to enable upcoming titles.");
  }
  const { error } = await supabase
    .from("movies")
    .update({ [field]: value })
    .eq("id", id);

  if (error) fail(back, error.message);
  revalidateAll();
  done(back, "Updated.");
}

export async function addMovieSourceAction(formData: FormData) {
  await requireAdmin();
  const movieId = text(formData, "movie_id");
  const back = movieId ? `/admin/movies/${movieId}` : "/admin/movies";
  if (!movieId) fail(back, "Missing movie id.");

  const rawUrl = text(formData, "url");
  if (!rawUrl) fail(back, "Source URL is required.");

  const detected = detectSourceProvider(rawUrl);
  const url = detected ? detected.url : rawUrl;
  const rawLanguage = text(formData, "language");
  const language = canonicalLanguage(rawLanguage) || rawLanguage || null;
  const rawLabel = text(formData, "label");
  const label =
    rawLabel ||
    (detected
      ? `${detected.name}${detected.quality ? ` • ${detected.quality}` : ""}`
      : "Stream");
  const rawType = text(formData, "type");
  const type =
    rawType && rawType !== "auto" && ALLOWED_TYPES.includes(rawType)
      ? rawType
      : detected?.type || "embed";
  if (!ALLOWED_TYPES.includes(type)) fail(back, "Invalid source type.");

  const supabase = createAdminClient();
  let sourceId = text(formData, "source_id") || null;

  if (!sourceId && detected?.slug) {
    await ensureDefaultProvidersInRegistry();
    const { data: reg } = await supabase
      .from("sources")
      .select("id")
      .eq("slug", detected.slug)
      .maybeSingle();
    if (reg?.id) sourceId = reg.id as string;
  }

  const { error } = await supabase.from("movie_sources").upsert(
    {
      movie_id: movieId,
      source_id: sourceId,
      label,
      url,
      type,
      quality: text(formData, "quality") || detected?.quality || null,
      language,
      priority:
        Number(formData.get("priority")) || detected?.priority || 10,
      is_active: formData.get("is_active") === "on",
    },
    { onConflict: "movie_id,url" },
  );

  if (error) fail(back, error.message);
  revalidateAll();
  done(back, `Source "${label}" added.`);
}

export async function grabMovieSourcesAction(formData: FormData) {
  await requireAdmin();
  const movieId = text(formData, "movie_id");
  const back = movieId ? `/admin/movies/${movieId}` : "/admin/movies";
  if (!movieId) fail(back, "Missing movie id.");

  const sourceInput = text(formData, "source_input");
  const rawLanguage = text(formData, "language");
  const language = canonicalLanguage(rawLanguage) || rawLanguage || null;

  let result: { count: number; newCount: number; labels: string[] };
  try {
    result = await grabAndSaveMovieSources(movieId, sourceInput, {
      language,
      autoDiscover: !sourceInput,
    });
  } catch (error) {
    fail(
      back,
      error instanceof Error ? error.message : "Could not grab sources.",
    );
  }

  if (result.count === 0 || (!sourceInput && result.newCount === 0)) {
    fail(
      back,
      "No new verified sources found. All reachable streams are already attached, or paste a direct stream/embed URL in the input box.",
    );
  }

  revalidateAll();
  const addedCount = result.newCount || result.count;
  done(
    back,
    `Imported ${addedCount} source${addedCount === 1 ? "" : "s"} (${result.labels.slice(0, 3).join(", ")}).`,
  );
}

export async function deleteMovieSourceAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const movieId = text(formData, "movie_id");
  const back = movieId ? `/admin/movies/${movieId}` : "/admin/movies";
  if (!id) fail(back, "Missing source id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("movie_sources").delete().eq("id", id);
  if (error) fail(back, error.message);
  revalidateAll();
  done(back, "Source removed.");
}

export async function toggleMovieSourceAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const movieId = text(formData, "movie_id");
  const active = text(formData, "active") === "true";
  const back = movieId ? `/admin/movies/${movieId}` : "/admin/movies";
  if (!id) fail(back, "Missing source id.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("movie_sources")
    .update({ is_active: active })
    .eq("id", id);

  if (error) fail(back, error.message);
  revalidateAll();
  done(back, "Source updated.");
}

export async function setMovieSourceLanguageAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const movieId = text(formData, "movie_id");
  const rawLanguage = text(formData, "language");
  const back = movieId ? `/admin/movies/${movieId}` : "/admin/movies";
  if (!id) fail(back, "Missing source id.");

  const language = canonicalLanguage(rawLanguage) || rawLanguage || null;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("movie_sources")
    .update({ language })
    .eq("id", id);

  if (error) fail(back, error.message);
  revalidateAll();
  done(back, "Audio language updated.");
}
