import type { Metadata } from "next";
import { ContinueWatchingPage } from "@/components/site/local-library";

export const metadata: Metadata = {
  title: "Continue Watching",
  description: "Resume titles saved on this device.",
};

export default function Page() {
  return <ContinueWatchingPage />;
}
