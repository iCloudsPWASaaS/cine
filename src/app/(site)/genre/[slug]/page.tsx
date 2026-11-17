import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowseView } from "@/components/site/browse-view";
import { getGenres } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const genres = await getGenres();
  const genre = genres.find((item) => item.slug === slug);
  if (!genre) return { title: "Genre" };
  return {
    title: `${genre.name} movies`,
    description: `Browse ${genre.name.toLowerCase()} titles on Cinewood.`,
  };
}

export default async function GenrePage({
  params,
  searchParams,
}: GenrePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const genres = await getGenres();
  const genre = genres.find((item) => item.slug === slug);

  if (!genre) notFound();

  return (
    <BrowseView
      searchParams={query}
      forcedGenre={genre.slug}
      actionPath={`/genre/${genre.slug}`}
      heading={genre.name}
      description={`Explore every ${genre.name.toLowerCase()} title in the Cinewood library.`}
    />
  );
}
