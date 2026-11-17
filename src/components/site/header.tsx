"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, Shield, X } from "lucide-react";
import { BrandLogo } from "@/components/site/brand-logo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  siteName: string;
  logoText: string;
  genres: { name: string; slug: string }[];
}

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
];

export function Header({ siteName, logoText, genres }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition duration-300",
        scrolled || searchOpen
          ? "border-b border-white/10 bg-ink/85 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-black/60 to-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center gap-3 sm:h-[72px] sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <BrandLogo
            label={logoText || siteName}
            className="h-9 transition hover:brightness-95 sm:h-10"
            priority
          />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
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
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="group relative">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition",
                pathname.startsWith("/genre")
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white",
              )}
            >
              Genres
              <ChevronDown size={14} />
            </button>
            <div className="invisible absolute left-0 top-full w-[440px] pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-panel/95 p-3 shadow-2xl backdrop-blur-xl">
                {genres.slice(0, 18).map((genre) => (
                  <Link
                    key={genre.slug}
                    href={`/genre/${genre.slug}`}
                    className="rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-gold"
                  >
                    {genre.name}
                  </Link>
                ))}
                <Link
                  href="/genres"
                  className="col-span-2 mt-1 rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-gold transition hover:bg-white/5"
                >
                  All genres
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <form action="/movies" method="get" className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="search"
              name="q"
              placeholder="Search films, series…"
              className="h-10 w-[210px] rounded-full border border-white/10 bg-white/[0.05] pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:w-[270px] focus:border-gold/50 focus:bg-white/[0.08]"
            />
          </form>
          <Link
            href="/admin"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-gold/40 hover:text-gold"
            aria-label="Admin panel"
            title="Admin panel"
          >
            <Shield size={16} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen((value) => !value)}
          className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {searchOpen && (
        <div className="container-page pb-4 md:hidden">
          <form action="/movies" method="get" className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="search"
              name="q"
              autoFocus
              placeholder="Search films, series…"
              className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-gold/50"
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-ink-soft p-5">
            <div className="mb-6 flex items-center justify-between gap-3">
              <BrandLogo label={logoText || siteName} className="h-10" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <form action="/movies" method="get" className="relative mb-6">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="search"
                name="q"
                placeholder="Search films, series…"
                className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm outline-none focus:border-gold/50"
              />
            </form>

            <nav className="flex flex-col gap-1">
              {[...links, { href: "/genres", label: "Genres" }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-lg font-semibold text-white/80 transition hover:bg-white/5 hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                Browse genres
              </p>
              <div className="flex flex-wrap gap-2">
                {genres.slice(0, 14).map((genre) => (
                  <Link
                    key={genre.slug}
                    href={`/genre/${genre.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="badge text-white/70 hover:text-gold"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/70"
            >
              <Shield size={15} /> Admin panel
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
