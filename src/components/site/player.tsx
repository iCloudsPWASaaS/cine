"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import {
  ExternalLink,
  Film,
  Info,
  Languages,
  Maximize2,
  Minimize2,
  Play,
  Subtitles,
  Tv,
} from "lucide-react";
import { groupSourcesByLanguage, normalizeLanguage } from "@/lib/languages";
import type { MovieSource, MovieSubtitle } from "@/lib/types";
import {
  cn,
  externalUrl,
  isSandboxSafeHost,
  normalizeEmbedUrl,
  withSubtitleParams,
  youtubeEmbed,
} from "@/lib/utils";

interface PlayerProps {
  slug: string;
  poster?: string | null;
  sources: MovieSource[];
  subtitles?: MovieSubtitle[];
  autoplay?: boolean;
}

function subscribeToTouch() {
  return () => {};
}

function getTouchSnapshot() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

function getServerTouchSnapshot() {
  return false;
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
  subtitleUrl,
  onLoadingChange,
}: {
  source: MovieSource;
  poster?: string | null;
  autoplay: boolean;
  subtitleUrl?: string | null;
  onLoadingChange: (loading: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const subtitleUrlRef = useRef(subtitleUrl);

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
        subtitle: {
          url: subtitleUrlRef.current || undefined,
          type: /\.srt(?:$|\?)/i.test(subtitleUrlRef.current || "")
            ? "srt"
            : "vtt",
          style: { color: "#fff", fontSize: "20px" },
        },
        moreVideoAttr: {
          playsInline: true,
          "webkit-playsinline": true,
          "x5-playsinline": true,
          "x5-video-player-type": "h5",
          "x5-video-orientation": "landscape",
        } as Record<string, string | boolean>,
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
      artRef.current = art;

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
      artRef.current = null;
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

  useEffect(() => {
    subtitleUrlRef.current = subtitleUrl;
    const art = artRef.current;
    if (!art) return;
    try {
      art.subtitle.url = subtitleUrl || "";
      const video = art.video;
      if (video?.textTracks) {
        for (let index = 0; index < video.textTracks.length; index += 1) {
          video.textTracks[index].mode = subtitleUrl ? "hidden" : "disabled";
        }
      }
      if (!subtitleUrl) {
        const subtitle = containerRef.current?.querySelector<HTMLElement>(
          ".art-subtitle",
        );
        if (subtitle) subtitle.innerHTML = "";
      }
    } catch {
      // ignore
    }
  }, [subtitleUrl]);

  return <div ref={containerRef} className="h-full w-full" />;
}

interface EmbedFrameProps {
  source: MovieSource;
  subtitle?: MovieSubtitle | null;
  allowNativeFullscreen: boolean;
  onLoaded: () => void;
}

function EmbedFrame({
  source,
  subtitle,
  allowNativeFullscreen,
  onLoaded,
}: EmbedFrameProps) {
  const url = withSubtitleParams(
    source.type === "youtube"
      ? youtubeEmbed(source.url)
      : normalizeEmbedUrl(source.url),
    subtitle,
  );

  const useStrictSandbox =
    source.type === "youtube" || isSandboxSafeHost(url);

  useEffect(() => {
    const originalOpen = window.open;
    const blockedOpen: typeof window.open = () => null;

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
  }, []);

  return (
    <iframe
      key={`${url}-${useStrictSandbox ? "sandboxed" : "compatible"}-${allowNativeFullscreen ? "native-fs" : "app-fs"}`}
      src={url}
      title={source.label}
      className="h-full w-full border-0"
      sandbox={
        useStrictSandbox
          ? "allow-scripts allow-same-origin allow-forms allow-presentation"
          : undefined
      }
      allow={
        allowNativeFullscreen
          ? "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
          : "autoplay; picture-in-picture; encrypted-media; gyroscope; accelerometer"
      }
      allowFullScreen={allowNativeFullscreen}
      referrerPolicy="origin"
      onLoad={onLoaded}
    />
  );
}

export function Player({
  slug,
  poster,
  sources,
  subtitles = [],
  autoplay = false,
}: PlayerProps) {
  const playable = sources.filter((source) => source.type !== "external");
  const languageGroups = useMemo(
    () => groupSourcesByLanguage(sources),
    [sources],
  );
  const [activeLanguage, setActiveLanguage] = useState<string>("All");
  const visibleSources =
    activeLanguage === "All"
      ? sources
      : languageGroups.find((group) => group.name === activeLanguage)?.sources ||
        [];
  const initialSource = playable[0] || sources[0] || null;
  const [activeId, setActiveId] = useState<string | null>(
    initialSource?.id || null,
  );
  const [loading, setLoading] = useState(
    Boolean(initialSource && initialSource.type !== "external"),
  );
  const tracked = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const isTouch = useSyncExternalStore(
    subscribeToTouch,
    getTouchSnapshot,
    getServerTouchSnapshot,
  );
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [webFullscreen, setWebFullscreen] = useState(false);
  const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
  const handleLoading = useCallback(
    (value: boolean) => setLoading(value),
    [],
  );

  useEffect(() => {
    const onChange = () => setNativeFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.classList.toggle("is-web-fullscreen", webFullscreen);
    document.body.classList.toggle("player-web-fullscreen-open", webFullscreen);
    return () => {
      stage.classList.remove("is-web-fullscreen");
      document.body.classList.remove("player-web-fullscreen-open");
    };
  }, [webFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (isTouch) {
      setWebFullscreen((value) => !value);
      return;
    }
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (stage.requestFullscreen) {
        await stage.requestFullscreen();
      } else {
        setWebFullscreen((value) => !value);
      }
    } catch {
      setWebFullscreen((value) => !value);
    }
  }, [isTouch]);

  const fullscreenActive = nativeFullscreen || webFullscreen;
  const activeSubtitle =
    subtitles.find((item) => item.id === activeSubtitleId) || null;

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
    <div className="player-card overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] sm:rounded-[26px]">
      <div
        ref={stageRef}
        data-source-type={active?.type || "none"}
        className="player-stage relative aspect-video w-full bg-black"
      >
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
              subtitle={activeSubtitle}
              allowNativeFullscreen={!isTouch}
              onLoaded={() => setLoading(false)}
            />
          </div>
        ) : (
          <div onClick={track} className="h-full w-full">
            <NativePlayer
              source={active}
              poster={poster}
              autoplay={autoplay}
              subtitleUrl={activeSubtitle?.url}
              onLoadingChange={handleLoading}
            />
          </div>
        )}

        {active && active.type !== "external" ? (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreenActive ? "Exit full screen" : "Full screen"}
            title={fullscreenActive ? "Exit full screen" : "Full screen"}
            className="player-fullscreen-button absolute right-3 top-3 z-[90] h-9 w-9 place-items-center rounded-lg border border-white/15 bg-black/60 text-white/85 backdrop-blur transition hover:border-gold/50 hover:text-gold"
          >
            {fullscreenActive ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        ) : null}

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
        </div>

        {subtitles.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              <Subtitles size={12} className="text-gold" /> Subtitles
            </span>
            {[
              { id: null, label: "Off" },
              ...subtitles.map((item) => ({ id: item.id, label: item.label })),
            ].map((option) => (
              <button
                key={option.id || "off"}
                type="button"
                onClick={() => setActiveSubtitleId(option.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                  activeSubtitleId === option.id
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/25 hover:text-white/80",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {sources.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              <Languages size={12} className="text-gold" /> Audio
            </span>
            {[
              { name: "All", count: sources.length },
              ...languageGroups.map((group) => ({
                name: group.name,
                count: group.sources.length,
              })),
            ].map((group) => (
              <button
                key={group.name}
                type="button"
                onClick={() => setActiveLanguage(group.name)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                  activeLanguage === group.name
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/25 hover:text-white/80",
                )}
              >
                {group.name}
                <span className="text-[10px] opacity-60">{group.count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {sources.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {visibleSources.map((source) => (
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
                    {source.language ? (
                      <>
                        {" · "}
                        {normalizeLanguage(source.language) === "Other"
                          ? source.language
                          : normalizeLanguage(source.language)}
                      </>
                    ) : null}
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
