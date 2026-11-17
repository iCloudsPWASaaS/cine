import Link from "next/link";
import {
  CalendarDays,
  Film,
  Image as ImageIcon,
  Star,
  TextQuote,
} from "lucide-react";
import { ImageUrlField } from "@/components/admin/image-url-field";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  createMovieAction,
  updateMovieAction,
} from "@/app/admin/actions/movies";
import type { Category, Genre, MovieWithTaxonomy } from "@/lib/types";

interface MovieFormProps {
  movie?: MovieWithTaxonomy;
  categories: Category[];
  genres: Genre[];
  selectedGenreIds?: string[];
}

const selectClass =
  "input [&>option]:bg-[#11141d] [&>option]:text-white";

export function MovieForm({
  movie,
  categories,
  genres,
  selectedGenreIds = [],
}: MovieFormProps) {
  const selected = new Set(selectedGenreIds);
  const editing = Boolean(movie);

  return (
    <form
      action={editing ? updateMovieAction : createMovieAction}
      className="space-y-6"
    >
      {movie ? <input type="hidden" name="id" value={movie.id} /> : null}

      <section className="admin-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Film size={16} className="text-gold" /> Title details
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label" htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={movie?.title || ""}
              className="input"
              placeholder="e.g. The Beast"
            />
          </div>

          <div>
            <label className="label" htmlFor="original_title">
              Original title
            </label>
            <input
              id="original_title"
              name="original_title"
              defaultValue={movie?.original_title || ""}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="slug">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={movie?.slug || ""}
              className="input"
              placeholder="auto-generated from title"
            />
          </div>

          <div>
            <label className="label" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={movie?.type || "movie"}
              className={selectClass}
            >
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="category_id">
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={movie?.category_id || ""}
              className={selectClass}
            >
              <option value="">Uncategorised</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="release_date">
              Release date
            </label>
            <input
              id="release_date"
              name="release_date"
              type="date"
              defaultValue={movie?.release_date || ""}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="runtime">
              Runtime (minutes)
            </label>
            <input
              id="runtime"
              name="runtime"
              type="number"
              min={0}
              defaultValue={movie?.runtime ?? ""}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="vote_average">
              Rating (0–10)
            </label>
            <input
              id="vote_average"
              name="vote_average"
              type="number"
              min={0}
              max={10}
              step={0.1}
              defaultValue={movie?.vote_average ?? ""}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <input
              id="status"
              name="status"
              defaultValue={movie?.status || "Released"}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="imdb_id">
              IMDb ID
            </label>
            <input
              id="imdb_id"
              name="imdb_id"
              defaultValue={movie?.imdb_id || ""}
              placeholder="tt1234567"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="trailer_url">
              Trailer URL
            </label>
            <input
              id="trailer_url"
              name="trailer_url"
              defaultValue={movie?.trailer_url || ""}
              placeholder="https://www.youtube.com/watch?v=…"
              className="input"
            />
          </div>
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <TextQuote size={16} className="text-gold" /> Story
        </h2>
        <div className="mt-5 grid gap-4">
          <div>
            <label className="label" htmlFor="tagline">
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              defaultValue={movie?.tagline || ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="overview">
              Overview
            </label>
            <textarea
              id="overview"
              name="overview"
              rows={6}
              defaultValue={movie?.overview || ""}
              className="input resize-y"
            />
          </div>
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <ImageIcon size={16} className="text-gold" /> Artwork
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <ImageUrlField
            name="poster_url"
            label="Poster URL"
            defaultValue={movie?.poster_url}
            folder="posters"
            hint="Portrait 2:3 artwork. Upload to the cinewood bucket or paste a URL."
          />
          <ImageUrlField
            name="backdrop_url"
            label="Backdrop URL"
            defaultValue={movie?.backdrop_url}
            folder="backdrops"
            hint="Wide 16:9 artwork used on the hero and detail pages."
          />
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <CalendarDays size={16} className="text-gold" /> Genres
          </h2>
          <p className="text-[11px] text-white/30">
            {selected.size} selected
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {genres.map((genre) => (
            <label
              key={genre.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/70 transition hover:border-white/20"
            >
              <input
                type="checkbox"
                name="genre_ids"
                value={genre.id}
                defaultChecked={selected.has(genre.id)}
                className="h-4 w-4 accent-[#f2c86b]"
              />
              {genre.name}
            </label>
          ))}
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Star size={16} className="text-gold" /> Visibility
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <input
              type="checkbox"
              name="published"
              defaultChecked={movie ? movie.published : true}
              className="mt-0.5 h-4 w-4 accent-[#f2c86b]"
            />
            <span>
              <span className="block text-sm font-semibold">Published</span>
              <span className="text-[11px] text-white/35">
                Visible on the public site.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={movie?.featured || false}
              className="mt-0.5 h-4 w-4 accent-[#f2c86b]"
            />
            <span>
              <span className="block text-sm font-semibold">Featured</span>
              <span className="text-[11px] text-white/35">
                Appears in the homepage hero.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <input
              type="checkbox"
              name="trending"
              defaultChecked={movie?.trending || false}
              className="mt-0.5 h-4 w-4 accent-[#f2c86b]"
            />
            <span>
              <span className="block text-sm font-semibold">Trending</span>
              <span className="text-[11px] text-white/35">
                Included in Trending Now.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText={editing ? "Saving…" : "Creating…"}>
          {editing ? "Save changes" : "Create movie"}
        </SubmitButton>
        <Link
          href={movie ? `/watch/${movie.slug}` : "/admin/movies"}
          target={movie ? "_blank" : undefined}
          className="btn-ghost"
        >
          {movie ? "Preview page" : "Cancel"}
        </Link>
      </div>
    </form>
  );
}
