"use client";

import Link from "next/link";
import { Play, Star } from "lucide-react";
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
    movies.length >= 10
      ? movies
      : Array.from({ length: Math.ceil(10 / movies.length) }, () => movies)
          .flat()
          .slice(0, Math.max(10, movies.length));

  return (
    <section className="relative overflow-hidden pt-[88px] sm:pt-[104px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_520px_at_45%_0%,rgba(48,160,185,0.34),transparent_62%),radial-gradient(820px_420px_at_76%_8%,rgba(176,150,126,0.22),transparent_60%),radial-gradient(900px_460px_at_8%_0%,rgba(18,70,90,0.36),transparent_62%),linear-gradient(to_bottom,rgba(12,48,62,0.18),transparent_78%)]" />

      <div className="container-page relative">
        <Swiper
          className="latest-swiper !pb-12 sm:!pb-14"
          modules={[Autoplay, EffectCoverflow, Pagination]}
          effect="coverflow"
          grabCursor
          centeredSlides
          loop={slides.length > 3}
          speed={700}
          spaceBetween={14}
          slidesPerView={1.55}
          autoplay={{
            delay: 3200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 110,
            modifier: 1.6,
            slideShadows: false,
          }}
          breakpoints={{
            480: { slidesPerView: 2.2, spaceBetween: 16 },
            640: { slidesPerView: 2.8, spaceBetween: 18 },
            768: { slidesPerView: 3.4, spaceBetween: 20 },
            1024: { slidesPerView: 4.2, spaceBetween: 22 },
            1280: { slidesPerView: 5, spaceBetween: 24 },
          }}
        >
          {slides.map((movie, index) => (
            <SwiperSlide key={`${movie.id}-${index}`} className="!h-auto">
              <Link
                href={`/watch/${movie.slug}`}
                className="carousel-card group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)] transition duration-300 hover:border-gold/40"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <MediaImage
                    src={movie.poster_url || movie.backdrop_url}
                    alt={movie.title}
                    title={movie.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 sm:inset-x-3.5 sm:top-3.5">
                    <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/75 backdrop-blur">
                      {mediaLabel(movie.type)}
                    </span>
                    {movie.vote_average ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-black/60 px-2 py-0.5 text-[11px] font-bold text-gold backdrop-blur">
                        <Star size={11} fill="currentColor" />
                        {formatRating(movie.vote_average)}
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-gold text-black shadow-[0_10px_30px_-8px_rgba(242,200,107,0.9)] transition duration-300 group-hover:scale-110 sm:h-14 sm:w-14">
                      <Play size={19} fill="currentColor" className="ml-0.5" />
                    </span>
                  </div>

                  <div className="absolute inset-x-3 bottom-3 sm:inset-x-3.5 sm:bottom-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-white/60 sm:text-[11px]">
                      {yearOf(movie.release_date) || "—"}
                      <span className="h-1 w-1 rounded-full bg-white/35" />
                      {movie.runtime ? formatRuntime(movie.runtime) : "New"}
                    </p>
                    <h2 className="mt-1 truncate text-base font-extrabold text-white transition group-hover:text-gold sm:text-lg">
                      {movie.title}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/50 sm:text-xs">
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
