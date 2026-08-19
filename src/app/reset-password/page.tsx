"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthLayout, errorClass, fieldClass, primaryButtonClass } from "@/components/auth/AuthLayout";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;
    const hasRecoveryMarker = new URLSearchParams(window.location.search).get("recovery") === "1";

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setReady(Boolean(data.session && hasRecoveryMarker));
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session && mounted) {
        setReady(true);
        setChecking(false);
      }
    });

    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) return setError("Use at least 8 characters, including a letter and a number.");
    if (password !== confirmPassword) return setError("The passwords do not match.");

    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (!updateError) await supabase.auth.signOut();
    setBusy(false);
    if (updateError) return setError(updateError.message);
    setUpdated(true);
    window.history.replaceState({}, "", "/reset-password");
  }

  if (updated) return <AuthLayout eyebrow="Account secured" title="Password updated" description="Your new password has been saved. Sign in again to continue learning."><Link className={`${primaryButtonClass} block text-center`} href="/login">Sign in with your new password</Link></AuthLayout>;
  if (checking) return <AuthLayout eyebrow="Secure recovery" title="Checking your reset link" description="Please wait while we verify that this password-reset link is valid."><div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-cream-soft"><div className="h-full w-1/2 animate-pulse rounded-full bg-orange" /></div></AuthLayout>;
  if (!ready) return <AuthLayout eyebrow="Reset link unavailable" title="Request a new link" description="This password-reset link is invalid or has expired."><Link className={`${primaryButtonClass} block text-center`} href="/forgot-password">Send a new reset link</Link><p className="mt-5 text-center text-sm"><Link className="font-bold text-orange-dark" href="/login">Back to sign in</Link></p></AuthLayout>;

  return <AuthLayout eyebrow="Secure your account" title="Choose a new password" description="Use a password you do not use elsewhere. It must contain at least 8 characters, a letter and a number.">
    <form className="space-y-5" onSubmit={submit}>
      <label className="block text-sm font-bold">New password<div className="relative"><input className={`${fieldClass} pr-16`} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /><button className="absolute right-4 top-[1.3rem] text-xs font-black text-orange-dark" type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button></div></label>
      <label className="block text-sm font-bold">Confirm new password<input className={fieldClass} type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Type your new password again" required /></label>
      {error && <p className={errorClass} role="alert">{error}</p>}
      <button className={primaryButtonClass} disabled={busy} type="submit">{busy ? "Saving password…" : "Save new password"}</button>
    </form>
  </AuthLayout>;
}
