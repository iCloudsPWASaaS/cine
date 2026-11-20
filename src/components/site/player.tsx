"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import {
  ExternalLink,
  Film,
  Info,
  Play,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tv,
} from "lucide-react";
import type { MovieSource } from "@/lib/types";
import {
  cn,
  externalUrl,
  isSandboxIncompatibleHost,
  isSandboxSafeHost,
  normalizeEmbedUrl,
  youtubeEmbed,
} from "@/lib/utils";

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
        moreVideoAttr: {
          playsInline: true,
          "webkit-playsinline": true,
          "x5-playsinline": true,
          "x5-video-player-type": "h5",
          "x5-video-player-fullscreen": "true",
        } as any,
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

type ShieldMode = "auto" | "strict" | "compatible";

interface EmbedFrameProps {
  source: MovieSource;
  shieldMode: ShieldMode;
  onLoaded: () => void;
  onBlockedPopup: () => void;
}

function EmbedFrame({
  source,
  shieldMode,
  onLoaded,
  onBlockedPopup,
}: EmbedFrameProps) {
  const url =
    source.type === "youtube"
      ? youtubeEmbed(source.url)
      : normalizeEmbedUrl(source.url);

  const canSandbox = source.type === "youtube" || isSandboxSafeHost(url);
  const useStrictSandbox =
    shieldMode === "strict" || (shieldMode === "auto" && canSandbox);

  useEffect(() => {
    const originalOpen = window.open;
    const blockedOpen: typeof window.open = () => {
      onBlockedPopup();
      return null;
    };

    window.open = blockedOpen;

    const handleBlur = () => {
      if (document.activeElement?.tagName === "IFRAME") {
        window.setTimeout(() => {
          try {
            window.focus();
          } catch {
            // ignore
          }
        }, 10);
      }
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.open = originalOpen;
      window.removeEventListener("blur", handleBlur);
    };
  }, [onBlockedPopup]);

  return (
    <iframe
      key={`${url}-${useStrictSandbox ? "sandboxed" : "compatible"}`}
      src={url}
      title={source.label}
      className="h-full w-full border-0"
      sandbox={
        useStrictSandbox
          ? "allow-scripts allow-same-origin allow-forms allow-presentation"
          : undefined
      }
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
      allowFullScreen
      referrerPolicy="origin"
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
  const [shieldMode, setShieldMode] = useState<ShieldMode>("auto");
  const [blockedPopups, setBlockedPopups] = useState(0);
  const tracked = useRef(false);
  const handleLoading = useCallback(
    (value: boolean) => setLoading(value),
    [],
  );
  const handleBlockedPopup = useCallback(() => {
    setBlockedPopups((prev) => prev + 1);
  }, []);

  const active =
    sources.find((source) => source.id === activeId) ||
    playable[0] ||
    sources[0] ||
    null;

  const activeNormalizedUrl = active
    ? active.type === "youtube"
      ? youtubeEmbed(active.url)
      : normalizeEmbedUrl(active.url)
    : "";
  const activeRejectsSandbox =
    Boolean(active) &&
    active?.type !== "youtube" &&
    isSandboxIncompatibleHost(activeNormalizedUrl);

  const effectiveShieldMode =
    activeRejectsSandbox && shieldMode === "strict"
      ? "compatible"
      : shieldMode;

  const isStrictSandboxed =
    Boolean(active) &&
    (active?.type === "hls" ||
      active?.type === "mp4" ||
      effectiveShieldMode === "strict" ||
      (effectiveShieldMode === "auto" &&
        (active?.type === "youtube" ||
          isSandboxSafeHost(activeNormalizedUrl))));

  const cycleShieldMode = () => {
    setShieldMode((current) => {
      if (activeRejectsSandbox) {
        return current === "compatible" ? "auto" : "compatible";
      }
      if (current === "auto") return "strict";
      if (current === "strict") return "compatible";
      return "auto";
    });
    if (active && active.type !== "external") {
      setLoading(true);
    }
  };

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
    <div className="player-card overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] sm:rounded-[26px]">
      <div className="player-stage relative aspect-video w-full bg-black">
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
            <EmbedFrame
              source={active}
              shieldMode={effectiveShieldMode}
              onLoaded={() => setLoading(false)}
              onBlockedPopup={handleBlockedPopup}
            />
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
          <div className="flex flex-wrap items-center gap-2">
            {active && (active.type === "embed" || active.type === "youtube") ? (
              <button
                type="button"
                onClick={cycleShieldMode}
                title="Click to switch Popup Shield mode (Auto / Strict Sandbox / Compatible)"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                  isStrictSandboxed
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/50"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/50",
                )}
              >
                {isStrictSandboxed ? (
                  <ShieldCheck size={13} className="text-emerald-400" />
                ) : effectiveShieldMode === "compatible" ? (
                  <ShieldAlert size={13} className="text-amber-400" />
                ) : (
                  <Shield size={13} className="text-amber-400" />
                )}
                Popup Shield:{" "}
                {effectiveShieldMode === "auto"
                  ? isStrictSandboxed
                    ? "ON (Sandboxed)"
                    : "Smart Guard"
                  : effectiveShieldMode === "strict"
                    ? "Strict (No Popups)"
                    : "Compatible"}
                {blockedPopups > 0 ? (
                  <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px]">
                    {blockedPopups} blocked
                  </span>
                ) : null}
              </button>
            ) : (
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                <ShieldCheck size={13} className="text-emerald-400" />
                Popup-free native stream
              </p>
            )}
          </div>
        </div>

        {sources.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
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
                  "group inline-flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition sm:gap-2 sm:px-3.5 sm:py-2.5",
                  active?.id === source.id
                    ? "border-gold/50 bg-gold/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
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
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold sm:max-w-[210px]">
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
