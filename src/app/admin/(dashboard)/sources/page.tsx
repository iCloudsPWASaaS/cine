import { Plus, Server, Trash2 } from "lucide-react";
import {
  createSourceAction,
  deleteSourceAction,
  updateSourceAction,
} from "@/app/admin/actions/taxonomy";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import { getSources } from "@/lib/queries";

export const dynamic = "force-dynamic";

const types = [
  { value: "embed", label: "Embed (iframe)" },
  { value: "hls", label: "HLS (.m3u8)" },
  { value: "mp4", label: "MP4" },
  { value: "youtube", label: "YouTube" },
  { value: "external", label: "External link" },
];

const selectClass =
  "input [&>option]:bg-[#11141d] [&>option]:text-white";

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sources = await getSources();

  return (
    <div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          Playback
        </p>
        <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
          Source registry
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/40">
          A reusable directory of providers and sources. Attach registry entries
          to individual titles from the movie editor. Only publish sources you
          are legally allowed to distribute.
        </p>
      </div>

      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Plus size={16} className="text-gold" /> Add source
        </h2>
        <form
          action={createSourceAction}
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          <div>
            <label className="label" htmlFor="new-source-name">
              Name *
            </label>
            <input
              id="new-source-name"
              name="name"
              required
              placeholder="Official Partner"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-source-slug">
              Slug
            </label>
            <input
              id="new-source-slug"
              name="slug"
              placeholder="auto"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-source-type">
              Type
            </label>
            <select
              id="new-source-type"
              name="type"
              className={selectClass}
              defaultValue="embed"
            >
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="new-source-region">
              Region
            </label>
            <input
              id="new-source-region"
              name="region"
              placeholder="Global / BD / US"
              className="input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="new-source-base">
              Base URL
            </label>
            <input
              id="new-source-base"
              name="base_url"
              placeholder="https://…"
              className="input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="new-source-notes">
              Notes
            </label>
            <input
              id="new-source-notes"
              name="notes"
              placeholder="Licensing, region, contact…"
              className="input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="h-4 w-4 accent-[#f2c86b]"
            />
            Active
          </label>
          <div className="flex items-end">
            <SubmitButton className="btn-gold w-full" pendingText="Creating…">
              <Plus size={15} /> Create
            </SubmitButton>
          </div>
        </form>
      </section>

      <div className="mt-6 space-y-3">
        {sources.length === 0 ? (
          <p className="admin-card px-5 py-10 text-center text-sm text-white/35">
            No registry sources yet.
          </p>
        ) : null}

        {sources.map((source) => (
          <div key={source.id} className="admin-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <form
                action={updateSourceAction}
                className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                <input type="hidden" name="id" value={source.id} />
                <div>
                  <label
                    className="label"
                    htmlFor={`source-name-${source.id}`}
                  >
                    Name
                  </label>
                  <input
                    id={`source-name-${source.id}`}
                    name="name"
                    defaultValue={source.name}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label
                    className="label"
                    htmlFor={`source-slug-${source.id}`}
                  >
                    Slug
                  </label>
                  <input
                    id={`source-slug-${source.id}`}
                    name="slug"
                    defaultValue={source.slug}
                    className="input"
                  />
                </div>
                <div>
                  <label
                    className="label"
                    htmlFor={`source-type-${source.id}`}
                  >
                    Type
                  </label>
                  <select
                    id={`source-type-${source.id}`}
                    name="type"
                    defaultValue={source.type}
                    className={selectClass}
                  >
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="label"
                    htmlFor={`source-region-${source.id}`}
                  >
                    Region
                  </label>
                  <input
                    id={`source-region-${source.id}`}
                    name="region"
                    defaultValue={source.region || ""}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="label"
                    htmlFor={`source-base-${source.id}`}
                  >
                    Base URL
                  </label>
                  <input
                    id={`source-base-${source.id}`}
                    name="base_url"
                    defaultValue={source.base_url || ""}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="label"
                    htmlFor={`source-notes-${source.id}`}
                  >
                    Notes
                  </label>
                  <input
                    id={`source-notes-${source.id}`}
                    name="notes"
                    defaultValue={source.notes || ""}
                    className="input"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={source.is_active}
                    className="h-4 w-4 accent-[#f2c86b]"
                  />
                  Active
                </label>
                <div className="flex items-end">
                  <SubmitButton
                    className="btn-gold w-full !py-2.5 text-xs"
                    pendingText="Saving…"
                  >
                    <Server size={14} /> Save
                  </SubmitButton>
                </div>
              </form>

              <form action={deleteSourceAction}>
                <input type="hidden" name="id" value={source.id} />
                <SubmitButton
                  className="btn-danger w-full !py-2.5 text-xs xl:w-auto"
                  pendingText="…"
                  confirm={`Delete source "${source.name}"?`}
                >
                  <Trash2 size={13} /> Delete
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
