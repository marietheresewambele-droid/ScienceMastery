"use client";

import { useState } from "react";
import { errorClass } from "@/components/auth/AuthLayout";
import { safeNextPath } from "@/lib/safe-next";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 7 8.9 4.8 12 4.8z" />
  </svg>
);

export function GoogleSignInButton({ label = "Continue with Google" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true);
    setError("");
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const { error: oauthError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // On success the browser navigates to Google, so only failures reach here.
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  }

  return <div>
    <button className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-ink bg-card px-5 py-3.5 font-bold text-ink transition hover:bg-cream-soft disabled:cursor-wait disabled:opacity-60" type="button" disabled={busy} onClick={signIn}>
      <GoogleIcon />{busy ? "Redirecting to Google…" : label}
    </button>
    {error && <p className={`${errorClass} mt-3`} role="alert">{error}</p>}
    <div className="my-6 flex items-center gap-4 text-xs font-black uppercase tracking-[.18em] text-ink-soft"><span className="h-0.5 flex-1 bg-ink/15" />or<span className="h-0.5 flex-1 bg-ink/15" /></div>
  </div>;
}
