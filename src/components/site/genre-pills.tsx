import Link from "next/link";
import { Hash } from "lucide-react";
import type { Genre } from "@/lib/types";

export function GenrePills({ genres }: { genres: Genre[] }) {
  if (genres.length === 0) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">
            Pick a mood
          </p>
          <h2 className="display mt-1 text-3xl tracking-[0.04em]">
            Browse by genre
          </h2>
        </div>
        <Link
          href="/genres"
          className="text-xs font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-gold"
        >
          All genres
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {genres.slice(0, 20).map((genre) => (
          <Link
            key={genre.id}
            href={`/genre/${genre.slug}`}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3.5 py-2 text-xs font-semibold text-white/65 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
          >
            <Hash size={12} className="text-white/30 group-hover:text-gold" />
            {genre.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
