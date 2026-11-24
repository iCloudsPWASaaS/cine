import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const name = decodeURIComponent(country);
  return {
    title: `Movies from ${name}`,
    description: `Browse movies produced in ${name}.`,
  };
}

export default async function CountryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ country }, query] = await Promise.all([params, searchParams]);
  const name = decodeURIComponent(country);
  if (!name.trim()) notFound();

  return (
    <BrowseView
      searchParams={query}
      forcedCountry={name}
      forcedType="movie"
      actionPath={`/country/${encodeURIComponent(name)}`}
      heading={`Movies from ${name}`}
      description={`Browse movies produced in ${name}.`}
      hideFilters
    />
  );
}
