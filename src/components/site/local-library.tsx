"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, Play, Trash2, X } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import {
  clearProgress,
  PROGRESS_EVENT,
  readProgress,
  readWatchlist,
  removeFromWatchlist,
  removeProgress,
  WATCHLIST_EVENT,
  type CatalogItem,
  type ProgressItem,
} from "@/lib/local-library";
import { yearOf } from "@/lib/utils";

function LocalCard({
  item,
  progress,
  onRemove,
}: {
  item: CatalogItem;
  progress?: number;
  onRemove?: () => void;
}) {
  return (
    <div className="group relative w-[145px] shrink-0 snap-start sm:w-[160px]">
      <Link href={`/watch/${item.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-site-card">
          <MediaImage
            src={item.poster_url}
            alt={item.title}
            title={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white">
              <Play size={17} fill="currentColor" className="ml-0.5" />
            </span>
          </div>
          {typeof progress === "number" ? (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
              <div
                className="h-full bg-brand"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          ) : null}
        </div>
        <div className="px-0.5 pt-2">
          <h3 className="truncate text-xs font-medium text-white">{item.title}</h3>
          <p className="mt-0.5 text-[11px] text-site-dim">
            {yearOf(item.release_date) || "—"} · {item.type === "series" ? "TV" : "Movie"}
          </p>
        </div>
      </Link>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.title}`}
          title="Remove"
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/70 opacity-100 transition hover:bg-brand hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-3 text-xl font-bold text-white sm:text-2xl">
        <span className="flix-icon-box">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

export function ContinueWatchingRow() {
  const [items, setItems] = useState<ProgressItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readProgress());
    sync();
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader
        icon={<Play size={20} className="text-emerald-400" />}
        title="Continue Watching"
        action={
          <button
            type="button"
            onClick={() => clearProgress()}
            className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-site-muted transition hover:bg-white/[0.12] hover:text-white"
          >
            Clear History
          </button>
        }
      />
      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {items.map((item) => {
          const canResume = item.resumable !== false && item.duration > 0;
          return (
            <LocalCard
              key={item.id}
              item={item}
              progress={canResume ? (item.position / item.duration) * 100 : 8}
            />
          );
        })}
      </div>
    </section>
  );
}

export function WatchlistRow() {
  const [items, setItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readWatchlist());
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader
        icon={<Clock3 size={20} className="text-violet-300" />}
        title="My List"
        action={
          <Link href="/watchlist" className="flix-btn flix-btn-secondary flix-btn-sm">
            View All
          </Link>
        }
      />
      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {items.slice(0, 12).map((item) => (
          <LocalCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function WatchlistPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(readWatchlist());
      setLoaded(true);
    };
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="container-page min-h-screen pb-16 pt-24">
      <div className="mb-8 flex items-center gap-3">
        <span className="flix-icon-box text-violet-300">
          <Clock3 size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">My List</h1>
          <p className="text-sm text-site-dim">
            Saved on this device. No account needed.
          </p>
        </div>
      </div>

      {loaded && items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
          <h2 className="text-lg font-semibold text-white">Your list is empty</h2>
          <p className="mt-2 text-sm text-site-dim">
            Tap the heart on any title to save it here.
          </p>
          <Link href="/movies" className="flix-btn mt-6">
            Browse movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {items.map((item) => (
            <LocalCard
              key={item.id}
              item={item}
              onRemove={() => removeFromWatchlist(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContinueWatchingPage() {
  const [items, setItems] = useState<ProgressItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readProgress());
    sync();
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="container-page min-h-screen pb-16 pt-24">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Continue Watching
        </h1>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={() => clearProgress()}
            className="flix-btn flix-btn-secondary flix-btn-sm"
          >
            <Trash2 size={13} /> Clear History
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center text-sm text-site-dim">
          Nothing here yet. Start watching a title to see it here.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {items.map((item) => (
            <LocalCard
              key={item.id}
              item={item}
              progress={(item.position / item.duration) * 100}
              onRemove={() => removeProgress(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
