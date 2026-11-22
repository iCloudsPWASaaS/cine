"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay, EffectCoverflow, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { MediaImage } from "@/components/site/media-image";
import type { Movie } from "@/lib/types";

export function LatestCarousel({ movies }: { movies: Movie[] }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = movies.slice(0, 8);

  if (slides.length === 0) return null;

  const loop = slides.length > 3;
  const active = slides[activeIndex] || slides[0];
  const goTo = (index: number) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    const next = (index + slides.length) % slides.length;
    if (loop) swiper.slideToLoop(next);
    else swiper.slideTo(next);
  };

  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-site-bg">
      <div className="absolute inset-0">
        <MediaImage
          key={active.id}
          src={active.backdrop_url || active.poster_url}
          alt={active.title}
          loading="eager"
          className="h-full w-full object-cover object-center brightness-[0.45] blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-site-bg via-site-bg/85 to-site-bg/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-site-bg via-transparent to-site-bg/50" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_480px_at_78%_35%,rgba(108,92,231,0.25),transparent_65%)]" />
      </div>

      <div className="container-page relative z-10 grid items-center gap-10 pb-14 pt-24 sm:pb-16 sm:pt-28 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-14">
        <div className="pointer-events-auto max-w-[520px]">
          <h1
            key={active.slug}
            className="animate-fade-up text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.65)] sm:text-6xl"
          >
            {active.title}
          </h1>

          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-zinc-300 drop-shadow sm:text-base">
            {active.overview || "A new addition to the Cinewood library."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/watch/${active.slug}`}
              className="flix-btn !px-7 !py-3 !text-base"
            >
              <Play size={18} fill="currentColor" /> Watch Now
            </Link>
            <Link
              href={`/watch/${active.slug}#about`}
              className="flix-btn flix-btn-secondary !px-7 !py-3 !text-base"
            >
              <Info size={18} /> More Info
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3">
            {slides.map((movie, index) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show ${movie.title}`}
                aria-current={index === activeIndex}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-8 bg-brand"
                    : "w-3 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
            <span className="ml-2 text-[11px] font-semibold tabular-nums text-white/45">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="relative">
          <Swiper
            className="hero-3d-swiper !overflow-visible"
            modules={[Autoplay, EffectCoverflow, Keyboard]}
            effect="coverflow"
            grabCursor
            centeredSlides
            loop={loop}
            speed={800}
            slidesPerView="auto"
            spaceBetween={16}
            slideToClickedSlide
            keyboard={{ enabled: true }}
            autoplay={{
              delay: 5500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            coverflowEffect={{
              rotate: 8,
              stretch: 0,
              depth: 220,
              scale: 0.88,
              modifier: 1.25,
              slideShadows: false,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          >
            {slides.map((movie, index) => {
              const isActive = index === activeIndex;
              return (
                <SwiperSlide
                  key={movie.id}
                  className="!h-auto !w-[190px] sm:!w-[220px] lg:!w-[240px]"
                >
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Show ${movie.title}`}
                    aria-current={isActive}
                    className={`group relative block w-full overflow-hidden rounded-2xl border bg-site-panel/80 text-left shadow-[0_24px_70px_-30px_rgba(0,0,0,0.95)] backdrop-blur transition-[border-color,box-shadow,opacity] duration-500 ${
                      isActive
                        ? "border-brand/60 shadow-[0_30px_90px_-24px_rgba(108,92,231,0.7)]"
                        : "border-white/10 opacity-70 hover:border-white/25 hover:opacity-95"
                    }`}
                  >
                    <div className="relative aspect-[2/3]">
                      <MediaImage
                        src={movie.poster_url || movie.backdrop_url}
                        alt={movie.title}
                        priority={index === 0}
                        loading="eager"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-site-bg via-site-bg/10 to-transparent" />
                      <div className="absolute inset-x-3 bottom-3">
                        <p className="line-clamp-2 text-sm font-bold text-white drop-shadow">
                          {movie.title}
                        </p>
                      </div>
                    </div>
                  </button>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {loop ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous slide"
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/[0.06] text-white/75 backdrop-blur transition hover:border-brand/60 hover:bg-brand/25 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next slide"
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/[0.06] text-white/75 backdrop-blur transition hover:border-brand/60 hover:bg-brand/25 hover:text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
