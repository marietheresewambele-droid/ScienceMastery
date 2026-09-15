import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const productionSupabaseUrl = "https://ggpcxhsofgjmrwxzosjz.supabase.co";
const productionPublishableKey = "sb_publishable_cxjLJWax1E8yY1ADTRb-Wg_OYsNkTJm";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    // Environment variables are preferred. The fallback is a publishable browser
    // key for the live BrainSoma Supabase project, not a secret server key.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? productionSupabaseUrl;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env["NEXT_PUBLIC_SUPABASE_PUBLISH-ABLE_KEY"] ??
      productionPublishableKey;

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
