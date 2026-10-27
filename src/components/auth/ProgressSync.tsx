"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { clearSyncedLocalData, pushDirty, setPushHandler, syncNow, syncOwner } from "@/lib/sync";

const REFRESH_AFTER_MS = 60_000;

/** Keeps a signed-in student's progress in step with their account. Renders nothing. */
export default function ProgressSync() {
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    let userId: string | null = null;
    let lastSync = 0;
    let running = false;

    async function run() {
      if (!userId || running) return;
      running = true;
      try {
        await syncNow(client, userId);
        lastSync = Date.now();
      } catch (error) {
        // Sync is best-effort: if the table is missing or the network is down, the site keeps working locally.
        console.warn("Progress sync skipped:", error instanceof Error ? error.message : error);
      } finally {
        running = false;
      }
    }

    function adopt(id: string | null) {
      if (id === userId) return;
      userId = id;
      if (id) {
        setPushHandler(async () => {
          try { await pushDirty(client, id); } catch (error) { console.warn("Progress upload failed:", error instanceof Error ? error.message : error); }
        });
        void run();
      } else {
        setPushHandler(null);
      }
    }

    client.auth.getSession().then(({ data }) => adopt(data.session?.user.id ?? null));
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && syncOwner()) clearSyncedLocalData();
      adopt(session?.user.id ?? null);
    });
    const refresh = () => { if (document.visibilityState === "visible" && Date.now() - lastSync > REFRESH_AFTER_MS) void run(); };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      listener.subscription.unsubscribe();
      setPushHandler(null);
    };
  }, []);

  return null;
}
