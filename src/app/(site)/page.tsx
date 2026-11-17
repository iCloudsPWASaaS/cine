import Link from "next/link";
import { ArrowRight, Clapperboard, Sparkles } from "lucide-react";
import { LatestCarousel } from "@/components/site/latest-carousel";
import { MovieRow } from "@/components/site/movie-row";
import {
  getCategoriesWithMovies,
  getFeatured,
  getLatest,
  getTopRated,
  getTrending,
  getUpcoming,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, trending, upcoming, latest, topRated, categoryRows] =
    await Promise.all([
      getFeatured(5),
      getTrending(12),
      getUpcoming(12),
      getLatest(12),
      getTopRated(12),
      getCategoriesWithMovies(12),
    ]);

  const totalTitles = Math.max(latest.length, topRated.length);
  const heroMovies = latest.length > 0 ? latest : featured;

  if (featured.length === 0 && latest.length === 0) {
    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center pt-20 text-center sm:pt-24">
        <span className="grid h-16 w-16 place-items-center rounded-3xl border border-gold/30 bg-gold/10 text-gold sm:h-20 sm:w-20">
          <Clapperboard size={32} />
        </span>
        <h1 className="hero-title mt-6 text-4xl sm:text-6xl">
          Your cinema is empty
        </h1>
        <p className="mt-3 max-w-md text-sm text-white/50 sm:text-base">
          Sign in to the admin panel and import a title from TMDB to get started.
        </p>
        <Link href="/admin" className="btn-gold mt-7">
          Open admin panel <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <LatestCarousel movies={heroMovies} />

      <div className="container-page mt-2 space-y-10 pb-10 sm:mt-4 sm:space-y-16">
        <MovieRow
          title="Trending Now"
          eyebrow="What everyone is watching"
          movies={trending.length > 0 ? trending : latest}
          href="/movies?sort=newest"
          ranked
        />

        <MovieRow
          title="Upcoming"
          eyebrow="Coming soon"
          movies={upcoming}
          href="/movies?upcoming=1"
        />

        <MovieRow
          title="Fresh on Cinewood"
          eyebrow="New releases"
          movies={latest}
          href="/movies?sort=newest"
        />

        <section className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.14] via-white/[0.03] to-transparent p-5 sm:rounded-3xl sm:p-10">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold sm:text-[11px]">
                <Sparkles size={14} /> The Cinewood promise
              </p>
              <h2 className="display mt-2.5 text-3xl leading-none sm:mt-3 sm:text-5xl">
                One home. Every story.
              </h2>
              <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-white/55 sm:mt-3 sm:text-sm">
                Rich metadata, beautiful presentation and a player built for
                real viewing. Import a title by name and Cinewood organises the
                details, artwork, genres and available legal sources.
              </p>
            </div>
            <Link
              href="/movies"
              className="btn-gold w-full shrink-0 justify-center !px-6 !py-3 sm:w-auto sm:!px-7"
            >
              Explore the library <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {categoryRows.map(({ category, movies }) => (
          <MovieRow
            key={category.id}
            title={category.name}
            eyebrow="Collection"
            movies={movies}
            href={`/movies?category=${category.slug}`}
          />
        ))}

        <MovieRow
          title="Top Rated"
          eyebrow="Critically loved"
          movies={topRated}
          href="/movies?sort=rating"
        />

        {totalTitles === 0 ? (
          <div className="card p-10 text-center text-white/50">
            No titles published yet.
          </div>
        ) : null}
      </div>
    </>
  );
}
