"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthLayout, errorClass, fieldClass, primaryButtonClass } from "@/components/auth/AuthLayout";
import { readableAuthEmailError } from "@/lib/auth-error";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function passwordError(password: string) {
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Include at least one letter and one number.";
  return null;
}

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setExistingAccount(false);
    const problem = passwordError(password);
    if (problem) return setError(problem);
    if (password !== confirmPassword) return setError("The passwords do not match.");

    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { first_name: firstName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/verified`,
        },
      });

      if (signUpError) return setError(readableAuthEmailError(signUpError.message));
      // With email confirmation enabled, Supabase may return a user with no
      // identities rather than an error when the email is already registered.
      if (data.user?.identities?.length === 0) {
        setExistingAccount(true);
        return setError("An account already exists for this email address.");
      }
      if (data.session) router.replace("/dashboard");
      else setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError("");
    try {
      const { error: resendError } = await getSupabaseBrowserClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/verified` },
      });
      if (resendError) setError(readableAuthEmailError(resendError.message));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not resend the verification email.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <AuthLayout eyebrow="One last step" title="Check your email" description={`Supabase has sent a verification email to ${email}. Open the link to activate your BrainSoma account.`}>
      <div className="rounded-2xl border-2 border-ink bg-moss-soft p-5 text-sm leading-6 text-moss-dark">The email may take a minute to arrive. Check your spam or junk folder if you cannot see it.</div>
      {error && <p className={`${errorClass} mt-4`}>{error}</p>}
      <button className={`${primaryButtonClass} mt-5`} disabled={busy} onClick={resend}>{busy ? "Sending…" : "Resend verification email"}</button>
      <p className="mt-6 text-center text-sm text-ink-soft"><Link className="font-bold text-orange-dark" href="/login">Back to sign in</Link></p>
    </AuthLayout>;
  }

  return <AuthLayout eyebrow="Create your account" title="Start mastering science" description="Create a free account to keep your progress across Biology, Chemistry and Physics. Supabase will email you a verification link after signup.">
    <form className="space-y-5" onSubmit={submit}>
      <label className="block text-sm font-bold">First name<input className={fieldClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" placeholder="Your first name" required /></label>
      <label className="block text-sm font-bold">Email address<input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></label>
      <label className="block text-sm font-bold">Password<div className="relative"><input className={`${fieldClass} pr-16`} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /><button className="absolute right-4 top-[1.3rem] text-xs font-black text-orange-dark" type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button></div></label>
      <label className="block text-sm font-bold">Confirm password<input className={fieldClass} type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Type your password again" required /></label>
      {error && <p className={errorClass} role="alert">{error}</p>}
      {existingAccount && <p className="rounded-2xl border-2 border-ink bg-cream-soft p-4 text-sm leading-6">Already registered? <Link className="font-extrabold text-orange-dark" href="/login">Sign in</Link> or <Link className="font-extrabold text-orange-dark" href="/forgot-password">reset your password</Link>.</p>}
      <button className={primaryButtonClass} disabled={busy} type="submit">{busy ? "Creating account…" : "Create free account"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-ink-soft">Already have an account? <Link className="font-extrabold text-orange-dark" href="/login">Sign in</Link></p>
  </AuthLayout>;
}
