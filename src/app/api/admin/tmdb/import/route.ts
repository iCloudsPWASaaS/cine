import { requireAdminApi, unauthorized } from "@/lib/api-auth";
import { importMovieFromTmdb } from "@/lib/import";
import { tmdbConfigured } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  try {
    const body = (await request.json()) as {
      tmdbId?: number;
      mediaType?: "movie" | "tv";
      categoryId?: string | null;
      region?: string;
      year?: string | null;
      country?: string | null;
    };

    if (
      !body.tmdbId ||
      !Number.isFinite(body.tmdbId) ||
      (body.mediaType !== "movie" && body.mediaType !== "tv")
    ) {
      return Response.json(
        { error: "tmdbId and mediaType (movie|tv) are required." },
        { status: 400 },
      );
    }

    const result = await importMovieFromTmdb({
      tmdbId: body.tmdbId,
      mediaType: body.mediaType,
      categoryId: body.categoryId || null,
      region: body.region,
      year: body.year,
      country: body.country,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "TMDB import failed.",
      },
      { status: 500 },
    );
  }
}
