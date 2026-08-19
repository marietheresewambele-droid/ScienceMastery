"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthLayout, primaryButtonClass } from "@/components/auth/AuthLayout";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function VerifiedPage() {
  const [state, setState] = useState<"checking" | "verified" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const authError = params.get("error_description") ?? hash.get("error_description");
      if (authError) {
        setMessage(authError);
        setState("error");
      } else {
        setState(data.session ? "verified" : "error");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted && session) setState("verified");
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  if (state === "checking") return <AuthLayout eyebrow="Confirming your account" title="Verifying your email" description="Please wait while SciMastery securely activates your account."><div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-cream-soft"><div className="h-full w-1/2 animate-pulse rounded-full bg-orange" /></div></AuthLayout>;
  if (state === "error") return <AuthLayout eyebrow="Verification unsuccessful" title="Request another email" description={message || "This verification link is invalid or has expired."}><Link className={`${primaryButtonClass} block text-center`} href="/signup">Return to sign up</Link><p className="mt-5 text-center text-sm"><Link className="font-bold text-orange-dark" href="/login">Go to sign in</Link></p></AuthLayout>;
  return <AuthLayout eyebrow="Account ready" title="Email verified" description="Your SciMastery account is active. Your progress can now stay linked to your account."><Link className={`${primaryButtonClass} block text-center`} href="/dashboard">Start learning</Link></AuthLayout>;
}
