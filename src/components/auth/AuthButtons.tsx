"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Variant = "landing" | "compact";

/**
 * Header auth controls: Sign in / Create account when signed out,
 * My Learning / Sign out when signed in. Renders nothing until the session is
 * known so the wrong buttons never flash.
 */
export function AuthButtons({ variant = "compact", showDashboard = true }: { variant?: Variant; showDashboard?: boolean }) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) setSignedIn(Boolean(data.session)); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) setSignedIn(Boolean(session)); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    setBusy(true);
    await getSupabaseBrowserClient().auth.signOut();
    setBusy(false);
    router.replace("/");
    router.refresh();
  }

  if (signedIn === null) return <div className="h-10 w-24" aria-hidden="true" />;

  const linkClass = "rounded-xl px-3 py-2.5 text-sm font-bold text-ink-soft hover:text-orange";
  if (!signedIn) {
    return <div className="flex items-center gap-2">
      <Link href="/login" className={`${variant === "landing" ? "hidden sm:block " : ""}${linkClass}`}>Sign in</Link>
      {variant === "landing" && <Link href="/signup" className="sm-btn bg-orange px-4 py-2.5 text-sm text-white">Create account</Link>}
    </div>;
  }
  return <div className="flex items-center gap-2">
    {showDashboard && <Link href="/dashboard" className={`${variant === "landing" ? "sm-btn bg-orange px-4 py-2.5 text-sm text-white" : linkClass}`}>My Learning</Link>}
    <button type="button" onClick={signOut} disabled={busy} className={`${linkClass} disabled:opacity-60`}>{busy ? "Signing out…" : "Sign out"}</button>
  </div>;
}
