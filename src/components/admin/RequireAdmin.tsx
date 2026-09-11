"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const adminEmails = new Set(
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authorized" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const email = data.user?.email?.toLowerCase();
        setStatus(email && adminEmails.has(email) ? "authorized" : "denied");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return <main className="min-h-screen bg-cream px-4 py-10 text-ink"><p className="mx-auto max-w-4xl text-ink-soft">Checking access…</p></main>;
  }

  if (status === "denied") {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Content administration</p>
          <h1 className="mt-2 font-display text-4xl font-bold">You don&apos;t have access to this page</h1>
          <p className="mt-4 max-w-2xl text-ink-soft">Sign in with an authorized content-admin account to continue.</p>
          <Link href="/login" className="sm-btn mt-6 inline-block bg-orange px-6 py-3 text-white">Sign in</Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
