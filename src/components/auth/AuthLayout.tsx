import Link from "next/link";
import type { ReactNode } from "react";

const FlaskIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9 3h6M10 3v6.3L4.8 18a3 3 0 0 0 2.7 4.4h9a3 3 0 0 0 2.7-4.4L14 9.3V3M7.5 15h9" />
  </svg>
);

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5faf7] px-4 py-8 text-[#0f1f3d] sm:grid sm:place-items-center sm:py-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#dce9e2] bg-white shadow-[0_28px_80px_-35px_rgba(15,31,61,.35)] lg:grid lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden bg-gradient-to-br from-[#0f1f3d] via-[#123b3f] to-[#006c43] p-12 text-white lg:flex lg:flex-col lg:justify-center">
          <Link href="/" className="mb-14 flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00a551] text-white"><FlaskIcon /></span>
            <span className="text-2xl font-extrabold tracking-tight">Sci<span className="text-[#5ee19c]">Mastery</span></span>
          </Link>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#5ee19c]">Science that sticks</p>
          <h2 className="mt-4 max-w-sm text-4xl font-black leading-tight tracking-tight">Master every GCSE science topic.</h2>
          <p className="mt-5 max-w-sm leading-7 text-slate-300">Save your progress, practise targeted questions and return exactly where you left off.</p>
          <div className="mt-10 space-y-5 text-sm">
            <p className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#5ee19c]">✓</span><span><strong className="block">Free student account</strong><small className="text-slate-400">No payment details needed</small></span></p>
            <p className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#5ee19c]">✓</span><span><strong className="block">Secure account recovery</strong><small className="text-slate-400">Reset access safely by email</small></span></p>
          </div>
        </section>

        <section className="p-7 sm:p-12 lg:p-14">
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a551] text-white"><FlaskIcon /></span>
            <span className="text-xl font-extrabold tracking-tight">Sci<span className="text-[#00a551]">Mastery</span></span>
          </Link>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#008c46]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-lg leading-7 text-[#5a6b82]">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

export const fieldClass = "mt-2 w-full rounded-xl border border-[#d9e1e8] bg-white px-4 py-3 text-[#0f1f3d] outline-none transition placeholder:text-[#9aa6b5] focus:border-[#00a551] focus:ring-4 focus:ring-[#00a551]/10";
export const primaryButtonClass = "w-full rounded-xl bg-[#00a551] px-5 py-3.5 font-extrabold text-white transition hover:bg-[#028f46] disabled:cursor-wait disabled:opacity-60";
export const errorClass = "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";
