import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getGenres, getSiteSettings } from "@/lib/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, genres] = await Promise.all([getSiteSettings(), getGenres()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        siteName={settings.name}
        logoText={settings.logo_text}
        genres={genres}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} genres={genres} />
    </div>
  );
}
