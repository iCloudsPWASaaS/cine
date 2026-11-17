import Link from "next/link";
import { ArrowLeft, Link2, PenLine, Search, Sparkles } from "lucide-react";
import { importMovieByNameAction } from "@/app/admin/actions/import";
import { Flash } from "@/components/admin/flash";
import { MovieForm } from "@/components/admin/movie-form";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  getCategories,
  getGenres,
  getSiteSettings,
} from "@/lib/queries";
import { tmdbConfigured } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export default async function NewMoviePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [categories, genres, settings] = await Promise.all([
    getCategories(false),
    getGenres(),
    getSiteSettings(),
  ]);
  const tmdbReady = tmdbConfigured();

  return (
    <div>
      <Link
        href="/admin/movies"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/40 transition hover:text-gold"
      >
        <ArrowLeft size={14} /> Back to catalogue
      </Link>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          New entry
        </p>
        <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
          Add a title
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/40">
          Import everything from TMDB by name and optionally grab playback
          sources (StreamWish, FileMoon, DoodStream, VidHide, HLS/MP4 or page
          URL) in one step.
        </p>
      </div>

      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-white/10 bg-gradient-to-r from-gold/[0.08] via-transparent to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                <Sparkles size={17} className="text-gold" /> Add a title &amp;
                grab sources
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/40">
                Enter the movie or series title and optionally paste a video
                source or watch page link. Cinewood imports TMDB metadata and
                attaches all detected playback sources automatically.
              </p>
            </div>
            <span className="badge shrink-0 border-gold/25 text-gold">
              Region {settings.tmdb.region || "BD"}
            </span>
          </div>

          {!tmdbReady ? (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100">
              <p className="font-bold">TMDB is not configured yet.</p>
              <p className="mt-1 text-amber-100/70">
                Add{" "}
                <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11px]">
                  TMDB_API_KEY=your_key
                </code>{" "}
                to{" "}
                <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11px]">
                  .env.local
                </code>{" "}
                and restart the app.
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
          <form
            action={importMovieByNameAction}
            className="grid gap-3 lg:grid-cols-[1fr_1.2fr_auto]"
          >
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
              />
              <input
                name="query"
                required
                disabled={!tmdbReady}
                placeholder="Movie or series title, e.g. Heartland…"
                className="input h-12 pl-11"
              />
            </div>
            <div className="relative">
              <Link2
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
              />
              <input
                name="source_input"
                disabled={!tmdbReady}
                placeholder="Source link (StreamWish, FileMoon, DoodStream, VidHide, .m3u8 or page URL)…"
                className="input h-12 pl-11"
              />
            </div>
            <SubmitButton
              className="btn-gold h-12 shrink-0"
              pendingText="Importing…"
            >
              <Search size={16} /> Search &amp; grab
            </SubmitButton>
          </form>

          <p className="mt-2 text-[11px] text-white/30">
            Exact title matches are preferred; otherwise the top TMDB result is
            imported. Any StreamWish, FileMoon, DoodStream, VidHide, HLS/MP4 or
            embedded player links are normalized and attached automatically.
          </p>
        </div>
      </section>

      <details className="group mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-gold">
          <PenLine size={13} />
          Advanced: add manually instead
          <span className="ml-auto text-white/20 transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="mt-6">
          <MovieForm categories={categories} genres={genres} />
        </div>
      </details>
    </div>
  );
}
