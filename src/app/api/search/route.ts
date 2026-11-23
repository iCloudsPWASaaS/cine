import { NextResponse } from "next/server";
import { browseMovies } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ results: [] });

  const { movies } = await browseMovies({ q, page: 1, sort: "relevance" }, 8);

  return NextResponse.json({
    results: movies.map((movie) => ({
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      poster_url: movie.poster_url,
      type: movie.type,
      release_date: movie.release_date,
    })),
  });
}
