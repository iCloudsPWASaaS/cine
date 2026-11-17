import Link from "next/link";
import { notFound } from "next/navigation";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { MovieCard } from "@/components/site/movie-card";
import {
  browseMovies,
  getCategories,
  getGenres,
} from "@/lib/queries";

type SearchParams = Record<string, string | string[] | undefined>;

interface BrowseViewProps {
  searchParams: SearchParams;
  forcedType?: "movie" | "series";
  forcedGenre?: string;
  actionPath?: string;
  heading?: string;
  description?: string;
}

function param(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export async function BrowseView({
  searchParams,
  forcedType,
  forcedGenre,
  actionPath = "/movies",
  heading,
  description,
}: BrowseViewProps) {
  const q = param(searchParams.q).trim();
  const type = forcedType || param(searchParams.type);
  const genre = forcedGenre || param(searchParams.genre);
  const category = param(searchParams.category);
  const year = param(searchParams.year);
  const upcoming = param(searchParams.upcoming);
  const sort = param(searchParams.sort) || "newest";
  const page = Math.max(1, Number(param(searchParams.page)) || 1);

  const [result, genres, categories] = await Promise.all([
    browseMovies({ q, type, genre, category, year, upcoming, sort, page }),
    getGenres(),
    getCategories(),
  ]);

  const activeGenre = genre ? genres.find((item) => item.slug === genre) : null;
  if (forcedGenre && !activeGenre) notFound();

  const currentCategory = category
    ? categories.find((item) => item.slug === category)
    : null;

  const title =
    heading ||
    (upcoming === "1"
      ? "Upcoming"
      : activeGenre?.name ||
        currentCategory?.name ||
        (type === "series"
          ? "Series"
          : type === "movie"
            ? "Movies"
            : "All titles"));

  const subtitle =
    description ||
    (upcoming === "1"
      ? "Titles marked as coming soon on Cinewood."
      : q
        ? `Results for “${q}”`
        : activeGenre
          ? `Every ${activeGenre.name.toLowerCase()} title in the library.`
          : currentCategory?.description ||
            "Browse the complete Cinewood library. Filter by genre, category, year and more.");

  const buildHref = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (!forcedType && type) params.set("type", type);
    if (!forcedGenre && genre) params.set("genre", genre);
    if (category) params.set("category", category);
    if (year) params.set("year", year);
    if (upcoming) params.set("upcoming", upcoming);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    return query ? `${actionPath}?${query}` : actionPath;
  };

  const totalPages = Math.max(1, Math.ceil(result.count / result.perPage));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, index) => currentYear - index);

  const pageNumbers: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let index = start; index <= end; index += 1) pageNumbers.push(index);

  return (
    <div className="container-page pb-12 pt-[88px] sm:pb-16 sm:pt-[104px]">
      <div className="mb-6 sm:mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          Cinewood library
        </p>
        <h1 className="hero-title mt-2 text-4xl text-white sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-white/45 sm:mt-3 sm:text-sm">
          {subtitle}
        </p>
      </div>

      <form
        action={actionPath}
        method="get"
        className="card mb-5 p-4 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by title or story…"
              className="input pl-11"
            />
          </div>

          {!forcedType ? (
            <select name="type" defaultValue={type} className="input">
              <option value="">All types</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
            </select>
          ) : null}

          {!forcedGenre ? (
            <select name="genre" defaultValue={genre} className="input">
              <option value="">All genres</option>
              {genres.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : null}

          <select name="category" defaultValue={category} className="input">
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select name="year" defaultValue={year} className="input">
            <option value="">Any year</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select name="upcoming" defaultValue={upcoming} className="input">
            <option value="">All releases</option>
            <option value="1">Upcoming only</option>
          </select>

          <select name="sort" defaultValue={sort} className="input">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating">Highest rated</option>
            <option value="title">Title A–Z</option>
          </select>

          <div className="flex items-center gap-2">
            <button type="submit" className="btn-gold flex-1">
              <SlidersHorizontal size={15} /> Apply
            </button>
            <Link href={actionPath} className="btn-ghost">
              Reset
            </Link>
          </div>
        </div>
      </form>

      {!forcedGenre ? (
        <div className="hide-scrollbar -mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-8 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <span className="inline-flex shrink-0 items-center gap-1.5 pr-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
            <Filter size={12} /> Quick genre
          </span>
          <Link
            href={buildHref({ genre: null, page: null })}
            className={`badge shrink-0 transition ${
              !genre ? "border-gold/40 text-gold" : "text-white/55 hover:text-gold"
            }`}
          >
            All
          </Link>
          {genres.slice(0, 16).map((item) => (
            <Link
              key={item.id}
              href={buildHref({ genre: item.slug, page: null })}
              className={`badge shrink-0 transition ${
                genre === item.slug
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "text-white/55 hover:border-white/20 hover:text-gold"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <p className="text-sm text-white/45">
          <span className="font-bold text-white">{result.count}</span>{" "}
          {result.count === 1 ? "title" : "titles"} found
        </p>
        <p className="text-xs text-white/30">
          Page {result.page} of {totalPages}
        </p>
      </div>

      {result.movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {result.movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-white/30">
            <Search size={24} />
          </span>
          <p className="mt-4 text-lg font-bold text-white/75">No titles found</p>
          <p className="mt-1 max-w-sm text-sm text-white/40">
            Try a different search, genre or year — or reset the filters.
          </p>
          <Link href={actionPath} className="btn-ghost mt-5">
            Clear filters
          </Link>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={buildHref({ page: String(page - 1) })} className="btn-ghost">
              Previous
            </Link>
          ) : null}
          {pageNumbers.map((number) => (
            <Link
              key={number}
              href={buildHref({ page: number === 1 ? null : String(number) })}
              className={
                number === page
                  ? "btn-gold !px-4"
                  : "btn-ghost !px-4"
              }
            >
              {number}
            </Link>
          ))}
          {page < totalPages ? (
            <Link href={buildHref({ page: String(page + 1) })} className="btn-ghost">
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
