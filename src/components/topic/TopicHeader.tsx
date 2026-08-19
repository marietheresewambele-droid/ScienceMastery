"use client";

import Link from "next/link";
import { TopicMetadata } from "@/types/questions";
import { useHomeHref } from "@/hooks/useHomeHref";

interface TopicHeaderProps {
  metadata: TopicMetadata;
}

const FlaskIcon = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
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
  const homeHref = useHomeHref();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href={homeHref}
          className="flex items-center gap-2.5"
          aria-label="ScienceMastery Home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-orange text-white shadow-[3px_3px_0_0_var(--color-ink)]">
            <FlaskIcon />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Science<span className="text-orange">Mastery</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-semibold text-ink-soft md:flex">
          <span className="sm-tag px-3 py-1 text-xs">
            {metadata.examBoard} {metadata.title}
          </span>
          <Link
            href={homeHref}
            className="transition hover:text-orange-dark"
          >
            Back to home
          </Link>
        </nav>

        {/* Mobile view */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="sm-tag px-2 py-1 text-xs">
            {metadata.subject.charAt(0).toUpperCase() + metadata.subject.slice(1)}
          </span>
          <Link
            href={homeHref}
            className="text-sm font-semibold text-ink-soft transition hover:text-orange-dark"
          >
            Home
          </Link>
        </div>
      </div>
    </header>
  );
}
