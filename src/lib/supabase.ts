import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

const FALLBACK_SUPABASE_URL = "https://ggpcxhsofgjmrwxzosjz.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cxjLJWax1E8yY1ADTRb-Wg_OYsNkTJm";

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const configuredKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

    const supabaseUrl =
      configuredUrl && /^https:\/\/[^\s]+\.supabase\.co\/?$/.test(configuredUrl)
        ? configuredUrl
        : FALLBACK_SUPABASE_URL;
    const publishableKey =
      configuredKey?.startsWith("sb_publishable_")
        ? configuredKey
        : FALLBACK_SUPABASE_PUBLISHABLE_KEY;

    browserClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
