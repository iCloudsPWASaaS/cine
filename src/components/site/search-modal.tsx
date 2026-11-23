"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, Search, Tv, X } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import type { CatalogItem } from "@/lib/local-library";
import { yearOf } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
}

export function SearchModal({ open, onClose, catalog }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<CatalogItem[]>([]);
  const [remoteQuery, setRemoteQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const close = useCallback(() => {
    setQuery("");
    setRemoteResults([]);
    setRemoteQuery("");
    setSearching(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const cleanQuery = query.trim();
  const searchHref = cleanQuery
    ? `/search?q=${encodeURIComponent(cleanQuery)}`
    : null;

  const results = useMemo(() => {
    if (!cleanQuery) return catalog.slice(0, 6);
    return remoteQuery === cleanQuery ? remoteResults : [];
  }, [catalog, cleanQuery, remoteQuery, remoteResults]);

  const isSearching =
    Boolean(cleanQuery) && searching && remoteQuery !== cleanQuery;

  useEffect(() => {
    if (!open || !cleanQuery) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(cleanQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { results?: CatalogItem[] };
        setRemoteResults(Array.isArray(data.results) ? data.results : []);
        setRemoteQuery(cleanQuery);
      } catch {
        if (!controller.signal.aborted) {
          setRemoteResults([]);
          setRemoteQuery(cleanQuery);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cleanQuery, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md"
      onClick={close}
      role="presentation"
    >
      <div
        className="mx-auto mt-24 w-full max-w-[600px] px-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search movies and TV shows"
      >
        <div className="overflow-hidden rounded-xl border border-white/10 bg-site-panel shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
            <Search size={20} className="text-site-dim" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                if (searchHref) {
                  router.push(searchHref);
                  close();
                } else if (results[0]) {
                  router.push(`/watch/${results[0].slug}`);
                  close();
                }
              }}
              placeholder="Enter keywords..."
              className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-site-dim"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close search"
              className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.06] text-site-muted transition hover:bg-white/[0.12] hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {results.length > 0 ? (
              results.map((item) => (
                <Link
                  key={item.id}
                  href={`/watch/${item.slug}`}
                  onClick={close}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.05]"
                >
                  <MediaImage
                    src={item.poster_url}
                    alt={item.title}
                    title={item.title}
                    className="h-[68px] w-[45px] shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-site-dim">
                      {yearOf(item.release_date) || "—"}
                      <span className="inline-flex items-center gap-1">
                        {item.type === "series" ? <Tv size={11} /> : <Film size={11} />}
                        {item.type === "series" ? "TV" : "Movie"}
                      </span>
                    </span>
                  </span>
                </Link>
              ))
            ) : isSearching ? (
              <p className="px-5 py-10 text-center text-sm text-site-dim">
                Searching…
              </p>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-site-dim">
                No titles found. Try another keyword.
              </p>
            )}
          </div>

          {searchHref ? (
            <Link
              href={searchHref}
              onClick={close}
              className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3 text-xs font-semibold text-brand transition hover:bg-white/[0.05]"
            >
              See all results for “{cleanQuery}”
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
