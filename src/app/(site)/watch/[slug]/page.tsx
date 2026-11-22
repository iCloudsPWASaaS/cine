import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clapperboard,
  Clock3,
  Eye,
  Film,
  Globe2,
  Languages,
  Play,
  ShieldCheck,
  Star,
  Tv,
} from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import { MovieRow } from "@/components/site/movie-row";
import { Player } from "@/components/site/player";
import { WatchlistButton } from "@/components/site/watchlist-button";
import {
  getMovieBySlug,
  getRelatedMovies,
  getSiteSettings,
} from "@/lib/queries";
import {
  formatCount,
  formatRating,
  formatRuntime,
  mediaLabel,
  yearOf,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Not found" };

  return {
    title: movie.title,
    description:
      movie.overview?.slice(0, 155) ||
      `Watch ${movie.title} on Cinewood.`,
    openGraph: {
      title: movie.title,
      description: movie.overview?.slice(0, 155) || undefined,
      images: movie.backdrop_url || movie.poster_url || undefined,
    },
  };
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-xs text-white/40">
        <Icon size={13} /> {label}
      </span>
      <span className="text-right text-xs font-semibold text-white/75">
        {value}
      </span>
    </div>
  );
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();

  const [related, settings] = await Promise.all([
    getRelatedMovies(movie),
    getSiteSettings(),
  ]);

  const cast = movie.metadata?.cast || [];
  const rating = formatRating(movie.vote_average);

  return (
    <div className="pb-12 sm:pb-16">
      <div className="relative h-[50vh] min-h-[340px] w-full sm:h-[64vh] sm:min-h-[540px]">
        <MediaImage
          src={movie.backdrop_url || movie.poster_url}
          alt={movie.title}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-site-bg via-site-bg/60 to-site-bg/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-site-bg/95 via-site-bg/35 to-transparent" />
      </div>

      <div className="container-page relative z-10 -mt-[200px] sm:-mt-[290px]">
        <nav className="mb-5 flex items-center gap-2 text-xs text-white/40 sm:mb-7">
          <Link href="/" className="transition hover:text-brand">
            Home
          </Link>
          <span>/</span>
          <Link
            href={movie.type === "series" ? "/tv" : "/movies"}
            className="transition hover:text-brand"
          >
            {movie.type === "series" ? "TV Shows" : "Movies"}
          </Link>
          <span>/</span>
          <span className="max-w-[160px] truncate text-white/60 sm:max-w-[220px]">
            {movie.title}
          </span>
        </nav>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-3xl border border-white/15 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)]">
              <MediaImage
                src={movie.poster_url}
                alt={movie.title}
                title={movie.title}
                className="aspect-[2/3] w-full object-cover"
              />
            </div>
          </div>

          <div className="max-w-3xl animate-fade-up">
            <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2">
              <span className="badge border-brand/30 bg-brand/10 text-brand">
                {mediaLabel(movie.type)}
              </span>
              {movie.metadata?.demo ? (
                <span className="badge text-emerald-300/80">
                  Open licence demo
                </span>
              ) : null}
            </div>

            <h1 className="hero-title break-words text-4xl text-white sm:text-6xl lg:text-8xl">
              {movie.title}
            </h1>

            {movie.original_title && movie.original_title !== movie.title ? (
              <p className="mt-1 text-xs italic text-white/35 sm:text-sm">
                {movie.original_title}
              </p>
            ) : null}

            {movie.tagline ? (
              <p className="mt-2.5 text-xs font-medium text-violet-300/80 sm:mt-3 sm:text-sm">
                “{movie.tagline}”
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60 sm:mt-5 sm:gap-x-5 sm:text-sm">
              {movie.release_date ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> {yearOf(movie.release_date)}
                </span>
              ) : null}
              {movie.type === "series" && movie.metadata?.seasons ? (
                <span className="inline-flex items-center gap-1.5">
                  <Tv size={14} /> {movie.metadata.seasons} season
                  {movie.metadata.seasons === 1 ? "" : "s"}
                </span>
              ) : movie.runtime ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={14} /> {formatRuntime(movie.runtime)}
                </span>
              ) : null}
              {rating ? (
                <span className="inline-flex items-center gap-1.5 text-brand">
                  <Star size={14} fill="currentColor" /> {rating} / 10
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Eye size={14} /> {formatCount(movie.view_count)} views
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
              {movie.genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
                  className="badge text-white/60 transition hover:border-brand/40 hover:text-brand"
                >
                  {genre.name}
                </Link>
              ))}
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:mt-5 sm:text-[15px]">
              {movie.overview}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-7 sm:gap-3">
              <Link href="#player" className="flix-btn !px-6 !py-3">
                <Play size={16} fill="currentColor" /> Watch Now
              </Link>
              <a href="#about" className="flix-btn flix-btn-secondary !px-6 !py-3">
                <Film size={15} /> More Info
              </a>
              <WatchlistButton
                item={{
                  id: movie.id,
                  slug: movie.slug,
                  title: movie.title,
                  poster_url: movie.poster_url,
                  backdrop_url: movie.backdrop_url,
                  type: movie.type,
                  release_date: movie.release_date,
                }}
                className="!static !h-10 !w-10 !opacity-100 !rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0">
          <div id="player" className="scroll-mt-20 sm:scroll-mt-24">
            <Player
              slug={movie.slug}
              title={movie.title}
              type={movie.type}
              releaseDate={movie.release_date}
              poster={movie.backdrop_url || movie.poster_url}
              sources={movie.sources}
              subtitles={(movie.metadata?.subtitles || []).filter(
                (item) => item.is_active && item.url,
              )}
              autoplay={settings.player.autoplay}
            />
          </div>

          <section id="about" className="card mt-6 scroll-mt-20 p-5 sm:mt-8 sm:p-8">
            <h2 className="display text-2xl tracking-[0.04em] sm:text-3xl">
              About the film
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/60">
              {movie.overview || "No synopsis available."}
            </p>

            {movie.metadata?.director || cast.length > 0 ? (
              <div className="mt-6 grid gap-4 border-t border-white/[0.07] pt-5 text-sm sm:grid-cols-2">
                {movie.metadata?.director ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                      Director
                    </p>
                    <p className="mt-1 font-semibold text-white/80">
                      {movie.metadata.director}
                    </p>
                  </div>
                ) : null}
                {movie.metadata?.production_companies?.length ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                      Production
                    </p>
                    <p className="mt-1 font-semibold text-white/80">
                      {movie.metadata.production_companies.join(", ")}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

          </section>

          {cast.length > 0 ? (
            <section className="mt-8">
              <h2 className="display text-3xl tracking-[0.04em]">Cast</h2>
              <div className="hide-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
                {cast.map((person) => (
                  <div
                    key={person.id}
                    className="w-[105px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-2"
                  >
                    <MediaImage
                      src={
                        person.profile_path
                          ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                          : null
                      }
                      alt={person.name}
                      title={person.name}
                      className="aspect-[2/3] w-full rounded-xl object-cover"
                    />
                    <p className="mt-2 truncate text-xs font-bold text-white/80">
                      {person.name}
                    </p>
                    {person.character ? (
                      <p className="mt-0.5 truncate text-[10px] text-white/35">
                        {person.character}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold">
              <Clapperboard size={16} className="text-brand" /> Details
            </h3>
            <div className="mt-3">
              <DetailRow
                icon={Film}
                label="Type"
                value={mediaLabel(movie.type)}
              />
              {movie.release_date ? (
                <DetailRow
                  icon={CalendarDays}
                  label="Release"
                  value={movie.release_date}
                />
              ) : null}
              {movie.runtime ? (
                <DetailRow
                  icon={Clock3}
                  label="Runtime"
                  value={formatRuntime(movie.runtime)}
                />
              ) : null}
              {movie.status ? (
                <DetailRow
                  icon={ShieldCheck}
                  label="Status"
                  value={movie.status}
                />
              ) : null}
              {rating ? (
                <DetailRow
                  icon={Star}
                  label="Rating"
                  value={`${rating} / 10${
                    movie.vote_count
                      ? ` · ${formatCount(movie.vote_count)}`
                      : ""
                  }`}
                />
              ) : null}
              {movie.metadata?.languages?.length ? (
                <DetailRow
                  icon={Languages}
                  label="Language"
                  value={movie.metadata.languages.join(", ")}
                />
              ) : null}
              {movie.metadata?.countries?.length ? (
                <DetailRow
                  icon={Globe2}
                  label="Country"
                  value={movie.metadata.countries.join(", ")}
                />
              ) : null}
              {movie.metadata?.episodes ? (
                <DetailRow
                  icon={Tv}
                  label="Episodes"
                  value={movie.metadata.episodes}
                />
              ) : null}
            </div>
          </div>

          <Link
            href={movie.type === "series" ? "/tv" : "/movies"}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/40 transition hover:text-brand"
          >
            <ArrowLeft size={14} /> Back to{" "}
            {movie.type === "series" ? "TV Shows" : "movies"}
          </Link>
        </aside>
      </div>

      <div className="container-page mt-16">
        <MovieRow
          title="You may also like"
          eyebrow="More from Cinewood"
          movies={related}
        />
      </div>
    </div>
  );
}
