import { clsx, type ClassValue } from "clsx";

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

export interface DetectedProvider {
  key: "streamwish" | "filemoon" | "doodstream" | "vidhide" | "youtube" | "hls" | "mp4" | "embed";
  name: string;
  slug: string;
  type: "hls" | "mp4" | "embed" | "youtube" | "external";
  url: string;
  quality: string;
  priority: number;
  baseUrl: string | null;
}

const HOST_PROVIDERS: {
  key: "streamwish" | "filemoon" | "doodstream" | "vidhide";
  name: string;
  slug: string;
  quality: string;
  priority: number;
  baseUrl: string;
  hostPattern: RegExp;
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
        ? `${parsed.protocol}//${parsed.host}/e/${codeMatch[1]}${parsed.search}`
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

export function normalizeEmbedUrl(url: string) {
  if (!url) return url;
  const detected = detectSourceProvider(url);
  if (!detected) return url;
  return detected.url;
}

export function externalUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
