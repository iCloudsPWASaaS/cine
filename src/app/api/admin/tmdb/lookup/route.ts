import { requireAdminApi, unauthorized } from "@/lib/api-auth";
import {
  getTmdbDetails,
  pickTmdbResult,
  searchTmdb,
  tmdbConfigured,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminApi(request);
  if (!admin) return unauthorized();

  if (!tmdbConfigured()) {
    return Response.json({ year: null, country: null }, { status: 200 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return Response.json({ year: null, country: null });
  }

  try {
    const results = await searchTmdb(query);
    const pick = pickTmdbResult(results, query);
    if (!pick) return Response.json({ year: null, country: null });

    const details = await getTmdbDetails(pick.media_type, pick.id);
    const releaseDate =
      pick.media_type === "tv"
        ? details.first_air_date
        : details.release_date;

    return Response.json({
      year: releaseDate?.slice(0, 4) || null,
      country: details.production_countries?.[0]?.name || null,
      title: pick.title || pick.name || null,
      tmdbId: pick.id,
      mediaType: pick.media_type,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "TMDB lookup failed.",
      },
      { status: 500 },
    );
  }
}
