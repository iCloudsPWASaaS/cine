import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trending",
  description: "What everyone is watching this week.",
};

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      forcedTrending
      actionPath="/trending"
      heading="Trending This Week"
      description="The most popular movies and TV shows right now."
    />
  );
}
