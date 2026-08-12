import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ggpcxhsofgjmrwxzosjz.supabase.co";

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_cxjLJWax1E8yY1ADTRb-Wg_OYsNkTJm";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
