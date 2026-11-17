import Link from "next/link";
import { Play, Star } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import type { Movie } from "@/lib/types";
import {
  cn,
  formatRating,
  mediaLabel,
  yearOf,
} from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  rank?: number;
  className?: string;
}

export function MovieCard({ movie, rank, className }: MovieCardProps) {
  return (
    <Link
      href={`/watch/${movie.slug}`}
      className={cn("group block", className)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] transition duration-300 group-hover:-translate-y-1.5 group-hover:border-gold/30 group-hover:shadow-[0_28px_70px_-28px_rgba(242,200,107,0.25)]">
        <div className="relative aspect-[2/3] overflow-hidden">
          <MediaImage
            src={movie.poster_url}
            alt={movie.title}
            title={movie.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent opacity-80" />

          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[11px] font-bold text-gold backdrop-blur">
            <Star size={11} fill="currentColor" />
            {movie.vote_average ? formatRating(movie.vote_average) : "N/A"}
          </div>

          <div className="absolute right-3 top-3">
            <span className="rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60 backdrop-blur">
              {mediaLabel(movie.type)}
            </span>
          </div>

          <div className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-black shadow-[0_10px_40px_-8px_rgba(242,200,107,0.9)] transition group-hover:scale-110">
              <Play size={22} fill="currentColor" className="ml-0.5" />
            </span>
          </div>

          {rank ? (
            <div className="absolute bottom-1 left-2 select-none">
              <span
                className="display text-[64px] leading-none text-white/90"
                style={{
                  WebkitTextStroke: "2px rgba(255,255,255,0.55)",
                  color: "rgba(6,7,11,0.55)",
                }}
              >
                {rank}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 px-0.5">
        <h3 className="truncate text-[15px] font-bold text-white/90 transition group-hover:text-gold">
          {movie.title}
        </h3>
        <p className="mt-1 flex items-center gap-2 text-xs text-white/40">
          <span>{yearOf(movie.release_date) || "—"}</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>{mediaLabel(movie.type)}</span>
        </p>
      </div>
    </Link>
  );
}
