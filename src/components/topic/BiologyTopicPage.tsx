"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import SubtopicGrid from "@/components/topic/SubtopicGrid";
import TopicHeader from "@/components/topic/TopicHeader";
import { topicRegistry } from "@/data/topics/registry";
import type { BiologyTopicConfig } from "@/types/questions";

interface BiologyTopicPageProps {
  config: BiologyTopicConfig;
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

export function BiologyTopicPage({ config }: BiologyTopicPageProps) {
  const topicConfig = topicRegistry.find((topic) => topic.id === config.id) ?? config;
  const questions = topicConfig.questions;
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

  const subject = topicConfig.subject ?? "biology";
  const subjectLabel = subject.charAt(0).toUpperCase() + subject.slice(1);

  const topicMetadata = {
    subject,
    title: topicConfig.title,
    slug: topicConfig.id,
    examBoard: topicConfig.examBoard ?? "AQA",
    topicNumber: topicConfig.topicNumber ?? "Topic",
    description: topicConfig.description ?? "",
    subtopics: topicConfig.subtopics.map((subtopic) => subtopic.title),
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

          <div className="mt-6 sm-panel-sm p-5">
            <h2 className="font-display text-lg font-semibold text-ink">
              How flashcard practice works
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  1. Answer from memory
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  Attempt each question without looking at the marking points first.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  2. Flip the card
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  Reveal the verified marking points and compare with your answer.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  3. Self-assess
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  Rate yourself Again, Hard, Good or Easy to schedule your next review.
                </p>
              </div>
            </div>
          </div>
        </section>

        <SubtopicGrid
          config={topicConfig}
          questions={questions}
          completedQuestions={completedIds}
        />

        <section className="mt-12 rounded-3xl border-2 border-ink bg-ink p-6 text-cream sm:p-8">
          <h2 className="mb-4 font-display text-2xl font-bold text-cream">
            Whole-topic review
          </h2>
          <p className="-mt-2 mb-5 max-w-2xl text-sm leading-6 text-cream/70">
            Choose a subtopic above for focused practice, or review the complete topic here.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={`/practice?mode=flashcards&subject=${subject}&topic=${topicConfig.id}`} className="flex flex-col items-start rounded-2xl border-2 border-ink bg-card p-5 text-ink transition hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-yellow font-display font-bold text-ink">P</div>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">Practice Mode</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">Start flashcards across all subtopics in this topic.</p>
              <span className="mt-3 text-sm font-bold text-orange-dark">Start practice flashcards →</span>
            </Link>
            <Link href={`/practice?mode=exam&subject=${subject}&topic=${topicConfig.id}`} className="flex flex-col items-start rounded-2xl border-2 border-ink bg-card p-5 text-ink transition hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-yellow font-display font-bold text-ink">E</div>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">Exam Mode</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">Attempt questions before revealing the marking points.</p>
              <span className="mt-3 text-sm font-bold text-orange-dark">Start exam practice →</span>
            </Link>
            <Link href={`/practice?mode=mixed&subject=${subject}&topic=${topicConfig.id}`} className="flex flex-col items-start rounded-2xl border-2 border-ink bg-card p-5 text-ink transition hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-yellow font-display font-bold text-ink">M</div>
              <h3 id="mixed-title" className="mt-3 font-display text-lg font-semibold text-ink">
                Mixed Practice
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Random questions across all subtopics for comprehensive review.
              </p>
              <span className="mt-3 text-sm font-bold text-orange-dark">Start mixed practice →</span>
            </Link>

            <Link href={`/practice?mode=bookmarks&subject=${subject}&topic=${topicConfig.id}`} className="flex flex-col items-start rounded-2xl border-2 border-ink bg-card p-5 text-ink transition hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-yellow font-display font-bold text-ink">B</div>
              <h3 id="bookmarked-title" className="mt-3 font-display text-lg font-semibold text-ink">
                Review Bookmarked
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Revisit questions you have bookmarked for later review.
              </p>
              <span className="mt-3 text-sm font-bold text-orange-dark">Review bookmarks →</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BiologyTopicPage;
