import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Countries",
  description: "Browse titles by country.",
};

export default async function CountryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={params}
      actionPath="/country"
      heading="Countries"
      description="Filter the library by production country."
    />
  );
}
