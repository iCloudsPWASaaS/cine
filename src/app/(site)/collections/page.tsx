import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import { getFeaturedCollections } from "@/lib/featured-collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Movie Collections & Franchises",
  description: "Watch complete movie series and franchises in order.",
};

const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/+7YjmLuJQrclmZWE0";

export default async function CollectionsPage() {
  const collections = await getFeaturedCollections();

  return (
    <div className="container-page pb-16 pt-[88px] sm:pb-20 sm:pt-[112px]">
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
        Movie Collections &amp; Franchises
      </h1>
      <p className="mt-2 text-sm text-site-muted">
        Watch complete movie series and franchises in order
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collection/${collection.id}`}
            className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-white/[0.08] bg-site-panel transition duration-300 hover:-translate-y-1 hover:border-brand/50"
          >
            <MediaImage
              src={collection.backdropUrl || collection.posterUrl}
              alt={collection.name}
              title={collection.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h2 className="truncate text-base font-extrabold tracking-tight text-white">
                {collection.name}
              </h2>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300">
                View collection
                <ArrowUpRight
                  size={13}
                  className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-gold/25 bg-gradient-to-r from-gold/[0.12] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-extrabold text-white">
            Join Cinewood Telegram Group
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-site-muted">
            If the site ever closes, this is where we&apos;ll post the new link.
            Be the first to know about news and updates.
          </p>
        </div>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flix-btn shrink-0"
        >
          Join
        </a>
      </div>
    </div>
  );
}
