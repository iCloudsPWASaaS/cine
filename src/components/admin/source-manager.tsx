import {
  ExternalLink,
  Film,
  Link2,
  Play,
  Plus,
  Power,
  Sparkles,
  Trash2,
  Tv,
  Wand2,
} from "lucide-react";
import {
  addMovieSourceAction,
  deleteMovieSourceAction,
  grabMovieSourcesAction,
  toggleMovieSourceAction,
} from "@/app/admin/actions/movies";
import { SubmitButton } from "@/components/admin/submit-button";
import type { MovieSource, Source } from "@/lib/types";

const typeIcon = {
  hls: Tv,
  mp4: Film,
  embed: Play,
  youtube: Play,
  external: ExternalLink,
} as const;

const SUPPORTED_HOSTS = [
  "VidLink Pro",
  "VidFast",
  "StreamWish",
  "FileMoon",
  "DoodStream",
  "VidHide",
  "StreamTape",
  "MixDrop",
  "HLS (.m3u8)",
  "MP4",
];

export function SourceManager({
  movieId,
  sources,
  registry,
}: {
  movieId: string;
  sources: MovieSource[];
  registry: Source[];
}) {
  return (
    <section className="admin-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <Link2 size={16} className="text-gold" /> Playback sources
          </h2>
          <p className="mt-1 text-xs text-white/40">
            Paste a StreamWish, FileMoon, DoodStream, VidHide, HLS/MP4 link,
            iframe snippet, or watch page URL to grab and import active sources
            automatically.
          </p>
        </div>
        <span className="badge shrink-0 text-white/50">
          {sources.length} total
        </span>
      </div>

      <form
        action={grabMovieSourcesAction}
        className="mt-5 rounded-2xl border border-gold/25 bg-gradient-to-r from-gold/[0.08] via-black/30 to-black/30 p-4"
      >
        <input type="hidden" name="movie_id" value={movieId} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-gold"
            htmlFor="grab-source-input"
          >
            <Sparkles size={13} /> Quick grab source
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_HOSTS.map((host) => (
              <span
                key={host}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/55"
              >
                {host}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <input
            id="grab-source-input"
            name="source_input"
            placeholder="Paste StreamWish / FileMoon / DoodStream / VidHide link, .m3u8, page URL — or leave blank to auto-search by title…"
            className="input h-11 flex-1"
          />
          <input
            name="language"
            placeholder="Language (optional)"
            className="input h-11 sm:w-44"
          />
          <SubmitButton
            className="btn-gold h-11 shrink-0"
            pendingText="Grabbing…"
          >
            <Wand2 size={15} /> Grab source
          </SubmitButton>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          Leave blank and click <strong>Grab source</strong> to auto-discover
          and verify playable streams across built-in TMDB/IMDb providers
          (VidLink Pro, VidFast, FileMoon, VidHide, DoodStream, StreamWish,
          NontonGo, MoviesAPI, VidSrc, Archive MP4/HLS &amp; YouTube), or paste
          any share/embed link (<code className="text-white/55">/d/</code>,{" "}
          <code className="text-white/55">/f/</code>,{" "}
          <code className="text-white/55">/v/</code> →{" "}
          <code className="text-white/55">/e/</code>).
        </p>
      </form>

      <details className="group mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45 transition hover:text-gold">
          <Plus size={13} /> Manual source entry (custom label, quality &amp;
          priority)
          <span className="ml-auto text-white/25 transition group-open:rotate-180">
            ▾
          </span>
        </summary>

        <form
          action={addMovieSourceAction}
          className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <input type="hidden" name="movie_id" value={movieId} />
          <div className="xl:col-span-2">
            <label className="label" htmlFor="source-label">
              Label (auto if blank)
            </label>
            <input
              id="source-label"
              name="label"
              placeholder="e.g. StreamWish • HD"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="source-type">
              Type
            </label>
            <select
              id="source-type"
              name="type"
              className="input [&>option]:bg-[#11141d] [&>option]:text-white"
              defaultValue="auto"
            >
              <option value="auto">Auto-detect</option>
              <option value="embed">Embed (iframe)</option>
              <option value="hls">HLS (.m3u8)</option>
              <option value="mp4">MP4</option>
              <option value="youtube">YouTube</option>
              <option value="external">External provider link</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="source-quality">
              Quality
            </label>
            <input
              id="source-quality"
              name="quality"
              placeholder="1080p / Auto / HD"
              className="input"
            />
          </div>

          <div className="xl:col-span-3">
            <label className="label" htmlFor="source-url">
              URL *
            </label>
            <input
              id="source-url"
              name="url"
              required
              placeholder="https://streamwish.to/e/… or https://filemoon.sx/e/…"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="source-language">
              Language
            </label>
            <input
              id="source-language"
              name="language"
              placeholder="English / Bangla"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="source-priority">
              Priority
            </label>
            <input
              id="source-priority"
              name="priority"
              type="number"
              defaultValue={20}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="source-registry">
              Registry
            </label>
            <select
              id="source-registry"
              name="source_id"
              className="input [&>option]:bg-[#11141d] [&>option]:text-white"
              defaultValue=""
            >
              <option value="">Auto</option>
              {registry.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2.5 text-sm text-white/60">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="h-4 w-4 accent-[#f2c86b]"
            />
            Active
          </label>
          <div className="flex items-end">
            <SubmitButton className="btn-gold w-full" pendingText="Adding…">
              <Plus size={15} /> Add source
            </SubmitButton>
          </div>
        </form>
      </details>

      <div className="mt-5 space-y-2">
        {sources.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-5 text-center text-xs text-white/35">
            No sources yet. Paste a link above and click Grab source.
          </p>
        ) : null}

        {sources.map((source) => {
          const Icon = typeIcon[source.type] || Play;
          return (
            <div
              key={source.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-gold">
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white/85">
                  {source.label}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-white/35">
                  {source.type.toUpperCase()}
                  {source.quality ? ` · ${source.quality}` : ""}
                  {source.language ? ` · ${source.language}` : ""} · priority{" "}
                  {source.priority}
                </p>
                <p className="truncate text-[10px] text-white/20">
                  {source.url}
                </p>
              </div>
              <span
                className={`badge shrink-0 ${
                  source.is_active
                    ? "border-emerald-500/25 text-emerald-300"
                    : "border-white/10 text-white/35"
                }`}
              >
                {source.is_active ? "Active" : "Hidden"}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <form action={toggleMovieSourceAction}>
                  <input type="hidden" name="id" value={source.id} />
                  <input type="hidden" name="movie_id" value={movieId} />
                  <input
                    type="hidden"
                    name="active"
                    value={source.is_active ? "false" : "true"}
                  />
                  <SubmitButton
                    className="btn-ghost !px-3 !py-2 text-xs"
                    pendingText="…"
                  >
                    <Power size={13} />
                    {source.is_active ? "Hide" : "Show"}
                  </SubmitButton>
                </form>
                <form action={deleteMovieSourceAction}>
                  <input type="hidden" name="id" value={source.id} />
                  <input type="hidden" name="movie_id" value={movieId} />
                  <SubmitButton
                    className="btn-danger !px-3 !py-2 text-xs"
                    pendingText="…"
                    confirm="Remove this source?"
                  >
                    <Trash2 size={13} />
                  </SubmitButton>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
