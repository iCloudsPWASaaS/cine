import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Movies",
  description: "Browse every movie in the Cinewood library.",
};

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      actionPath="/movies"
      heading="Movies"
      description="Feature films across every genre, decade and mood."
    />
  );
}
