import { createAdminClient } from "@/lib/supabase/admin";
import { getTmdbMovieCollection, tmdbConfigured, tmdbImage } from "@/lib/tmdb";
import type {
  Movie,
  MovieCollection,
  MovieMetadata,
  TmdbCollectionRef,
} from "@/lib/types";
import { slugify, yearOf } from "@/lib/utils";

type CollectionMovieRow = {
  id: string;
  slug: string;
  title: string;
  type: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string | null;
  vote_average: number | null;
  tmdb_id: number | null;
  metadata: MovieMetadata | null;
};

const SYNC_LIMIT = 80;
const SYNC_CONCURRENCY = 10;
let syncInFlight: Promise<void> | null = null;

async function syncCollectionMetadata(rows: CollectionMovieRow[]) {
  if (!tmdbConfigured()) return;

  const pending = rows
    .filter((row) => {
      const tmdbId = Number(row.tmdb_id || 0);
      const metadata = (row.metadata || {}) as MovieMetadata;
      return tmdbId > 0 && !metadata.collection_checked;
    })
    .slice(0, SYNC_LIMIT);
  if (pending.length === 0) return;

  const supabase = createAdminClient();
  for (let index = 0; index < pending.length; index += SYNC_CONCURRENCY) {
    const chunk = pending.slice(index, index + SYNC_CONCURRENCY);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const collection: TmdbCollectionRef | null =
            await getTmdbMovieCollection(Number(row.tmdb_id));
          const metadata = {
            ...((row.metadata || {}) as MovieMetadata),
            collection,
            collection_checked: true,
          };
          row.metadata = metadata;
          await supabase
            .from("movies")
            .update({ metadata })
            .eq("id", row.id);
        } catch {
          // Leave unchecked so the next visit can retry.
        }
      }),
    );
  }
}

async function ensureCollectionsSynced(rows: CollectionMovieRow[]) {
  if (!syncInFlight) {
    syncInFlight = syncCollectionMetadata(rows).finally(() => {
      syncInFlight = null;
    });
  }
  await syncInFlight;
}

function collectionYears(movies: Movie[]): string {
  const years = movies
    .map((movie) => yearOf(movie.release_date))
    .filter((value): value is string => Boolean(value));
  if (years.length === 0) return "";
  const unique = Array.from(new Set(years));
  return unique.length === 1 ? unique[0] : `${unique[0]}–${unique[unique.length - 1]}`;
}

export async function getCollections(): Promise<MovieCollection[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("movies")
    .select(
      "id,slug,title,type,poster_url,backdrop_url,release_date,vote_average,tmdb_id,metadata",
    )
    .eq("published", true)
    .eq("type", "movie");

  const rows = (data || []) as unknown as CollectionMovieRow[];
  await ensureCollectionsSynced(rows);

  const groups = new Map<number, MovieCollection>();
  for (const row of rows) {
    const ref = row.metadata?.collection;
    if (!ref?.id || !ref.name) continue;

    let collection = groups.get(ref.id);
    if (!collection) {
      collection = {
        id: ref.id,
        slug: slugify(ref.name),
        name: ref.name,
        count: 0,
        posterUrl: tmdbImage(ref.poster_path, "w780") || row.poster_url || null,
        backdropUrl:
          tmdbImage(ref.backdrop_path, "w1280") || row.backdrop_url || null,
        years: "",
        movies: [],
      };
      groups.set(ref.id, collection);
    }

    collection.movies.push(row as unknown as Movie);
    collection.count += 1;
  }

  const collections = Array.from(groups.values());
  for (const collection of collections) {
    collection.movies.sort((a, b) =>
      (a.release_date || "9999").localeCompare(b.release_date || "9999"),
    );
    collection.years = collectionYears(collection.movies);
  }

  return collections.sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export async function getCollectionBySlug(
  slug: string,
): Promise<MovieCollection | null> {
  const collections = await getCollections();
  return collections.find((collection) => collection.slug === slug) || null;
}
