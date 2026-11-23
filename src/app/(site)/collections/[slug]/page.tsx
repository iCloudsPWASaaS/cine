import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers3 } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import { MovieCard } from "@/components/site/movie-card";
import { getCollectionBySlug } from "@/lib/collections";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection" };
  return {
    title: `${collection.name} Collection`,
    description: `Watch every movie in the ${collection.name} on Cinewood, in release order.`,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
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
          <p className="mt-2 text-xs text-white/60 sm:text-sm">
            {collection.count} {collection.count === 1 ? "movie" : "movies"}
            {collection.years ? ` · ${collection.years}` : ""} · In release
            order
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {collection.movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
