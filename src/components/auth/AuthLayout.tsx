import Link from "next/link";
import type { ReactNode } from "react";

const FlaskIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M9 3h6M10 3v6.3L4.8 18a3 3 0 0 0 2.7 4.4h9a3 3 0 0 0 2.7-4.4L14 9.3V3M7.5 15h9" />
  </svg>
);

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-cream-soft px-4 py-8 text-ink sm:grid sm:place-items-center sm:py-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border-2 border-ink bg-card shadow-[8px_8px_0_0_var(--color-ink)] lg:grid lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden border-r-2 border-ink bg-ink p-12 text-cream lg:flex lg:flex-col lg:justify-center">
          <Link href="/" className="mb-14 flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-cream/30 bg-orange text-white"><FlaskIcon /></span>
            <span className="font-display text-2xl font-bold tracking-tight">Sci<span className="text-yellow">Mastery</span></span>
          </Link>
          <p className="text-xs font-black uppercase tracking-[.2em] text-yellow">Science that sticks</p>
          <h2 className="mt-4 max-w-sm font-display text-4xl font-bold leading-tight tracking-tight">Master every GCSE science topic.</h2>
          <p className="mt-5 max-w-sm leading-7 text-cream/70">Save your progress, practise targeted questions and return exactly where you left off.</p>
          <div className="mt-10 space-y-5 text-sm">
            <p className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-cream/30 bg-white/10 text-yellow">✓</span><span><strong className="block">Free student account</strong><small className="text-cream/50">No payment details needed</small></span></p>
            <p className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-cream/30 bg-white/10 text-yellow">✓</span><span><strong className="block">Secure account recovery</strong><small className="text-cream/50">Reset access safely by email</small></span></p>
          </div>
        </section>

        <section className="p-7 sm:p-12 lg:p-14">
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink bg-orange text-white"><FlaskIcon /></span>
            <span className="font-display text-xl font-bold tracking-tight">Sci<span className="text-orange">Mastery</span></span>
          </Link>
          <p className="text-xs font-black uppercase tracking-[.18em] text-orange-dark">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-lg leading-7 text-ink-soft">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

export const fieldClass = "mt-2 w-full rounded-xl border-2 border-ink bg-card px-4 py-3 text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-orange focus:ring-4 focus:ring-orange/15";
export const primaryButtonClass = "sm-btn w-full !rounded-xl bg-orange px-5 py-3.5 text-white disabled:cursor-wait disabled:opacity-60";
export const errorClass = "rounded-xl border-2 border-orange-dark bg-orange-soft px-4 py-3 text-sm text-orange-dark";
