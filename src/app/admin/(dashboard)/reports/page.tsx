import Link from "next/link";
import { ChartColumn, Eye, Film, Sparkles, TrendingUp } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import { getViewReport } from "@/lib/queries";
import { formatCount, mediaLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface BreakdownProps {
  title: string;
  rows: { label: string; count: number }[];
  max: number;
}

function Breakdown({ title, rows, max }: BreakdownProps) {
  return (
    <section className="admin-card p-5">
      <h2 className="text-sm font-extrabold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-white/30">No views recorded yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-white/60">{row.label}</span>
                <span className="shrink-0 font-bold text-white/80">
                  {formatCount(row.count)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gold/70"
                  style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminReportsPage() {
  const report = await getViewReport();
  const maxDaily = Math.max(1, ...report.daily.map((day) => day.count));
  const maxCategory = Math.max(1, ...report.byCategory.map((row) => row.count));
  const maxFlag = Math.max(1, ...report.flags.map((row) => row.count));
  const topTitles = report.movies.slice(0, 15);

  const cards = [
    {
      label: "Lifetime views",
      value: formatCount(report.totalViews),
      icon: Eye,
    },
    {
      label: "Last 7 days",
      value: formatCount(report.views7Days),
      icon: TrendingUp,
    },
    {
      label: "Last 30 days",
      value: formatCount(report.views30Days),
      icon: ChartColumn,
    },
    {
      label: "Titles with views",
      value: `${report.viewedTitles}/${report.movies.length}`,
      icon: Film,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Analytics
          </p>
          <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
            Reports
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/40">
            See which titles get watched, how activity trends and where views
            come from across the catalogue.
          </p>
        </div>
        <Link href="/admin/movies" className="btn-ghost">
          <Film size={15} /> Open catalogue
        </Link>
      </div>

      {report.totalViews === 0 ? (
        <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/[0.06] p-4 text-xs leading-relaxed text-gold/80">
          No views yet. A view is recorded when a visitor starts playback on a
          published title. Activity will appear here automatically.
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="admin-card flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/5 text-gold">
              <card.icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold tracking-tight text-white">
                {card.value}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {report.topMovie ? (
        <section className="admin-card mt-5 flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <MediaImage
            src={report.topMovie.poster_url}
            alt={report.topMovie.title}
            title={report.topMovie.title}
            className="h-24 w-16 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              <Sparkles size={12} /> Most watched title
            </p>
            <h2 className="display mt-1 truncate text-3xl tracking-[0.03em]">
              {report.topMovie.title}
            </h2>
            <p className="mt-1 text-xs text-white/35">
              {formatCount(report.topMovie.view_count)} lifetime views ·{" "}
              {report.topMovie.recentViews} in the last 7 days · Average{" "}
              {formatCount(report.averageViews)} views per title
            </p>
          </div>
          <Link
            href={`/admin/movies/${report.topMovie.id}`}
            className="btn-ghost shrink-0"
          >
            Edit title
          </Link>
        </section>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="admin-card p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-extrabold">Views this week</h2>
              <p className="text-[11px] text-white/30">
                {formatCount(report.views7Days)} total
              </p>
            </div>
            <div className="mt-5 flex h-44 items-end gap-2 sm:gap-4">
              {report.daily.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-[11px] font-bold text-white/60">
                    {day.count}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gold/75 transition"
                      style={{
                        height: `${day.count > 0 ? Math.max(6, (day.count / maxDaily) * 100) : 2}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-extrabold">Top titles by views</h2>
              <p className="text-[11px] text-white/30">Lifetime · last 7 days</p>
            </div>
            {topTitles.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-sm text-white/40">No titles in the library.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th className="text-right">Views</th>
                      <th className="text-right">7 days</th>
                      <th className="text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTitles.map((movie) => (
                      <tr key={movie.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <MediaImage
                              src={movie.poster_url}
                              alt={movie.title}
                              title={movie.title}
                              className="h-12 w-9 shrink-0 rounded-lg object-cover"
                            />
                            <Link
                              href={`/admin/movies/${movie.id}`}
                              className="max-w-[240px] truncate text-sm font-bold text-white/85 hover:text-gold"
                            >
                              {movie.title}
                            </Link>
                          </div>
                        </td>
                        <td className="text-xs capitalize text-white/50">
                          {mediaLabel(movie.type)}
                        </td>
                        <td className="text-right font-bold text-gold">
                          {formatCount(movie.view_count)}
                        </td>
                        <td className="text-right text-xs text-white/50">
                          {movie.recentViews}
                        </td>
                        <td className="text-right text-xs text-white/40">
                          {report.totalViews > 0
                            ? `${Math.round((Number(movie.view_count || 0) / report.totalViews) * 100)}%`
                            : "0%"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <Breakdown
            title="Views by type"
            rows={report.byType}
            max={Math.max(1, ...report.byType.map((row) => row.count))}
          />
          <Breakdown
            title="Views by category"
            rows={report.byCategory.slice(0, 6)}
            max={maxCategory}
          />
          <Breakdown
            title="Featured collections"
            rows={report.flags}
            max={maxFlag}
          />
        </div>
      </div>
    </div>
  );
}
