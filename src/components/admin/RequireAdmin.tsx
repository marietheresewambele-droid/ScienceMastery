"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authorized" | "configuration">("checking");
  const [configurationMessage, setConfigurationMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      try {
        const { data } = await getSupabaseBrowserClient().auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/admin/access", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (response.ok) setStatus("authorized");
        else if (response.status === 503) {
          const body = await response.json().catch(() => ({}));
          setConfigurationMessage(body.error || "Supabase is not configured for this environment.");
          setStatus("configuration");
        }
        else router.replace("/");
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Supabase is not configured for this environment.";
          if (message.includes("Supabase is not configured")) {
            setConfigurationMessage(message);
            setStatus("configuration");
          } else router.replace("/");
        }
      }
    }
    void checkAccess();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "checking") {
    return <main className="min-h-screen bg-cream px-4 py-10 text-ink"><p className="mx-auto max-w-4xl text-ink-soft">Checking access…</p></main>;
  }

  if (status === "configuration") {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <section className="sm-panel mx-auto max-w-3xl p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Configuration required</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Supabase is not configured</h1>
          <p className="mt-3 text-ink-soft">{configurationMessage}</p>
          <p className="mt-3 text-sm text-ink-soft">Set the Supabase URL and publishable key for the browser, plus the service-role key on the server, then restart the app.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
