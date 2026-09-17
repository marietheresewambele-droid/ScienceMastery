import "server-only";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/adminAccess";

/**
 * Verifies the request's Bearer token belongs to a signed-in admin. On success returns the
 * service-role client (already available, reused rather than re-created) plus the caller's
 * user record; on failure returns the NextResponse to return directly from the route handler.
 */
export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) return { error: NextResponse.json({ error: "Missing authorization token." }, { status: 401 }) } as const;

  const admin = getSupabaseAdminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user || !isAdminEmail(userData.user.email)) {
    return { error: NextResponse.json({ error: "You are not authorized to manage content." }, { status: 403 }) } as const;
  }

  return { admin, user: userData.user } as const;
}
