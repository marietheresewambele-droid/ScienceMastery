"use client";

import { useState, useMemo, useCallback } from "react";
import { MasteryQuestion, ReviewMap, ReviewRating } from "@/types/questions";

interface QuestionPracticeProps {
  questions: MasteryQuestion[];
  initialSubtopic?: string | null;
  filterSubtopic?: string | null;
  filterAO?: "AO1" | "AO2" | "AO3" | null;
  filterDifficulty?: "Foundation" | "Higher" | "Both" | null;
  showBookmarkedOnly?: boolean;
  showNeedsPracticeOnly?: boolean;
  showDueOnly?: boolean;
  onComplete: (questionId: string, gotIt: boolean) => void;
  onReview: (questionId: string, rating: ReviewRating) => void;
  onBookmark: (questionId: string) => void;
  bookmarkedIds: Set<string>;
  needsPracticeIds: Set<string>;
  reviewMap: ReviewMap;
  onBackToTopic: () => void;
}

export default function QuestionPractice({
  questions,
  initialSubtopic,
  filterSubtopic = null,
  filterAO = null,
  filterDifficulty = null,
  showBookmarkedOnly = false,
  showNeedsPracticeOnly = false,
  showDueOnly = false,
  onComplete,
  onReview,
  onBookmark,
  bookmarkedIds,
  needsPracticeIds,
  reviewMap,
  onBackToTopic,
}: QuestionPracticeProps) {
  const [currentTime] = useState(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Derive filtered questions using useMemo - no state sync needed
  const filteredQuestions = useMemo(() => {
    let result = questions;

    // Apply initialSubtopic filter if provided and no explicit filterSubtopic
    const effectiveSubtopic = filterSubtopic ?? initialSubtopic;

    if (effectiveSubtopic) {
      result = result.filter((q) => q.subtopic === effectiveSubtopic);
    }
    if (filterAO) {
      result = result.filter((q) => q.assessmentObjective.includes(filterAO));
    }
    if (filterDifficulty) {
      result = result.filter((q) => q.difficulty === filterDifficulty);
    }
    if (showBookmarkedOnly) {
      result = result.filter((q) => bookmarkedIds.has(q.id));
    }
    if (showNeedsPracticeOnly) {
      result = result.filter((q) => needsPracticeIds.has(q.id));
    }
    if (showDueOnly) {
      result = result.filter((q) => {
        const review = reviewMap[q.id];
        if (!review) {
          return false;
        }

        return new Date(review.dueAt).getTime() <= currentTime;
      });
    }

    return result;
  }, [
    questions,
    initialSubtopic,
    filterSubtopic,
    filterAO,
    filterDifficulty,
    showBookmarkedOnly,
    showNeedsPracticeOnly,
    showDueOnly,
    currentTime,
    bookmarkedIds,
    needsPracticeIds,
    reviewMap,
  ]);

  // Reset currentIndex when filtered questions change significantly
  // Only reset if current index is out of bounds
  const safeCurrentIndex = useMemo(() => {
    if (currentIndex >= filteredQuestions.length) {
      return Math.max(0, filteredQuestions.length - 1);
    }
    return currentIndex;
  }, [currentIndex, filteredQuestions.length]);

  const currentQuestion = filteredQuestions[safeCurrentIndex];

  const handleNext = useCallback(() => {
    if (safeCurrentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(safeCurrentIndex + 1);
      setShowAnswer(false);
    }
  }, [safeCurrentIndex, filteredQuestions.length]);

  const handlePrevious = useCallback(() => {
    if (safeCurrentIndex > 0) {
      setCurrentIndex(safeCurrentIndex - 1);
      setShowAnswer(false);
    }
  }, [safeCurrentIndex]);

  const getRatingPreview = (rating: ReviewRating) => {
    const previous = reviewMap[currentQuestion?.id ?? ""];

    if (!previous) {
      if (rating === "again") {
        return "10 minutes";
      }

      if (rating === "hard") {
        return "1 day";
      }

      if (rating === "good") {
        return "3 days";
      }

      return "7 days";
    }

    if (rating === "again") {
      return "10 minutes";
    }

    if (rating === "hard") {
      return `${Math.max(1, Math.round(previous.intervalDays * 1.2))} ${Math.max(1, Math.round(previous.intervalDays * 1.2)) === 1 ? "day" : "days"}`;
    }

    if (rating === "good") {
      return `${Math.max(3, Math.round(previous.intervalDays * 2))} ${Math.max(3, Math.round(previous.intervalDays * 2)) === 1 ? "day" : "days"}`;
    }

    return `${Math.max(7, Math.round(previous.intervalDays * 3))} ${Math.max(7, Math.round(previous.intervalDays * 3)) === 1 ? "day" : "days"}`;
  };

  const handleRating = (rating: ReviewRating) => {
    if (currentQuestion) {
      onReview(currentQuestion.id, rating);
      onComplete(currentQuestion.id, true);
      handleNext();
    }
  };

  const handleBookmarkToggle = () => {
    if (currentQuestion) {
      onBookmark(currentQuestion.id);
    }
  };

  if (!currentQuestion || filteredQuestions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e6eaee] bg-white p-8 text-center">
        <p className="text-lg font-bold text-[#5a6b7f]">
          No questions available for this selection.
        </p>
        <button
          type="button"
          onClick={onBackToTopic}
          className="mt-4 rounded-xl bg-[#00a551] px-6 py-3 font-bold text-white transition hover:bg-[#028f46]"
        >
          Back to topic
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="practice-heading" className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToTopic}
          className="flex items-center gap-2 text-sm font-semibold text-[#5a6b7f] transition hover:text-[#0b1d33]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to topic
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#5a6b7f]">
            Question {safeCurrentIndex + 1} of {filteredQuestions.length}
          </span>
          <div className="h-2 w-40 rounded-full bg-[#e6eaee]">
            <div
              className="h-2 rounded-full bg-[#00a551] transition-all"
              style={{
                width: `${((safeCurrentIndex + 1) / filteredQuestions.length) * 100}%`,
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Question card */}
      <article className="rounded-2xl border border-[#e6eaee] bg-white p-6 shadow-sm sm:p-8">
        {/* Question metadata */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">
              {currentQuestion.subtopic}
            </span>
            <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
              {currentQuestion.assessmentObjective}
            </span>
            {currentQuestion.difficulty && (
              <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-bold text-[#92400e]">
                {currentQuestion.difficulty}
              </span>
            )}
            {currentQuestion.commandWord && (
              <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-bold text-[#1e40af]">
                {currentQuestion.commandWord}
              </span>
            )}
          </div>

          <span className="rounded-xl bg-[#0b1d33] px-4 py-2 text-sm font-bold text-white">
            {currentQuestion.marks}{" "}
            {currentQuestion.marks === 1 ? "mark" : "marks"}
          </span>
        </div>

        {/* Question text */}
        <div className="mt-6">
          <h2
            id="practice-heading"
            className="text-xl font-extrabold leading-8 text-[#0b1d33]"
          >
            {currentQuestion.question}
          </h2>
        </div>

        <div className="mt-6">
          {!showAnswer ? (
            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              className="w-full rounded-xl bg-[#0b1d33] px-6 py-4 font-bold text-white transition hover:bg-[#1a3a52] focus:outline-none focus:ring-2 focus:ring-[#0b1d33]"
            >
              Reveal answer
            </button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#00a551] bg-[#f0fdf4] p-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#02753a]">
                  Answer guidance
                </h3>

                {currentQuestion.modelAnswer ? (
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-[#5a6b7f]">
                      Model answer
                    </p>
                    <p className="mt-2 text-[#0b1d33]">{currentQuestion.modelAnswer}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-[#5a6b7f]">
                      Guidance points
                    </p>
                    <ul className="mt-2 space-y-2">
                      {currentQuestion.markingPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00a551] text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="text-[#0b1d33]">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-[#dce2e7] bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#5a6b7f]">
                    Marking points
                  </h3>
                  <ul className="space-y-2">
                    {currentQuestion.markingPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00a551] text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="text-[#0b1d33]">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#0b1d33] px-3 py-1 text-xs font-bold text-white">
                      {currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}
                    </span>
                    {currentQuestion.commandWord && (
                      <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-bold text-[#1e40af]">
                        {currentQuestion.commandWord}
                      </span>
                    )}
                    {currentQuestion.assessmentObjective && (
                      <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#5a6b7f]">
                        {currentQuestion.assessmentObjective}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => handleRating("again")}
                  className="rounded-xl bg-[#dc2626] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                >
                  <span className="block">Again — Review soon</span>
                  <span className="mt-1 block text-xs font-semibold opacity-90">
                    {getRatingPreview("again")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRating("hard")}
                  className="rounded-xl bg-[#d97706] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#b45309] focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                >
                  <span className="block">Hard — Short interval</span>
                  <span className="mt-1 block text-xs font-semibold opacity-90">
                    {getRatingPreview("hard")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRating("good")}
                  className="rounded-xl bg-[#00a551] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#028f46] focus:outline-none focus:ring-2 focus:ring-[#00a551]"
                >
                  <span className="block">Good — Normal interval</span>
                  <span className="mt-1 block text-xs font-semibold opacity-90">
                    {getRatingPreview("good")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRating("easy")}
                  className="rounded-xl bg-[#1e40af] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  <span className="block">Easy — Longer interval</span>
                  <span className="mt-1 block text-xs font-semibold opacity-90">
                    {getRatingPreview("easy")}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation and bookmark */}
        {showAnswer && (
          <div className="mt-6 flex items-center justify-between border-t border-[#e6eaee] pt-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={safeCurrentIndex === 0}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
                  safeCurrentIndex === 0
                    ? "cursor-not-allowed bg-[#dce2e7] text-[#9ca3af]"
                    : "bg-white text-[#5a6b7f] hover:bg-[#f7f9fa]"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={safeCurrentIndex === filteredQuestions.length - 1}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
                  safeCurrentIndex === filteredQuestions.length - 1
                    ? "cursor-not-allowed bg-[#dce2e7] text-[#9ca3af]"
                    : "bg-[#00a551] text-white hover:bg-[#028f46]"
                }`}
              >
                Next
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={handleBookmarkToggle}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
                bookmarkedIds.has(currentQuestion.id)
                  ? "bg-[#00a551] text-white"
                  : "border border-[#dce2e7] bg-white text-[#5a6b7f] hover:border-[#00a551]"
              }`}
              aria-pressed={bookmarkedIds.has(currentQuestion.id)}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill={bookmarkedIds.has(currentQuestion.id) ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3V5z" />
              </svg>
              {bookmarkedIds.has(currentQuestion.id) ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
        )}
      </article>
    </section>
  );
}
