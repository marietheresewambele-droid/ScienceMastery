"use client";

import { useState, useEffect, useCallback } from "react";
import { MasteryQuestion } from "@/types/questions";

interface QuestionPracticeProps {
  questions: MasteryQuestion[];
  initialSubtopic?: string | null;
  onComplete: (questionId: string, gotIt: boolean) => void;
  onBookmark: (questionId: string) => void;
  onNeedsPractice: (questionId: string) => void;
  bookmarkedIds: Set<string>;
  needsPracticeIds: Set<string>;
  onBackToTopic: () => void;
}

export default function QuestionPractice({
  questions,
  initialSubtopic,
  onComplete,
  onBookmark,
  onNeedsPractice,
  bookmarkedIds,
  needsPracticeIds,
  onBackToTopic,
}: QuestionPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMarkingPoints, setShowMarkingPoints] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [filteredQuestions, setFilteredQuestions] =
    useState<MasteryQuestion[]>(questions);

  // Filter questions by subtopic if provided
  useEffect(() => {
    if (initialSubtopic) {
      const filtered = questions.filter((q) => q.subtopic === initialSubtopic);
      setFilteredQuestions(filtered);
      setCurrentIndex(0);
    } else {
      setFilteredQuestions(questions);
    }
  }, [initialSubtopic, questions]);

  const currentQuestion = filteredQuestions[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowMarkingPoints(false);
      setStudentAnswer("");
    }
  }, [currentIndex, filteredQuestions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowMarkingPoints(false);
      setStudentAnswer("");
    }
  }, [currentIndex]);

  const handleGotIt = () => {
    if (currentQuestion) {
      onComplete(currentQuestion.id, true);
      handleNext();
    }
  };

  const handleNeedsMorePractice = () => {
    if (currentQuestion) {
      onNeedsPractice(currentQuestion.id);
      onComplete(currentQuestion.id, false);
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
            Question {currentIndex + 1} of {filteredQuestions.length}
          </span>
          <div className="h-2 w-40 rounded-full bg-[#e6eaee]">
            <div
              className="h-2 rounded-full bg-[#00a551] transition-all"
              style={{
                width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%`,
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

        {/* Student answer textarea */}
        <div className="mt-6">
          <label
            htmlFor="student-answer"
            className="block text-sm font-semibold text-[#5a6b7f]"
          >
            Your answer
          </label>
          <textarea
            id="student-answer"
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Type your answer here from memory..."
            rows={5}
            className="mt-2 w-full rounded-xl border border-[#dce2e7] bg-[#f7f9fa] px-4 py-3 text-[#0b1d33] placeholder:text-[#9ca3af] focus:border-[#00a551] focus:outline-none focus:ring-2 focus:ring-[#00a551]"
          />
        </div>

        {/* Reveal marking points button */}
        <div className="mt-6">
          {!showMarkingPoints ? (
            <button
              type="button"
              onClick={() => setShowMarkingPoints(true)}
              className="w-full rounded-xl bg-[#0b1d33] px-6 py-4 font-bold text-white transition hover:bg-[#1a3a52] focus:outline-none focus:ring-2 focus:ring-[#0b1d33]"
            >
              Reveal marking points
            </button>
          ) : (
            <div className="space-y-4">
              {/* Marking points */}
              <div className="rounded-2xl border border-[#00a551] bg-[#f0fdf4] p-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#02753a]">
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
              </div>

              {/* Model answer (if available) */}
              {currentQuestion.modelAnswer && (
                <div className="rounded-2xl border border-[#dce2e7] bg-[#f7f9fa] p-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#5a6b7f]">
                    Model answer
                  </h3>
                  <p className="text-[#0b1d33]">{currentQuestion.modelAnswer}</p>
                </div>
              )}

              {/* Self-assessment buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGotIt}
                  className="flex-1 rounded-xl bg-[#00a551] px-6 py-4 font-bold text-white transition hover:bg-[#028f46] focus:outline-none focus:ring-2 focus:ring-[#00a551]"
                >
                  I got it
                </button>
                <button
                  type="button"
                  onClick={handleNeedsMorePractice}
                  className="flex-1 rounded-xl border border-[#dce2e7] bg-white px-6 py-4 font-bold text-[#5a6b7f] transition hover:border-[#f59e0b] hover:text-[#b45309] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                >
                  I need more practice
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation and bookmark */}
        {showMarkingPoints && (
          <div className="mt-6 flex items-center justify-between border-t border-[#e6eaee] pt-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
                  currentIndex === 0
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
                disabled={currentIndex === filteredQuestions.length - 1}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
                  currentIndex === filteredQuestions.length - 1
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
