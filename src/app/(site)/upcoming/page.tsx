import type { Metadata } from "next";
import { BrowseView } from "@/components/site/browse-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upcoming",
  description: "Movies coming soon to Cinewood.",
};

export default async function UpcomingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <BrowseView
      searchParams={{ ...params, upcoming: "1" }}
      actionPath="/upcoming"
      heading="Upcoming"
      description="Titles marked as coming soon."
    />
  );
}
