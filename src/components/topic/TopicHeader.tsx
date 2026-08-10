"use client";

import Link from "next/link";
import { TopicMetadata } from "@/types/questions";

interface TopicHeaderProps {
  metadata: TopicMetadata;
}

const FlaskIcon = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 3h6" />
    <path d="M10 3v6.3L4.8 18a3 3 0 0 0 2.7 4.4h9a3 3 0 0 0 2.7-4.4L14 9.3V3" />
    <path d="M7.5 15h9" />
  </svg>
);

export default function TopicHeader({ metadata }: TopicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e6eaee] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="ScienceMastery Home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a551] text-white shadow-sm">
            <FlaskIcon />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Science<span className="text-[#00a551]">Mastery</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-semibold text-[#5a6b7f] md:flex">
          <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">
            {metadata.examBoard} {metadata.title}
          </span>
          <Link
            href="/"
            className="transition hover:text-[#0b1d33]"
          >
            Back to home
          </Link>
        </nav>

        {/* Mobile view */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="rounded-full bg-[#e9f8f0] px-2 py-1 text-xs font-bold text-[#02753a]">
            {metadata.subject.charAt(0).toUpperCase() + metadata.subject.slice(1)}
          </span>
          <Link
            href="/"
            className="text-sm font-semibold text-[#5a6b7f] transition hover:text-[#0b1d33]"
          >
            Home
          </Link>
        </div>
      </div>
    </header>
  );
}
