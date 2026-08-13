"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import PracticeFilters from "@/components/practice/PracticeFilters";
import QuestionPractice from "@/components/practice/QuestionPractice";
import SubtopicGrid from "@/components/topic/SubtopicGrid";
import TopicHeader from "@/components/topic/TopicHeader";
import type { BiologyTopicConfig, ReviewMap, ReviewRating, ReviewRecord } from "@/types/questions";

type PracticeMode = "mastery" | "flashcards" | "mixed" | "bookmarked";

interface BiologyTopicPageProps {
  config: BiologyTopicConfig;
}

interface ProgressState {
  bookmarkedIds: Set<string>;
  needsPracticeIds: Set<string>;
  completedIds: Set<string>;
  reviewMap: ReviewMap;
}

interface HydrateProgressAction {
  type: "hydrate";
  payload: ProgressState;
}

interface BookmarkAction {
  type: "toggle-bookmark";
  payload: {
    questionId: string;
  };
}

interface CompleteAction {
  type: "complete";
  payload: {
    questionId: string;
    gotIt: boolean;
  };
}

interface ReviewAction {
  type: "review";
  payload: {
    questionId: string;
    rating: ReviewRating;
    reviewMap: ReviewMap;
  };
}

type ProgressAction = HydrateProgressAction | BookmarkAction | CompleteAction | ReviewAction;

const emptyProgressState: ProgressState = {
  bookmarkedIds: new Set<string>(),
  needsPracticeIds: new Set<string>(),
  completedIds: new Set<string>(),
  reviewMap: {},
};

function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case "hydrate":
      return {
        bookmarkedIds: new Set(action.payload.bookmarkedIds),
        needsPracticeIds: new Set(action.payload.needsPracticeIds),
        completedIds: new Set(action.payload.completedIds),
        reviewMap: action.payload.reviewMap,
      };
    case "toggle-bookmark": {
      const next = new Set(state.bookmarkedIds);
      if (next.has(action.payload.questionId)) {
        next.delete(action.payload.questionId);
      } else {
        next.add(action.payload.questionId);
      }

      return {
        ...state,
        bookmarkedIds: next,
      };
    }
    case "complete": {
      const nextCompleted = new Set(state.completedIds);
      nextCompleted.add(action.payload.questionId);

      const nextNeedsPractice = action.payload.gotIt
        ? new Set(state.needsPracticeIds)
        : new Set(state.needsPracticeIds).add(action.payload.questionId);

      return {
        ...state,
        completedIds: nextCompleted,
        needsPracticeIds: nextNeedsPractice,
      };
    }
    case "review": {
      const nextCompleted = new Set(state.completedIds);
      nextCompleted.add(action.payload.questionId);

      const nextNeedsPractice =
        action.payload.rating === "again" || action.payload.rating === "hard"
          ? new Set(state.needsPracticeIds).add(action.payload.questionId)
          : (() => {
              const next = new Set(state.needsPracticeIds);
              next.delete(action.payload.questionId);
              return next;
            })();

      return {
        ...state,
        completedIds: nextCompleted,
        needsPracticeIds: nextNeedsPractice,
        reviewMap: {
          ...action.payload.reviewMap,
          [action.payload.questionId]: scheduleNextReview(
            state.reviewMap[action.payload.questionId],
            action.payload.rating
          ),
        },
      };
    }
    default:
      return state;
  }
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

function loadStoredReviewMap(storageKey: string): ReviewMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    const reviews: ReviewMap = {};

    if (Array.isArray(parsed)) {
      parsed.forEach((entry) => {
        if (typeof entry !== "object" || entry === null) {
          return;
        }

        const candidate = entry as {
          id?: unknown;
          questionId?: unknown;
          rating?: unknown;
          reviewedAt?: unknown;
          dueAt?: unknown;
          intervalDays?: unknown;
          repetitions?: unknown;
        };

        const idValue =
          typeof candidate.id === "string"
            ? candidate.id
            : typeof candidate.questionId === "string"
              ? candidate.questionId
              : "";

        if (!idValue) {
          return;
        }

        const validRating =
          candidate.rating === "again" ||
          candidate.rating === "hard" ||
          candidate.rating === "good" ||
          candidate.rating === "easy";

        if (validRating && typeof candidate.rating === "string") {
          if (
            candidate.reviewedAt &&
            typeof candidate.reviewedAt === "string" &&
            candidate.dueAt &&
            typeof candidate.dueAt === "string" &&
            typeof candidate.intervalDays === "number" &&
            typeof candidate.repetitions === "number"
          ) {
            reviews[idValue] = {
              rating: candidate.rating as ReviewRating,
              reviewedAt: candidate.reviewedAt,
              dueAt: candidate.dueAt,
              intervalDays: candidate.intervalDays,
              repetitions: candidate.repetitions,
            };
          } else {
            const fallbackDate = new Date().toISOString();
            reviews[idValue] = {
              rating: candidate.rating as ReviewRating,
              reviewedAt: fallbackDate,
              dueAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              intervalDays: 0,
              repetitions: 0,
            };
          }
        }
      });
    } else if (parsed && typeof parsed === "object") {
      Object.entries(parsed as Record<string, unknown>).forEach(([id, value]) => {
        if (typeof value === "string") {
          const candidateValue = value as "again" | "hard" | "good" | "easy";
          if (
            candidateValue === "again" ||
            candidateValue === "hard" ||
            candidateValue === "good" ||
            candidateValue === "easy"
          ) {
            const reviewedAt = new Date().toISOString();
            reviews[id] = {
              rating: candidateValue,
              reviewedAt,
              dueAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              intervalDays: 0,
              repetitions: 0,
            };
          }
        }
      });
    }

    return reviews;
  } catch {
    return {};
  }
}

function scheduleNextReview(
  previous: ReviewRecord | undefined,
  rating: ReviewRating,
  now: Date = new Date()
): ReviewRecord {
  const reviewedAt = now.toISOString();

  if (!previous) {
    const firstSchedule = {
      again: { dueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(), intervalDays: 0, repetitions: 0 },
      hard: { dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), intervalDays: 1, repetitions: 1 },
      good: { dueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), intervalDays: 3, repetitions: 1 },
      easy: { dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), intervalDays: 7, repetitions: 1 },
    };

    const due = firstSchedule[rating];

    return {
      rating,
      reviewedAt,
      dueAt: due.dueAt,
      intervalDays: due.intervalDays,
      repetitions: due.repetitions,
    };
  }

  if (rating === "again") {
    return {
      rating,
      reviewedAt,
      dueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      intervalDays: 0,
      repetitions: 0,
    };
  }

  if (rating === "hard") {
    const intervalDays = Math.max(1, Math.round(previous.intervalDays * 1.2));
    return {
      rating,
      reviewedAt,
      dueAt: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString(),
      intervalDays,
      repetitions: previous.repetitions + 1,
    };
  }

  if (rating === "good") {
    const intervalDays = Math.max(3, Math.round(previous.intervalDays * 2));
    return {
      rating,
      reviewedAt,
      dueAt: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString(),
      intervalDays,
      repetitions: previous.repetitions + 1,
    };
  }

  const intervalDays = Math.max(7, Math.round(previous.intervalDays * 3));
  return {
    rating,
    reviewedAt,
    dueAt: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString(),
    intervalDays,
    repetitions: previous.repetitions + 1,
  };
}

export function BiologyTopicPage({ config }: BiologyTopicPageProps) {
  const questions = config.questions;
  const bookmarksKey = `${config.storageNamespace}_bookmarks`;
  const needsPracticeKey = `${config.storageNamespace}_needspractice`;
  const completedKey = `${config.storageNamespace}_completed`;
  const reviewsKey = `${config.storageNamespace}_reviews`;

  const [view, setView] = useState<"topic" | "practice">("topic");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("mastery");

  const [filterSubtopic, setFilterSubtopic] = useState<string | null>(null);
  const [filterAO, setFilterAO] = useState<"AO1" | "AO2" | "AO3" | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<
    "Foundation" | "Higher" | "Both" | null
  >(null);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [showNeedsPracticeOnly, setShowNeedsPracticeOnly] = useState(false);
  const [showDueOnly, setShowDueOnly] = useState(false);

  const [progress, dispatchProgress] = useReducer(progressReducer, emptyProgressState);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hydratedProgress: ProgressState = {
      bookmarkedIds: new Set(loadStoredStringArray(bookmarksKey)),
      needsPracticeIds: new Set(loadStoredStringArray(needsPracticeKey)),
      completedIds: new Set(loadStoredStringArray(completedKey)),
      reviewMap: loadStoredReviewMap(reviewsKey),
    };

    dispatchProgress({
      type: "hydrate",
      payload: hydratedProgress,
    });
    hasHydrated.current = true;
  }, [bookmarksKey, completedKey, needsPracticeKey, reviewsKey]);

  useEffect(() => {
    if (!hasHydrated.current || typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(bookmarksKey, JSON.stringify(Array.from(progress.bookmarkedIds)));
    } catch (e) {
      console.error("Failed to save bookmarks:", e);
    }
  }, [bookmarksKey, progress.bookmarkedIds]);

  useEffect(() => {
    if (!hasHydrated.current || typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(needsPracticeKey, JSON.stringify(Array.from(progress.needsPracticeIds)));
    } catch (e) {
      console.error("Failed to save needs practice:", e);
    }
  }, [needsPracticeKey, progress.needsPracticeIds]);

  useEffect(() => {
    if (!hasHydrated.current || typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(completedKey, JSON.stringify(Array.from(progress.completedIds)));
    } catch (e) {
      console.error("Failed to save completed:", e);
    }
  }, [completedKey, progress.completedIds]);

  useEffect(() => {
    if (!hasHydrated.current || typeof window === "undefined") {
      return;
    }

    try {
      const serialisedReviews = Object.entries(progress.reviewMap).map(([id, record]) => ({
        id,
        ...record,
      }));

      localStorage.setItem(reviewsKey, JSON.stringify(serialisedReviews));
    } catch (e) {
      console.error("Failed to save reviews:", e);
    }
  }, [progress.reviewMap, reviewsKey]);

  const handleBookmark = (questionId: string) => {
    dispatchProgress({
      type: "toggle-bookmark",
      payload: { questionId },
    });
  };

  const handleComplete = (questionId: string, gotIt: boolean) => {
    dispatchProgress({
      type: "complete",
      payload: { questionId, gotIt },
    });
  };

  const handleReview = (questionId: string, rating: ReviewRating) => {
    dispatchProgress({
      type: "review",
      payload: {
        questionId,
        rating,
        reviewMap: progress.reviewMap,
      },
    });
  };

  const handleSubtopicSelect = (subtopic: string) => {
    setSelectedSubtopic(subtopic);
    setView("practice");
    setPracticeMode("mastery");
  };

  const handleBackToTopic = () => {
    setView("topic");
    setSelectedSubtopic(null);
    setFilterSubtopic(null);
    setFilterAO(null);
    setFilterDifficulty(null);
    setShowBookmarkedOnly(false);
    setShowNeedsPracticeOnly(false);
    setShowDueOnly(false);
  };

  const totalQuestions = questions.length;
  const completedCount = Array.from(progress.completedIds).filter((id) =>
    questions.some((question) => question.id === id)
  ).length;
  const progressPercentage =
    totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  const subject = config.subject ?? "biology";
  const subjectLabel = subject.charAt(0).toUpperCase() + subject.slice(1);

  const topicMetadata = {
    subject,
    title: config.title,
    slug: config.id,
    examBoard: config.examBoard ?? "AQA",
    topicNumber: config.topicNumber ?? "Topic",
    description: config.description ?? "",
    subtopics: config.subtopics.map((subtopic) => subtopic.title),
  };

  return (
    <div className="min-h-screen bg-white text-[#0b1d33]">
      <TopicHeader metadata={topicMetadata} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {view === "topic" && (
          <>
            <section className="mb-8">
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center gap-2 text-sm font-semibold text-[#5a6b7f]">
                  <li>
                    <Link href={"/" + subject} className="transition hover:text-[#0b1d33]">
                      {subjectLabel}
                    </Link>
                  </li>
                  <li>
                    <span className="text-[#dce2e7]">/</span>
                  </li>
                  <li aria-current="page" className="text-[#0b1d33]">
                    {config.title}
                  </li>
                </ol>
              </nav>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">
                      {topicMetadata.topicNumber}
                    </span>
                    <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
                      {topicMetadata.examBoard} GCSE {subjectLabel}
                    </span>
                  </div>

                  <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                    {config.title}
                  </h1>

                  <p className="mt-3 max-w-3xl leading-7 text-[#5a6b7f]">
                    {config.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <div className="rounded-2xl border border-[#e6eaee] bg-[#f7f9fa] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#5a6b7f]">
                      Topic progress
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-3 w-32 rounded-full bg-[#dce2e7]">
                        <div
                          className="h-3 rounded-full bg-[#00a551] transition-all"
                          style={{ width: `${progressPercentage}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-sm font-bold text-[#00a551]">
                        {completedCount}/{totalQuestions} complete
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#e6eaee] bg-[#f7f9fa] p-5">
                <h2 className="text-lg font-extrabold text-[#0b1d33]">
                  How mastery questions work
                </h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold text-[#5a6b7f]">
                      1. Answer from memory
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5a6b7f]">
                      Attempt each question without looking at the marking points first.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#5a6b7f]">
                      2. Check marking points
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5a6b7f]">
                      Reveal the verified marking points and compare with your answer.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#5a6b7f]">
                      3. Self-assess
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5a6b7f]">
                      Mark whether you got it or need more practice to track progress.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <SubtopicGrid
              config={config}
              questions={questions}
              completedQuestions={progress.completedIds}
              onSubtopicSelect={handleSubtopicSelect}
            />

            <section className="mt-12 rounded-3xl bg-[#0f1f3d] p-6 text-white sm:p-8">
              <h2 className="mb-4 text-2xl font-extrabold text-white">
                Whole-topic review
              </h2>
              <p className="-mt-2 mb-5 max-w-2xl text-sm leading-6 text-[#c8d2df]">
                Choose a subtopic above for focused practice, or review the complete topic here.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Link href={`/practice?mode=exam&subject=${subject}&topic=${config.id}`} className="flex flex-col items-start rounded-2xl bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f8f0] font-black text-[#02753a]">E</div>
                  <h3 className="mt-3 text-lg font-extrabold text-[#0b1d33]">Exam Mode</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">Attempt questions before revealing the marking points.</p>
                  <span className="mt-3 text-sm font-bold text-[#00a551]">Start exam practice →</span>
                </Link>
                <Link href={`/practice?mode=mixed&subject=${subject}&topic=${config.id}`} className="flex flex-col items-start rounded-2xl bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f8f0] font-black text-[#02753a]">M</div>
                  <h3 id="mixed-title" className="mt-3 text-lg font-extrabold text-[#0b1d33]">
                    Mixed Practice
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">
                    Random questions across all subtopics for comprehensive review.
                  </p>
                  <span className="mt-3 text-sm font-bold text-[#00a551]">Start mixed practice →</span>
                </Link>

                <Link href={`/practice?mode=bookmarks&subject=${subject}&topic=${config.id}`} className="flex flex-col items-start rounded-2xl bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f8f0] font-black text-[#02753a]">B</div>
                  <h3 id="bookmarked-title" className="mt-3 text-lg font-extrabold text-[#0b1d33]">
                    Review Bookmarked
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">
                    Revisit questions you have bookmarked for later review.
                  </p>
                  <span className="mt-3 text-sm font-bold text-[#00a551]">Review bookmarks →</span>
                </Link>
              </div>
            </section>
          </>
        )}

        {view === "practice" && practiceMode === "mastery" && (
          <>
            <PracticeFilters
              questions={questions}
              selectedSubtopic={filterSubtopic}
              selectedAO={filterAO}
              selectedDifficulty={filterDifficulty}
              showBookmarkedOnly={showBookmarkedOnly}
              showNeedsPracticeOnly={showNeedsPracticeOnly}
              showDueOnly={showDueOnly}
              onSubtopicChange={setFilterSubtopic}
              onAOChange={setFilterAO}
              onDifficultyChange={setFilterDifficulty}
              onBookmarkedToggle={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              onNeedsPracticeToggle={() => setShowNeedsPracticeOnly(!showNeedsPracticeOnly)}
              onDueToggle={() => setShowDueOnly(!showDueOnly)}
            />

            <div className="mt-6">
              <QuestionPractice
                questions={questions}
                initialSubtopic={selectedSubtopic || filterSubtopic}
                filterSubtopic={filterSubtopic}
                filterAO={filterAO}
                filterDifficulty={filterDifficulty}
                showBookmarkedOnly={showBookmarkedOnly}
                showNeedsPracticeOnly={showNeedsPracticeOnly}
                showDueOnly={showDueOnly}
                onComplete={handleComplete}
                onReview={handleReview}
                onBookmark={handleBookmark}
                bookmarkedIds={progress.bookmarkedIds}
                needsPracticeIds={progress.needsPracticeIds}
                reviewMap={progress.reviewMap}
                onBackToTopic={handleBackToTopic}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default BiologyTopicPage;
