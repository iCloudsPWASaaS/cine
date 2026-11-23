import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { MediaImage } from "@/components/site/media-image";
import type { Category } from "@/lib/types";

export function SpecialCategorySection({
  categories,
}: {
  categories: Category[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flix-icon-box bg-gold/15 text-gold">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-site-dim">
            Special categories
          </p>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Cinema by region
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/movies?category=${category.slug}`}
            className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-white/[0.08] bg-site-panel transition duration-300 hover:-translate-y-1 hover:border-gold/50"
          >
            <MediaImage
              src={category.image_url}
              alt={category.name}
              title={category.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-extrabold text-white">
                  {category.name}
                </h3>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 text-white/50 transition group-hover:text-gold"
                />
              </div>
              {category.description ? (
                <p className="mt-1 truncate text-[10px] text-white/60">
                  {category.description}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
