import type {
  TmdbCollectionDetails,
  TmdbCollectionRef,
  TmdbSearchResult,
} from "@/lib/types";

const TMDB_BASE = "https://api.themoviedb.org/3";

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface TmdbCast {
  id: number;
  name: string;
  character?: string | null;
  profile_path?: string | null;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
}

export interface TmdbWatchRegion {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

export interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  tagline?: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  homepage?: string | null;
  original_language?: string;
  genres?: TmdbGenre[];
  videos?: { results?: TmdbVideo[] };
  credits?: {
    cast?: TmdbCast[];
    crew?: { job?: string; name?: string }[];
  };
  "watch/providers"?: { results?: Record<string, TmdbWatchRegion> };
  external_ids?: { imdb_id?: string | null };
  production_companies?: { name: string }[];
  production_countries?: { name: string }[];
  spoken_languages?: { english_name?: string; name?: string }[];
  belongs_to_collection?: TmdbCollectionRef | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    season_number?: number;
    episode_count?: number;
  }[];
}

export function tmdbConfigured() {
  return Boolean(process.env.TMDB_API_KEY || process.env.TMDB_ACCESS_TOKEN);
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
  revalidate = 3600,
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!apiKey && !token) {
    throw new Error(
      "TMDB is not configured. Add TMDB_API_KEY or TMDB_ACCESS_TOKEN to .env.local.",
    );
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  if (!token && apiKey) url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbFetch<{ results?: TmdbSearchResult[] }>(
    "/search/multi",
    {
      query: trimmed,
      include_adult: false,
      language: "en-US",
      page: 1,
    },
    600,
  );

  return (data.results || [])
    .filter(
      (result) => result.media_type === "movie" || result.media_type === "tv",
    )
    .slice(0, 12);
}

export function pickTmdbResult(
  results: TmdbSearchResult[],
  query: string,
): TmdbSearchResult | null {
  if (results.length === 0) return null;
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const wanted = normalize(query);
  return (
    results.find(
      (item) => normalize(item.title || item.name || "") === wanted,
    ) || results[0]
  );
}

export async function getTmdbDetails(
  mediaType: "movie" | "tv",
  tmdbId: number,
): Promise<TmdbDetails> {
  return tmdbFetch<TmdbDetails>(
    `/${mediaType}/${tmdbId}`,
    {
      append_to_response: "videos,credits,watch/providers,external_ids",
      language: "en-US",
    },
    300,
  );
}

export async function getTmdbMovieCollection(
  tmdbId: number,
): Promise<TmdbCollectionRef | null> {
  const data = await tmdbFetch<{
    belongs_to_collection?: TmdbCollectionRef | null;
  }>(
    `/movie/${tmdbId}`,
    { language: "en-US" },
    86400,
  );
  return data.belongs_to_collection || null;
}

export async function getTmdbCollectionDetails(
  collectionId: number,
): Promise<TmdbCollectionDetails> {
  return tmdbFetch<TmdbCollectionDetails>(
    `/collection/${collectionId}`,
    { language: "en-US" },
    86400,
  );
}

export function tmdbImage(path: string | null | undefined, size = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function pickTmdbTrailer(details: TmdbDetails): TmdbVideo | null {
  const videos = (details.videos?.results || []).filter(
    (video) => video.site === "YouTube",
  );
  return (
    videos.find((video) => video.type === "Trailer" && video.official) ||
    videos.find((video) => video.type === "Trailer") ||
    videos.find((video) => video.type === "Teaser") ||
    null
  );
}
