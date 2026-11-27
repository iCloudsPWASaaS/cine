"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay, EffectCoverflow, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { MediaImage } from "@/components/site/media-image";
import type { Movie } from "@/lib/types";

export function LatestCarousel({ movies }: { movies: Movie[] }) {
  const router = useRouter();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const slides = movies.slice(0, 15);
  const initialIndex = Math.floor(slides.length / 2);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [ready, setReady] = useState(false);

  if (slides.length === 0) return null;

  const loop = slides.length > 3;
  const active = slides[activeIndex] || slides[0];
  const setInitialSlide = (swiper: SwiperInstance) => {
    requestAnimationFrame(() => {
      swiper.update();
      if (loop) swiper.slideToLoop(initialIndex, 0);
      else swiper.slideTo(initialIndex, 0);
      setReady(true);
    });
  };
  const goTo = (index: number) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    const next = (index + slides.length) % slides.length;
    if (loop) swiper.slideToLoop(next);
    else swiper.slideTo(next);
  };

  return (
    <section className="relative isolate overflow-hidden bg-site-bg pb-8 pt-20 sm:pb-10 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 z-0">
        <MediaImage
          key={active.slug}
          src={active.poster_url || active.backdrop_url}
          alt=""
          priority
          loading="eager"
          className="h-full w-full object-cover object-top opacity-75 brightness-[1.15] blur-[1px] saturate-[1.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-site-bg/35 via-site-bg/65 to-site-bg/95" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_320px_at_50%_0%,rgba(108,92,231,0.16),transparent_70%)]" />
      </div>

      <div className="container-page relative z-10">
        <div className="w-full">
          <div className="min-w-0 text-center">
            <h1
              key={active.slug}
              className="animate-fade-up mt-1.5 text-xl font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-2xl lg:text-3xl"
            >
              {active.title}
            </h1>
            <p
              key={`${active.slug}-overview`}
              className="animate-fade-up mx-auto mt-2 line-clamp-2 max-w-2xl text-xs leading-relaxed text-site-muted sm:text-sm"
            >
              {active.overview || "A new addition to the Cinewood library."}
            </p>
          </div>

          <div className="mt-5 min-w-0 sm:mt-6">
            <Swiper
              className={`hero-3d-swiper !overflow-hidden rounded-xl transition-opacity duration-300 ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              modules={[Autoplay, EffectCoverflow, Keyboard]}
              effect="coverflow"
              grabCursor
              centeredSlides
              loop={loop}
              loopAdditionalSlides={4}
              initialSlide={initialIndex}
              speed={450}
              slidesPerView={1.7}
              spaceBetween={8}
              breakpoints={{
                480: { slidesPerView: 2.6, spaceBetween: 10 },
                640: { slidesPerView: 3.8, spaceBetween: 12 },
                1024: { slidesPerView: 5.2, spaceBetween: 12 },
                1280: { slidesPerView: 6.2, spaceBetween: 14 },
              }}
              slideToClickedSlide
              keyboard={{ enabled: true }}
              autoplay={{
                delay: 3200,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              coverflowEffect={{
                rotate: 2,
                stretch: 0,
                depth: 40,
                scale: 0.96,
                modifier: 1,
                slideShadows: false,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                setInitialSlide(swiper);
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            >
              {slides.map((movie, index) => {
                const isActive = index === activeIndex;
                return (
                  <SwiperSlide key={movie.id} className="!h-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (isActive) router.push(`/watch/${movie.slug}`);
                        else goTo(index);
                      }}
                      aria-label={`Open ${movie.title}`}
                      aria-current={isActive}
                      className="hero-carousel-card group relative block w-full overflow-hidden rounded-xl text-left transition-opacity duration-300"
                    >
                      <div className="relative aspect-[2/3]">
                        <MediaImage
                          src={movie.poster_url || movie.backdrop_url}
                          alt={movie.title}
                          priority={index === 0}
                          loading="eager"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-site-bg/95 via-site-bg/5 to-transparent" />
                        <div className="absolute inset-x-2.5 bottom-2.5">
                          <p className="line-clamp-2 text-[11px] font-bold text-white drop-shadow sm:text-xs">
                            {movie.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            <div className="mt-5 flex items-center justify-center gap-2">
              {slides.map((movie, index) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to ${movie.title}`}
                  aria-current={index === activeIndex}
                  className={`h-1 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-6 bg-brand"
                      : "w-2.5 bg-white/25 hover:bg-white/55"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
