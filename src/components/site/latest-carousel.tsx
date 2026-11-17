"use client";

import Link from "next/link";
import { ArrowRight, Play, Star } from "lucide-react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { MediaImage } from "@/components/site/media-image";
import type { Movie } from "@/lib/types";
import {
  formatRating,
  formatRuntime,
  mediaLabel,
  yearOf,
} from "@/lib/utils";

export function LatestCarousel({ movies }: { movies: Movie[] }) {
  if (movies.length === 0) return null;

  const slides =
    movies.length >= 6
      ? movies
      : [...movies, ...movies, ...movies].slice(0, 8);

  return (
    <section className="relative overflow-hidden pt-[104px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_15%_0%,rgba(242,200,107,0.09),transparent_60%),radial-gradient(800px_420px_at_100%_20%,rgba(228,87,46,0.07),transparent_55%)]" />

      <div className="container-page relative">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-gold" />
              New on Cinewood
            </p>
            <h1 className="display mt-2 text-4xl tracking-[0.04em] sm:text-5xl">
              Latest Releases
            </h1>
            <p className="mt-1 text-xs text-white/40">
              Automatically loaded from the newest titles added to the library.
            </p>
          </div>
          <Link
            href="/movies?sort=newest"
            className="group inline-flex items-center gap-1.5 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-gold"
          >
            View all releases
            <ArrowRight
              size={14}
              className="transition group-hover:translate-x-1"
            />
          </Link>
        </div>

        <Swiper
          className="latest-swiper !pb-16"
          modules={[Autoplay, EffectCoverflow, Pagination]}
          effect="coverflow"
          grabCursor
          centeredSlides
          loop={slides.length > 3}
          speed={700}
          spaceBetween={18}
          slidesPerView={1.15}
          autoplay={{
            delay: 3200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 120,
            modifier: 2.4,
            slideShadows: false,
          }}
          breakpoints={{
            640: { slidesPerView: 1.7, spaceBetween: 20 },
            1024: { slidesPerView: 2.5, spaceBetween: 24 },
            1280: { slidesPerView: 3, spaceBetween: 28 },
          }}
        >
          {slides.map((movie, index) => (
            <SwiperSlide key={`${movie.id}-${index}`} className="!h-auto">
              <Link
                href={`/watch/${movie.slug}`}
                className="carousel-card group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)] transition duration-300 hover:border-gold/40"
              >
                <div className="relative aspect-video overflow-hidden">
                  <MediaImage
                    src={movie.backdrop_url || movie.poster_url}
                    alt={movie.title}
                    title={movie.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

                  <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur">
                      {mediaLabel(movie.type)}
                    </span>
                    {movie.vote_average ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-gold backdrop-blur">
                        <Star size={11} fill="currentColor" />
                        {formatRating(movie.vote_average)}
                      </span>
                    ) : null}
                  </div>

                  <span className="absolute bottom-[86px] left-4 grid h-11 w-11 place-items-center rounded-full bg-gold text-black opacity-0 shadow-[0_10px_30px_-8px_rgba(242,200,107,0.9)] transition duration-300 group-hover:opacity-100">
                    <Play size={17} fill="currentColor" className="ml-0.5" />
                  </span>

                  <div className="absolute inset-x-4 bottom-4">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-white/55">
                      {yearOf(movie.release_date) || "—"}
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      {movie.runtime ? formatRuntime(movie.runtime) : "New"}
                    </p>
                    <h2 className="mt-1 truncate text-lg font-extrabold text-white transition group-hover:text-gold sm:text-xl">
                      {movie.title}
                    </h2>
                    <p className="mt-1 line-clamp-1 text-xs text-white/45">
                      {movie.overview || "A new addition to the Cinewood library."}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
