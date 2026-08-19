"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthLayout, errorClass, fieldClass, primaryButtonClass } from "@/components/auth/AuthLayout";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: resetError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password?recovery=1`,
    });
    setBusy(false);
    if (resetError) return setError(resetError.message);
    setSent(true);
  }

  if (sent) return <AuthLayout eyebrow="Recovery email sent" title="Check your email" description={`If an account exists for ${email}, we have sent a secure password-reset link.`}>
    <div className="rounded-2xl border-2 border-ink bg-moss-soft p-5 text-sm leading-6 text-moss-dark">For your security, the link can only be used once. Check your spam or junk folder if it does not arrive.</div>
    <Link className={`${primaryButtonClass} mt-6 block text-center`} href="/login">Return to sign in</Link>
  </AuthLayout>;

  return <AuthLayout eyebrow="Account recovery" title="Forgot your password?" description="Enter the email address linked to your account and we will send you a secure reset link.">
    <form className="space-y-5" onSubmit={submit}>
      <label className="block text-sm font-bold">Email address<input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></label>
      {error && <p className={errorClass} role="alert">{error}</p>}
      <button className={primaryButtonClass} disabled={busy} type="submit">{busy ? "Sending reset link…" : "Send reset link"}</button>
    </form>
    <p className="mt-6 text-center text-sm"><Link className="font-extrabold text-orange-dark" href="/login">← Back to sign in</Link></p>
  </AuthLayout>;
}
