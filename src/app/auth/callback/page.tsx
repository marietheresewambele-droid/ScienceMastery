"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthLayout, primaryButtonClass } from "@/components/auth/AuthLayout";
import { safeNextPath } from "@/lib/safe-next";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const authError = params.get("error_description") ?? hash.get("error_description");
    if (authError) {
      const failed = window.setTimeout(() => setError(authError), 0);
      return () => window.clearTimeout(failed);
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      router.replace(safeNextPath(params.get("next")));
      router.refresh();
    };
    // detectSessionInUrl exchanges the tokens in the URL; wait for it rather than racing getSession().
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (session) finish(); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) finish(); });
    const timeout = window.setTimeout(() => { if (!done) setError("We could not complete Google sign-in. Please try again."); }, 10000);
    return () => { listener.subscription.unsubscribe(); window.clearTimeout(timeout); };
  }, [router]);

  if (error) return <AuthLayout eyebrow="Sign-in unsuccessful" title="Google sign-in failed" description={error}><Link className={`${primaryButtonClass} block text-center`} href="/login">Back to sign in</Link></AuthLayout>;
  return <AuthLayout eyebrow="Almost there" title="Signing you in" description="Please wait while we finish signing you in with Google."><div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-cream-soft"><div className="h-full w-1/2 animate-pulse rounded-full bg-orange" /></div></AuthLayout>;
}
