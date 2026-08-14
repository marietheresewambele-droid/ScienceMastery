"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function useHomeHref() {
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setHomeHref(data.session ? "/dashboard" : "/");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHomeHref(session ? "/dashboard" : "/");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return homeHref;
}
