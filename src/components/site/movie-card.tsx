import Link from "next/link";
import { Play } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import { WatchlistButton } from "@/components/site/watchlist-button";
import type { Movie } from "@/lib/types";
import { cn, mediaLabel, yearOf } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  rank?: number;
  className?: string;
  showWatchlist?: boolean;
}

export function MovieCard({
  movie,
  rank,
  className,
  showWatchlist = true,
}: MovieCardProps) {
  return (
    <div className={cn("group relative", className)}>
      <Link href={`/watch/${movie.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-site-card shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_36px_-22px_rgba(108,92,231,0.9)]">
          <MediaImage
            src={movie.poster_url || movie.backdrop_url}
            alt={movie.title}
            title={movie.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute right-2 top-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            HD
          </span>

          <div className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100">
            <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-white/30 bg-brand/90 text-white backdrop-blur transition group-hover:scale-110">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </span>
          </div>

          {rank ? (
            <span
              className="pointer-events-none absolute bottom-1 left-1 select-none font-sans text-[64px] font-black leading-[0.75] text-transparent"
              style={{ WebkitTextStroke: "3px rgba(108,92,231,0.55)" }}
            >
              {rank}
            </span>
          ) : null}
        </div>

        <div className="px-0.5 pt-2">
          <h3 className="truncate text-xs font-medium text-white sm:text-sm">
            {movie.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-site-dim">
            <span>{yearOf(movie.release_date) || "—"}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                movie.type === "series"
                  ? "bg-sky-500/25 text-sky-300"
                  : "bg-violet-500/25 text-violet-300",
              )}
            >
              {movie.type === "series" ? "TV" : mediaLabel(movie.type)}
            </span>
          </div>
        </div>
      </Link>

      {showWatchlist ? (
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
          className="left-2 top-2"
        />
      ) : null}
    </div>
  );
}
