import Link from "next/link";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  deleteMovieAction,
  toggleMovieFieldAction,
} from "@/app/admin/actions/movies";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaImage } from "@/components/site/media-image";
import { getAdminMovies } from "@/lib/queries";
import type { Movie } from "@/lib/types";
import { mediaLabel, yearOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminMovieRow = Movie & { category?: { name: string } | null };

function param(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = param(params.q).trim();
  const type = param(params.type);
  const page = Math.max(1, Number(param(params.page)) || 1);

  const result = await getAdminMovies({ q, type, page });
  const movies = result.movies as unknown as AdminMovieRow[];
  const totalPages = Math.max(1, Math.ceil(result.count / result.perPage));

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (type) next.set("type", type);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return `/admin/movies${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Catalogue
          </p>
          <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
            Movies &amp; Series
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {result.count} {result.count === 1 ? "title" : "titles"} in the
            library.
          </p>
        </div>
        <Link href="/admin/movies/new" className="btn-gold">
          <Plus size={16} /> Add title
        </Link>
      </div>

      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <form
        action="/admin/movies"
        method="get"
        className="admin-card mb-5 flex flex-col gap-2 p-4 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title…"
            className="input pl-11"
          />
        </div>
        <select
          name="type"
          defaultValue={type}
          className="input sm:w-44 [&>option]:bg-[#11141d] [&>option]:text-white"
        >
          <option value="">All types</option>
          <option value="movie">Movies</option>
          <option value="series">Series</option>
        </select>
        <button type="submit" className="btn-gold shrink-0">
          Search
        </button>
        <Link href="/admin/movies" className="btn-ghost shrink-0">
          Reset
        </Link>
      </form>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Flags</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((movie) => (
                <tr key={movie.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <MediaImage
                        src={movie.poster_url}
                        alt={movie.title}
                        title={movie.title}
                        className="h-16 w-11 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/movies/${movie.id}`}
                          className="block max-w-[260px] truncate text-sm font-bold text-white/85 hover:text-gold"
                        >
                          {movie.title}
                        </Link>
                        <p className="text-[11px] text-white/30">
                          {yearOf(movie.release_date) || "—"} ·{" "}
                          {mediaLabel(movie.type)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs capitalize text-white/50">
                    {movie.type}
                  </td>
                  <td className="text-xs text-white/50">
                    {movie.category?.name || "—"}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {movie.featured ? (
                        <span
                          className="badge border-gold/30 text-gold"
                          title="Featured"
                        >
                          <Sparkles size={10} /> F
                        </span>
                      ) : null}
                      {movie.trending ? (
                        <span
                          className="badge border-sky-400/25 text-sky-300"
                          title="Trending"
                        >
                          T
                        </span>
                      ) : null}
                      {!movie.featured && !movie.trending ? (
                        <span className="text-xs text-white/20">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        movie.published
                          ? "border-emerald-500/25 text-emerald-300"
                          : "border-white/10 text-white/35"
                      }`}
                    >
                      {movie.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/watch/${movie.slug}`}
                        target="_blank"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/45 transition hover:text-gold"
                        title="View on site"
                      >
                        <Eye size={14} />
                      </Link>
                      <Link
                        href={`/admin/movies/${movie.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/45 transition hover:text-gold"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <form action={toggleMovieFieldAction}>
                        <input type="hidden" name="id" value={movie.id} />
                        <input type="hidden" name="field" value="published" />
                        <input
                          type="hidden"
                          name="value"
                          value={movie.published ? "false" : "true"}
                        />
                        <input
                          type="hidden"
                          name="redirect_to"
                          value="/admin/movies"
                        />
                        <SubmitButton
                          className="btn-ghost !px-3 !py-2 text-[11px]"
                          pendingText="…"
                        >
                          {movie.published ? "Unpublish" : "Publish"}
                        </SubmitButton>
                      </form>
                      <form action={deleteMovieAction}>
                        <input type="hidden" name="id" value={movie.id} />
                        <SubmitButton
                          className="btn-danger !px-2.5 !py-2"
                          pendingText="…"
                          confirm={`Delete "${movie.title}" and all of its sources?`}
                        >
                          <Trash2 size={13} />
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-white/40">
              No titles match this search.
            </p>
            <Link href="/admin/movies/new" className="btn-gold mt-4">
              <Plus size={15} /> Add a title
            </Link>
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-ghost">
              Previous
            </Link>
          ) : null}
          <span className="text-xs text-white/40">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="btn-ghost">
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
