import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These are public browser values for the live BrainSoma Supabase project.
// Keep them first so an outdated Vercel variable cannot break student sign-in.
const liveSupabaseUrl = "https://ggpcxhsofgjmrwxzosjz.supabase.co";
const livePublishableKey = "sb_publishable_cxjLJWax1E8yY1ADTRb-Wg_OYsNkTJm";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(liveSupabaseUrl, livePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
