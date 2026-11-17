import { slugify } from "@/lib/utils";
import { getSiteSettings } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTmdbDetails,
  pickTmdbTrailer,
  tmdbImage,
  type TmdbDetails,
  type TmdbWatchRegion,
} from "@/lib/tmdb";

interface ImportInput {
  tmdbId: number;
  mediaType: "movie" | "tv";
  categoryId?: string | null;
  region?: string;
  year?: string | null;
  country?: string | null;
}

async function uniqueSlug(base: string, mediaType: string, tmdbId: number) {
  const supabase = createAdminClient();
  const root = slugify(base) || `${mediaType}-${tmdbId}`;
  let candidate = root;

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const { data } = await supabase
      .from("movies")
      .select("id, tmdb_id, type")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
    if (data.tmdb_id === (mediaType === "tv" ? -tmdbId : tmdbId)) {
      return candidate;
    }
    candidate = `${root}-${attempt + 1}`;
  }

  return `${root}-${Date.now().toString(36)}`;
}

async function resolveCategory(
  categoryId?: string | null,
  primaryGenre?: string | null,
) {
  const supabase = createAdminClient();

  if (categoryId) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();
    if (data) return data.id as string;
  }

  if (primaryGenre) {
    const genreSlug = slugify(primaryGenre);
    if (genreSlug) {
      const { data: bySlug } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", genreSlug)
        .maybeSingle();
      if (bySlug) return bySlug.id as string;

      const { data: byName } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", primaryGenre)
        .maybeSingle();
      if (byName) return byName.id as string;
    }
  }

  const { data: latest } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "latest-movies")
    .maybeSingle();
  if (latest) return latest.id as string;

  const { data: first } = await supabase
    .from("categories")
    .select("id")
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  return first?.id || null;
}

async function upsertGenres(details: TmdbDetails) {
  const supabase = createAdminClient();
  const ids: string[] = [];

  for (const genre of details.genres || []) {
    const slug = slugify(genre.name);
    let genreId: string | null = null;

    const { data: byTmdb } = await supabase
      .from("genres")
      .select("id")
      .eq("tmdb_id", genre.id)
      .maybeSingle();

    if (byTmdb) {
      genreId = byTmdb.id;
    } else {
      const { data: bySlug } = await supabase
        .from("genres")
        .select("id, tmdb_id")
        .eq("slug", slug)
        .maybeSingle();

      if (bySlug) {
        genreId = bySlug.id;
        if (!bySlug.tmdb_id) {
          await supabase.from("genres").update({ tmdb_id: genre.id }).eq("id", bySlug.id);
        }
      } else {
        const { data: created, error } = await supabase
          .from("genres")
          .insert({ tmdb_id: genre.id, name: genre.name, slug })
          .select("id")
          .single();
        if (error) {
          const { data: retry } = await supabase
            .from("genres")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          genreId = retry?.id || null;
        } else {
          genreId = created.id;
        }
      }
    }

    if (genreId) ids.push(genreId);
  }

  return Array.from(new Set(ids));
}

export async function importMovieFromTmdb(input: ImportInput) {
  const { tmdbId, mediaType } = input;
  const settings = await getSiteSettings();
  const region =
    input.region || process.env.TMDB_REGION || settings.tmdb.region || "BD";

  const details = await getTmdbDetails(mediaType, tmdbId);
  const supabase = createAdminClient();
  const tmdbKey = mediaType === "tv" ? -tmdbId : tmdbId;

  const title =
    (mediaType === "tv" ? details.name : details.title) || `TMDB ${tmdbId}`;
  const originalTitle =
    (mediaType === "tv" ? details.original_name : details.original_title) ||
    title;
  const tmdbReleaseDate =
    (mediaType === "tv" ? details.first_air_date : details.release_date) || null;
  const year = /^\d{4}$/.test(input.year || "") ? input.year! : null;
  const releaseDate = year
    ? `${year}${tmdbReleaseDate?.slice(4) || "-01-01"}`
    : tmdbReleaseDate;
  const trailer = pickTmdbTrailer(details);
  const trailerUrl = trailer
    ? `https://www.youtube.com/embed/${trailer.key}`
    : null;

  const { data: existing } = await supabase
    .from("movies")
    .select("id, slug, category_id")
    .eq("tmdb_id", tmdbKey)
    .maybeSingle();

  const slug = existing?.slug || (await uniqueSlug(title, mediaType, tmdbId));
  const categoryId = await resolveCategory(
    input.categoryId || existing?.category_id || null,
    details.genres?.[0]?.name || null,
  );

  const watchRegion: TmdbWatchRegion | undefined =
    details["watch/providers"]?.results?.[region];

  const providerGroups = {
    flatrate: watchRegion?.flatrate || [],
    rent: watchRegion?.rent || [],
    buy: watchRegion?.buy || [],
  };

  const director =
    details.credits?.crew?.find((member) => member.job === "Director")?.name ||
    null;

  const tmdbCountries = (details.production_countries || [])
    .map((country) => country.name)
    .filter(Boolean);
  const countries = input.country
    ? [input.country, ...tmdbCountries.filter((item) => item !== input.country)]
    : tmdbCountries;

  const metadata = {
    tmdb_id: tmdbId,
    media_type: mediaType,
    original_language: details.original_language || null,
    homepage: details.homepage || null,
    tmdb_url: `https://www.themoviedb.org/${mediaType}/${tmdbId}`,
    cast: (details.credits?.cast || []).slice(0, 12).map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character || null,
      profile_path: member.profile_path || null,
    })),
    director,
    production_companies: (details.production_companies || [])
      .map((company) => company.name)
      .slice(0, 6),
    country: countries[0] || null,
    countries,
    languages: (details.spoken_languages || [])
      .map((language) => language.english_name || language.name)
      .filter(Boolean),
    seasons: details.number_of_seasons || null,
    episodes: details.number_of_episodes || null,
    watch_providers: watchRegion
      ? {
          link: watchRegion.link || null,
          flatrate: providerGroups.flatrate,
          rent: providerGroups.rent,
          buy: providerGroups.buy,
        }
      : null,
  };

  const payload = {
    tmdb_id: tmdbKey,
    imdb_id: details.external_ids?.imdb_id || null,
    type: mediaType === "tv" ? "series" : "movie",
    title,
    original_title: originalTitle,
    slug,
    tagline: details.tagline || null,
    overview: details.overview || null,
    release_date: releaseDate,
    runtime:
      mediaType === "tv"
        ? details.episode_run_time?.[0] || null
        : details.runtime || null,
    status: details.status || null,
    vote_average: details.vote_average ?? null,
    vote_count: details.vote_count ?? null,
    popularity: details.popularity ?? null,
    poster_url: tmdbImage(details.poster_path, "w500"),
    backdrop_url: tmdbImage(details.backdrop_path, "w1280"),
    trailer_url: trailerUrl,
    category_id: categoryId,
    metadata,
  };

  const { data: saved, error } = await supabase
    .from("movies")
    .upsert(payload, { onConflict: "tmdb_id" })
    .select("id, slug")
    .single();

  if (error || !saved) {
    throw new Error(error?.message || "Could not save the imported title.");
  }

  const genreIds = await upsertGenres(details);
  await supabase.from("movie_genres").delete().eq("movie_id", saved.id);
  if (genreIds.length > 0) {
    await supabase.from("movie_genres").insert(
      genreIds.map((genreId) => ({ movie_id: saved.id, genre_id: genreId })),
    );
  }

  const sources: {
    movie_id: string;
    label: string;
    url: string;
    type: string;
    quality: string | null;
    language: string | null;
    priority: number;
    is_active: boolean;
  }[] = [];

  if (trailerUrl) {
    sources.push({
      movie_id: saved.id,
      label: `Official Trailer${trailer?.name ? ` • ${trailer.name}` : ""}`,
      url: trailerUrl,
      type: "youtube",
      quality: "HD",
      language: details.original_language || null,
      priority: 1,
      is_active: true,
    });
  }

  if (watchRegion?.link) {
    sources.push({
      movie_id: saved.id,
      label: "Where to watch (JustWatch)",
      url: watchRegion.link,
      type: "external",
      quality: null,
      language: null,
      priority: 0,
      is_active: true,
    });
  }

  if (sources.length > 0) {
    await supabase
      .from("movie_sources")
      .upsert(sources, { onConflict: "movie_id,url", ignoreDuplicates: true });
  }

  return { id: saved.id as string, slug: saved.slug as string, title };
}
