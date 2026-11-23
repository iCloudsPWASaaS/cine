import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Layers3 } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import { getFeaturedCollectionById } from "@/lib/featured-collections";
import { tmdbImage } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

interface CollectionDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CollectionDetailProps): Promise<Metadata> {
  const { id } = await params;
  const collection = await getFeaturedCollectionById(Number(id));
  if (!collection) return { title: "Collection" };
  return {
    title: `${collection.name} - Cinewood`,
    description: `Browse the movies in ${collection.name} in release order.`,
  };
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailProps) {
  const { id } = await params;
  const collectionId = Number(id);
  if (!Number.isFinite(collectionId)) notFound();

  const collection = await getFeaturedCollectionById(collectionId);
  if (!collection) notFound();

  return (
    <div className="container-page pb-16 pt-[88px] sm:pb-20 sm:pt-[112px]">
      <Link
        href="/collections"
        className="inline-flex items-center gap-2 text-xs font-semibold text-site-muted transition hover:text-brand"
      >
        <ArrowLeft size={14} /> All collections
      </Link>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-site-panel">
        <MediaImage
          src={collection.backdropUrl || collection.posterUrl}
          alt={collection.name}
          title={collection.name}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1c] via-[#0d0d1c]/70 to-transparent" />
        <div className="relative px-5 py-10 sm:px-10 sm:py-16">
          <span className="flix-icon-box bg-brand/20 text-brand">
            <Layers3 size={20} />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {collection.name}
          </h1>
          {collection.count > 0 ? (
            <p className="mt-2 text-xs text-white/60 sm:text-sm">
              {collection.count} {collection.count === 1 ? "movie" : "movies"}
              {collection.years ? ` · ${collection.years}` : ""} · In release
              order
            </p>
          ) : null}
        </div>
      </div>

      {collection.parts.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {collection.parts.map((part, index) => (
            <Link
              key={part.id}
              href={`/search?q=${encodeURIComponent(part.title)}`}
              className="group"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/[0.08] bg-site-panel">
                <MediaImage
                  src={tmdbImage(part.poster_path, "w342")}
                  alt={part.title}
                  title={part.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 grid h-6 min-w-6 place-items-center rounded-md bg-black/70 px-1 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <h2 className="mt-2 line-clamp-2 text-xs font-bold text-white transition group-hover:text-brand">
                {part.title}
              </h2>
              <p className="mt-0.5 text-[10px] text-site-dim">
                {part.release_date?.slice(0, 4) || "TBA"}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand">
                Find on Cinewood
                <ArrowUpRight size={11} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-site-panel p-8 text-center text-sm text-site-muted">
          Collection movies are unavailable right now.
        </div>
      )}
    </div>
  );
}
