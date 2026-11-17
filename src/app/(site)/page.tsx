import Link from "next/link";
import { ArrowRight, Clapperboard } from "lucide-react";
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
