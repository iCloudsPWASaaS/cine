"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { importMovieFromTmdb } from "@/lib/import";
import { canonicalLanguage } from "@/lib/languages";
import { grabAndSaveMovieSources } from "@/lib/source-grabber";
import { pickTmdbResult, searchTmdb, tmdbConfigured } from "@/lib/tmdb";
import type { TmdbSearchResult } from "@/lib/types";

const back = "/admin/movies/new";

function fail(message: string): never {
  redirect(`${back}?error=${encodeURIComponent(message)}`);
}

export async function importMovieByNameAction(formData: FormData) {
  await requireAdmin();

  const query = String(formData.get("query") || "").trim();
  const rawYear = String(formData.get("year") || "").trim();
  const year = /^\d{4}$/.test(rawYear) ? rawYear : null;
  const country = String(formData.get("country") || "").trim() || null;
  const rawLanguage = String(formData.get("language") || "").trim();
  const language = canonicalLanguage(rawLanguage) || null;
  if (!query) fail("Enter a movie or series name.");

  if (!tmdbConfigured()) {
    fail(
      "TMDB is not configured. Add TMDB_API_KEY to .env.local and restart the app.",
    );
  }

  let results: TmdbSearchResult[] = [];
  try {
    results = await searchTmdb(query);
  } catch (error) {
    fail(
      error instanceof Error ? error.message : "TMDB search failed.",
    );
  }

  if (results.length === 0) {
    fail(`No TMDB matches found for "${query}". Try the full title or a year.`);
  }

  const pick = pickTmdbResult(results, query);
  if (!pick) fail(`No TMDB matches found for "${query}".`);

  let saved: { id: string; slug: string; title: string } | null = null;
  try {
    saved = await importMovieFromTmdb({
      tmdbId: pick.id,
      mediaType: pick.media_type,
      year,
      country,
    });
  } catch (error) {
    fail(
      error instanceof Error ? error.message : "Could not import this title.",
    );
  }

  if (!saved) fail("Could not import this title.");

  let grabbedCount = 0;
  let grabError: string | null = null;
  try {
    const grabbed = await grabAndSaveMovieSources(saved.id, "", {
      autoDiscover: true,
      language,
    });
    grabbedCount = grabbed.count;
  } catch (error) {
    grabError =
      error instanceof Error ? error.message : "Unknown source grab error.";
  }

  revalidatePath("/", "layout");
  revalidatePath(`/watch/${saved.slug}`);

  const message = grabError
    ? `${saved.title} imported, but the source grab failed: ${grabError}. Retry from the edit page.`
    : grabbedCount > 0
      ? `${saved.title} imported with ${grabbedCount} playback source${grabbedCount === 1 ? "" : "s"}.`
      : `${saved.title} imported from TMDB. No verified playback sources were found.`;

  redirect(`/admin/movies/${saved.id}?ok=${encodeURIComponent(message)}`);
}

