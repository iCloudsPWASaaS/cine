"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Film,
  Globe2,
  Heart,
  Layers3,
  Menu,
  Play,
  Search,
  Shield,
  Shuffle,
  Star,
  TrendingUp,
  Tv,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/site/brand-logo";
import { SearchModal } from "@/components/site/search-modal";
import {
  readWatchlist,
  WATCHLIST_EVENT,
  type CatalogItem,
} from "@/lib/local-library";
import { cn } from "@/lib/utils";

interface HeaderProps {
  siteName: string;
  logoText: string;
  genres: { name: string; slug: string }[];
  years: number[];
  countries: string[];
  catalog: CatalogItem[];
}

interface DropdownItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV Shows" },
  { href: "/new-releases", label: "New" },
];

const browseItems: DropdownItem[] = [
  { label: "Trending", href: "/trending", icon: TrendingUp },
  { label: "Genres", href: "/genres", icon: Layers3 },
  { label: "Top Rated", href: "/top-rated", icon: Star },
  { label: "Collections", href: "/collections", icon: Film },
  { label: "Countries", href: "/country", icon: Globe2 },
  { label: "Networks", href: "/networks", icon: Tv },
  { label: "Now Playing", href: "/now-playing", icon: Play },
  { label: "Upcoming", href: "/upcoming", icon: CalendarDays },
  { label: "Airing Today", href: "/airing-today", icon: Clock3 },
];

function BrowseDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = browseItems.some((item) => pathname === item.href);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-[0.03em] text-site-muted transition hover:text-white",
          active && "text-white",
        )}
        aria-expanded={open}
      >
        Browse
        <ChevronDown
          size={12}
          className={cn("transition", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-[420px] -translate-x-1/2 rounded-xl border border-white/10 bg-site-panel/98 p-3 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-1">
            {browseItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-site-muted transition hover:bg-white/10 hover:text-white"
              >
                <item.icon size={16} className="opacity-70" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Header({
  siteName,
  logoText,
  genres,
  years,
  countries,
  catalog,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const sync = () => setSavedCount(readWatchlist().length);
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const pickRandom = () => {
    if (catalog.length === 0) return;
    const movie = catalog[Math.floor(Math.random() * catalog.length)];
    router.push(`/watch/${movie.slug}`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#141432]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label={siteName}
          >
            <BrandLogo
              label={logoText || siteName}
              className="h-8 w-auto sm:h-9"
              priority
            />
          </Link>

          <nav className="hidden items-center md:flex">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-2 text-xs font-semibold uppercase tracking-[0.03em] text-site-muted transition hover:text-white",
                    active && "text-white",
                  )}
                >
                  {link.label}
                  {active ? (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />
                  ) : null}
                </Link>
              );
            })}
            <BrowseDropdown pathname={pathname} />
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 text-site-muted transition hover:border-white/20 hover:bg-white/[0.14] hover:text-white"
              aria-label="Search movies and TV shows"
            >
              <Search size={16} />
              <span className="hidden text-xs opacity-70 lg:inline">
                Enter keywords...
              </span>
            </button>
            <button
              type="button"
              onClick={pickRandom}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-site-muted transition hover:border-white/20 hover:bg-white/[0.14] hover:text-white"
              aria-label="Random pick"
              title="Random Pick"
            >
              <Shuffle size={15} />
            </button>
            <Link
              href="/watchlist"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-site-muted transition hover:border-white/20 hover:bg-white/[0.14] hover:text-white"
              aria-label="My List"
              title="My List"
            >
              <Heart size={15} />
              {savedCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                  {savedCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/admin"
              className="hidden h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-site-muted transition hover:border-white/20 hover:bg-white/[0.14] hover:text-white sm:grid"
              aria-label="Admin panel"
              title="Admin panel"
            >
              <Shield size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-white md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-white/[0.06] bg-[#141432]/98 px-4 py-3 md:hidden">
            <nav className="grid grid-cols-2 gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.03em] text-site-muted transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-site-dim">
              Browse
            </p>
            <div className="grid grid-cols-2 gap-1">
              {browseItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-site-muted transition hover:bg-white/10 hover:text-white"
                >
                  <item.icon size={14} className="opacity-70" />
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-site-dim">
              Genres
            </p>
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {genres.slice(0, 14).map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/genre/${genre.slug}`}
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-site-muted"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-site-dim">
              Years
            </p>
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {years.slice(0, 10).map((year) => (
                <Link
                  key={year}
                  href={`/movies?year=${year}`}
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-site-muted"
                >
                  {year}
                </Link>
              ))}
            </div>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-site-dim">
              Countries
            </p>
            <div className="flex flex-wrap gap-2 px-3 pb-4">
              {countries.slice(0, 10).map((country) => (
                <Link
                  key={country}
                  href={`/movies?country=${encodeURIComponent(country)}`}
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-site-muted"
                >
                  {country}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        catalog={catalog}
      />
    </>
  );
}
