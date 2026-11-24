import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Movies from ${year}`,
    description: `Browse movies released in ${year}.`,
  };
}

export default async function YearPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ year }, query] = await Promise.all([params, searchParams]);
  if (!/^\d{4}$/.test(year)) notFound();

  return (
    <BrowseView
      searchParams={query}
      forcedYear={year}
      forcedType="movie"
      actionPath={`/year/${year}`}
      heading={`Movies from ${year}`}
      description={`Browse movies released in ${year}.`}
      hideFilters
    />
  );
}
