import {
  Captions,
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
  addMovieSubtitleAction,
  deleteMovieSourceAction,
  deleteMovieSubtitleAction,
  grabMovieSourcesAction,
  setMovieSourceLanguageAction,
  toggleMovieSourceAction,
  toggleMovieSubtitleAction,
} from "@/app/admin/actions/movies";
import { SubmitButton } from "@/components/admin/submit-button";
import { canonicalLanguage, LANGUAGES } from "@/lib/languages";
import type { MovieSource, MovieSubtitle, Source } from "@/lib/types";
import { parseSourceEpisode } from "@/lib/utils";

const typeIcon = {
  hls: Tv,
  mp4: Film,
  embed: Play,
  youtube: Play,
  external: ExternalLink,
} as const;

const SUPPORTED_HOSTS = [
  "111Movies",
  "VidLink Pro",
  "VidSrc.Mov",
  "MultiEmbed",
  "VidCore",
  "VidZen",
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
  subtitles = [],
}: {
  movieId: string;
  sources: MovieSource[];
  registry: Source[];
  subtitles?: MovieSubtitle[];
}) {
  const episodeMap = new Map<
    string,
    { season: number; episode: number; sources: MovieSource[] }
  >();
  for (const source of sources) {
    const parsed = parseSourceEpisode(source.label);
    if (!parsed) continue;
    const group = episodeMap.get(parsed.key) || {
      season: parsed.season,
      episode: parsed.episode,
      sources: [],
    };
    group.sources.push(source);
    episodeMap.set(parsed.key, group);
  }
  const episodeGroups = Array.from(episodeMap.values()).sort(
    (a, b) => a.season - b.season || a.episode - b.episode,
  );
  const seasonGroups = Array.from(
    episodeGroups.reduce((map, group) => {
      const list = map.get(group.season) || [];
      list.push(group);
      map.set(group.season, list);
      return map;
    }, new Map<number, typeof episodeGroups>()),
  )
    .map(([season, episodes]) => ({ season, episodes }))
    .sort((a, b) => a.season - b.season);

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
            placeholder="Optional: paste an extra StreamWish / FileMoon / DoodStream / VidHide link, .m3u8 or page URL — bot discovery always runs…"
            className="input h-11 flex-1"
          />
          <select
            name="language"
            defaultValue=""
            aria-label="Audio language"
            className="input h-11 sm:w-44 [&>option]:bg-[#11141d] [&>option]:text-white"
          >
            <option value="">Auto-detect audio</option>
            {LANGUAGES.map((language) => (
              <option key={language.name} value={language.name}>
                {language.name}
              </option>
            ))}
          </select>
          <SubmitButton
            className="btn-gold h-11 shrink-0"
            pendingText="Grabbing…"
          >
            <Wand2 size={15} /> Grab source
          </SubmitButton>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          This runs the same grab logic as import, then verifies and attaches
          playable streams. Top priority: 111Movies, VidLink, VidSrc.Mov,
          MultiEmbed, VidCore and VidZen. Others include VidFast, FileMoon,
          VidHide, DoodStream, NontonGo, MoviesAPI, VidSrc, Archive MP4/HLS
          &amp; YouTube. A pasted link is added on top of those results. Audio
          language is detected from metadata and the link; choose one above to
          override. Share links
          (<code className="text-white/55">/d/</code>,{" "}
          <code className="text-white/55">/f/</code>,{" "}
          <code className="text-white/55">/v/</code> →{" "}
          <code className="text-white/55">/e/</code>) are normalized
          automatically.
        </p>
      </form>

      {episodeGroups.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-violet-200">
              <Tv size={14} /> Full episode section
            </h3>
            <span className="badge text-white/50">
              {episodeGroups.length} episodes ·{" "}
              {episodeGroups.reduce((sum, group) => sum + group.sources.length, 0)}{" "}
              sources
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {seasonGroups.map((season) => (
              <div key={season.season}>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/60">
                  Season {season.season}
                  <span className="text-violet-200/35">
                    {season.episodes.length} episodes
                  </span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {season.episodes.map((group) => (
                    <span
                      key={`E${group.episode}`}
                      className="rounded-md border border-violet-400/20 bg-violet-400/[0.08] px-2 py-1 text-[11px] font-bold text-violet-100"
                    >
                      E{group.episode}
                      <span className="ml-1.5 text-[10px] font-medium text-violet-200/50">
                        {group.sources.length}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
            <select
              id="source-language"
              name="language"
              defaultValue=""
              className="input [&>option]:bg-[#11141d] [&>option]:text-white"
            >
              <option value="">Auto-detect audio</option>
              {LANGUAGES.map((language) => (
                <option key={language.name} value={language.name}>
                  {language.name}
                </option>
              ))}
            </select>
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
                  {` · ${canonicalLanguage(source.language) || "Auto"}`} ·
                  priority {source.priority}
                </p>
                <p className="truncate text-[10px] text-white/20">
                  {source.url}
                </p>
              </div>
              <form
                key={`${source.id}-${source.language || "auto"}`}
                action={setMovieSourceLanguageAction}
                className="flex shrink-0 items-center gap-1.5"
              >
                <input type="hidden" name="id" value={source.id} />
                <input type="hidden" name="movie_id" value={movieId} />
                <select
                  name="language"
                  defaultValue={canonicalLanguage(source.language) || ""}
                  aria-label={`Audio language for ${source.label}`}
                  className="input !h-9 !w-28 !px-2 text-xs [&>option]:bg-[#11141d] [&>option]:text-white"
                >
                  <option value="">Auto</option>
                  {LANGUAGES.map((language) => (
                    <option key={language.name} value={language.name}>
                      {language.name}
                    </option>
                  ))}
                </select>
                <SubmitButton
                  className="btn-ghost !px-2 !py-2 text-xs"
                  pendingText="…"
                >
                  Set
                </SubmitButton>
              </form>
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

      <details className="group mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45 transition hover:text-gold">
          <Captions size={13} /> Subtitle tracks ({subtitles.length})
          <span className="ml-auto text-white/25 transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-3 text-[11px] leading-relaxed text-white/35">
            Add direct <code className="text-white/55">.vtt</code> or{" "}
            <code className="text-white/55">.srt</code> URLs. They show on native
            HLS/MP4 players and are passed to embed players that accept external
            subtitles (VidLink, VidFast, MultiEmbed/SuperEmbed).
          </p>
          <form
            action={addMovieSubtitleAction}
            className="grid gap-2.5 sm:grid-cols-[1fr_1.6fr_1fr_auto]"
          >
            <input type="hidden" name="movie_id" value={movieId} />
            <input
              name="label"
              required
              placeholder="Label (Hindi)"
              className="input"
              aria-label="Subtitle label"
            />
            <input
              name="url"
              required
              type="url"
              placeholder="https://example.com/subtitles.vtt"
              className="input"
              aria-label="Subtitle URL"
            />
            <select
              name="language"
              defaultValue=""
              className="input [&>option]:bg-[#11141d] [&>option]:text-white"
              aria-label="Subtitle language"
            >
              <option value="">Auto</option>
              {LANGUAGES.map((language) => (
                <option key={language.name} value={language.name}>
                  {language.name}
                </option>
              ))}
            </select>
            <SubmitButton className="btn-gold" pendingText="Adding…">
              Add subtitle
            </SubmitButton>
          </form>

          <div className="mt-3 space-y-2">
            {subtitles.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[11px] text-white/35">
                No subtitle tracks yet.
              </p>
            ) : (
              subtitles.map((track) => (
                <div
                  key={track.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white/80">
                      {track.label}
                      {track.language ? ` · ${track.language}` : ""}
                    </p>
                    <p className="truncate text-[10px] text-white/25">
                      {track.url}
                    </p>
                  </div>
                  <form action={toggleMovieSubtitleAction}>
                    <input type="hidden" name="movie_id" value={movieId} />
                    <input type="hidden" name="id" value={track.id} />
                    <SubmitButton
                      className="btn-ghost !px-2 !py-1.5 text-[11px]"
                      pendingText="…"
                    >
                      <Power size={12} />
                      {track.is_active ? "Hide" : "Show"}
                    </SubmitButton>
                  </form>
                  <form action={deleteMovieSubtitleAction}>
                    <input type="hidden" name="movie_id" value={movieId} />
                    <input type="hidden" name="id" value={track.id} />
                    <SubmitButton
                      className="btn-danger !px-2 !py-1.5 text-[11px]"
                      pendingText="…"
                      confirm="Remove this subtitle track?"
                    >
                      <Trash2 size={12} />
                    </SubmitButton>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </details>
    </section>
  );
}
