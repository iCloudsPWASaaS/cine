"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import {
  ExternalLink,
  Film,
  Info,
  Play,
  ShieldCheck,
  Tv,
} from "lucide-react";
import type { MovieSource } from "@/lib/types";
import { cn, externalUrl, normalizeEmbedUrl, youtubeEmbed } from "@/lib/utils";

interface PlayerProps {
  slug: string;
  poster?: string | null;
  sources: MovieSource[];
  autoplay?: boolean;
}

function sourceKindLabel(source: MovieSource) {
  switch (source.type) {
    case "hls":
      return "HLS";
    case "mp4":
      return "MP4";
    case "youtube":
      return "Trailer";
    case "external":
      return "Provider";
    default:
      return "Embed";
  }
}

function NativePlayer({
  source,
  poster,
  autoplay,
  onLoadingChange,
}: {
  source: MovieSource;
  poster?: string | null;
  autoplay: boolean;
  onLoadingChange: (loading: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let art: Artplayer | null = null;
    let hls: Hls | null = null;
    let cancelled = false;

    const boot = async () => {
      const container = containerRef.current;
      if (!container) return;

      const [ArtplayerModule, HlsModule] = await Promise.all([
        import("artplayer"),
        import("hls.js"),
      ]);
      if (cancelled) return;

      const Player = ArtplayerModule.default;
      const HlsPlayer = HlsModule.default;

      art = new Player({
        container,
        url: source.url,
        poster: poster || undefined,
        autoplay,
        volume: 0.75,
        theme: "#f2c86b",
        setting: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        pip: true,
        miniProgressBar: true,
        airplay: true,
        autoPlayback: true,
        hotkey: true,
        customType: {
          m3u8: (video: HTMLVideoElement, url: string) => {
            if (HlsPlayer.isSupported()) {
              hls = new HlsPlayer({
                maxBufferLength: 40,
                capLevelToPlayerSize: true,
              });
              hls.loadSource(url);
              hls.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = url;
            }
          },
        },
      });

      art.on("play", () => {
        if (art) art.notice.show = "";
      });
      art.on("ready", () => onLoadingChange(false));
      art.on("canplay", () => onLoadingChange(false));
      art.on("playing", () => onLoadingChange(false));
      art.on("waiting", () => onLoadingChange(true));
      art.on("error", () => onLoadingChange(false));
    };

    boot();

    return () => {
      cancelled = true;
      try {
        hls?.destroy();
      } catch {
        // ignore
      }
      try {
        art?.destroy(false);
      } catch {
        // ignore
      }
    };
  }, [source.url, poster, autoplay, onLoadingChange]);

  return <div ref={containerRef} className="h-full w-full" />;
}

interface EmbedFrameProps {
  source: MovieSource;
  onLoaded: () => void;
}

function EmbedFrame({ source, onLoaded }: EmbedFrameProps) {
  const url =
    source.type === "youtube"
      ? youtubeEmbed(source.url)
      : normalizeEmbedUrl(source.url);

  return (
    <iframe
      src={url}
      title={source.label}
      className="h-full w-full border-0"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={onLoaded}
    />
  );
}

export function Player({ slug, poster, sources, autoplay = false }: PlayerProps) {
  const playable = sources.filter((source) => source.type !== "external");
  const initialSource = playable[0] || sources[0] || null;
  const [activeId, setActiveId] = useState<string | null>(
    initialSource?.id || null,
  );
  const [loading, setLoading] = useState(
    Boolean(initialSource && initialSource.type !== "external"),
  );
  const tracked = useRef(false);
  const handleLoading = useCallback(
    (value: boolean) => setLoading(value),
    [],
  );

  const active =
    sources.find((source) => source.id === activeId) ||
    playable[0] ||
    sources[0] ||
    null;

  const track = () => {
    if (tracked.current) return;
    tracked.current = true;
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => undefined);
  };

  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
      <div className="relative aspect-video w-full bg-black">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-white/40">
              <Film size={26} />
            </span>
            <div>
              <p className="text-lg font-bold text-white/80">
                No playable source yet
              </p>
              <p className="mt-1 max-w-sm text-sm text-white/40">
                Add a licensed embed, HLS or MP4 source from the admin panel.
              </p>
            </div>
          </div>
        ) : active.type === "external" ? (
          <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm"
              style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
            />
            <div className="relative z-10 max-w-md">
              <span className="badge mb-3 text-gold">Official provider</span>
              <p className="text-xl font-extrabold text-white">
                {active.label}
              </p>
              <p className="mt-2 text-sm text-white/50">
                Cinewood does not stream this title. Continue to the provider to
                watch it through a legal subscription, rent or purchase.
              </p>
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={track}
                className="btn-gold mt-6"
              >
                <ExternalLink size={16} /> Open {externalUrl(active.url)}
              </a>
            </div>
          </div>
        ) : active.type === "embed" || active.type === "youtube" ? (
          <div onClick={track} className="h-full w-full">
            <EmbedFrame source={active} onLoaded={() => setLoading(false)} />
          </div>
        ) : (
          <div onClick={track} className="h-full w-full">
            <NativePlayer
              source={active}
              poster={poster}
              autoplay={autoplay}
              onLoadingChange={handleLoading}
            />
          </div>
        )}

        {loading && active && active.type !== "external" ? (
          <div className="pointer-events-none absolute inset-0 z-[80] grid place-items-center bg-black/35">
            <div className="flex flex-col items-center gap-3">
              <span className="relative grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-black/60 backdrop-blur">
                <span className="absolute inset-1 animate-spin rounded-full border-2 border-white/10 border-t-gold" />
                <Play
                  size={19}
                  fill="currentColor"
                  className="ml-0.5 text-white/75"
                />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                Loading {sourceKindLabel(active)}…
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/[0.07] bg-[#0c0e15] px-4 py-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/40">
            <Tv size={14} className="text-gold" />
            Sources
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
              {sources.length}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-white/35">
            <ShieldCheck size={13} className="text-emerald-400/70" />
            Try another source if playback stalls.
          </p>
        </div>

        {sources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => {
                  setActiveId(source.id);
                  setLoading(source.type !== "external");
                  if (source.type !== "external") track();
                }}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition",
                  active?.id === source.id
                    ? "border-gold/50 bg-gold/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg",
                    active?.id === source.id
                      ? "bg-gold text-black"
                      : "bg-white/5 text-white/40 group-hover:text-gold",
                  )}
                >
                  {source.type === "external" ? (
                    <ExternalLink size={14} />
                  ) : (
                    <Play size={13} fill="currentColor" />
                  )}
                </span>
                <span>
                  <span className="block max-w-[210px] truncate text-sm font-bold">
                    {source.label}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/35">
                    {sourceKindLabel(source)}
                    {source.quality ? <> · {source.quality}</> : null}
                    {source.language ? <> · {source.language}</> : null}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-xs text-white/40">
            <Info size={14} /> Sources can be added from the admin movie editor.
          </p>
        )}
      </div>
    </div>
  );
}
