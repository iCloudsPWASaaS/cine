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
  type DetectedProvider,
} from "@/lib/utils";

const execFileAsync = promisify(execFile);

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
  /(?:googletagmanager|google-analytics|doubleclick|facebook\.com|twitter\.com|instagram\.com|disqus\.com|recaptcha|cloudflare\.com\/cdn-cgi|ads\.|adservice|googlesyndication)/i;

const IGNORED_EXTENSIONS =
  /\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|json|xml)(?:$|\?)/i;

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
    return resolved.toString();
  } catch {
    return null;
  }
}

function toGrabbedItem(detected: DetectedProvider, index = 0): GrabbedSourceItem {
  const suffix = index > 0 ? ` #${index + 1}` : "";
  return {
    label: `${detected.name}${detected.quality ? ` • ${detected.quality}` : ""}${suffix}`,
    url: detected.url,
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

  // 5. Known host links (StreamWish, FileMoon, VidHide, DoodStream) anywhere in scripts/HTML
  const hostLinkRegex =
    /https?:\/\/(?:[a-z0-9-]+\.)*(?:streamwish|swdyu|wishembed|sfastwish|flaswish|obeywish|cdnwish|asnwish|jodwish|swish|hlswish|playerwish|embedwish|filemoon|moonmov|kerapoxy|1azayf9w|bymo|fmoonembed|vidhide|vidhidepro|vidhidevip|vidhidepre|vidhidefast|earnvids|smoothpre|dhtpre|peytonepre|callistanise|dood|doodstream|d000d|d0000d|ds2play|ds2video|doods|do7go|myvidplay|vide0)\.[a-z0-9.]+\/[^\s"'<>\\`]+/gi;
  for (const match of unescaped.matchAll(hostLinkRegex)) {
    const url = resolveUrl(match[0], pageUrl);
    if (url) found.push(url);
  }

  return Array.from(new Set(found));
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
    name: "StreamWish",
    slug: "streamwish",
    type: "embed" as const,
    base_url: "https://streamwish.to",
    is_active: true,
    notes: "StreamWish embed provider (/e/ links).",
  },
  {
    name: "FileMoon",
    slug: "filemoon",
    type: "embed" as const,
    base_url: "https://filemoon.sx",
    is_active: true,
    notes: "FileMoon HD embed provider (/e/ links).",
  },
  {
    name: "VidHide",
    slug: "vidhide",
    type: "embed" as const,
    base_url: "https://vidhidepro.com",
    is_active: true,
    notes: "VidHide embed provider (/e/ links).",
  },
  {
    name: "DoodStream",
    slug: "doodstream",
    type: "embed" as const,
    base_url: "https://doodstream.com",
    is_active: true,
    notes: "DoodStream embed provider (/e/ links).",
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

function extractApiKeyFromText(text?: string | null): string | null {
  if (!text) return null;
  const match =
    text.match(/(?:api[_-]?key|key)\s*[=:]\s*([A-Za-z0-9_-]{10,})/i) ||
    text.match(/^([A-Za-z0-9]{16,64})$/);
  return match?.[1] || null;
}

async function searchHostApiByTitle(provider: {
  name: string;
  slug: string;
  apiUrl: string;
  embedBase: string;
  quality: string;
  priority: number;
}): Promise<GrabbedSourceItem[]> {
  try {
    const res = await fetch(provider.apiUrl, {
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      result?:
        | {
            files?: { file_code?: string; title?: string }[];
          }
        | { file_code?: string; title?: string }[];
    };

    const files = Array.isArray(data.result)
      ? data.result
      : Array.isArray(data.result?.files)
        ? data.result.files
        : [];

    return files
      .filter((f) => f.file_code)
      .slice(0, 2)
      .map((f, index) => ({
        label: `${provider.name} • ${provider.quality}${index > 0 ? ` #${index + 1}` : ""}`,
        url: `${provider.embedBase}/e/${f.file_code}`,
        type: "embed" as const,
        quality: provider.quality,
        language: null,
        priority: provider.priority - index,
        providerSlug: provider.slug,
        providerName: provider.name,
        baseUrl: provider.embedBase,
      }));
  } catch {
    return [];
  }
}

async function searchInternetArchiveStreams(
  title: string,
): Promise<GrabbedSourceItem[]> {
  try {
    const query = `title:("${title.replace(/"/g, "")}") AND mediatype:(movies)`;
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title&rows=1&page=1&output=json`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      response?: { docs?: { identifier?: string; title?: string }[] };
    };
    const identifier = json.response?.docs?.[0]?.identifier;
    if (!identifier) return [];

    const metaRes = await fetch(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
      { signal: AbortSignal.timeout(7000) },
    );
    if (!metaRes.ok) return [];
    const meta = (await metaRes.json()) as {
      files?: { name?: string; format?: string }[];
    };
    const files = meta.files || [];
    const mp4File = files.find(
      (f) =>
        f.name &&
        /\.mp4$/i.test(f.name) &&
        !f.name.includes("_ia") &&
        !f.name.includes("sample"),
    );
    const hlsFile = files.find((f) => f.name && /\.m3u8$/i.test(f.name));

    const items: GrabbedSourceItem[] = [];
    if (mp4File?.name) {
      items.push({
        label: "Open Cinema • MP4",
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(mp4File.name)}`,
        type: "mp4",
        quality: "HD",
        language: null,
        priority: 28,
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
        priority: 30,
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

  const bySlug = new Map(
    (registry || []).map((row) => [row.slug as string, row]),
  );

  const items: GrabbedSourceItem[] = [];
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

  // 0. Built-in multi-server full-movie embed gateways (indexed by TMDB / IMDb ID)
  if (tmdbAbs) {
    const isTv = mediaKind === "tv";
    items.push(
      {
        label: "StreamWish • Multi HD",
        url: isTv
          ? `https://multiembed.mov/?video_id=${tmdbAbs}&tmdb=1&s=1&e=1`
          : `https://multiembed.mov/?video_id=${tmdbAbs}&tmdb=1`,
        type: "embed",
        quality: "HD",
        language: null,
        priority: 26,
        providerSlug: "streamwish",
        providerName: "StreamWish",
        baseUrl: "https://streamwish.to",
      },
      {
        label: "FileMoon • 1080p Auto",
        url: isTv
          ? `https://player.autoembed.cc/embed/tv/${tmdbAbs}/1/1`
          : `https://player.autoembed.cc/embed/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 25,
        providerSlug: "filemoon",
        providerName: "FileMoon",
        baseUrl: "https://filemoon.sx",
      },
      {
        label: "VidHide • Adaptive HLS",
        url: isTv
          ? `https://vidsrc.icu/embed/tv/${tmdbAbs}/1/1`
          : `https://vidsrc.icu/embed/movie/${tmdbAbs}`,
        type: "embed",
        quality: "1080p",
        language: null,
        priority: 24,
        providerSlug: "vidhide",
        providerName: "VidHide",
        baseUrl: "https://vidhidepro.com",
      },
      {
        label: "DoodStream • 2Embed HD",
        url: isTv
          ? `https://www.2embed.cc/embedtvfull/${tmdbAbs}`
          : `https://www.2embed.cc/embed/${tmdbAbs}`,
        type: "embed",
        quality: "HD",
        language: null,
        priority: 23,
        providerSlug: "doodstream",
        providerName: "DoodStream",
        baseUrl: "https://doodstream.com",
      },
    );
  }

  // 1. Expand any Source Registry templates containing {tmdb_id}, {imdb_id}, {slug}, or {title}
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

      items.push({
        label: `${reg.name} • HD`,
        url: expanded,
        type: (reg.type as SourceType) || "embed",
        quality: "HD",
        language: null,
        priority: 22,
        providerSlug: reg.slug as string,
        providerName: reg.name as string,
        baseUrl: base,
      });
    }
  }

  // 2. Query StreamWish, FileMoon, VidHide, DoodStream APIs by movie title when API keys are configured
  const swKey =
    process.env.STREAMWISH_API_KEY ||
    extractApiKeyFromText(bySlug.get("streamwish")?.notes as string) ||
    extractApiKeyFromText(bySlug.get("streamwish")?.base_url as string);
  const fmKey =
    process.env.FILEMOON_API_KEY ||
    extractApiKeyFromText(bySlug.get("filemoon")?.notes as string) ||
    extractApiKeyFromText(bySlug.get("filemoon")?.base_url as string);
  const vhKey =
    process.env.VIDHIDE_API_KEY ||
    extractApiKeyFromText(bySlug.get("vidhide")?.notes as string) ||
    extractApiKeyFromText(bySlug.get("vidhide")?.base_url as string);
  const ddKey =
    process.env.DOODSTREAM_API_KEY ||
    extractApiKeyFromText(bySlug.get("doodstream")?.notes as string) ||
    extractApiKeyFromText(bySlug.get("doodstream")?.base_url as string);

  const hostSearches: Promise<GrabbedSourceItem[]>[] = [];
  if (swKey) {
    hostSearches.push(
      searchHostApiByTitle({
        name: "StreamWish",
        slug: "streamwish",
        apiUrl: `https://api.streamwish.com/api/file/list?key=${encodeURIComponent(swKey)}&title=${encodeURIComponent(movie.title)}`,
        embedBase: "https://streamwish.to",
        quality: "HD",
        priority: 25,
      }),
    );
  }
  if (fmKey) {
    hostSearches.push(
      searchHostApiByTitle({
        name: "FileMoon",
        slug: "filemoon",
        apiUrl: `https://filemoonapi.com/api/file/list?key=${encodeURIComponent(fmKey)}&title=${encodeURIComponent(movie.title)}`,
        embedBase: "https://filemoon.sx",
        quality: "1080p",
        priority: 24,
      }),
    );
  }
  if (vhKey) {
    hostSearches.push(
      searchHostApiByTitle({
        name: "VidHide",
        slug: "vidhide",
        apiUrl: `https://vidhideapi.com/api/file/list?key=${encodeURIComponent(vhKey)}&title=${encodeURIComponent(movie.title)}`,
        embedBase: "https://vidhidepro.com",
        quality: "HD",
        priority: 23,
      }),
    );
  }
  if (ddKey) {
    hostSearches.push(
      searchHostApiByTitle({
        name: "DoodStream",
        slug: "doodstream",
        apiUrl: `https://doodapi.co/api/search/videos?key=${encodeURIComponent(ddKey)}&search_term=${encodeURIComponent(movie.title)}`,
        embedBase: "https://doodstream.com",
        quality: "HD",
        priority: 22,
      }),
    );
  }

  // 3. Search direct MP4 / HLS (.m3u8) on Internet Archive by title
  hostSearches.push(searchInternetArchiveStreams(movie.title));

  const resolvedLists = await Promise.all(hostSearches);
  for (const list of resolvedLists) {
    items.push(...list);
  }

  // 4. YouTube source (from movie.trailer_url or TMDB videos)
  if (movie.trailer_url) {
    const detected = detectSourceProvider(movie.trailer_url);
    if (detected) {
      items.push({
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
        items.push({
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

  return items;
}

export async function grabAndSaveMovieSources(
  movieId: string,
  rawInput: string,
  options?: { language?: string | null; autoDiscover?: boolean },
): Promise<{ count: number; newCount: number; labels: string[] }> {
  const collected: GrabbedSourceItem[] = [];

  if (rawInput.trim()) {
    const fromInput = await grabSourcesFromInput(rawInput);
    collected.push(...fromInput);
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
    supabase.from("movie_sources").select("url").eq("movie_id", movieId),
  ]);

  const existingUrls = new Set(
    (existingRows || []).map((row) => row.url as string),
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
