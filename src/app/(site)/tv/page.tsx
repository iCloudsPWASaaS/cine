import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TV Shows",
  description: "Browse every TV show in the Cinewood library.",
};

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      forcedType="series"
      actionPath="/tv"
      heading="TV Shows"
      description="Series, seasons and episodes in one place."
    />
  );
}
