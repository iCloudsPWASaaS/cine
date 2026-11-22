import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { MovieCard } from "@/components/site/movie-card";
import {
  browseMovies,
  getCategories,
  getGenres,
  getMovieCountries,
} from "@/lib/queries";

type SearchParams = Record<string, string | string[] | undefined>;

interface BrowseViewProps {
  searchParams: SearchParams;
  forcedType?: "movie" | "series";
  forcedGenre?: string;
  forcedYear?: string;
  forcedTrending?: boolean;
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
  forcedYear,
  forcedTrending,
  actionPath = "/movies",
  heading,
  description,
}: BrowseViewProps) {
  const q = param(searchParams.q).trim();
  const type = forcedType || param(searchParams.type);
  const genre = forcedGenre || param(searchParams.genre);
  const category = param(searchParams.category);
  const year = forcedYear || param(searchParams.year);
  const country = param(searchParams.country);
  const upcoming = param(searchParams.upcoming);
  const trending = forcedTrending ? "1" : param(searchParams.trending);
  const sort = param(searchParams.sort) || "newest";
  const page = Math.max(1, Number(param(searchParams.page)) || 1);

  const [result, genres, categories, countries] = await Promise.all([
    browseMovies({
      q,
      type,
      genre,
      category,
      year,
      country,
      upcoming,
      trending: trending || undefined,
      sort,
      page,
    }),
    getGenres(),
    getCategories(),
    getMovieCountries(),
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
      : trending === "1"
        ? "Trending"
        : activeGenre?.name ||
          (country
            ? `${country} titles`
            : year
              ? `${year} Movies`
              : currentCategory?.name ||
                (type === "series"
                  ? "Series"
                  : type === "movie"
                    ? "Movies"
                    : "All titles")));

  const subtitle =
    description ||
    (upcoming === "1"
      ? "Titles marked as coming soon on Cinewood."
      : trending === "1"
        ? "The titles everyone is watching right now."
        : country
        ? `Titles produced in ${country}.`
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
    if (country) params.set("country", country);
    if (upcoming) params.set("upcoming", upcoming);
    if (!forcedTrending && trending) params.set("trending", trending);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    return query ? `${actionPath}?${query}` : actionPath;
  };

  const activeFilters: { key: string; label: string; clearHref: string }[] = [];
  if (q) {
    activeFilters.push({
      key: "q",
      label: `Search: ${q}`,
      clearHref: buildHref({ q: null, page: null }),
    });
  }
  if (!forcedType && type) {
    activeFilters.push({
      key: "type",
      label: type === "series" ? "TV Shows" : "Movies",
      clearHref: buildHref({ type: null, page: null }),
    });
  }
  if (!forcedGenre && activeGenre) {
    activeFilters.push({
      key: "genre",
      label: activeGenre.name,
      clearHref: buildHref({ genre: null, page: null }),
    });
  }
  if (category && currentCategory) {
    activeFilters.push({
      key: "category",
      label: currentCategory.name,
      clearHref: buildHref({ category: null, page: null }),
    });
  }
  if (year) {
    activeFilters.push({
      key: "year",
      label: year,
      clearHref: buildHref({ year: null, page: null }),
    });
  }
  if (country) {
    activeFilters.push({
      key: "country",
      label: country,
      clearHref: buildHref({ country: null, page: null }),
    });
  }
  if (upcoming === "1") {
    activeFilters.push({
      key: "upcoming",
      label: "Upcoming only",
      clearHref: buildHref({ upcoming: null, page: null }),
    });
  }
  if (!forcedTrending && trending === "1") {
    activeFilters.push({
      key: "trending",
      label: "Trending",
      clearHref: buildHref({ trending: null, page: null }),
    });
  }
  if (sort === "rating") {
    activeFilters.push({
      key: "sort",
      label: "Top rated",
      clearHref: buildHref({ sort: null, page: null }),
    });
  }

  const quickTabs = [
    {
      label: "All",
      href: buildHref({
        q: null,
        type: null,
        genre: null,
        category: null,
        year: null,
        country: null,
        upcoming: null,
        trending: null,
        sort: null,
        page: null,
      }),
      active:
        !q &&
        !genre &&
        !category &&
        !year &&
        !country &&
        !upcoming &&
        !trending &&
        sort === "newest",
    },
    {
      label: "Trending",
      href: buildHref({ trending: "1", page: null }),
      active: trending === "1",
    },
    {
      label: "Top Rated",
      href: buildHref({ sort: "rating", page: null }),
      active: sort === "rating",
    },
    {
      label: "Upcoming",
      href: buildHref({ upcoming: "1", page: null }),
      active: upcoming === "1",
    },
  ];

  const totalPages = Math.max(1, Math.ceil(result.count / result.perPage));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, index) => currentYear - index);

  const pageNumbers: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let index = start; index <= end; index += 1) pageNumbers.push(index);

  return (
    <div className="container-page pb-12 pt-20 sm:pb-16 sm:pt-24">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-site-dim sm:mt-3 sm:text-sm">
          {subtitle}
        </p>
      </div>

      <div className="hide-scrollbar -mx-4 mb-5 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {quickTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`shrink-0 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
              tab.active
                ? "border-brand/40 bg-brand/15 text-white"
                : "border-white/[0.06] bg-white/[0.04] text-site-muted hover:border-white/20 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form
        action={actionPath}
        method="get"
        className="mb-5 rounded-2xl border border-white/[0.06] bg-site-panel/80 p-4 backdrop-blur sm:p-5"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]">
          <div className="relative lg:col-span-2">
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

          {!forcedYear ? (
            <select name="year" defaultValue={year} className="input">
              <option value="">Any year</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : null}

          <select name="sort" defaultValue={sort} className="input">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating">Highest rated</option>
            <option value="title">Title A–Z</option>
          </select>

          <button type="submit" className="flix-btn whitespace-nowrap">
            <SlidersHorizontal size={15} /> Apply
          </button>
        </div>

        <details className="group mt-4 border-t border-white/[0.06] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-site-muted transition hover:text-white">
            More filters
            <ChevronDown
              size={14}
              className="transition group-open:rotate-180"
            />
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {!forcedType ? (
              <select name="type" defaultValue={type} className="input">
                <option value="">All types</option>
                <option value="movie">Movies</option>
                <option value="series">TV Shows</option>
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

            <select name="country" defaultValue={country} className="input">
              <option value="">All countries</option>
              {countries.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select name="upcoming" defaultValue={upcoming} className="input">
              <option value="">All releases</option>
              <option value="1">Upcoming only</option>
            </select>
          </div>
        </details>
      </form>

      {!forcedGenre ? (
        <div className="hide-scrollbar -mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-8 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Link
            href={buildHref({ genre: null, page: null })}
            className={`badge shrink-0 transition ${
              !genre ? "border-brand/40 text-brand" : "text-white/55 hover:text-brand"
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
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "text-white/55 hover:border-white/20 hover:text-brand"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      ) : null}

      {activeFilters.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
            Active filters
          </span>
          {activeFilters.map((filter) => (
            <Link
              key={filter.key}
              href={filter.clearHref}
              className="badge border-brand/40 bg-brand/10 text-brand transition hover:bg-brand/20"
              title={`Remove ${filter.label} filter`}
            >
              {filter.label}
              <X size={11} />
            </Link>
          ))}
          <Link
            href={actionPath}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/40 transition hover:text-white"
          >
            <RotateCcw size={11} /> Clear all
          </Link>
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
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
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
          <Link href={actionPath} className="flix-btn flix-btn-secondary mt-5">
            Clear filters
          </Link>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={buildHref({ page: String(page - 1) })} className="flix-btn flix-btn-secondary">
              Previous
            </Link>
          ) : null}
          {pageNumbers.map((number) => (
            <Link
              key={number}
              href={buildHref({ page: number === 1 ? null : String(number) })}
              className={number === page ? "flix-btn" : "flix-btn flix-btn-secondary"}
            >
              {number}
            </Link>
          ))}
          {page < totalPages ? (
            <Link href={buildHref({ page: String(page + 1) })} className="flix-btn flix-btn-secondary">
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
