import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;

/**
 * Service-role Supabase client. Bypasses RLS entirely — never import this
 * from a "use client" file or anywhere that could end up in the browser bundle.
 */
export function getSupabaseAdminClient() {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
    if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}
