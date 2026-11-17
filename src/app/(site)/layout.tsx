import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import {
  getGenres,
  getMovieCountries,
  getMovieYears,
  getSiteSettings,
} from "@/lib/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, genres, years, countries] = await Promise.all([
    getSiteSettings(),
    getGenres(),
    getMovieYears(),
    getMovieCountries(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        siteName={settings.name}
        logoText={settings.logo_text}
        genres={genres}
        years={years}
        countries={countries}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} genres={genres} />
    </div>
  );
}
