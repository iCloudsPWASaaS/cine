import type { NextRequest } from "next/server";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  "[::1]",
]);

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local")) return true;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }

  if (host.includes(":")) {
    const normalized = host.replace(/^0+/, "");
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9")) return true;
    if (normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return Response.json({ error: "Missing subtitle url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return Response.json({ error: "Invalid subtitle url" }, { status: 400 });
  }

  if (
    (target.protocol !== "http:" && target.protocol !== "https:") ||
    isPrivateHost(target.hostname)
  ) {
    return Response.json({ error: "Subtitle url not allowed" }, { status: 400 });
  }

  try {
    const response = await fetch(target, {
      headers: {
        Accept: "text/plain,text/vtt,application/x-subrip,*/*;q=0.5",
        "User-Agent": "Cinewood/1.0 subtitle reader",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json(
        { error: `Subtitle request failed (${response.status})` },
        { status: 502 },
      );
    }

    const body = await response.text();
    if (!body.trim()) {
      return Response.json({ error: "Empty subtitle file" }, { status: 502 });
    }

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Could not load subtitle" }, { status: 502 });
  }
}
