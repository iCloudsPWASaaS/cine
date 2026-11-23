import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Releases",
  description: "The latest titles added to Cinewood.",
};

export default async function NewReleasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  return (
    <BrowseView
      searchParams={{ ...params, sort: sort || "newest" }}
      actionPath="/new-releases"
      heading="New Releases"
      description="Just added to the Cinewood library."
    />
  );
}
