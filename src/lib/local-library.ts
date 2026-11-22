export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  poster_url: string | null;
  backdrop_url?: string | null;
  type: string;
  release_date: string | null;
}

const WATCHLIST_KEY = "cinewood:watchlist";
const PROGRESS_KEY = "cinewood:progress";

export const WATCHLIST_EVENT = "cinewood:watchlist-change";
export const PROGRESS_EVENT = "cinewood:progress-change";

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[], event: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(event));
}

export function readWatchlist(): CatalogItem[] {
  return readJson<CatalogItem>(WATCHLIST_KEY);
}

export function isWatchlisted(id: string) {
  return readWatchlist().some((item) => item.id === id);
}

export function toggleWatchlist(item: CatalogItem) {
  const items = readWatchlist();
  const exists = items.some((entry) => entry.id === item.id);
  const next = exists
    ? items.filter((entry) => entry.id !== item.id)
    : [item, ...items];
  writeJson(WATCHLIST_KEY, next, WATCHLIST_EVENT);
  return !exists;
}

export function removeFromWatchlist(id: string) {
  writeJson(
    WATCHLIST_KEY,
    readWatchlist().filter((item) => item.id !== id),
    WATCHLIST_EVENT,
  );
}

export interface ProgressItem extends CatalogItem {
  position: number;
  duration: number;
  updated_at: number;
}

export function readProgress(): ProgressItem[] {
  return readJson<ProgressItem>(PROGRESS_KEY).sort(
    (a, b) => b.updated_at - a.updated_at,
  );
}

export function saveProgress(
  item: CatalogItem,
  position: number,
  duration: number,
) {
  if (!Number.isFinite(position) || !Number.isFinite(duration)) return;
  if (position < 5 || duration <= 0) return;

  const remaining = readProgress().filter((entry) => entry.id !== item.id);
  if (position >= duration * 0.95) {
    writeJson(PROGRESS_KEY, remaining, PROGRESS_EVENT);
    return;
  }

  writeJson(
    PROGRESS_KEY,
    [
      {
        ...item,
        position,
        duration,
        updated_at: Date.now(),
      },
      ...remaining,
    ].slice(0, 24),
    PROGRESS_EVENT,
  );
}

export function removeProgress(id: string) {
  writeJson(
    PROGRESS_KEY,
    readProgress().filter((item) => item.id !== id),
    PROGRESS_EVENT,
  );
}

export function clearProgress() {
  writeJson(PROGRESS_KEY, [], PROGRESS_EVENT);
}
