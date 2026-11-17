import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Layers,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { GenrePills } from "@/components/site/genre-pills";
import { LatestCarousel } from "@/components/site/latest-carousel";
import { MovieRow } from "@/components/site/movie-row";
import {
  getCategoriesWithMovies,
  getFeatured,
  getGenres,
  getLatest,
  getTopRated,
  getTrending,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, trending, latest, topRated, categoryRows, genres] =
    await Promise.all([
      getFeatured(5),
      getTrending(12),
      getLatest(12),
      getTopRated(12),
      getCategoriesWithMovies(12),
      getGenres(),
    ]);

  const totalTitles = Math.max(latest.length, topRated.length);
  const heroMovies = latest.length > 0 ? latest : featured;

  if (featured.length === 0 && latest.length === 0) {
    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center pt-24 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl border border-gold/30 bg-gold/10 text-gold">
          <Clapperboard size={34} />
        </span>
        <h1 className="hero-title mt-6 text-6xl">Your cinema is empty</h1>
        <p className="mt-3 max-w-md text-white/50">
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

      <div className="container-page relative z-20 -mt-4 pb-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {[
            {
              icon: Layers,
              title: "Curated collections",
              text: "Categories and genres, organised.",
            },
            {
              icon: MonitorPlay,
              title: "Adaptive player",
              text: "HLS, MP4, embeds and trailers.",
            },
            {
              icon: ShieldCheck,
              title: "Legal sources only",
              text: "Open films and official providers.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 bg-[#0b0d14] px-5 py-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-gold">
                <item.icon size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-white/85">{item.title}</p>
                <p className="text-xs text-white/40">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page space-y-16 pb-10">
        <GenrePills genres={genres} />

        <MovieRow
          title="Trending Now"
          eyebrow="What everyone is watching"
          movies={trending.length > 0 ? trending : latest}
          href="/movies?sort=newest"
          ranked
        />

        <MovieRow
          title="Fresh on Cinewood"
          eyebrow="New releases"
          movies={latest}
          href="/movies?sort=newest"
        />

        <section className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/[0.14] via-white/[0.03] to-transparent p-7 sm:p-10">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                <Sparkles size={14} /> The Cinewood promise
              </p>
              <h2 className="display mt-3 text-4xl leading-none sm:text-5xl">
                One home. Every story.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                Rich metadata, beautiful presentation and a player built for
                real viewing. Import a title by name and Cinewood organises the
                details, artwork, genres and available legal sources.
              </p>
            </div>
            <Link href="/movies" className="btn-gold shrink-0 !px-7 !py-3">
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

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Star,
              title: "Ratings that matter",
              text: "Every title carries audience scores, runtime and release data.",
            },
            {
              icon: Layers,
              title: "Organised by design",
              text: "Categories, genres and collections keep the library effortless.",
            },
            {
              icon: MonitorPlay,
              title: "Made for playback",
              text: "Switch between sources, qualities and languages in one click.",
            },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <item.icon size={22} className="text-gold" />
              <h3 className="mt-4 text-lg font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                {item.text}
              </p>
            </div>
          ))}
        </section>

        {totalTitles === 0 ? (
          <div className="card p-10 text-center text-white/50">
            No titles published yet.
          </div>
        ) : null}
      </div>
    </>
  );
}
