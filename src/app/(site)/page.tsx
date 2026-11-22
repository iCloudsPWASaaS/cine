import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  Clock3,
  Film,
  Flame,
  Layers3,
  PlayCircle,
  Star,
  TrendingUp,
  Tv,
} from "lucide-react";
import {
  ContinueWatchingRow,
  WatchlistRow,
} from "@/components/site/local-library";
import { LatestCarousel } from "@/components/site/latest-carousel";
import { MovieRow } from "@/components/site/movie-row";
import {
  getAiringToday,
  getCategoriesWithMovies,
  getFeatured,
  getLatest,
  getNowPlaying,
  getPopularByType,
  getTopRated,
  getTrending,
  getUpcoming,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    featured,
    trending,
    upcoming,
    latest,
    topRated,
    categoryRows,
    popularMovies,
    popularSeries,
    nowPlaying,
    airingToday,
  ] = await Promise.all([
    getFeatured(6),
    getTrending(12),
    getUpcoming(12),
    getLatest(16),
    getTopRated(12),
    getCategoriesWithMovies(12),
    getPopularByType("movie", 12),
    getPopularByType("series", 12),
    getNowPlaying(12),
    getAiringToday(12),
  ]);

  const heroUsesUpcoming = upcoming.length > 0;
  const heroMovies = heroUsesUpcoming
    ? upcoming
    : featured.length > 0
      ? featured
      : latest;
  const fallback = latest.length > 0 ? latest : featured;

  if (featured.length === 0 && latest.length === 0) {
    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center pt-20 text-center sm:pt-24">
        <span className="flix-icon-box h-16 w-16 text-brand sm:h-20 sm:w-20">
          <Clapperboard size={32} />
        </span>
        <h1 className="mt-6 text-4xl font-bold text-white sm:text-6xl">
          Your cinema is empty
        </h1>
        <p className="mt-3 max-w-md text-sm text-site-muted sm:text-base">
          Sign in to the admin panel and import a title from TMDB to get started.
        </p>
        <Link href="/admin" className="flix-btn mt-7">
          Open admin panel <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <LatestCarousel
        movies={heroMovies}
        label={heroUsesUpcoming ? "Coming Soon" : "Featured"}
      />

      <div className="container-page pb-10">
        <MovieRow
          title="Trending This Week"
          eyebrow="What everyone is watching"
          movies={trending.length > 0 ? trending : fallback}
          href="/trending"
          icon={TrendingUp}
          accent="violet"
        />

        <MovieRow
          title="Coming Soon"
          eyebrow="Coming to Cinewood"
          movies={upcoming}
          href="/upcoming"
          icon={CalendarDays}
          accent="orange"
        />

        <ContinueWatchingRow />
        <WatchlistRow />

        <MovieRow
          title="Hot Today"
          eyebrow="Popular right now"
          movies={nowPlaying.length > 0 ? nowPlaying : fallback}
          href="/now-playing"
          icon={Flame}
          accent="orange"
        />

        <MovieRow
          title="Popular Movies"
          eyebrow="Most watched films"
          movies={popularMovies.length > 0 ? popularMovies : fallback}
          href="/movies"
          icon={Film}
          accent="blue"
        />

        <MovieRow
          title="Popular TV Shows"
          eyebrow="Binge-worthy series"
          movies={popularSeries.length > 0 ? popularSeries : fallback}
          href="/tv"
          icon={Tv}
          accent="violet"
        />

        <MovieRow
          title="In Theaters Now"
          eyebrow="Fresh releases"
          movies={nowPlaying.length > 0 ? nowPlaying : fallback}
          href="/now-playing"
          icon={PlayCircle}
          accent="pink"
        />

        <MovieRow
          title="On Air Now"
          eyebrow="TV episodes dropping"
          movies={airingToday.length > 0 ? airingToday : popularSeries}
          href="/airing-today"
          icon={Clock3}
          accent="green"
        />

        <MovieRow
          title="Top Rated"
          eyebrow="Critically loved"
          movies={topRated}
          href="/top-rated"
          icon={Star}
          accent="violet"
          ranked
        />

        {categoryRows.map(({ category, movies }) => (
          <MovieRow
            key={category.id}
            title={category.name}
            eyebrow="Collection"
            movies={movies}
            href={`/movies?category=${category.slug}`}
            icon={Layers3}
            accent="violet"
          />
        ))}
      </div>
    </>
  );
}
