import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MovieCard } from "@/components/site/movie-card";
import type { Movie } from "@/lib/types";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  href?: string;
  ranked?: boolean;
  eyebrow?: string;
}

export function MovieRow({ title, movies, href, ranked, eyebrow }: MovieRowProps) {
  if (movies.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5 sm:gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="display text-2xl tracking-[0.04em] text-white sm:text-4xl">
            {title}
          </h2>
        </div>
        {href ? (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1.5 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-gold"
          >
            View all
            <ArrowRight
              size={14}
              className="transition group-hover:translate-x-1"
            />
          </Link>
        ) : null}
      </div>

      <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:px-0">
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            className="w-[138px] shrink-0 snap-start sm:w-[172px] lg:w-[188px]"
          >
            <MovieCard movie={movie} rank={ranked ? index + 1 : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
}
