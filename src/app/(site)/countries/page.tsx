import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { getMovieCountriesWithCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Countries",
  description: "Explore Cinewood by production country.",
};

const accents = [
  "from-violet-500/25",
  "from-fuchsia-500/20",
  "from-sky-500/20",
  "from-indigo-500/25",
  "from-emerald-500/20",
  "from-orange-500/20",
];

export default async function CountriesPage() {
  const countries = await getMovieCountriesWithCounts();

  return (
    <div className="container-page pb-16 pt-[88px] sm:pb-20 sm:pt-[112px]">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-300/80">
        Discover
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
        Countries
      </h1>
      <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-site-muted sm:mt-3 sm:text-sm">
        Stories from everywhere. Choose a country and browse the library.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {countries.map((item, index) => (
          <Link
            key={item.country}
            href={`/country/${encodeURIComponent(item.country)}`}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-site-panel p-4 transition duration-300 hover:-translate-y-1 hover:border-brand/40 sm:p-6"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${accents[index % accents.length]} via-transparent to-transparent opacity-60 transition group-hover:opacity-100`}
            />
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <Globe2 size={18} className="text-violet-300/70" />
                <ArrowUpRight
                  size={18}
                  className="text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
                />
              </div>
              <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-white sm:mt-10 sm:text-3xl">
                {item.country}
              </h2>
              <p className="mt-1 text-xs text-site-dim">
                {item.count} {item.count === 1 ? "title" : "titles"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
