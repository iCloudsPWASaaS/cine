import Link from "next/link";
import { Clapperboard, Shield } from "lucide-react";
import type { Genre, SiteSettings } from "@/lib/types";

interface FooterProps {
  settings: SiteSettings;
  genres: Genre[];
}

export function Footer({ settings, genres }: FooterProps) {
  return (
    <footer className="mt-24 border-t border-white/10 bg-black/30">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-black">
              <Clapperboard size={19} strokeWidth={2.4} />
            </span>
            <span className="display text-[26px] tracking-[0.08em]">
              {settings.logo_text || settings.name.toUpperCase()}
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            {settings.description}
          </p>
          <p className="mt-5 max-w-sm text-xs leading-relaxed text-white/35">
            Cinewood does not host video files. Playback comes from sources
            configured by the administrator, including officially licensed
            embeds and open-licence films. Demo titles are Blender Foundation
            open movies licensed under CC BY 3.0.
          </p>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
            Browse
          </p>
          <div className="flex flex-col gap-2.5 text-sm text-white/60">
            <Link className="transition hover:text-gold" href="/movies">
              All movies
            </Link>
            <Link className="transition hover:text-gold" href="/series">
              Series
            </Link>
            <Link className="transition hover:text-gold" href="/genres">
              Genres
            </Link>
            <Link className="transition hover:text-gold" href="/movies?sort=rating">
              Top rated
            </Link>
            <Link
              className="mt-2 inline-flex items-center gap-2 text-white/40 transition hover:text-gold"
              href="/admin"
            >
              <Shield size={14} /> Admin panel
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
            Popular genres
          </p>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 12).map((genre) => (
              <Link
                key={genre.id}
                href={`/genre/${genre.slug}`}
                className="badge text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
          <p>{settings.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
