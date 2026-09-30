"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";

/** Attaches the signed-in admin's Supabase access token so /api/admin/* routes can verify them. */
export async function authorizedFetch(input: string, init: RequestInit = {}) {
  const { data: sessionData } = await getSupabaseBrowserClient().auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again.");
  return fetch(input, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
}
