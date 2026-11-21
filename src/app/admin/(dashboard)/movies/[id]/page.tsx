import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Film,
  Sparkles,
  Trash2,
} from "lucide-react";
import { deleteMovieAction } from "@/app/admin/actions/movies";
import { Flash } from "@/components/admin/flash";
import { MovieForm } from "@/components/admin/movie-form";
import { SourceManager } from "@/components/admin/source-manager";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  getAdminMovieById,
  getCategories,
  getGenres,
  getMovieGenres,
  getSources,
} from "@/lib/queries";
import { mediaLabel, yearOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditMoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const movie = await getAdminMovieById(id);
  if (!movie) notFound();

  const [categories, genres, selectedGenreIds, registry] = await Promise.all([
    getCategories(false),
    getGenres(),
    getMovieGenres(movie.id),
    getSources(),
  ]);

  return (
    <div>
      <Link
        href="/admin/movies"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/40 transition hover:text-gold"
      >
        <ArrowLeft size={14} /> Back to catalogue
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge border-white/10 text-white/45">
              {mediaLabel(movie.type)}
            </span>
            <span
              className={`badge ${
                movie.published
                  ? "border-emerald-500/25 text-emerald-300"
                  : "border-white/10 text-white/35"
              }`}
            >
              {movie.published ? "Published" : "Draft"}
            </span>
            {movie.tmdb_id ? (
              <span className="badge border-gold/25 text-gold">
                <Sparkles size={10} /> TMDB import
              </span>
            ) : null}
          </div>
          <h1 className="display mt-2 text-4xl tracking-[0.03em] sm:text-5xl">
            {movie.title}
          </h1>
          <p className="mt-1 text-sm text-white/35">
            /watch/{movie.slug}
            {movie.release_date ? ` · ${yearOf(movie.release_date)}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/watch/${movie.slug}`}
            target="_blank"
            className="btn-ghost"
          >
            <ExternalLink size={15} /> View page
          </Link>
          {movie.metadata?.tmdb_url ? (
            <a
              href={movie.metadata.tmdb_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <Film size={15} /> TMDB
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <Flash searchParams={query} />
      </div>

      <div className="space-y-6">
        <SourceManager
          movieId={movie.id}
          sources={movie.sources}
          registry={registry}
          subtitles={movie.metadata?.subtitles || []}
        />

        <MovieForm
          movie={movie}
          categories={categories}
          genres={genres}
          selectedGenreIds={selectedGenreIds}
        />

        <section className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-red-200">Danger zone</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-red-200/50">
            Deleting this title removes its genre links, playback sources and
            watch page. This cannot be undone.
          </p>
          <form action={deleteMovieAction} className="mt-4">
            <input type="hidden" name="id" value={movie.id} />
            <SubmitButton
              className="btn-danger"
              pendingText="Deleting…"
              confirm={`Permanently delete "${movie.title}"?`}
            >
              <Trash2 size={15} /> Delete title
            </SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
