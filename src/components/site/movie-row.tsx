import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { MovieCard } from "@/components/site/movie-card";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  href?: string;
  ranked?: boolean;
  eyebrow?: string;
  icon?: LucideIcon;
  accent?: "violet" | "orange" | "blue" | "green" | "pink";
}

const accents = {
  violet: {
    box: "bg-violet-500/15 border-violet-500/20 text-violet-300",
    gradient: "bg-gradient-to-r from-violet-400 to-fuchsia-400",
  },
  orange: {
    box: "bg-orange-500/15 border-orange-500/20 text-orange-300",
    gradient: "bg-gradient-to-r from-orange-400 to-amber-400",
  },
  blue: {
    box: "bg-sky-500/15 border-sky-500/20 text-sky-300",
    gradient: "bg-gradient-to-r from-sky-400 to-blue-400",
  },
  green: {
    box: "bg-emerald-500/15 border-emerald-500/20 text-emerald-300",
    gradient: "bg-gradient-to-r from-emerald-400 to-teal-400",
  },
  pink: {
    box: "bg-pink-500/15 border-pink-500/20 text-pink-300",
    gradient: "bg-gradient-to-r from-pink-400 to-rose-400",
  },
};

export function MovieRow({
  title,
  movies,
  href,
  ranked,
  eyebrow,
  icon: Icon,
  accent = "violet",
}: MovieRowProps) {
  if (movies.length === 0) return null;

  const palette = accents[accent];

  return (
    <section className="py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span className={cn("flix-icon-box", palette.box)}>
              <Icon size={20} />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-site-dim">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="truncate text-xl font-bold text-white sm:text-2xl">
              {title}
            </h2>
          </div>
          <span
            className={cn(
              "hidden h-0.5 w-10 rounded-full sm:block",
              palette.gradient,
            )}
          />
        </div>
        {href ? (
          <Link href={href} className="flix-btn flix-btn-secondary flix-btn-sm shrink-0">
            View All
            <ArrowRight size={13} />
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {movies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            rank={ranked ? index + 1 : undefined}
          />
        ))}
      </div>
    </section>
  );
}
