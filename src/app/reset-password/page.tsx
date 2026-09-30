"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthLayout, errorClass, fieldClass, primaryButtonClass } from "@/components/auth/AuthLayout";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;
    // Supabase appends the recovery session as a URL hash; check for it without reading the token itself.
    const hasRecoveryHash = /type=recovery/.test(window.location.hash);

    function markReady() {
      if (!mounted) return;
      setReady(true);
      setChecking(false);
      window.history.replaceState({}, document.title, "/reset-password");
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) markReady();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session && hasRecoveryHash) markReady();
    });

    // Give Supabase a moment to process the recovery hash before giving up.
    const timeout = window.setTimeout(() => {
      if (mounted) setChecking(false);
    }, 4000);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && password === confirmPassword;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) return setError("Your password must be at least 8 characters long.");
    if (password !== confirmPassword) return setError("The passwords do not match.");

    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("We could not update your password. Please request a new reset link and try again.");
        return;
      }
      await supabase.auth.signOut();
      setUpdated(true);
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (updated) return <AuthLayout eyebrow="Account secured" title="Password updated" description="Your password has been updated. You can now sign in."><Link className={`${primaryButtonClass} block text-center`} href="/login">Go to sign in</Link></AuthLayout>;
  if (checking) return <AuthLayout eyebrow="Secure recovery" title="Checking your reset link" description="Please wait while we verify that this password-reset link is valid."><div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-cream-soft"><div className="h-full w-1/2 animate-pulse rounded-full bg-orange" /></div></AuthLayout>;
  if (!ready) return <AuthLayout eyebrow="Reset link unavailable" title="Request a new link" description="This password-reset link is invalid or has expired. Please request a new one."><Link className={`${primaryButtonClass} block text-center`} href="/forgot-password">Send a new reset link</Link><p className="mt-5 text-center text-sm"><Link className="font-bold text-orange-dark" href="/login">Back to sign in</Link></p></AuthLayout>;

  return <AuthLayout eyebrow="Secure your account" title="Choose a new password" description="Your new password must be at least 8 characters long.">
    <form className="space-y-5" onSubmit={submit}>
      <label className="block text-sm font-bold">New password<div className="relative"><input className={`${fieldClass} pr-16`} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /><button className="absolute right-4 top-[1.3rem] text-xs font-black text-orange-dark" type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button></div></label>
      <label className="block text-sm font-bold">Confirm new password<div className="relative"><input className={`${fieldClass} pr-16`} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Type your new password again" required /><button className="absolute right-4 top-[1.3rem] text-xs font-black text-orange-dark" type="button" onClick={() => setShowConfirmPassword((shown) => !shown)}>{showConfirmPassword ? "Hide" : "Show"}</button></div></label>
      {passwordTooShort && <p className="text-xs font-bold text-orange-dark">Password must be at least 8 characters.</p>}
      {passwordsMismatch && <p className="text-xs font-bold text-orange-dark">Passwords do not match.</p>}
      {error && <p className={errorClass} role="alert">{error}</p>}
      <button className={primaryButtonClass} disabled={busy || !canSubmit} type="submit">{busy ? "Saving password…" : "Save new password"}</button>
    </form>
  </AuthLayout>;
}
