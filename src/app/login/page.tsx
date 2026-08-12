"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthLayout, errorClass, fieldClass, primaryButtonClass } from "@/components/auth/AuthLayout";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: loginError } = await getSupabaseBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (loginError) return setError(loginError.message.toLowerCase().includes("invalid login") ? "The email or password is incorrect." : loginError.message);
    router.replace("/dashboard");
    router.refresh();
  }

  return <AuthLayout eyebrow="Welcome back" title="Sign in to SciMastery" description="Continue from where you left off and keep building your GCSE science mastery.">
    <form className="space-y-5" onSubmit={submit}>
      <label className="block text-sm font-bold">Email address<input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></label>
      <label className="block text-sm font-bold">Password<div className="relative"><input className={`${fieldClass} pr-16`} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Your password" required /><button className="absolute right-4 top-[1.3rem] text-xs font-black text-[#008c46]" type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button></div></label>
      <div className="text-right"><Link className="text-sm font-extrabold text-[#008c46]" href="/forgot-password">Forgot password?</Link></div>
      {error && <p className={errorClass} role="alert">{error}</p>}
      <button className={primaryButtonClass} disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-[#5a6b82]">New to SciMastery? <Link className="font-extrabold text-[#008c46]" href="/signup">Create an account</Link></p>
  </AuthLayout>;
}
