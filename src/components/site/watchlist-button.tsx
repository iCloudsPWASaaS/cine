"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import {
  isWatchlisted,
  toggleWatchlist,
  WATCHLIST_EVENT,
  type CatalogItem,
} from "@/lib/local-library";
import { cn } from "@/lib/utils";

export function WatchlistButton({
  item,
  className,
}: {
  item: CatalogItem;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isWatchlisted(item.id));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [item.id]);

  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
      aria-pressed={saved}
      title={saved ? "Remove from My List" : "Add to My List"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWatchlist(item);
        setSaved(isWatchlisted(item.id));
      }}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/60 text-white/75 backdrop-blur transition hover:border-brand hover:bg-brand hover:text-white",
        saved && "border-brand bg-brand text-white opacity-100",
        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
        className,
      )}
    >
      <Heart size={15} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
