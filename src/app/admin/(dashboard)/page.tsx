import Link from "next/link";
import {
  ArrowRight,
  Database,
  Eye,
  Film,
  FolderOpen,
  HardDrive,
  Plus,
  Server,
  Sparkles,
  Tags,
  TriangleAlert,
  Users,
} from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import { getAdminStats, getSiteSettings } from "@/lib/queries";
import { tmdbConfigured } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const statCards = [
  { key: "movies", label: "Titles", icon: Film, href: "/admin/movies" },
  {
    key: "published",
    label: "Published",
    icon: Eye,
    href: "/admin/movies",
  },
  {
    key: "categories",
    label: "Categories",
    icon: FolderOpen,
    href: "/admin/categories",
  },
  { key: "genres", label: "Genres", icon: Tags, href: "/admin/genres" },
  { key: "sources", label: "Sources", icon: Server, href: "/admin/sources" },
  { key: "profiles", label: "Accounts", icon: Users, href: "/admin/settings" },
] as const;

export default async function AdminDashboardPage() {
  const [stats, settings] = await Promise.all([
    getAdminStats(),
    getSiteSettings(),
  ]);
  const hasTmdb = tmdbConfigured();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "cinewood";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Overview
          </p>
          <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/40">
            Welcome back to {settings.name}. Manage the catalogue, artwork,
            categories and playback sources from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/movies/new" className="btn-gold">
            <Plus size={16} /> Add title
          </Link>
          <Link href="/admin/sources" className="btn-ghost">
            <Server size={15} /> Sources
          </Link>
        </div>
      </div>

      {!hasTmdb ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <TriangleAlert size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Automatic metadata import is off</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
              Add a free TMDB key to{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">
                TMDB_API_KEY
              </code>{" "}
              in <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code>{" "}
              and restart the app. Manual entry and source management already
              work.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="admin-card group flex items-center gap-4 p-5 transition hover:border-gold/30"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-gold">
              <card.icon size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-extrabold tracking-tight text-white">
                {stats[card.key]}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                {card.label}
              </p>
            </div>
            <ArrowRight
              size={16}
              className="text-white/20 transition group-hover:translate-x-1 group-hover:text-gold"
            />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-extrabold">Recently added</h2>
            <Link
              href="/admin/movies"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold/80 hover:text-gold"
            >
              View all
            </Link>
          </div>

          {stats.recent.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm text-white/40">
                No titles yet. Add your first movie to get started.
              </p>
              <Link href="/admin/movies/new" className="btn-gold mt-4">
                <Plus size={15} /> Add title
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((movie) => (
                    <tr key={movie.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <MediaImage
                            src={movie.poster_url}
                            alt={movie.title}
                            title={movie.title}
                            className="h-14 w-10 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white/85">
                              {movie.title}
                            </p>
                            <p className="truncate text-[11px] text-white/30">
                              /watch/{movie.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs capitalize text-white/50">
                        {movie.type}
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
                      <td className="text-right">
                        <Link
                          href={`/admin/movies/${movie.id}`}
                          className="text-xs font-bold text-gold/80 hover:text-gold"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="admin-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Sparkles size={16} className="text-gold" /> Quick start
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                {
                  title: "Create categories",
                  text: "Group titles into collections like Latest, Trending or Genre rows.",
                  href: "/admin/categories",
                },
                {
                  title: "Import a title",
                  text: "Search TMDB by name to fetch metadata, artwork and legal availability.",
                  href: "/admin/movies/new",
                },
                {
                  title: "Add playback sources",
                  text: "Attach licensed HLS, MP4 or embed sources and set their priority.",
                  href: "/admin/movies",
                },
              ].map((step, index) => (
                <li key={step.title}>
                  <Link href={step.href} className="group flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10 text-[11px] font-black text-gold">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white/80 group-hover:text-gold">
                        {step.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-white/35">
                        {step.text}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="admin-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Database size={16} className="text-gold" /> System status
            </h2>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <span className="text-white/45">Database schema</span>
                <span className="badge border-emerald-500/25 text-emerald-300">
                  cinewood
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-white/45">
                  <HardDrive size={12} /> Storage bucket
                </span>
                <span className="badge border-emerald-500/25 text-emerald-300">
                  {bucket}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <span className="text-white/45">TMDB metadata</span>
                <span
                  className={`badge ${
                    hasTmdb
                      ? "border-emerald-500/25 text-emerald-300"
                      : "border-amber-500/25 text-amber-300"
                  }`}
                >
                  {hasTmdb ? "Connected" : "Not configured"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
