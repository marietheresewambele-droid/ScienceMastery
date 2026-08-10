"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopicHeader from "@/components/topic/TopicHeader";
import SubtopicGrid from "@/components/topic/SubtopicGrid";
import QuestionPractice from "@/components/practice/QuestionPractice";
import PracticeFilters from "@/components/practice/PracticeFilters";
import { cellBiologyMetadata, cellBiologyQuestions } from "@/data/topics/cell-biology";
import type { ReviewMap, ReviewRating, ReviewRecord } from "@/types/questions";

type PracticeMode = "mastery" | "flashcards" | "mixed" | "bookmarked";

function loadStoredStringArray(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(key);
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

function loadStoredReviewMap(): ReviewMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem("sciencemastery_cellbiology_reviews");
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

        const idValue = typeof candidate.id === "string"
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

export default function CellBiologyPage() {
  // View state: 'topic' or 'practice'
  const [view, setView] = useState<"topic" | "practice">("topic");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("mastery");

  // Filter states
  const [filterSubtopic, setFilterSubtopic] = useState<string | null>(null);
  const [filterAO, setFilterAO] = useState<"AO1" | "AO2" | "AO3" | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<
    "Foundation" | "Higher" | "Both" | null
  >(null);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [showNeedsPracticeOnly, setShowNeedsPracticeOnly] = useState(false);
  const [showDueOnly, setShowDueOnly] = useState(false);

  // localStorage state - using lazy initialisers for SSR safety
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() =>
    new Set(loadStoredStringArray("sciencemastery_cellbiology_bookmarks"))
  );
  const [needsPracticeIds, setNeedsPracticeIds] = useState<Set<string>>(() =>
    new Set(loadStoredStringArray("sciencemastery_cellbiology_needspractice"))
  );
  const [completedIds, setCompletedIds] = useState<Set<string>>(() =>
    new Set(loadStoredStringArray("sciencemastery_cellbiology_completed"))
  );
  const [reviewMap, setReviewMap] = useState<ReviewMap>(() =>
    loadStoredReviewMap()
  );

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "sciencemastery_cellbiology_bookmarks",
          JSON.stringify(Array.from(bookmarkedIds))
        );
      } catch (e) {
        console.error("Failed to save bookmarks:", e);
      }
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "sciencemastery_cellbiology_needspractice",
          JSON.stringify(Array.from(needsPracticeIds))
        );
      } catch (e) {
        console.error("Failed to save needs practice:", e);
      }
    }
  }, [needsPracticeIds]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "sciencemastery_cellbiology_completed",
          JSON.stringify(Array.from(completedIds))
        );
      } catch (e) {
        console.error("Failed to save completed:", e);
      }
    }
  }, [completedIds]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const serialisedReviews = Object.entries(reviewMap).map(([id, record]) => ({
          id,
          ...record,
        }));

        localStorage.setItem(
          "sciencemastery_cellbiology_reviews",
          JSON.stringify(serialisedReviews)
        );
      } catch (e) {
        console.error("Failed to save reviews:", e);
      }
    }
  }, [reviewMap]);

  const handleBookmark = (questionId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleComplete = (questionId: string, gotIt: boolean) => {
    setCompletedIds((prev) => new Set(prev).add(questionId));
    if (!gotIt) {
      setNeedsPracticeIds((prev) => new Set(prev).add(questionId));
    }
  };

  const handleReview = (questionId: string, rating: ReviewRating) => {
    setCompletedIds((prev) => new Set(prev).add(questionId));

    if (rating === "again" || rating === "hard") {
      setNeedsPracticeIds((prev) => new Set(prev).add(questionId));
    } else {
      setNeedsPracticeIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }

    const nextReview = scheduleNextReview(reviewMap[questionId], rating);

    setReviewMap((prev) => {
      return {
        ...prev,
        [questionId]: nextReview,
      };
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

  // Calculate topic progress
  const totalQuestions = cellBiologyQuestions.length;
  const completedCount = Array.from(completedIds).filter((id) =>
    cellBiologyQuestions.some((q) => q.id === id)
  ).length;
  const progressPercentage =
    totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-white text-[#0b1d33]">
      <TopicHeader metadata={cellBiologyMetadata} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {view === "topic" && (
          <>
            {/* Breadcrumb and intro */}
            <section className="mb-8">
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center gap-2 text-sm font-semibold text-[#5a6b7f]">
                  <li>
                    <Link
                      href="/"
                      className="transition hover:text-[#0b1d33]"
                    >
                      Biology
                    </Link>
                  </li>
                  <li>
                    <span className="text-[#dce2e7]">/</span>
                  </li>
                  <li aria-current="page" className="text-[#0b1d33]">
                    Cell Biology
                  </li>
                </ol>
              </nav>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">
                      {cellBiologyMetadata.topicNumber}
                    </span>
                    <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
                      {cellBiologyMetadata.examBoard} GCSE Biology
                    </span>
                  </div>

                  <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                    {cellBiologyMetadata.title}
                  </h1>

                  <p className="mt-3 max-w-3xl leading-7 text-[#5a6b7f]">
                    Master the fundamentals of cell biology through focused
                    practice questions. Compare your answers with marking points
                    and use active recall to build lasting understanding.
                  </p>
                </div>

                {/* Progress indicator */}
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

              {/* Explanation of mastery approach */}
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
                      Attempt each question without looking at the marking
                      points first.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#5a6b7f]">
                      2. Check marking points
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5a6b7f]">
                      Reveal the verified marking points and compare with your
                      answer.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#5a6b7f]">
                      3. Self-assess
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5a6b7f]">
                      Mark whether you got it or need more practice to track
                      progress.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Subtopic cards */}
            <SubtopicGrid
              metadata={cellBiologyMetadata}
              questions={cellBiologyQuestions}
              completedQuestions={completedIds}
              onSubtopicSelect={handleSubtopicSelect}
            />

            {/* Practice modes section */}
            <section className="mt-12">
              <h2 className="mb-4 text-2xl font-extrabold text-[#0b1d33]">
                Practice modes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Mastery Questions - functional */}
                <button
                  type="button"
                  onClick={() => {
                    setPracticeMode("mastery");
                    setView("practice");
                  }}
                  className="flex flex-col items-start rounded-2xl border border-[#e6eaee] bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#00a551]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f8f0] font-black text-[#02753a]">
                    1
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold text-[#0b1d33]">
                    Mastery Questions
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">
                    Work through structured questions by subtopic with marking
                    points.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#00a551]">
                    Start practising
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                </button>

                {/* Flashcards - coming soon */}
                <article
                  className="flex flex-col items-start rounded-2xl border border-[#e6eaee] bg-[#f7f9fa] p-5 opacity-70"
                  aria-labelledby="flashcards-title"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dce2e7] font-black text-[#5a6b7f]">
                    2
                  </div>
                  <h3
                    id="flashcards-title"
                    className="mt-3 text-lg font-extrabold text-[#0b1d33]"
                  >
                    Flashcards
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">
                    Use active recall with flip cards for key concepts.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#dce2e7] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
                    Coming soon
                  </span>
                </article>

                {/* Mixed Practice - coming soon */}
                <article
                  className="flex flex-col items-start rounded-2xl border border-[#e6eaee] bg-[#f7f9fa] p-5 opacity-70"
                  aria-labelledby="mixed-title"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dce2e7] font-black text-[#5a6b7f]">
                    3
                  </div>
                  <h3
                    id="mixed-title"
                    className="mt-3 text-lg font-extrabold text-[#0b1d33]"
                  >
                    Mixed Practice
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">
                    Random questions across all subtopics for comprehensive
                    review.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#dce2e7] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
                    Coming soon
                  </span>
                </article>

                {/* Review Bookmarked - coming soon */}
                <article
                  className="flex flex-col items-start rounded-2xl border border-[#e6eaee] bg-[#f7f9fa] p-5 opacity-70"
                  aria-labelledby="bookmarked-title"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dce2e7] font-black text-[#5a6b7f]">
                    4
                  </div>
                  <h3
                    id="bookmarked-title"
                    className="mt-3 text-lg font-extrabold text-[#0b1d33]"
                  >
                    Review Bookmarked
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">
                    Revisit questions you have bookmarked for later review.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#dce2e7] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
                    Coming soon
                  </span>
                </article>
              </div>
            </section>
          </>
        )}

        {view === "practice" && practiceMode === "mastery" && (
          <>
            {/* Filters */}
            <PracticeFilters
              questions={cellBiologyQuestions}
              selectedSubtopic={filterSubtopic}
              selectedAO={filterAO}
              selectedDifficulty={filterDifficulty}
              showBookmarkedOnly={showBookmarkedOnly}
              showNeedsPracticeOnly={showNeedsPracticeOnly}
              showDueOnly={showDueOnly}
              onSubtopicChange={setFilterSubtopic}
              onAOChange={setFilterAO}
              onDifficultyChange={setFilterDifficulty}
              onBookmarkedToggle={() =>
                setShowBookmarkedOnly(!showBookmarkedOnly)
              }
              onNeedsPracticeToggle={() =>
                setShowNeedsPracticeOnly(!showNeedsPracticeOnly)
              }
              onDueToggle={() => setShowDueOnly(!showDueOnly)}
            />

            {/* Question practice interface */}
            <div className="mt-6">
              <QuestionPractice
                questions={cellBiologyQuestions}
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
                bookmarkedIds={bookmarkedIds}
                needsPracticeIds={needsPracticeIds}
                reviewMap={reviewMap}
                onBackToTopic={handleBackToTopic}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
