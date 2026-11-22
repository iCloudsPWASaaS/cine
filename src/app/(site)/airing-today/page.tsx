import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Airing Today",
  description: "TV episodes dropping today.",
};

export default async function AiringTodayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      forcedType="series"
      actionPath="/airing-today"
      heading="Airing Today"
      description="Currently airing TV series."
    />
  );
}
