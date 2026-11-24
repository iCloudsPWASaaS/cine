import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Movies",
  description: "Browse every movie in the Cinewood library.",
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) || "";
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const year = first(params.year);
  const country = first(params.country);
  const scope = [year, country].filter(Boolean);

  return (
    <BrowseView
      searchParams={params}
      actionPath="/movies"
      heading={scope.length > 0 ? `Movies from ${scope.join("/")}` : "Movies"}
      description={
        scope.length > 0
          ? `Browse movies from ${scope.join(" and ")}.`
          : "Feature films across every genre, decade and mood."
      }
      hideFilters={scope.length > 0}
    />
  );
}
