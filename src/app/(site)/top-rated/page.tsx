import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top Rated",
  description: "The highest rated movies and TV shows on Cinewood.",
};

export default async function TopRatedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={{ ...params, sort: "rating" }}
      actionPath="/top-rated"
      heading="Top Rated"
      description="Critically loved titles, ranked by rating."
    />
  );
}
