import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Now Playing",
  description: "Movies currently in theaters.",
};

export default async function NowPlayingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      forcedType="movie"
      actionPath="/now-playing"
      heading="Now Playing"
      description="Fresh movies in theaters and newly added online."
    />
  );
}
