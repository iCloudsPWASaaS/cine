import type { Metadata, Viewport } from "next";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cinewood — Cinema, curated.",
    template: "%s · Cinewood",
  },
  description:
    "A beautifully organised home for films and series. Discover trending titles, browse by genre and watch in a world-class player.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Cinewood — Cinema, curated.",
    description:
      "Discover trending films and series, browse curated collections and watch in a world-class player.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#06070b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
