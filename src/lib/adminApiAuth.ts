import "server-only";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

/**
 * Verifies the request's Bearer token belongs to a signed-in admin. On success returns the
 * service-role client (already available, reused rather than re-created) plus the caller's
 * user record; on failure returns the NextResponse to return directly from the route handler.
 */
export async function requireAdmin(request: Request) {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    return {
      error: NextResponse.json(
        { error: `Supabase server configuration is missing: ${missing.join(", ")}.` },
        { status: 503 },
      ),
    } as const;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) return { error: NextResponse.json({ error: "Missing authorization token." }, { status: 401 }) } as const;

  const admin = getSupabaseAdminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: NextResponse.json({ error: "You are not authorized to manage content." }, { status: 403 }) } as const;
  }

  const { data: role, error: roleError } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .eq("active", true)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) {
    // A failed lookup (wrong service-role key, missing table or grant) is a server problem, not
    // proof the caller isn't an admin - surface it instead of silently denying access.
    console.error("admin_users lookup failed:", roleError);
    return {
      error: NextResponse.json(
        { error: "Could not check admin access. Verify SUPABASE_SERVICE_ROLE_KEY is the service-role key and the admin_users migration is applied." },
        { status: 503 },
      ),
    } as const;
  }
  if (!role) {
    return { error: NextResponse.json({ error: "You are not authorized to manage content." }, { status: 403 }) } as const;
  }

  return { admin, user: userData.user } as const;
}
