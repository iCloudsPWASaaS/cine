import { clsx, type ClassValue } from "clsx";
import { languageCode } from "@/lib/languages";
import type { MovieSubtitle } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function yearOf(date: string | null | undefined) {
  if (!date) return null;
  return date.slice(0, 4);
}

export function formatRuntime(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

export function formatRating(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return Number(value).toFixed(1);
}

export function formatCount(value: number | null | undefined) {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function mediaLabel(type: string) {
  return type === "series" ? "Series" : "Movie";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function providerLogo(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : null;
}

export function youtubeEmbed(url: string) {
  if (!url) return url;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
  return url;
}

export type ProviderKey =
  | "streamwish"
  | "filemoon"
  | "doodstream"
  | "vidhide"
  | "streamtape"
  | "mixdrop"
  | "voe"
  | "vidguard"
  | "lulustream"
  | "mp4upload"
  | "gdrive"
  | "movies111"
  | "vidlink"
  | "vidsrcmov"
  | "vidsrc"
  | "vidcore"
  | "vidzen"
  | "autoembed"
  | "multiembed"
  | "twoembed"
  | "embedsu"
  | "vidfast"
  | "videasy"
  | "moviesapi"
  | "nontongo"
  | "youtube"
  | "hls"
  | "mp4"
  | "embed";

export interface DetectedProvider {
  key: ProviderKey;
  name: string;
  slug: string;
  type: "hls" | "mp4" | "embed" | "youtube" | "external";
  url: string;
  quality: string;
  priority: number;
  baseUrl: string | null;
}

const HOST_PROVIDERS: {
  key: ProviderKey;
  name: string;
  slug: string;
  quality: string;
  priority: number;
  baseUrl: string;
  hostPattern: RegExp;
  embedFormat?: (parsed: URL, code: string) => string;
}[] = [
  {
    key: "streamwish",
    name: "StreamWish",
    slug: "streamwish",
    quality: "HD",
    priority: 25,
    baseUrl: "https://streamwish.to",
    hostPattern:
      /(?:^|\.)(streamwish|swdyu|wishembed|sfastwish|flaswish|obeywish|cdnwish|asnwish|jodwish|swish|hlswish|playerwish|embedwish)\.[a-z0-9.]+$/i,
  },
  {
    key: "filemoon",
    name: "FileMoon",
    slug: "filemoon",
    quality: "1080p",
    priority: 24,
    baseUrl: "https://filemoon.sx",
    hostPattern:
      /(?:^|\.)(filemoon|moonmov|kerapoxy|1azayf9w|bymo|fmoonembed)\.[a-z0-9.]+$/i,
  },
  {
    key: "vidhide",
    name: "VidHide",
    slug: "vidhide",
    quality: "HD",
    priority: 23,
    baseUrl: "https://vidhidepro.com",
    hostPattern:
      /(?:^|\.)(vidhide|vidhidepro|vidhidevip|vidhidepre|vidhidefast|earnvids|smoothpre|dhtpre|peytonepre|callistanise)\.[a-z0-9.]+$/i,
  },
  {
    key: "doodstream",
    name: "DoodStream",
    slug: "doodstream",
    quality: "HD",
    priority: 22,
    baseUrl: "https://doodstream.com",
    hostPattern:
      /(?:^|\.)(dood|doodstream|d000d|d0000d|ds2play|ds2video|doods|do7go|myvidplay|vide0)\.[a-z0-9.]+$/i,
  },
  {
    key: "streamtape",
    name: "StreamTape",
    slug: "streamtape",
    quality: "HD",
    priority: 21,
    baseUrl: "https://streamtape.com",
    hostPattern:
      /(?:^|\.)(streamtape|strtape|strcloud|stape)\.[a-z0-9.]+$/i,
  },
  {
    key: "mixdrop",
    name: "MixDrop",
    slug: "mixdrop",
    quality: "HD",
    priority: 21,
    baseUrl: "https://mixdrop.co",
    hostPattern:
      /(?:^|\.)(mixdrop|mdbekjwqa|mdfx9dc8n)\.[a-z0-9.]+$/i,
  },
  {
    key: "voe",
    name: "Voe",
    slug: "voe",
    quality: "1080p",
    priority: 22,
    baseUrl: "https://voe.sx",
    hostPattern:
      /(?:^|\.)(voe|voe-unblock|launchreliantcleaverriver)\.[a-z0-9.]+$/i,
  },
  {
    key: "vidguard",
    name: "VidGuard",
    slug: "vidguard",
    quality: "1080p",
    priority: 22,
    baseUrl: "https://vidguard.to",
    hostPattern:
      /(?:^|\.)(vidguard|vgfplay|vgembed|listeamed|bembed)\.[a-z0-9.]+$/i,
  },
  {
    key: "lulustream",
    name: "LuluStream",
    slug: "lulustream",
    quality: "HD",
    priority: 21,
    baseUrl: "https://lulustream.com",
    hostPattern:
      /(?:^|\.)(lulustream|luluvdo|lulu)\.[a-z0-9.]+$/i,
  },
  {
    key: "mp4upload",
    name: "Mp4Upload",
    slug: "mp4upload",
    quality: "HD",
    priority: 20,
    baseUrl: "https://www.mp4upload.com",
    hostPattern: /(?:^|\.)mp4upload\.[a-z0-9.]+$/i,
    embedFormat: (parsed, code) =>
      `${parsed.protocol}//${parsed.host}/embed-${code.replace(/^embed-/, "")}.html`,
  },
];

const GATEWAY_PROVIDERS: {
  key: ProviderKey;
  name: string;
  slug: string;
  quality: string;
  priority: number;
  baseUrl: string;
  hostPattern: RegExp;
}[] = [
  {
    key: "movies111",
    name: "111Movies",
    slug: "movies111",
    quality: "1080p",
    priority: 60,
    baseUrl: "https://111movies.net",
    hostPattern: /(?:^|\.)111movies\.[a-z0-9.]+$/i,
  },
  {
    key: "vidlink",
    name: "VidLink Pro",
    slug: "vidlink",
    quality: "1080p",
    priority: 59,
    baseUrl: "https://vidlink.pro",
    hostPattern: /(?:^|\.)vidlink\.[a-z0-9.]+$/i,
  },
  {
    key: "vidsrcmov",
    name: "VidSrc.Mov",
    slug: "vidsrcmov",
    quality: "1080p",
    priority: 58,
    baseUrl: "https://vidsrc.mov",
    hostPattern: /(?:^|\.)vidsrc\.mov$/i,
  },
  {
    key: "vidcore",
    name: "VidCore",
    slug: "vidcore",
    quality: "4K",
    priority: 56,
    baseUrl: "https://vidcore.io",
    hostPattern: /(?:^|\.)vidcore\.(?:io|org)$/i,
  },
  {
    key: "vidzen",
    name: "VidZen",
    slug: "vidzen",
    quality: "4K",
    priority: 55,
    baseUrl: "https://vidzen.fun",
    hostPattern: /(?:^|\.)vidzen\.[a-z0-9.]+$/i,
  },
  {
    key: "vidsrc",
    name: "VidSrc",
    slug: "vidsrc",
    quality: "1080p",
    priority: 26,
    baseUrl: "https://vidsrc.icu",
    hostPattern: /(?:^|\.)(vidsrc|vidsrcme|vidsrcto)\.[a-z0-9.]+$/i,
  },
  {
    key: "multiembed",
    name: "MultiEmbed",
    slug: "streamwish",
    quality: "HD",
    priority: 57,
    baseUrl: "https://multiembed.mov",
    hostPattern: /(?:^|\.)(multiembed|superembed)\.[a-z0-9.]+$/i,
  },
  {
    key: "autoembed",
    name: "FileMoon",
    slug: "filemoon",
    quality: "1080p",
    priority: 25,
    baseUrl: "https://player.autoembed.cc",
    hostPattern: /(?:^|\.)autoembed\.[a-z0-9.]+$/i,
  },
  {
    key: "embedsu",
    name: "Embed.su",
    slug: "embedsu",
    quality: "1080p",
    priority: 24,
    baseUrl: "https://embed.su",
    hostPattern: /(?:^|\.)embed\.su$/i,
  },
  {
    key: "vidfast",
    name: "VidFast",
    slug: "vidfast",
    quality: "1080p",
    priority: 24,
    baseUrl: "https://vidfast.pro",
    hostPattern: /(?:^|\.)vidfast\.[a-z0-9.]+$/i,
  },
  {
    key: "videasy",
    name: "Videasy",
    slug: "videasy",
    quality: "1080p",
    priority: 24,
    baseUrl: "https://player.videasy.net",
    hostPattern: /(?:^|\.)videasy\.[a-z0-9.]+$/i,
  },
  {
    key: "twoembed",
    name: "DoodStream",
    slug: "doodstream",
    quality: "HD",
    priority: 23,
    baseUrl: "https://www.2embed.cc",
    hostPattern: /(?:^|\.)2embed\.[a-z0-9.]+$/i,
  },
  {
    key: "moviesapi",
    name: "MoviesAPI",
    slug: "moviesapi",
    quality: "1080p",
    priority: 23,
    baseUrl: "https://moviesapi.club",
    hostPattern: /(?:^|\.)moviesapi\.[a-z0-9.]+$/i,
  },
  {
    key: "nontongo",
    name: "NontonGo",
    slug: "nontongo",
    quality: "HD",
    priority: 22,
    baseUrl: "https://www.nontongo.win",
    hostPattern: /(?:^|\.)nontongo\.[a-z0-9.]+$/i,
  },
];

export function extractIframeSrc(input: string): string {
  const trimmed = input.trim();
  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) return iframeMatch[1].trim();
  return trimmed;
}

export function detectSourceProvider(rawInput: string): DetectedProvider | null {
  const raw = extractIframeSrc(rawInput);
  if (!raw) return null;

  const normalizedRaw = raw.startsWith("//") ? `https:${raw}` : raw;
  let parsed: URL;
  try {
    parsed = new URL(normalizedRaw);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

  for (const provider of HOST_PROVIDERS) {
    if (provider.hostPattern.test(host)) {
      const cleanPath = parsed.pathname.replace(/\.html?$/i, "");
      const codeMatch =
        cleanPath.match(
          /^\/(?:e|d|f|v|w|file|embed|download|watch)\/([A-Za-z0-9_-]+)/i,
        ) || cleanPath.match(/^\/([A-Za-z0-9_-]{6,})$/);
      const embedUrl = codeMatch
        ? provider.embedFormat
          ? provider.embedFormat(parsed, codeMatch[1])
          : `${parsed.protocol}//${parsed.host}/e/${codeMatch[1]}${parsed.search}`
        : parsed.toString();

      return {
        key: provider.key,
        name: provider.name,
        slug: provider.slug,
        type: "embed",
        url: embedUrl,
        quality: provider.quality,
        priority: provider.priority,
        baseUrl: provider.baseUrl,
      };
    }
  }

  for (const gateway of GATEWAY_PROVIDERS) {
    if (gateway.hostPattern.test(host)) {
      return {
        key: gateway.key,
        name: gateway.name,
        slug: gateway.slug,
        type: "embed",
        url: parsed.toString(),
        quality: gateway.quality,
        priority: gateway.priority,
        baseUrl: gateway.baseUrl,
      };
    }
  }

  if (/^drive\.google\.com$/i.test(host)) {
    const fileMatch = parsed.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
    const embedUrl = fileMatch
      ? `https://drive.google.com/file/d/${fileMatch[1]}/preview`
      : parsed.toString();
    return {
      key: "gdrive",
      name: "Google Drive",
      slug: "gdrive",
      type: "embed",
      url: embedUrl,
      quality: "HD",
      priority: 22,
      baseUrl: "https://drive.google.com",
    };
  }

  if (
    /(?:^|\.)youtube\.com$/i.test(host) ||
    /(?:^|\.)youtu\.be$/i.test(host)
  ) {
    return {
      key: "youtube",
      name: "YouTube",
      slug: "youtube",
      type: "youtube",
      url: youtubeEmbed(parsed.toString()),
      quality: "HD",
      priority: 10,
      baseUrl: "https://www.youtube.com",
    };
  }

  if (/\.m3u8(?:$|\?|#)/i.test(parsed.pathname + parsed.search)) {
    return {
      key: "hls",
      name: "Adaptive HLS",
      slug: "adaptive-hls",
      type: "hls",
      url: parsed.toString(),
      quality: "Auto",
      priority: 30,
      baseUrl: `${parsed.protocol}//${parsed.host}`,
    };
  }

  if (/\.(?:mp4|webm|m4v)(?:$|\?|#)/i.test(parsed.pathname + parsed.search)) {
    return {
      key: "mp4",
      name: "Direct MP4",
      slug: "open-cinema",
      type: "mp4",
      url: parsed.toString(),
      quality: "HD",
      priority: 28,
      baseUrl: `${parsed.protocol}//${parsed.host}`,
    };
  }

  return {
    key: "embed",
    name: host.split(".")[0]
      ? host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1)
      : "Embed",
    slug: slugify(host.split(".")[0] || "embed"),
    type: "embed",
    url: parsed.toString(),
    quality: "HD",
    priority: 15,
    baseUrl: `${parsed.protocol}//${parsed.host}`,
  };
}

export function upgradeLegacyGatewayUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    // Upgrade dead player.autoembed.cc -> live player.autoembed.me
    if (host === "player.autoembed.cc") {
      parsed.hostname = "player.autoembed.me";
      return parsed.toString();
    }

    // Unwrap outer ad-wrapper autoembed.co -> direct player.autoembed.me
    if (host === "autoembed.co") {
      const movieMatch = parsed.pathname.match(/^\/movie\/tmdb\/(\d+)/i);
      if (movieMatch) {
        return `https://player.autoembed.me/embed/movie/${movieMatch[1]}`;
      }
      const tvMatch = parsed.pathname.match(/^\/tv\/tmdb\/(\d+)-(\d+)-(\d+)/i);
      if (tvMatch) {
        return `https://player.autoembed.me/embed/tv/${tvMatch[1]}/${tvMatch[2]}/${tvMatch[3]}`;
      }
    }

    // Upgrade dead vidsrc mirrors (.icu, .xyz, .vip, .in, .pm, .net, .cc, .to) -> live vidsrc.su
    if (
      /^(?:vidsrc\.(?:icu|xyz|vip|in|pm|net|to)|vidsrcto\.[a-z]+)$/i.test(host)
    ) {
      const cleanPath = parsed.pathname.replace(/^\/v2\/embed\//i, "/embed/");
      return `https://vidsrc.su${cleanPath}${parsed.search}`;
    }

    if (host === "vidsrc.cc") {
      const cleanPath = parsed.pathname.replace(/^\/v2\/embed\//i, "/embed/");
      return `https://vidsrc.su${cleanPath}${parsed.search}`;
    }

    // Upgrade dead moviesapi.club -> live moviesapi.to
    if (host === "moviesapi.club") {
      parsed.hostname = "moviesapi.to";
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export function isSandboxIncompatibleHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    return /(?:^|\.)(?:2embed|autoembed|player\.autoembed|vidlink|vidfast|vidsrc|vidsrcto|multiembed|streamingnow|superembed|moviesapi|nontongo|embed\.su|videasy|filemoon|streamwish|vidhide|doodstream|dood|mixdrop|streamtape|voe|vidguard|lulustream|mp4upload)\b/i.test(
      host,
    );
  } catch {
    return false;
  }
}

export function isSandboxSafeHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    return /(?:^|\.)(?:youtube|youtube-nocookie|youtu|archive)\b/i.test(host);
  } catch {
    return false;
  }
}

export function normalizeEmbedUrl(url: string) {
  if (!url) return url;
  const upgraded = upgradeLegacyGatewayUrl(url);
  const detected = detectSourceProvider(upgraded);
  if (!detected) return upgraded;
  return upgradeLegacyGatewayUrl(detected.url);
}

export function externalUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function withSubtitleParams(
  url: string,
  subtitle?: MovieSubtitle | null,
) {
  if (!subtitle?.url) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (/multiembed\.mov|superembed\.stream|embedbandit\.com/.test(host)) {
      parsed.searchParams.set("sub_url", subtitle.url);
      parsed.searchParams.set("sub_label", subtitle.label);
    } else if (/vidlink\.pro/.test(host)) {
      parsed.searchParams.set("sub_file", subtitle.url);
      parsed.searchParams.set("sub_label", subtitle.label);
    } else if (/vidfast\./.test(host)) {
      const code = languageCode(subtitle.language) || "en";
      parsed.searchParams.set("sub", code);
    } else {
      return url;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
