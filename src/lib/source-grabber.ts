import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTmdbDetails,
  pickTmdbTrailer,
  searchTmdb,
  tmdbConfigured,
} from "@/lib/tmdb";
import type { SourceType } from "@/lib/types";
import {
  detectSourceProvider,
  upgradeLegacyGatewayUrl,
  type DetectedProvider,
} from "@/lib/utils";

const execFileAsync = promisify(execFile);

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface GrabbedSourceItem {
  label: string;
  url: string;
  type: SourceType;
  quality: string | null;
  language: string | null;
  priority: number;
  providerSlug: string;
  providerName: string;
  baseUrl: string | null;
}

const IGNORED_IFRAME_HOSTS =
  /(?:googletagmanager|google-analytics|doubleclick|facebook\.com|twitter\.com|instagram\.com|disqus\.com|recaptcha|cloudflare\.com\/cdn-cgi|ads\.|adservice|googlesyndication|histats\.com|llvpn\.com)/i;

const IGNORED_EXTENSIONS =
  /\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|json|xml)(?:$|\?)/i;

const DEAD_VIDEO_HTML_PATTERN =
  /(?:this\s+video\s+doesn't\s+exist|video\s+not\s+found|media\s+not\s+found|movie\s+not\s+found|episode\s+not\s+found|file\s+not\s+found|file\s+is\s+no\s+longer\s+available|file\s+was\s+deleted|this\s+video\s+is\s+unavailable|no\s+sources?\s+found|id="__next_error__"|404\s+not\s+found|sorry,\s+this\s+video\s+has\s+been\s+removed)/i;

function resolveUrl(candidate: string, baseUrl?: string): string | null {
  const cleaned = candidate
    .replace(/\\+/g, "")
    .replace(/&amp;/g, "&")
    .trim();
  if (!cleaned || cleaned.startsWith("javascript:") || cleaned.startsWith("about:") || cleaned.startsWith("data:")) {
    return null;
  }
  try {
    const resolved = baseUrl ? new URL(cleaned, baseUrl) : new URL(cleaned.startsWith("//") ? `https:${cleaned}` : cleaned);
    if (!["http:", "https:"].includes(resolved.protocol)) return null;
    if (IGNORED_IFRAME_HOSTS.test(resolved.hostname)) return null;
    if (IGNORED_EXTENSIONS.test(resolved.pathname)) return null;
    return upgradeLegacyGatewayUrl(resolved.toString());
  } catch {
    return null;
  }
}

function toGrabbedItem(detected: DetectedProvider, index = 0): GrabbedSourceItem {
  const suffix = index > 0 ? ` #${index + 1}` : "";
  return {
    label: `${detected.name}${detected.quality ? ` • ${detected.quality}` : ""}${suffix}`,
    url: upgradeLegacyGatewayUrl(detected.url),
    type: detected.type,
    quality: detected.quality || "HD",
    language: null,
    priority: Math.max(1, detected.priority - index),
    providerSlug: detected.slug,
    providerName: detected.name,
    baseUrl: detected.baseUrl,
  };
}

function extractCandidateUrlsFromHtml(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  const unescaped = html.replace(/\\\//g, "/");

  // 1. <iframe src="..."> or data-src / data-lazy-src
  const iframeRegex =
    /<iframe[^>]+(?:src|data-src|data-lazy-src|data-url)=["']([^"']+)["']/gi;
  for (const match of unescaped.matchAll(iframeRegex)) {
    const url = resolveUrl(match[1], pageUrl);
    if (url) found.push(url);
  }

  // 2. Elements with data-src / data-link / data-video / data-embed / data-iframe / data-file
  const dataAttrRegex =
    /data-(?:src|url|link|embed|video|iframe|file|drive|source|player)=["']([^"']+)["']/gi;
  for (const match of unescaped.matchAll(dataAttrRegex)) {
    const raw = match[1].trim();
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//") || raw.startsWith("/embed") || raw.startsWith("/e/")) {
      const url = resolveUrl(raw, pageUrl);
      if (url && url !== pageUrl) found.push(url);
    }
  }

  // 3. <video src="..."> and <source src="...">
  const mediaTagRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
  for (const match of unescaped.matchAll(mediaTagRegex)) {
    const url = resolveUrl(match[1], pageUrl);
    if (url) found.push(url);
  }

  // 4. Direct .m3u8 or .mp4 links in scripts/markup
  const streamRegex =
    /https?:\/\/[^\s"'<>\\`]+\.(?:m3u8|mp4)(?:\?[^\s"'<>\\`]*)?/gi;
  for (const match of unescaped.matchAll(streamRegex)) {
    const url = resolveUrl(match[0], pageUrl);
    if (url) found.push(url);
  }

  // 5. Known host links anywhere in scripts/HTML
  const hostLinkRegex =
    /https?:\/\/(?:[a-z0-9-]+\.)*(?:streamwish|swdyu|wishembed|sfastwish|flaswish|obeywish|cdnwish|asnwish|jodwish|swish|hlswish|playerwish|embedwish|filemoon|moonmov|kerapoxy|1azayf9w|bymo|fmoonembed|vidhide|vidhidepro|vidhidevip|vidhidepre|vidhidefast|earnvids|smoothpre|dhtpre|peytonepre|callistanise|dood|doodstream|d000d|d0000d|ds2play|ds2video|doods|do7go|myvidplay|vide0|streamtape|strtape|strcloud|mixdrop|voe|vidguard|vgfplay|listeamed|lulustream|luluvdo|mp4upload|vidlink|vidfast|2embed|nontongo|moviesapi|autoembed|multiembed|vidsrc)\.[a-z0-9.]+\/[^\s"'<>\\`]+/gi;
  for (const match of unescaped.matchAll(hostLinkRegex)) {
    const url = resolveUrl(match[0], pageUrl);
    if (url) found.push(url);
  }

  return Array.from(new Set(found));
}

function normalizeTitleTokens(title: string): string[] {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !["the", "and", "for", "movie", "part"].includes(token));
}

export async function verifySourcePlayable(
  item: GrabbedSourceItem,
  movieTitle?: string,
): Promise<boolean> {
  if (item.type === "external") return true;

  // 1. Verify YouTube embed via oEmbed API
  if (item.type === "youtube") {
    const idMatch = item.url.match(/\/embed\/([A-Za-z0-9_-]{6,})/i);
    if (!idMatch?.[1]) return false;
    try {
      const watchUrl = `https://www.youtube.com/watch?v=${idMatch[1]}`;
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
        {
          headers: { "User-Agent": BROWSER_UA },
          signal: AbortSignal.timeout(4500),
        },
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  // 2. Verify direct HLS (.m3u8) or MP4 stream reachability
  if (item.type === "hls" || item.type === "mp4") {
    try {
      const origin = new URL(item.url).origin;
      const res = await fetch(item.url, {
        method: "GET",
        headers: {
          "User-Agent": BROWSER_UA,
          Range: "bytes=0-2047",
          Referer: `${origin}/`,
        },
        signal: AbortSignal.timeout(5500),
      });
      if (!res.ok && res.status !== 206) return false;
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (item.type === "hls") {
        if (
          contentType.includes("mpegurl") ||
          contentType.includes("octet-stream") ||
          contentType.includes("audio/") ||
          contentType.includes("video/")
        ) {
          return true;
        }
        const sample = await res.text();
        return sample.includes("#EXTM3U");
      }
      return !contentType.includes("text/html");
    } catch {
      return false;
    }
  }

  // 3. Verify iframe embed provider (checks server is online + video exists)
  try {
    const parsed = new URL(item.url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const res = await fetch(item.url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${parsed.origin}/`,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 404 || res.status === 410 || res.status === 451 || res.status >= 500) {
      return false;
    }

    const html = await res.text();
    if (!html || html.length < 120) return false;

    if (DEAD_VIDEO_HTML_PATTERN.test(html)) {
      return false;
    }

    // Host-specific existence checks
    if (host.includes("multiembed.mov") || host.includes("streamingnow.mov")) {
      return (
        res.ok &&
        html.length > 15000 &&
        !html.includes("This video doesn't exist") &&
        !html.includes("Not Found!")
      );
    }

    if (host.includes("2embed.")) {
      const pageTitle = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
      if (!pageTitle || /^2embed\.cc\s*-\s*player$/i.test(pageTitle)) {
        return false;
      }
      return res.ok;
    }

    if (host.includes("vidlink.")) {
      return res.ok && !html.includes("__next_error__") && html.length > 15000;
    }

    if (host.includes("vidfast.")) {
      if (!res.ok) return false;
      if (movieTitle) {
        const tokens = normalizeTitleTokens(movieTitle);
        const lowerHtml = html.toLowerCase();
        if (tokens.length > 0 && !tokens.some((token) => lowerHtml.includes(token))) {
          return false;
        }
      }
      return html.length > 20000;
    }

    if (host.includes("nontongo.")) {
      if (!res.ok) return false;
      const pageTitle = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
      return Boolean(pageTitle) && !/bad gateway|error|404/i.test(pageTitle);
    }

    return res.ok;
  } catch {
    return false;
  }
}

async function tryYtDlp(targetUrl: string): Promise<GrabbedSourceItem[]> {
  try {
    const { stdout } = await execFileAsync(
      "yt-dlp",
      ["-J", "--no-playlist", "--no-warnings", targetUrl],
      { timeout: 12000, maxBuffer: 16 * 1024 * 1024 },
    );
    const info = JSON.parse(stdout) as {
      url?: string;
      formats?: {
        url?: string;
        ext?: string;
        height?: number;
        protocol?: string;
        acodec?: string;
        vcodec?: string;
      }[];
    };

    const items: GrabbedSourceItem[] = [];
    const formats = Array.isArray(info.formats) ? info.formats : [];
    const playable = formats.filter(
      (f) =>
        f.url &&
        f.vcodec !== "none" &&
        (f.protocol?.includes("m3u8") || f.ext === "mp4" || f.url.includes(".m3u8")),
    );

    const best = playable.slice(-3).reverse();
    for (const f of best) {
      if (!f.url) continue;
      const isHls =
        Boolean(f.protocol?.includes("m3u8")) || f.url.includes(".m3u8");
      const quality = f.height ? `${f.height}p` : isHls ? "Auto" : "HD";
      items.push({
        label: `${isHls ? "Adaptive HLS" : "Direct MP4"} • ${quality}`,
        url: f.url,
        type: isHls ? "hls" : "mp4",
        quality,
        language: null,
        priority: isHls ? 30 : 28,
        providerSlug: isHls ? "adaptive-hls" : "open-cinema",
        providerName: isHls ? "Adaptive HLS" : "Open Cinema",
        baseUrl: null,
      });
    }

    if (items.length === 0 && info.url) {
      const detected = detectSourceProvider(info.url);
      if (detected) items.push(toGrabbedItem(detected));
    }

    return items;
  } catch {
    return [];
  }
}

async function inspectPageUrl(
  pageUrl: string,
  depth = 0,
): Promise<GrabbedSourceItem[]> {
  const results: GrabbedSourceItem[] = [];
  const nestedPages: string[] = [];

  try {
    const origin = new URL(pageUrl).origin;
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${origin}/`,
      },
      signal: AbortSignal.timeout(9000),
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (
        contentType.includes("mpegurl") ||
        contentType.includes("apple.mpegurl")
      ) {
        const detected = detectSourceProvider(`${pageUrl}#.m3u8`);
        if (detected) {
          return [{ ...toGrabbedItem(detected), url: pageUrl }];
        }
      }
      if (contentType.startsWith("video/")) {
        return [
          {
            label: "Direct MP4 • HD",
            url: pageUrl,
            type: "mp4",
            quality: "HD",
            language: null,
            priority: 28,
            providerSlug: "open-cinema",
            providerName: "Open Cinema",
            baseUrl: origin,
          },
        ];
      }

      const html = await response.text();
      const candidates = extractCandidateUrlsFromHtml(html, pageUrl);
      for (const candidate of candidates) {
        const detected = detectSourceProvider(candidate);
        if (!detected) continue;

        if (detected.key !== "embed") {
          results.push(toGrabbedItem(detected));
        } else {
          results.push(toGrabbedItem(detected));
          if (depth < 1 && nestedPages.length < 3) {
            nestedPages.push(detected.url);
          }
        }
      }
    }
  } catch {
    // Page fetch timed out or blocked; continue to yt-dlp / direct fallback
  }

  for (const nestedUrl of nestedPages) {
    const nestedItems = await inspectPageUrl(nestedUrl, depth + 1);
    for (const item of nestedItems) {
      if (item.providerSlug !== "embed") {
        results.push(item);
      }
    }
  }

  if (results.length === 0 && depth === 0) {
    const ytdlpItems = await tryYtDlp(pageUrl);
    results.push(...ytdlpItems);
  }

  return results;
}

export async function grabSourcesFromInput(
  rawInput: string,
): Promise<GrabbedSourceItem[]> {
  const input = rawInput.trim();
  if (!input) return [];

  const tokens: string[] = [];

  // Extract any <iframe src="..."> first
  for (const match of input.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)) {
    if (match[1]) tokens.push(match[1].trim());
  }

  // Extract all http(s) or protocol-relative URLs
  for (const match of input.matchAll(/(?:https?:)?\/\/[^\s"'<>\\,]+/gi)) {
    const candidate = match[0].startsWith("//")
      ? `https:${match[0]}`
      : match[0];
    tokens.push(candidate);
  }

  const uniqueTokens = Array.from(new Set(tokens));
  if (uniqueTokens.length === 0) {
    const single = detectSourceProvider(input);
    return single ? [toGrabbedItem(single)] : [];
  }

  const collected: GrabbedSourceItem[] = [];

  for (const token of uniqueTokens) {
    const detected = detectSourceProvider(token);
    if (!detected) continue;

    // Known provider (StreamWish, FileMoon, DoodStream, VidHide, YouTube, HLS, MP4)
    // or explicit embed path (/e/, /embed/, /player) -> add directly without scraping
    const isDirectEmbedPath = /\/(?:e|embed|player)\//i.test(token);
    if (detected.key !== "embed" || isDirectEmbedPath) {
      collected.push(toGrabbedItem(detected));
      continue;
    }

    // Otherwise, inspect the page for active embedded sources / streams
    const extracted = await inspectPageUrl(detected.url);
    if (extracted.length > 0) {
      collected.push(...extracted);
    } else if (/\/(?:watch|movie|series|tv|film|show)\b/i.test(detected.url)) {
      // A watch page URL that blocked scraping — let autoDiscoverSourcesForMovie handle it
      continue;
    } else {
      // Fallback: treat the provided URL itself as an embed source
      collected.push(toGrabbedItem(detected));
    }
  }

  // Deduplicate by normalized URL and number duplicate provider labels cleanly
  const byUrl = new Map<string, GrabbedSourceItem>();
  for (const item of collected) {
    if (!byUrl.has(item.url)) {
      byUrl.set(item.url, item);
    }
  }

  const deduped = Array.from(byUrl.values());
  const providerCounts = new Map<string, number>();
  for (const item of deduped) {
    providerCounts.set(
      item.providerSlug,
      (providerCounts.get(item.providerSlug) || 0) + 1,
    );
  }

  const providerSeen = new Map<string, number>();
  return deduped.map((item) => {
    const totalForProvider = providerCounts.get(item.providerSlug) || 1;
    const index = providerSeen.get(item.providerSlug) || 0;
    providerSeen.set(item.providerSlug, index + 1);
    const suffix = totalForProvider > 1 ? ` #${index + 1}` : "";
    return {
      ...item,
      label: `${item.providerName}${item.quality ? ` • ${item.quality}` : ""}${suffix}`,
      priority: Math.max(1, item.priority - index),
    };
  });
}

const DEFAULT_REGISTRY_PROVIDERS = [
  {
    name: "VidLink Pro",
    slug: "vidlink",
    type: "embed" as const,
    base_url: "https://vidlink.pro",
    is_active: true,
    notes: "Fast 1080p adaptive HLS embed gateway.",
  },
  {
    name: "VidFast",
    slug: "vidfast",
    type: "embed" as const,
    base_url: "https://vidfast.pro",
    is_active: true,
    notes: "1080p multi-audio HLS embed gateway.",
  },
  {
    name: "StreamWish",
    slug: "streamwish",
    type: "embed" as const,
    base_url: "https://streamwish.to",
    is_active: true,
    notes: "StreamWish / MultiEmbed HD provider.",
  },
  {
    name: "FileMoon",
    slug: "filemoon",
    type: "embed" as const,
    base_url: "https://filemoon.sx",
    is_active: true,
    notes: "FileMoon / AutoEmbed 1080p provider.",
  },
  {
    name: "VidHide",
    slug: "vidhide",
    type: "embed" as const,
    base_url: "https://vidhidepro.com",
    is_active: true,
    notes: "VidHide / VidSrc SU adaptive HLS provider.",
  },
  {
    name: "DoodStream",
    slug: "doodstream",
    type: "embed" as const,
    base_url: "https://doodstream.com",
    is_active: true,
    notes: "DoodStream / 2Embed HD provider.",
  },
  {
    name: "NontonGo",
    slug: "nontongo",
    type: "embed" as const,
    base_url: "https://www.nontongo.win",
    is_active: true,
    notes: "Multi-subtitle HD embed provider.",
  },
  {
    name: "MoviesAPI",
    slug: "moviesapi",
    type: "embed" as const,
    base_url: "https://moviesapi.to",
    is_active: true,
    notes: "VidSpark 1080p multi-server embed provider.",
  },
  {
    name: "VidSrc",
    slug: "vidsrc",
    type: "embed" as const,
    base_url: "https://vidsrc.dev",
    is_active: true,
    notes: "VidSrc multi-server backup embed provider.",
  },
];

export async function ensureDefaultProvidersInRegistry() {
  const supabase = createAdminClient();
  await supabase
    .from("sources")
    .upsert(DEFAULT_REGISTRY_PROVIDERS, {
      onConflict: "slug",
      ignoreDuplicates: true,
    });
}

function normalizeArchiveTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function searchInternetArchiveStreams(
  title: string,
): Promise<GrabbedSourceItem[]> {
  try {
    const query = `title:("${title.replace(/"/g, "")}") AND mediatype:(movies)`;
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title&rows=3&page=1&output=json`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(6500) });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      response?: { docs?: { identifier?: string; title?: string }[] };
    };
    const targetNorm = normalizeArchiveTitle(title);
    const matchedDoc = (json.response?.docs || []).find((doc) => {
      if (!doc.identifier || !doc.title) return false;
      const docNorm = normalizeArchiveTitle(doc.title);
      return docNorm === targetNorm || docNorm.startsWith(`${targetNorm} `);
    });
    const identifier = matchedDoc?.identifier;
    if (!identifier) return [];

    const metaRes = await fetch(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
      { signal: AbortSignal.timeout(6500) },
    );
    if (!metaRes.ok) return [];
    const meta = (await metaRes.json()) as {
      files?: { name?: string; format?: string; size?: string | number }[];
    };
    const files = meta.files || [];
    const isDemoShort =
      /^(big buck bunny|sintel|tears of steel|elephants dream)$/i.test(
        title.trim(),
      );
    const minBytes = isDemoShort ? 5 * 1024 * 1024 : 35 * 1024 * 1024;

    const mp4File = files.find((f) => {
      if (!f.name || !/\.mp4$/i.test(f.name)) return false;
      if (f.name.includes("_ia") || /sample|trailer|promo/i.test(f.name)) {
        return false;
      }
      const size = Number(f.size || 0);
      return size >= minBytes;
    });
    const hlsFile = files.find((f) => f.name && /\.m3u8$/i.test(f.name));

    const items: GrabbedSourceItem[] = [];
    if (mp4File?.name) {
      items.push({
        label: "Open Cinema • MP4",
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(mp4File.name)}`,
        type: "mp4",
        quality: "HD",
        language: null,
        priority: 30,
        providerSlug: "open-cinema",
        providerName: "Open Cinema",
        baseUrl: "https://archive.org",
      });
    }
    if (hlsFile?.name) {
      items.push({
        label: "Adaptive HLS • Auto",
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(hlsFile.name)}`,
        type: "hls",
        quality: "Auto",
        language: null,
        priority: 31,
        providerSlug: "adaptive-hls",
        providerName: "Adaptive HLS",
        baseUrl: "https://archive.org",
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function autoDiscoverSourcesForMovie(
  movieId: string,
): Promise<GrabbedSourceItem[]> {
  const supabase = createAdminClient();
  const { data: movie } = await supabase
    .from("movies")
    .select("id, title, original_title, slug, type, tmdb_id, imdb_id, trailer_url")
    .eq("id", movieId)
    .maybeSingle();

  if (!movie) return [];

  await ensureDefaultProvidersInRegistry();

  const { data: registry } = await supabase
    .from("sources")
    .select("id, name, slug, type, base_url, is_active, notes")
    .eq("is_active", true);

  let tmdbAbs = movie.tmdb_id ? Math.abs(Number(movie.tmdb_id)) : null;
  const mediaKind = movie.type === "series" ? "tv" : "movie";

  // If movie has no tmdb_id yet, look it up by title on TMDB automatically
  if (!tmdbAbs && tmdbConfigured()) {
    try {
      const matches = await searchTmdb(movie.title);
      const match =
        matches.find(
          (m) => (m.media_type === "tv" ? "tv" : "movie") === mediaKind,
        ) || matches[0];
      if (match?.id) {
        tmdbAbs = match.id;
      }
    } catch {
      // ignore search error
    }
  }

  const primaryGateways: GrabbedSourceItem[] = [];
  const secondarySpaGateways: GrabbedSourceItem[] = [];

  // 1. Built-in multi-server full-movie embed gateways (indexed by TMDB ID)
  if (tmdbAbs) {
    const isTv = mediaKind === "tv";

    primaryGateways.push(
      {
        label: "VidLink Pro • 1080p HLS",
        url: isTv
          ? `https://vidlink.pro/tv/${tmdbAbs}/1/1`
          : `https://vidlink.pro/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 29,
        providerSlug: "vidlink",
        providerName: "VidLink Pro",
        baseUrl: "https://vidlink.pro",
      },
      {
        label: "VidFast • 1080p Auto",
        url: isTv
          ? `https://vidfast.pro/tv/${tmdbAbs}/1/1`
          : `https://vidfast.pro/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 28,
        providerSlug: "vidfast",
        providerName: "VidFast",
        baseUrl: "https://vidfast.pro",
      },
      {
        label: "DoodStream • 2Embed HD",
        url: isTv
          ? `https://www.2embed.cc/embedtvfull/${tmdbAbs}`
          : `https://www.2embed.cc/embed/${tmdbAbs}`,
        type: "embed",
        quality: "HD",
        language: null,
        priority: 25,
        providerSlug: "doodstream",
        providerName: "DoodStream",
        baseUrl: "https://doodstream.com",
      },
      {
        label: "StreamWish • Multi HD",
        url: isTv
          ? `https://multiembed.mov/?video_id=${tmdbAbs}&tmdb=1&s=1&e=1`
          : `https://multiembed.mov/?video_id=${tmdbAbs}&tmdb=1`,
        type: "embed",
        quality: "HD",
        language: null,
        priority: 24,
        providerSlug: "streamwish",
        providerName: "StreamWish",
        baseUrl: "https://streamwish.to",
      },
      {
        label: "NontonGo • Multi-Sub HD",
        url: isTv
          ? `https://www.nontongo.win/embed/tv/${tmdbAbs}/1/1`
          : `https://www.nontongo.win/embed/movie/${tmdbAbs}`,
        type: "embed",
        quality: "HD",
        language: null,
        priority: 23,
        providerSlug: "nontongo",
        providerName: "NontonGo",
        baseUrl: "https://www.nontongo.win",
      },
    );

    secondarySpaGateways.push(
      {
        label: "FileMoon • 1080p Auto",
        url: isTv
          ? `https://player.autoembed.me/embed/tv/${tmdbAbs}/1/1`
          : `https://player.autoembed.me/embed/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 27,
        providerSlug: "filemoon",
        providerName: "FileMoon",
        baseUrl: "https://filemoon.sx",
      },
      {
        label: "VidHide • Adaptive HLS",
        url: isTv
          ? `https://vidsrc.su/embed/tv/${tmdbAbs}/1/1`
          : `https://vidsrc.su/embed/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 26,
        providerSlug: "vidhide",
        providerName: "VidHide",
        baseUrl: "https://vidhidepro.com",
      },
      {
        label: "MoviesAPI • VidSpark HD",
        url: isTv
          ? `https://moviesapi.to/tv/${tmdbAbs}-1-1`
          : `https://moviesapi.to/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 22,
        providerSlug: "moviesapi",
        providerName: "MoviesAPI",
        baseUrl: "https://moviesapi.to",
      },
      {
        label: "VidSrc • Multi-Server HD",
        url: isTv
          ? `https://vidsrc.dev/embed/tv/${tmdbAbs}/1/1`
          : `https://vidsrc.dev/embed/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 21,
        providerSlug: "vidsrc",
        providerName: "VidSrc",
        baseUrl: "https://vidsrc.dev",
      },
    );
  }

  // 2. Expand any Source Registry templates containing {tmdb_id}, {imdb_id}, {slug}, or {title}
  const templateCandidates: GrabbedSourceItem[] = [];
  for (const reg of registry || []) {
    const base = (reg.base_url as string | null)?.trim();
    if (!base) continue;

    if (
      base.includes("{tmdb_id}") ||
      base.includes("{imdb_id}") ||
      base.includes("{slug}") ||
      base.includes("{title}")
    ) {
      if (base.includes("{tmdb_id}") && !tmdbAbs) continue;
      if (base.includes("{imdb_id}") && !movie.imdb_id) continue;

      const expanded = base
        .replace(/\{type\}/gi, mediaKind)
        .replace(/\{tmdb_id\}/gi, String(tmdbAbs || ""))
        .replace(/\{imdb_id\}/gi, String(movie.imdb_id || ""))
        .replace(/\{slug\}/gi, encodeURIComponent(movie.slug))
        .replace(/\{title\}/gi, encodeURIComponent(movie.title));

      templateCandidates.push({
        label: `${reg.name} • HD`,
        url: upgradeLegacyGatewayUrl(expanded),
        type: (reg.type as SourceType) || "embed",
        quality: "HD",
        language: null,
        priority: 20,
        providerSlug: reg.slug as string,
        providerName: reg.name as string,
        baseUrl: base,
      });
    }
  }

  // 3. YouTube trailer candidate
  const trailerCandidates: GrabbedSourceItem[] = [];
  if (movie.trailer_url) {
    const detected = detectSourceProvider(movie.trailer_url);
    if (detected) {
      trailerCandidates.push({
        ...toGrabbedItem(detected),
        label: "Official Trailer • HD",
        priority: 5,
      });
    }
  } else if (tmdbAbs && tmdbConfigured()) {
    try {
      const details = await getTmdbDetails(mediaKind, tmdbAbs);
      const trailer = pickTmdbTrailer(details);
      if (trailer?.key) {
        trailerCandidates.push({
          label: `Official Trailer${trailer.name ? ` • ${trailer.name}` : ""}`,
          url: `https://www.youtube.com/embed/${trailer.key}`,
          type: "youtube",
          quality: "HD",
          language: null,
          priority: 5,
          providerSlug: "youtube",
          providerName: "YouTube",
          baseUrl: "https://www.youtube.com",
        });
      }
    } catch {
      // ignore TMDB error
    }
  }

  // 4. Verify all candidates in parallel before returning
  const [
    verifiedPrimary,
    verifiedSecondary,
    verifiedTemplates,
    archiveStreams,
    verifiedTrailers,
  ] = await Promise.all([
    Promise.all(
      primaryGateways.map(async (item) =>
        (await verifySourcePlayable(item, movie.title)) ? item : null,
      ),
    ),
    Promise.all(
      secondarySpaGateways.map(async (item) =>
        (await verifySourcePlayable(item, movie.title)) ? item : null,
      ),
    ),
    Promise.all(
      templateCandidates.map(async (item) =>
        (await verifySourcePlayable(item, movie.title)) ? item : null,
      ),
    ),
    searchInternetArchiveStreams(movie.title).then((items) =>
      Promise.all(
        items.map(async (item) =>
          (await verifySourcePlayable(item, movie.title)) ? item : null,
        ),
      ),
    ),
    Promise.all(
      trailerCandidates.map(async (item) =>
        (await verifySourcePlayable(item, movie.title)) ? item : null,
      ),
    ),
  ]);

  const validPrimary = verifiedPrimary.filter(
    (item): item is GrabbedSourceItem => Boolean(item),
  );
  const validSecondary =
    validPrimary.length > 0
      ? verifiedSecondary.filter((item): item is GrabbedSourceItem =>
          Boolean(item),
        )
      : [];
  const validTemplates = verifiedTemplates.filter(
    (item): item is GrabbedSourceItem => Boolean(item),
  );
  const validArchive = archiveStreams.filter(
    (item): item is GrabbedSourceItem => Boolean(item),
  );
  const validTrailers = verifiedTrailers.filter(
    (item): item is GrabbedSourceItem => Boolean(item),
  );

  return [
    ...validArchive,
    ...validPrimary,
    ...validSecondary,
    ...validTemplates,
    ...validTrailers,
  ];
}

export async function grabAndSaveMovieSources(
  movieId: string,
  rawInput: string,
  options?: { language?: string | null; autoDiscover?: boolean },
): Promise<{ count: number; newCount: number; labels: string[] }> {
  const collected: GrabbedSourceItem[] = [];

  if (rawInput.trim()) {
    const fromInput = await grabSourcesFromInput(rawInput);
    const verifiedInput = await Promise.all(
      fromInput.map(async (item) =>
        (await verifySourcePlayable(item)) ? item : null,
      ),
    );
    for (const item of verifiedInput) {
      if (item) collected.push(item);
    }
  }

  if (collected.length === 0 || !rawInput.trim() || options?.autoDiscover) {
    const discovered = await autoDiscoverSourcesForMovie(movieId);
    collected.push(...discovered);
  }

  const byUrl = new Map<string, GrabbedSourceItem>();
  for (const item of collected) {
    if (!byUrl.has(item.url)) {
      byUrl.set(item.url, item);
    }
  }
  const grabbed = Array.from(byUrl.values());

  if (grabbed.length === 0) {
    return { count: 0, newCount: 0, labels: [] };
  }

  await ensureDefaultProvidersInRegistry();

  const supabase = createAdminClient();
  const [{ data: registryRows }, { data: existingRows }] = await Promise.all([
    supabase.from("sources").select("id, slug"),
    supabase.from("movie_sources").select("id, url").eq("movie_id", movieId),
  ]);

  // Clean up any legacy offline gateway URLs stored on this movie
  const deadLegacyIds = (existingRows || [])
    .filter((row) =>
      /https?:\/\/(?:player\.autoembed\.cc|vidsrc\.icu|moviesapi\.club)\//i.test(
        String(row.url || ""),
      ),
    )
    .map((row) => row.id as string);

  if (deadLegacyIds.length > 0) {
    await supabase.from("movie_sources").delete().in("id", deadLegacyIds);
  }

  const existingUrls = new Set(
    (existingRows || [])
      .filter((row) => !deadLegacyIds.includes(row.id as string))
      .map((row) => row.url as string),
  );
  const slugToId = new Map<string, string>(
    (registryRows || []).map((row) => [row.slug as string, row.id as string]),
  );

  const rowsToUpsert = grabbed.map((item) => ({
    movie_id: movieId,
    source_id: slugToId.get(item.providerSlug) || null,
    label: item.label,
    url: item.url,
    type: item.type,
    quality: item.quality,
    language: options?.language || item.language || null,
    priority: item.priority,
    is_active: true,
  }));

  const newRows = rowsToUpsert.filter((row) => !existingUrls.has(row.url));

  const { error } = await supabase
    .from("movie_sources")
    .upsert(rowsToUpsert, { onConflict: "movie_id,url" });

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: rowsToUpsert.length,
    newCount: newRows.length,
    labels: (newRows.length > 0 ? newRows : rowsToUpsert).map((r) => r.label),
  };
}
