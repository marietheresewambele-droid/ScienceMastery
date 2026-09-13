"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function continueWithGoogle() {
    setBusy(true);
    onError("");
    const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setBusy(false);
      onError(error.message);
    }
  }

  return (
    <button
      className="w-full rounded-xl border-2 border-ink bg-white px-5 py-3.5 font-bold text-ink transition hover:bg-cream-soft disabled:cursor-wait disabled:opacity-60"
      disabled={busy}
      onClick={continueWithGoogle}
      type="button"
    >
      <span aria-hidden="true" className="mr-3 inline-grid h-5 w-5 place-items-center rounded-full bg-[#4285F4] text-xs font-black text-white">G</span>
      {busy ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
