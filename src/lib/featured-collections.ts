import {
  getTmdbCollectionDetails,
  tmdbConfigured,
  tmdbImage,
} from "@/lib/tmdb";
import type { TmdbCollectionPart } from "@/lib/types";

export const FEATURED_COLLECTIONS = [
  { id: 10, name: "Star Wars Collection" },
  { id: 131296, name: "Marvel Cinematic Universe" },
  { id: 86311, name: "The Avengers Collection" },
  { id: 9485, name: "The Fast and the Furious Collection" },
  { id: 119, name: "Lord of the Rings Collection" },
  { id: 2150, name: "Shrek Collection" },
  { id: 528, name: "The Terminator Collection" },
  { id: 748, name: "X-Men Collection" },
  { id: 2980, name: "Ghostbusters Collection" },
  { id: 8091, name: "Alien Collection" },
  { id: 1241, name: "Harry Potter Collection" },
  { id: 529892, name: "Mission: Impossible Collection" },
  { id: 295, name: "Pirates of the Caribbean Collection" },
  { id: 87359, name: "Mission: Impossible Collection" },
  { id: 263, name: "The Dark Knight Collection" },
  { id: 645, name: "James Bond Collection" },
  { id: 84, name: "Indiana Jones Collection" },
  { id: 1570, name: "Die Hard Collection" },
  { id: 328, name: "Jurassic Park Collection" },
  { id: 735, name: "Toy Story Collection" },
  { id: 2326, name: "Spider-Man Collection" },
  { id: 531241, name: "Spider-Man (MCU) Collection" },
] as const;

export interface FeaturedCollection {
  id: number;
  name: string;
  count: number;
  years: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  parts: TmdbCollectionPart[];
}

function yearRange(parts: TmdbCollectionPart[]): string {
  const years = parts
    .map((part) => part.release_date?.slice(0, 4))
    .filter((year): year is string => Boolean(year))
    .sort();
  if (years.length === 0) return "";
  return years[0] === years[years.length - 1]
    ? years[0]
    : `${years[0]}–${years[years.length - 1]}`;
}

function fallback(entry: (typeof FEATURED_COLLECTIONS)[number]): FeaturedCollection {
  return {
    id: entry.id,
    name: entry.name,
    count: 0,
    years: "",
    posterUrl: null,
    backdropUrl: null,
    parts: [],
  };
}

export async function getFeaturedCollections(): Promise<FeaturedCollection[]> {
  return Promise.all(
    FEATURED_COLLECTIONS.map(async (entry) => {
      if (!tmdbConfigured()) return fallback(entry);
      try {
        const details = await getTmdbCollectionDetails(entry.id);
        const parts = (details.parts || [])
          .slice()
          .sort((a, b) =>
            (a.release_date || "").localeCompare(b.release_date || ""),
          );
        return {
          id: entry.id,
          name: details.name || entry.name,
          count: parts.length,
          years: yearRange(parts),
          posterUrl: tmdbImage(details.poster_path, "w500"),
          backdropUrl: tmdbImage(details.backdrop_path, "w780"),
          parts,
        };
      } catch {
        return fallback(entry);
      }
    }),
  );
}

export async function getFeaturedCollectionById(
  id: number,
): Promise<FeaturedCollection | null> {
  const entry = FEATURED_COLLECTIONS.find((item) => item.id === id);
  if (!entry) return null;

  if (!tmdbConfigured()) return fallback(entry);
  try {
    const details = await getTmdbCollectionDetails(entry.id);
    const parts = (details.parts || [])
      .slice()
      .sort((a, b) =>
        (a.release_date || "").localeCompare(b.release_date || ""),
      );
    return {
      id: entry.id,
      name: details.name || entry.name,
      count: parts.length,
      years: yearRange(parts),
      posterUrl: tmdbImage(details.poster_path, "w500"),
      backdropUrl: tmdbImage(details.backdrop_path, "w780"),
      parts,
    };
  } catch {
    return fallback(entry);
  }
}
