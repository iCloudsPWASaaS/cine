import { getAdminSession } from "@/lib/auth";

export type ApiAdmin =
  | { kind: "session"; userId: string }
  | { kind: "api-key" };

export async function requireAdminApi(
  request: Request,
): Promise<ApiAdmin | null> {
  const expected = process.env.ADMIN_API_KEY;
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();

  if (expected && token && token === expected) {
    return { kind: "api-key" };
  }

  const session = await getAdminSession();
  if (session) return { kind: "session", userId: session.user.id };

  return null;
}

export function unauthorized() {
  return Response.json(
    { error: "Unauthorized. Sign in as an admin or send the admin API key." },
    { status: 401 },
  );
}
