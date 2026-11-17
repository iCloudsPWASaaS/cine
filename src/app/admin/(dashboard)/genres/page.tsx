import { Plus, Tags, Trash2 } from "lucide-react";
import {
  createGenreAction,
  deleteGenreAction,
  updateGenreAction,
} from "@/app/admin/actions/taxonomy";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import { getGenres } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminGenresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const genres = await getGenres();

  return (
    <div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          Taxonomy
        </p>
        <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
          Genres
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/40">
          Genres are shared across the catalogue. TMDB imports create genres
          automatically — you can rename them here.
        </p>
      </div>

      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Plus size={16} className="text-gold" /> Add genre
        </h2>
        <form
          action={createGenreAction}
          className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div>
            <label className="label" htmlFor="new-genre-name">
              Name *
            </label>
            <input
              id="new-genre-name"
              name="name"
              required
              placeholder="Documentary"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-genre-slug">
              Slug
            </label>
            <input
              id="new-genre-slug"
              name="slug"
              placeholder="auto"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-genre-tmdb">
              TMDB ID
            </label>
            <input
              id="new-genre-tmdb"
              name="tmdb_id"
              type="number"
              placeholder="optional"
              className="input"
            />
          </div>
          <div className="flex items-end">
            <SubmitButton className="btn-gold w-full" pendingText="Creating…">
              <Plus size={15} /> Create
            </SubmitButton>
          </div>
        </form>
      </section>

      <div className="mt-6 space-y-2">
        {genres.length === 0 ? (
          <p className="admin-card px-5 py-10 text-center text-sm text-white/35">
            No genres yet.
          </p>
        ) : null}

        {genres.map((genre) => (
          <div
            key={genre.id}
            className="admin-card flex flex-col gap-3 p-4 xl:flex-row xl:items-end"
          >
            <form
              action={updateGenreAction}
              className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              <input type="hidden" name="id" value={genre.id} />
              <div>
                <label className="label" htmlFor={`genre-name-${genre.id}`}>
                  Name
                </label>
                <input
                  id={`genre-name-${genre.id}`}
                  name="name"
                  defaultValue={genre.name}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor={`genre-slug-${genre.id}`}>
                  Slug
                </label>
                <input
                  id={`genre-slug-${genre.id}`}
                  name="slug"
                  defaultValue={genre.slug}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor={`genre-tmdb-${genre.id}`}>
                  TMDB ID
                </label>
                <input
                  id={`genre-tmdb-${genre.id}`}
                  name="tmdb_id"
                  type="number"
                  defaultValue={genre.tmdb_id || ""}
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <SubmitButton
                  className="btn-gold w-full !py-2.5 text-xs"
                  pendingText="Saving…"
                >
                  <Tags size={14} /> Save
                </SubmitButton>
              </div>
            </form>

            <form action={deleteGenreAction}>
              <input type="hidden" name="id" value={genre.id} />
              <SubmitButton
                className="btn-danger w-full !py-2.5 text-xs xl:w-auto"
                pendingText="…"
                confirm={`Delete genre "${genre.name}"?`}
              >
                <Trash2 size={13} /> Delete
              </SubmitButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
