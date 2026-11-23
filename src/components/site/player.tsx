"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { saveProgress } from "@/lib/local-library";
import type { MovieSource, MovieSubtitle, SourceType } from "@/lib/types";
import {
  cn,
  externalUrl,
  isSandboxIncompatibleHost,
  isSandboxSafeHost,
  normalizeEmbedUrl,
  upgradeLegacyGatewayUrl,
  withSubtitleParams,
  youtubeEmbed,
} from "@/lib/utils";

interface PlayerProps {
  slug: string;
  title: string;
  type: string;
  releaseDate?: string | null;
  poster?: string | null;
  sources: MovieSource[];
  subtitles?: MovieSubtitle[];
  autoplay?: boolean;
}

function subtitleType(url: string | undefined | null) {
  return /\.vtt(?:$|\?)/i.test(url || "") ? "vtt" : "srt";
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

const SUBTITLE_STYLE = { color: "#fff", fontSize: "20px" } as const;

function subtitleLoader(url: string) {
  return `/api/subtitles?url=${encodeURIComponent(url)}`;
}

function normalizeSubtitle(text: string, type: "vtt" | "srt") {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (type === "vtt") {
    return /^WEBVTT/i.test(clean) ? `${clean}\n` : `WEBVTT\n\n${clean}\n`;
  }
  const body = clean
    .replace(/^\s*\d+\s*\n(?=\d{2}:\d{2}:\d{2}[,.])/gm, "")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${body}\n`;
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenTarget = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function browserFullscreenElement() {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement || doc.webkitFullscreenElement || null;
}

function requestBrowserFullscreen(element: HTMLElement) {
  const target = element as FullscreenTarget;
  if (target.requestFullscreen) return Promise.resolve(target.requestFullscreen());
  if (target.webkitRequestFullscreen) {
    return Promise.resolve(target.webkitRequestFullscreen());
  }
  return Promise.reject(new Error("Fullscreen is not supported"));
}

function exitBrowserFullscreen() {
  const doc = document as FullscreenDocument;
  if (doc.exitFullscreen) return Promise.resolve(doc.exitFullscreen());
  if (doc.webkitExitFullscreen) return Promise.resolve(doc.webkitExitFullscreen());
  return Promise.resolve();
}

function NativePlayer({
  source,
  sourceType,
  poster,
  autoplay,
  subtitleUrl,
  subtitleLabel,
  onLoadingChange,
  onProgress,
}: {
  source: MovieSource;
  sourceType: SourceType;
  poster?: string | null;
  autoplay: boolean;
  subtitleUrl?: string | null;
  subtitleLabel?: string | null;
  onLoadingChange: (loading: boolean) => void;
  onProgress: (position: number, duration: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const subtitleUrlRef = useRef(subtitleUrl);
  const subtitleLabelRef = useRef(subtitleLabel);
  const subtitleRequestRef = useRef(0);
  const subtitleBlobRef = useRef<string | null>(null);
  const subtitleSwitchLockRef = useRef<Promise<unknown>>(Promise.resolve());
  const applySubtitleRef = useRef<
    (art: Artplayer, url?: string | null, label?: string | null) => Promise<void>
  >(async () => undefined);
  const lastProgressRef = useRef(0);

  const switchSubtitle = useCallback(
    (
      art: Artplayer,
      url: string,
      option: Parameters<Artplayer["subtitle"]["switch"]>[1],
    ) => {
      const task = subtitleSwitchLockRef.current.then(() =>
        art.subtitle.switch(url, option),
      );
      subtitleSwitchLockRef.current = task.catch(() => undefined);
      return task;
    },
    [],
  );

  const clearSubtitle = useCallback(async (art: Artplayer) => {
    const requestId = ++subtitleRequestRef.current;
    const url = URL.createObjectURL(
      new Blob(["WEBVTT\n\n"], { type: "text/vtt" }),
    );
    try {
      await switchSubtitle(art, url, {
        type: "vtt",
        name: "",
        style: SUBTITLE_STYLE,
      });
      if (requestId !== subtitleRequestRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (subtitleBlobRef.current && subtitleBlobRef.current !== url) {
        URL.revokeObjectURL(subtitleBlobRef.current);
      }
      subtitleBlobRef.current = url;
      const subtitle = containerRef.current?.querySelector<HTMLElement>(
        ".art-subtitle",
      );
      if (subtitle) subtitle.innerHTML = "";
    } catch {
      URL.revokeObjectURL(url);
    }
  }, [switchSubtitle]);

  const applySubtitle = useCallback(
    async (art: Artplayer, url?: string | null, label?: string | null) => {
      const requestId = ++subtitleRequestRef.current;
      art.subtitle.style(SUBTITLE_STYLE);
      if (!url) {
        await clearSubtitle(art);
        return;
      }
      try {
        const response = await fetch(subtitleLoader(url), {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Subtitle request failed");
        const raw = await response.text();
        if (requestId !== subtitleRequestRef.current) return;
        const vtt = normalizeSubtitle(raw, subtitleType(url));
        const blobUrl = URL.createObjectURL(
          new Blob([vtt], { type: "text/vtt" }),
        );
        await switchSubtitle(art, blobUrl, {
          type: "vtt",
          name: label || "Subtitle",
          style: SUBTITLE_STYLE,
        });
        if (requestId !== subtitleRequestRef.current) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        if (subtitleBlobRef.current && subtitleBlobRef.current !== blobUrl) {
          URL.revokeObjectURL(subtitleBlobRef.current);
        }
        subtitleBlobRef.current = blobUrl;
        const subtitle = containerRef.current?.querySelector<HTMLElement>(
          ".art-subtitle",
        );
        if (subtitle) subtitle.innerHTML = "";
      } catch {
        if (requestId === subtitleRequestRef.current) {
          art.notice.show = "Subtitle could not be loaded";
          await clearSubtitle(art);
        }
      }
    },
    [clearSubtitle, switchSubtitle],
  );

  useEffect(() => {
    applySubtitleRef.current = applySubtitle;
  }, [applySubtitle]);

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
      const streamUrl = upgradeLegacyGatewayUrl(source.url);
      const artType =
        sourceType === "hls" || /\.m3u8(?:[?#]|$)/i.test(streamUrl)
          ? "m3u8"
          : undefined;

      art = new Player({
        container,
        url: streamUrl,
        type: artType,
        poster: poster || undefined,
        autoplay,
        volume: 0.75,
        theme: "#6c5ce7",
        setting: true,
        playbackRate: true,
        aspectRatio: true,
        playsInline: true,
        fullscreen: false,
        fullscreenWeb: false,
        pip: true,
        miniProgressBar: true,
        airplay: true,
        autoPlayback: true,
        hotkey: true,
        subtitle: {
          url: "",
          name: "",
          type: "vtt",
          style: SUBTITLE_STYLE,
          escape: true,
          encoding: "utf-8",
          onVttLoad: (vtt: string) => vtt,
        },
        moreVideoAttr: {
          playsInline: true,
          "webkit-playsinline": true,
          "x5-playsinline": true,
          "x5-video-player-type": "h5",
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
      void applySubtitleRef.current(
        art,
        subtitleUrlRef.current,
        subtitleLabelRef.current,
      );

      art.on("play", () => {
        if (art) art.notice.show = "";
      });
      art.on("ready", () => onLoadingChange(false));
      art.on("canplay", () => onLoadingChange(false));
      art.on("playing", () => onLoadingChange(false));
      art.on("waiting", () => onLoadingChange(true));
      art.on("error", () => onLoadingChange(false));
      art.on("timeupdate", () => {
        const player = artRef.current;
        if (!player) return;
        const now = Date.now();
        if (now - lastProgressRef.current < 5000) return;
        lastProgressRef.current = now;
        onProgress(
          Number(player.currentTime) || 0,
          Number(player.duration) || 0,
        );
      });
    };

    boot();

    return () => {
      cancelled = true;
      subtitleRequestRef.current += 1;
      artRef.current = null;
      if (subtitleBlobRef.current) {
        URL.revokeObjectURL(subtitleBlobRef.current);
        subtitleBlobRef.current = null;
      }
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
  }, [source.url, sourceType, poster, autoplay, onLoadingChange, onProgress]);

  useEffect(() => {
    subtitleUrlRef.current = subtitleUrl;
    subtitleLabelRef.current = subtitleLabel;
    const art = artRef.current;
    if (!art) return;
    void applySubtitle(art, subtitleUrl, subtitleLabel);
  }, [subtitleUrl, subtitleLabel, applySubtitle]);

  return <div ref={containerRef} className="h-full w-full" />;
}

interface EmbedFrameProps {
  source: MovieSource;
  subtitle?: MovieSubtitle | null;
  onLoaded: () => void;
}

function EmbedFrame({ source, subtitle, onLoaded }: EmbedFrameProps) {
  const url = withSubtitleParams(
    source.type === "youtube"
      ? youtubeEmbed(source.url)
      : normalizeEmbedUrl(source.url),
    subtitle,
  );

  const useStrictSandbox =
    (source.type === "youtube" || isSandboxSafeHost(url)) &&
    !isSandboxIncompatibleHost(url);

  useEffect(() => {
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
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

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

export function Player({
  slug,
  title,
  type,
  releaseDate,
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
  const [webFullscreen, setWebFullscreen] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
  const subtitleOptions = useMemo(
    () => [
      { id: null, label: "Off" },
      ...subtitles.map((item) => ({ id: item.id, label: item.label })),
    ],
    [subtitles],
  );
  const handleLoading = useCallback(
    (value: boolean) => setLoading(value),
    [],
  );
  const handleProgress = useCallback(
    (position: number, duration: number) => {
      saveProgress(
        {
          id: slug,
          slug,
          title,
          poster_url: poster || null,
          backdrop_url: poster,
          type,
          release_date: releaseDate || null,
        },
        position,
        duration,
      );
    },
    [slug, title, type, releaseDate, poster],
  );

  useEffect(() => {
    const onChange = () => {
      const element = browserFullscreenElement();
      const stage = stageRef.current;
      setNativeFullscreen(
        Boolean(
          stage && element && (element === stage || stage.contains(element)),
        ),
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
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

  useEffect(() => {
    if (!webFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWebFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [webFullscreen]);

  const exitFullscreenMode = useCallback(async () => {
    setWebFullscreen(false);
    if (nativeFullscreen) {
      try {
        await exitBrowserFullscreen();
      } catch {
        // ignore
      }
      setNativeFullscreen(false);
    }
  }, [nativeFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (nativeFullscreen || webFullscreen) {
      await exitFullscreenMode();
      return;
    }
    try {
      await requestBrowserFullscreen(stage);
      setNativeFullscreen(true);
      const orientation = screen.orientation as
        | (ScreenOrientation & { lock?: (value: string) => Promise<void> })
        | undefined;
      if (orientation?.lock) {
        try {
          await orientation.lock("landscape");
        } catch {
          // ignore
        }
      }
    } catch {
      setWebFullscreen(true);
    }
  }, [nativeFullscreen, webFullscreen, exitFullscreenMode]);

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
              <span className="badge mb-3 text-violet-300/80">
                Official provider
              </span>
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
                className="flix-btn mt-6"
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
              onLoaded={() => setLoading(false)}
            />
          </div>
        ) : (
          <div onClick={track} className="h-full w-full">
            <NativePlayer
              source={active}
              sourceType={active.type}
              poster={poster}
              autoplay={autoplay}
              subtitleUrl={activeSubtitle?.url}
              subtitleLabel={activeSubtitle?.label}
              onLoadingChange={handleLoading}
              onProgress={handleProgress}
            />
          </div>
        )}

        {active && active.type !== "external" ? (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreenActive ? "Exit full screen" : "Full screen"}
            title={fullscreenActive ? "Exit full screen" : "Full screen"}
            className="player-fullscreen-button absolute right-3 top-3 z-[90] h-9 w-9 place-items-center rounded-lg border border-white/15 bg-black/60 text-white/85 backdrop-blur transition hover:border-brand/50 hover:text-brand"
          >
            {fullscreenActive ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        ) : null}

        {fullscreenActive && subtitles.length > 0 ? (
          <div className="player-subtitle-overlay hide-scrollbar absolute top-14 right-3 left-3 z-[95] flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-1.5 backdrop-blur">
            <span className="mr-1 flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              <Subtitles size={12} className="text-violet-300" /> Subtitles
            </span>
            {subtitleOptions.map((option) => (
              <button
                key={option.id || "off"}
                type="button"
                onClick={() => setActiveSubtitleId(option.id)}
                className={cn(
                  "flix-pill shrink-0 transition hover:text-white",
                  activeSubtitleId === option.id && "flix-server-btn-active",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {loading && active && active.type !== "external" ? (
          <div className="pointer-events-none absolute inset-0 z-[80] grid place-items-center bg-black/35">
            <div className="flex flex-col items-center gap-3">
              <span className="relative grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-black/60 backdrop-blur">
                <span className="absolute inset-1 animate-spin rounded-full border-2 border-white/10 border-t-brand" />
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
            <Tv size={14} className="text-violet-300" />
            Sources
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
              {sources.length}
            </span>
          </div>
        </div>

        {subtitles.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              <Subtitles size={12} className="text-violet-300" /> Subtitles
            </span>
            {subtitleOptions.map((option) => (
              <button
                key={option.id || "off"}
                type="button"
                onClick={() => setActiveSubtitleId(option.id)}
                className={cn(
                  "flix-pill transition hover:text-white",
                  activeSubtitleId === option.id && "flix-server-btn-active",
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
              <Languages size={12} className="text-violet-300" /> Audio
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
                  "flix-pill inline-flex items-center gap-1.5 transition hover:text-white",
                  activeLanguage === group.name && "flix-server-btn-active",
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
                  "flix-server-btn group inline-flex items-center gap-2.5",
                  active?.id === source.id && "flix-server-btn-active",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    active?.id === source.id
                      ? "bg-brand text-white"
                      : "bg-white/5 text-white/40 group-hover:text-white",
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
