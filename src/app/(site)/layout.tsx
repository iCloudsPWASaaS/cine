import { Suspense } from "react";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import {
  getCategories,
  getGenres,
  getLatest,
  getMovieCountries,
  getMovieYears,
  getSiteSettings,
} from "@/lib/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, genres, years, countries, categories, catalog] =
    await Promise.all([
      getSiteSettings(),
      getGenres(),
      getMovieYears(),
      getMovieCountries(),
      getCategories(),
      getLatest(120),
    ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense
        fallback={
          <div className="h-14 border-b border-white/[0.06] bg-[#0b0b1f]" />
        }
      >
        <Header
          siteName={settings.name}
          logoText={settings.logo_text}
          genres={genres}
          years={years}
          countries={countries}
          categories={categories}
          catalog={catalog}
        />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer settings={settings} genres={genres} />
    </div>
  );
}
