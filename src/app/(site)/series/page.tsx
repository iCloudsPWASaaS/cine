import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TV Series",
  description: "Browse every web series and TV show in the Cinewood library.",
};

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      forcedType="series"
      actionPath="/series"
      heading="TV Series"
      description="All web series and TV shows in one place."
    />
  );
}
