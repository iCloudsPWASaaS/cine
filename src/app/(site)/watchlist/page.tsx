import type { Metadata } from "next";
import { WatchlistPage } from "@/components/site/local-library";

export const metadata: Metadata = {
  title: "My List",
  description: "Titles saved on this device.",
};

export default function Page() {
  return <WatchlistPage />;
}
