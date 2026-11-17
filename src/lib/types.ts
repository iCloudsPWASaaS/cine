export type MovieType = "movie" | "series";
export type SourceType = "hls" | "mp4" | "embed" | "youtube" | "external";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Genre {
  id: string;
  tmdb_id: number | null;
  name: string;
  slug: string;
}

export interface Movie {
  id: string;
  tmdb_id: number | null;
  imdb_id: string | null;
  type: MovieType;
  title: string;
  original_title: string | null;
  slug: string;
  tagline: string | null;
  overview: string | null;
  release_date: string | null;
  runtime: number | null;
  status: string | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  category_id: string | null;
  featured: boolean;
  trending: boolean;
  published: boolean;
  view_count: number;
  metadata: MovieMetadata;
  created_at: string;
  updated_at: string;
}

export interface MovieMetadata {
  demo?: boolean;
  license?: string;
  studio?: string;
  country?: string;
  homepage?: string | null;
  original_language?: string | null;
  tmdb_url?: string | null;
  cast?: {
    id: number;
    name: string;
    character?: string | null;
    profile_path?: string | null;
  }[];
  director?: string | null;
  production_companies?: string[];
  countries?: string[];
  languages?: string[];
  seasons?: number | null;
  episodes?: number | null;
  watch_providers?: {
    link?: string | null;
    flatrate?: Provider[];
    rent?: Provider[];
    buy?: Provider[];
  } | null;
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
}

export interface MovieSource {
  id: string;
  movie_id: string;
  source_id: string | null;
  label: string;
  url: string;
  type: SourceType;
  quality: string | null;
  language: string | null;
  priority: number;
  is_active: boolean;
}

export interface Source {
  id: string;
  name: string;
  slug: string;
  type: SourceType;
  base_url: string | null;
  region: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface MovieWithTaxonomy extends Movie {
  category: Category | null;
  genres: Genre[];
  sources: MovieSource[];
}

export interface SiteSettings {
  name: string;
  tagline: string;
  description: string;
  logo_text: string;
  player: { autoplay?: boolean; default_quality?: string };
  tmdb: { region?: string };
}

export interface TmdbSearchResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  popularity?: number;
}

export interface BrowseFilters {
  q?: string;
  type?: string;
  genre?: string;
  category?: string;
  year?: string;
  sort?: string;
  page?: number;
}
