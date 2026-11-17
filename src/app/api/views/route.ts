import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string };
    if (!body.slug || typeof body.slug !== "string") {
      return Response.json({ ok: false }, { status: 400 });
    }
    const supabase = createAdminClient();
    await supabase.rpc("increment_movie_views", { movie_slug: body.slug });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
