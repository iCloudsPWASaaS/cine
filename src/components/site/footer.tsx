import Link from "next/link";
import { Play } from "lucide-react";
import type { Genre, SiteSettings } from "@/lib/types";

interface FooterProps {
  settings: SiteSettings;
  genres: Genre[];
}

const columns = [
  {
    title: "Browse",
    links: [
      { label: "Movies", href: "/movies" },
      { label: "TV Series", href: "/series" },
      { label: "Trending", href: "/trending" },
      { label: "Top Rated", href: "/top-rated" },
    ],
  },
  {
    title: "Movies",
    links: [
      { label: "Popular", href: "/movies" },
      { label: "Now Playing", href: "/now-playing" },
      { label: "Upcoming", href: "/upcoming" },
      { label: "New Releases", href: "/new-releases" },
    ],
  },
  {
    title: "TV Series",
    links: [
      { label: "Popular", href: "/series" },
      { label: "Top Rated", href: "/top-rated?type=series" },
      { label: "Airing Today", href: "/airing-today" },
      { label: "Networks", href: "/networks" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Genres", href: "/genres" },
      { label: "Countries", href: "/countries" },
      { label: "Collections", href: "/collections" },
      { label: "My List", href: "/watchlist" },
    ],
  },
];

export function Footer({ settings, genres }: FooterProps) {
  return (
    <footer className="border-t border-white/[0.06] bg-[#103242]">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-[320px]">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand">
                <Play size={16} fill="currentColor" className="ml-0.5 text-white" />
              </span>
              <span className="text-lg font-bold text-white">
                {settings.logo_text || settings.name}
              </span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-site-dim">
              {settings.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.slice(0, 8).map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
                  className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-site-muted transition hover:bg-brand hover:text-white"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-white">
                {column.title}
              </h3>
              <div className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="text-xs text-site-dim transition hover:pl-1 hover:text-brand"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] text-site-dim">
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
          <p className="text-[11px] text-site-dim">
            Cinewood does not store video files on its servers.
          </p>
        </div>
      </div>
    </footer>
  );
}
