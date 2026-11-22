import Link from "next/link";
import { Hash } from "lucide-react";
import type { Genre } from "@/lib/types";

export function GenrePills({ genres }: { genres: Genre[] }) {
  if (genres.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-site-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300/80">
            Pick a mood
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Browse by genre
          </h2>
        </div>
        <Link
          href="/genres"
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-site-muted transition hover:text-brand"
        >
          All genres
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {genres.slice(0, 20).map((genre) => (
          <Link
            key={genre.id}
            href={`/genre/${genre.slug}`}
            className="flix-pill group inline-flex items-center gap-1.5 transition hover:text-white"
          >
            <Hash size={12} className="text-white/30 group-hover:text-brand" />
            {genre.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
