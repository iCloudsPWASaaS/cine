import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Networks",
  description: "Browse TV shows by network.",
};

export default async function NetworksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      forcedType="series"
      actionPath="/networks"
      heading="Networks"
      description="TV series grouped by network and streaming service."
    />
  );
}
