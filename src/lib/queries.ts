import { createAdminClient } from "@/lib/supabase/admin";
import type {
  BrowseFilters,
  Category,
  Genre,
  Movie,
  MovieSource,
  MovieWithTaxonomy,
  SiteSettings,
} from "@/lib/types";

const CARD_FIELDS = [
  "id",
  "slug",
  "title",
  "original_title",
  "type",
  "poster_url",
  "backdrop_url",
  "release_date",
  "runtime",
  "vote_average",
  "view_count",
  "featured",
  "trending",
  "published",
  "overview",
  "category_id",
  "created_at",
].join(",");

const DEFAULT_SETTINGS: SiteSettings = {
  name: "Cinewood",
  tagline: "Cinema, curated.",
  description:
    "A beautifully organised home for films and series. Built for people who love the movies.",
  logo_text: "CINEWOOD",
  player: { autoplay: false, default_quality: "auto" },
  tmdb: { region: process.env.TMDB_REGION || "BD" },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value");

    const map = new Map<string, Record<string, unknown>>(
      (data || []).map((row) => [row.key, row.value as Record<string, unknown>]),
    );
    const site = (map.get("site") || {}) as Record<string, unknown>;
    const player = (map.get("player") || {}) as Record<string, unknown>;
    const tmdb = (map.get("tmdb") || {}) as Record<string, unknown>;

    return {
      name: (site.name as string) || DEFAULT_SETTINGS.name,
      tagline: (site.tagline as string) || DEFAULT_SETTINGS.tagline,
      description: (site.description as string) || DEFAULT_SETTINGS.description,
      logo_text: (site.logo_text as string) || DEFAULT_SETTINGS.logo_text,
      player: {
        autoplay: Boolean(player.autoplay),
        default_quality: (player.default_quality as string) || "auto",
      },
      tmdb: {
        region:
          (tmdb.region as string) ||
          process.env.TMDB_REGION ||
          DEFAULT_SETTINGS.tmdb.region,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getCategories(activeOnly = true): Promise<Category[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return (data || []) as unknown as Category[];
}

export async function getGenres(): Promise<Genre[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("genres")
    .select("id, tmdb_id, name, slug")
    .order("name", { ascending: true });
  return (data || []) as Genre[];
}

export async function getGenresWithCounts(): Promise<
  (Genre & { count: number })[]
> {
  const supabase = createAdminClient();
  const [genresResult, linksResult] = await Promise.all([
    supabase.from("genres").select("id, tmdb_id, name, slug").order("name"),
    supabase.from("movie_genres").select("genre_id"),
  ]);

  const counts = new Map<string, number>();
  for (const row of linksResult.data || []) {
    counts.set(row.genre_id, (counts.get(row.genre_id) || 0) + 1);
  }

  return ((genresResult.data || []) as Genre[])
    .map((genre) => ({ ...genre, count: counts.get(genre.id) || 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getFeatured(limit = 5): Promise<Movie[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movies")
    .select(CARD_FIELDS)
    .eq("published", true)
    .or("featured.eq.true,trending.eq.true")
    .order("featured", { ascending: false })
    .order("popularity", { ascending: false })
    .limit(limit);

  if (data && data.length > 0) return data as unknown as Movie[];

  const { data: fallback } = await supabase
    .from("movies")
    .select(CARD_FIELDS)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (fallback || []) as unknown as Movie[];
}

export async function getTrending(limit = 12): Promise<Movie[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movies")
    .select(CARD_FIELDS)
    .eq("published", true)
    .eq("trending", true)
    .order("popularity", { ascending: false })
    .limit(limit);
  return (data || []) as unknown as Movie[];
}

export async function getLatest(limit = 12): Promise<Movie[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movies")
    .select(CARD_FIELDS)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []) as unknown as Movie[];
}

export async function getTopRated(limit = 12): Promise<Movie[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movies")
    .select(CARD_FIELDS)
    .eq("published", true)
    .order("vote_average", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data || []) as unknown as Movie[];
}

export async function getCategoriesWithMovies(
  limitPerCategory = 12,
): Promise<{ category: Category; movies: Movie[] }[]> {
  const categories = await getCategories();
  const supabase = createAdminClient();

  const rows = await Promise.all(
    categories.slice(0, 6).map(async (category) => {
      const { data } = await supabase
        .from("movies")
        .select(CARD_FIELDS)
        .eq("published", true)
        .eq("category_id", category.id)
        .order("created_at", { ascending: false })
        .limit(limitPerCategory);
      return { category, movies: (data || []) as unknown as Movie[] };
    }),
  );

  return rows.filter((row) => row.movies.length > 0);
}

export async function getMovieBySlug(
  slug: string,
): Promise<MovieWithTaxonomy | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movies")
    .select(
      `*, category:categories(id, name, slug, description, image_url, sort_order, is_active), movie_genres(genres(id, tmdb_id, name, slug))`,
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!data) return null;

  const sourceRows = await getMovieSources(data.id);
  const genres = ((data.movie_genres || []) as { genres: Genre | null }[])
    .map((row) => row.genres)
    .filter((genre): genre is Genre => Boolean(genre));

  return { ...data, genres, sources: sourceRows } as MovieWithTaxonomy;
}

export async function getMovieSources(movieId: string): Promise<MovieSource[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movie_sources")
    .select(
      "id, movie_id, source_id, label, url, type, quality, language, priority, is_active",
    )
    .eq("movie_id", movieId)
    .eq("is_active", true)
    .order("priority", { ascending: false });
  return (data || []) as MovieSource[];
}

export async function getRelatedMovies(
  movie: MovieWithTaxonomy,
  limit = 12,
): Promise<Movie[]> {
  const supabase = createAdminClient();
  const genreIds = movie.genres.map((genre) => genre.id);
  const ids = new Set<string>();

  if (genreIds.length > 0) {
    const { data: links } = await supabase
      .from("movie_genres")
      .select("movie_id")
      .in("genre_id", genreIds)
      .neq("movie_id", movie.id)
      .limit(200);
    for (const row of links || []) ids.add(row.movie_id);
  }

  if (ids.size > 0) {
    const { data } = await supabase
      .from("movies")
      .select(CARD_FIELDS)
      .eq("published", true)
      .in("id", Array.from(ids))
      .order("popularity", { ascending: false })
      .limit(limit);
    if (data && data.length > 0) return data as unknown as Movie[];
  }

  const { data } = await supabase
    .from("movies")
    .select(CARD_FIELDS)
    .eq("published", true)
    .neq("id", movie.id)
    .order("popularity", { ascending: false })
    .limit(limit);
  return (data || []) as unknown as Movie[];
}

export interface BrowseResult {
  movies: Movie[];
  count: number;
  page: number;
  perPage: number;
}

export async function browseMovies(
  filters: BrowseFilters,
  perPage = 24,
): Promise<BrowseResult> {
  const supabase = createAdminClient();
  const page = Math.max(1, Number(filters.page) || 1);

  let restrictedIds: string[] | null = null;

  if (filters.genre) {
    const { data: genre } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", filters.genre)
      .maybeSingle();
    if (!genre) return { movies: [], count: 0, page, perPage };

    const { data: links } = await supabase
      .from("movie_genres")
      .select("movie_id")
      .eq("genre_id", genre.id)
      .limit(5000);
    restrictedIds = (links || []).map((row) => row.movie_id);
    if (restrictedIds.length === 0) {
      return { movies: [], count: 0, page, perPage };
    }
  }

  let categoryId: string | null = null;
  if (filters.category) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (!category) return { movies: [], count: 0, page, perPage };
    categoryId = category.id;
  }

  let query = supabase
    .from("movies")
    .select(CARD_FIELDS, { count: "exact" })
    .eq("published", true);

  if (restrictedIds) query = query.in("id", restrictedIds);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (filters.type === "movie" || filters.type === "series") {
    query = query.eq("type", filters.type);
  }

  if (filters.year && /^\d{4}$/.test(filters.year)) {
    query = query
      .gte("release_date", `${filters.year}-01-01`)
      .lte("release_date", `${filters.year}-12-31`);
  }

  if (filters.q) {
    const clean = filters.q.replace(/[(),*]/g, " ").trim();
    if (clean) {
      query = query.or(
        `title.ilike.%${clean}%,original_title.ilike.%${clean}%,overview.ilike.%${clean}%`,
      );
    }
  }

  switch (filters.sort) {
    case "oldest":
      query = query.order("release_date", { ascending: true, nullsFirst: false });
      break;
    case "rating":
      query = query.order("vote_average", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("release_date", {
        ascending: false,
        nullsFirst: false,
      });
      break;
  }

  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("browseMovies", error.message);
  }

  return {
    movies: (data || []) as unknown as Movie[],
    count: count || 0,
    page,
    perPage,
  };
}

export async function getAdminStats() {
  const supabase = createAdminClient();
  const [movies, published, categories, genres, sources, profiles, recent] =
    await Promise.all([
      supabase.from("movies").select("id", { count: "exact", head: true }),
      supabase
        .from("movies")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("genres").select("id", { count: "exact", head: true }),
      supabase.from("sources").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("movies")
        .select("id, slug, title, poster_url, type, published, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  return {
    movies: movies.count || 0,
    published: published.count || 0,
    categories: categories.count || 0,
    genres: genres.count || 0,
    sources: sources.count || 0,
    profiles: profiles.count || 0,
    recent: recent.data || [],
  };
}

export async function getAdminMovies(filters: {
  q?: string;
  type?: string;
  page?: number;
}): Promise<BrowseResult> {
  const supabase = createAdminClient();
  const page = Math.max(1, Number(filters.page) || 1);
  const perPage = 30;

  let query = supabase
    .from("movies")
    .select(`${CARD_FIELDS}, category:categories(name)`, { count: "exact" });

  if (filters.type === "movie" || filters.type === "series") {
    query = query.eq("type", filters.type);
  }
  if (filters.q) {
    const clean = filters.q.replace(/[(),*]/g, " ").trim();
    if (clean) query = query.or(`title.ilike.%${clean}%,original_title.ilike.%${clean}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const { data, count } = await query;
  return {
    movies: (data || []) as unknown as Movie[],
    count: count || 0,
    page,
    perPage,
  };
}

export async function getAdminMovieById(
  id: string,
): Promise<MovieWithTaxonomy | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movies")
    .select(
      `*, category:categories(id, name, slug, description, image_url, sort_order, is_active), movie_genres(genres(id, tmdb_id, name, slug))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const { data: sources } = await supabase
    .from("movie_sources")
    .select(
      "id, movie_id, source_id, label, url, type, quality, language, priority, is_active",
    )
    .eq("movie_id", id)
    .order("priority", { ascending: false });

  const genres = ((data.movie_genres || []) as { genres: Genre | null }[])
    .map((row) => row.genres)
    .filter((genre): genre is Genre => Boolean(genre));

  return { ...data, genres, sources: (sources || []) as MovieSource[] } as MovieWithTaxonomy;
}

export async function getSources(): Promise<
  (import("@/lib/types").Source)[]
> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sources")
    .select("id, name, slug, type, base_url, region, is_active, notes")
    .order("name");
  return (data || []) as import("@/lib/types").Source[];
}

export async function getMovieGenres(movieId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movie_genres")
    .select("genre_id")
    .eq("movie_id", movieId);
  return (data || []).map((row) => row.genre_id);
}
