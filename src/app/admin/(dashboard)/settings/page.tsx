import {
  Database,
  Globe2,
  HardDrive,
  KeyRound,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { updateSettingsAction } from "@/app/admin/actions/settings";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import { getSiteSettings } from "@/lib/queries";
import { tmdbConfigured } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const selectClass =
  "input [&>option]:bg-[#11141d] [&>option]:text-white";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const settings = await getSiteSettings();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "cinewood";
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "cinewood";
  const hasTmdb = tmdbConfigured();
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasAdminApiKey = Boolean(process.env.ADMIN_API_KEY);

  return (
    <div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          Configuration
        </p>
        <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/40">
          Brand, player defaults and metadata region. Secrets live in{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">
            .env.local
          </code>
          .
        </p>
      </div>

      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form action={updateSettingsAction} className="space-y-5">
          <section className="admin-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Sparkles size={16} className="text-gold" /> Brand
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  Site name
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={settings.name}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="logo_text">
                  Logo text
                </label>
                <input
                  id="logo_text"
                  name="logo_text"
                  defaultValue={settings.logo_text}
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="tagline">
                  Tagline
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  defaultValue={settings.tagline}
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={settings.description}
                  className="input resize-y"
                />
              </div>
            </div>
          </section>

          <section className="admin-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Settings size={16} className="text-gold" /> Player &amp; metadata
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="region">
                  Metadata / provider region
                </label>
                <input
                  id="region"
                  name="region"
                  maxLength={2}
                  defaultValue={settings.tmdb.region || "BD"}
                  className="input uppercase"
                />
                <p className="mt-1 text-[11px] text-white/30">
                  ISO 3166-1 alpha-2, e.g. BD, US, GB. Used for JustWatch
                  availability.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="default_quality">
                  Default quality
                </label>
                <select
                  id="default_quality"
                  name="default_quality"
                  defaultValue={settings.player.default_quality || "auto"}
                  className={selectClass}
                >
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:col-span-2">
                <input
                  type="checkbox"
                  name="autoplay"
                  defaultChecked={settings.player.autoplay || false}
                  className="mt-0.5 h-4 w-4 accent-[#f2c86b]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Autoplay
                  </span>
                  <span className="text-[11px] text-white/35">
                    Start playback automatically when the player loads. Browsers
                    may still block autoplay with sound.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
        </form>

        <aside className="space-y-5">
          <section className="admin-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <ShieldCheck size={16} className="text-gold" /> Environment
            </h2>
            <div className="mt-4 space-y-2 text-xs">
              {[
                {
                  label: "Database schema",
                  value: schema,
                  ok: true,
                  icon: Database,
                },
                {
                  label: "Storage bucket",
                  value: bucket,
                  ok: true,
                  icon: HardDrive,
                },
                {
                  label: "Service role key",
                  value: hasServiceKey ? "Configured" : "Missing",
                  ok: hasServiceKey,
                  icon: KeyRound,
                },
                {
                  label: "TMDB metadata",
                  value: hasTmdb ? "Connected" : "Not configured",
                  ok: hasTmdb,
                  icon: Globe2,
                },
                {
                  label: "Admin API key",
                  value: hasAdminApiKey ? "Configured" : "Missing",
                  ok: hasAdminApiKey,
                  icon: KeyRound,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="flex items-center gap-1.5 text-white/45">
                    <row.icon size={12} /> {row.label}
                  </span>
                  <span
                    className={`badge ${
                      row.ok
                        ? "border-emerald-500/25 text-emerald-300"
                        : "border-amber-500/25 text-amber-300"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <KeyRound size={16} className="text-gold" /> Admin API
            </h2>
            <p className="mt-2 text-[11px] leading-relaxed text-white/35">
              The import endpoints accept either an admin session cookie or the
              server-side admin key.
            </p>
            <div className="mt-3 space-y-2 text-[11px] text-white/45">
              <p className="rounded-lg bg-black/30 px-2.5 py-2 font-mono">
                GET /api/admin/tmdb/search?q=the+beast
              </p>
              <p className="rounded-lg bg-black/30 px-2.5 py-2 font-mono">
                POST /api/admin/tmdb/import
              </p>
              <p className="text-white/30">
                Header:{" "}
                <code className="text-white/50">
                  Authorization: Bearer $ADMIN_API_KEY
                </code>
              </p>
            </div>
          </section>

          <section className="admin-card p-5">
            <h2 className="text-sm font-extrabold">Admin account</h2>
            <p className="mt-2 text-[11px] leading-relaxed text-white/35">
              Create or reset the admin account with{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">
                npm run seed:admin
              </code>
              . It uses the ADMIN_EMAIL and ADMIN_PASSWORD values from{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code>.
              Change the password after first login.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
