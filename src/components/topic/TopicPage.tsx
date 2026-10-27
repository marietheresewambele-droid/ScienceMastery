"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import SubtopicGrid from "@/components/topic/SubtopicGrid";
import TopicHeader from "@/components/topic/TopicHeader";
import { findTopic } from "@/data/topics/registry";
import { subtopicsFor, useQuestionBank } from "@/lib/questionBank";
import type { Subject } from "@/types/questions";

interface TopicPageProps {
  subject: Subject;
  slug: string;
}

function loadStoredStringArray(storageKey: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function TopicPage({ subject, slug }: TopicPageProps) {
  const topicConfig = findTopic(subject, slug);
  if (!topicConfig) notFound();
  const bank = useQuestionBank();
  const questions = useMemo(
    () => (bank.questions ?? []).filter((question) => question.subject === subject && question.topicSlug === slug),
    [bank.questions, subject, slug],
  );
  const subtopics = useMemo(() => subtopicsFor(questions), [questions]);
  const completedKey = `${topicConfig.storageNamespace}_completed`;

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCompletedIds(new Set(loadStoredStringArray(completedKey)));
  }, [completedKey]);

  const totalQuestions = questions.length;
  const completedCount = Array.from(completedIds).filter((id) =>
    questions.some((question) => question.id === id)
  ).length;
  const progressPercentage =
    totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  const subjectLabel = subject.charAt(0).toUpperCase() + subject.slice(1);

  const topicMetadata = {
    subject,
    title: topicConfig.title,
    slug: topicConfig.id,
    examBoard: topicConfig.examBoard ?? "AQA",
    topicNumber: topicConfig.topicNumber ?? "Topic",
    description: topicConfig.description ?? "",
    subtopics: subtopics.map((subtopic) => subtopic.title),
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      <TopicHeader metadata={topicMetadata} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <li>
                <Link href={"/" + subject} className="transition hover:text-orange-dark">
                  {subjectLabel}
                </Link>
              </li>
              <li>
                <span className="text-ink-soft/40">/</span>
              </li>
              <li aria-current="page" className="text-ink">
                {topicConfig.title}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="sm-tag px-3 py-1 text-xs">
                  {topicMetadata.topicNumber}
                </span>
                <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">
                  {topicMetadata.examBoard} GCSE {subjectLabel}
                </span>
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {topicConfig.title}
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-ink-soft">
                {topicConfig.description}
              </p>
            </div>

            <div className="shrink-0">
              <div className="sm-panel-sm p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                  Topic progress
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full border-2 border-ink bg-cream-soft">
                    <div
                      className="h-full rounded-full bg-orange transition-all"
                      style={{ width: `${progressPercentage}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-sm font-bold text-orange-dark">
                    {completedCount}/{totalQuestions} complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {bank.error && (
          <p role="alert" className="mb-6 rounded-xl border-2 border-ink bg-orange-soft p-4 text-sm font-semibold text-orange-dark">
            The questions for this topic could not be loaded ({bank.error}). Please refresh to try again.
          </p>
        )}
        {!bank.questions && !bank.error && (
          <p className="mb-6 text-sm font-semibold text-ink-soft">Loading questions…</p>
        )}
        {bank.questions && !questions.length && (
          <p className="mb-6 rounded-xl border-2 border-ink bg-card p-4 text-sm font-semibold text-ink-soft">
            No questions have been published for this topic yet.
          </p>
        )}

        <section aria-labelledby="whole-topic-heading" className="mb-10 rounded-3xl border-2 border-ink bg-ink p-5 text-cream shadow-[5px_5px_0_0_var(--color-orange)] sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="whole-topic-heading" className="font-display text-2xl font-bold">Study the whole topic</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-cream/70">
                Every subtopic in {topicConfig.title} in order{totalQuestions > 0 ? `, ${totalQuestions} questions` : ""}. Or pick a single subtopic below.
              </p>
            </div>
            <Link href={`/practice?mode=bookmarks&subject=${subject}&topic=${topicConfig.id}`} className="text-sm font-bold text-yellow underline-offset-4 hover:underline">
              Review bookmarked cards →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Link href={`/practice?mode=flashcards&subject=${subject}&topic=${topicConfig.id}`} className="flex items-center gap-4 rounded-2xl border-2 border-ink bg-card p-4 text-ink transition hover:-translate-y-1">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-yellow font-display text-lg font-bold">P</span>
              <span>
                <span className="block font-display text-lg font-semibold">Practice mode</span>
                <span className="block text-sm leading-5 text-ink-soft">Flashcards for the whole topic, scheduled by spaced repetition.</span>
              </span>
            </Link>
            <Link href={`/practice?mode=exam&subject=${subject}&topic=${topicConfig.id}`} className="flex items-center gap-4 rounded-2xl border-2 border-ink bg-card p-4 text-ink transition hover:-translate-y-1">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-orange font-display text-lg font-bold text-white">E</span>
              <span>
                <span className="block font-display text-lg font-semibold">Exam mode</span>
                <span className="block text-sm leading-5 text-ink-soft">Answer the whole topic, mark yourself, and get a final score.</span>
              </span>
            </Link>
          </div>
        </section>

        <SubtopicGrid
          topic={topicConfig}
          subtopics={subtopics}
          questions={questions}
          completedQuestions={completedIds}
        />
      </main>
    </div>
  );
}

export default TopicPage;
