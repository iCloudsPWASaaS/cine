import { requireAdminApi, unauthorized } from "@/lib/api-auth";
import { searchTmdb, tmdbConfigured } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminApi(request);
  if (!admin) return unauthorized();

  if (!tmdbConfigured()) {
    return Response.json(
      {
        error:
          "TMDB is not configured. Add TMDB_API_KEY or TMDB_ACCESS_TOKEN to .env.local.",
      },
      { status: 400 },
    );
  }

  const query = new URL(request.url).searchParams.get("q") || "";
  if (!query.trim()) return Response.json({ results: [] });

  try {
    const results = await searchTmdb(query);
    return Response.json({ results });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "TMDB search failed." },
      { status: 502 },
    );
  }
}
