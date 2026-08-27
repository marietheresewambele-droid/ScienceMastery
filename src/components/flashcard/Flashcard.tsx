"use client";

import type { MasteryQuestion, ReviewRating } from "@/types/questions";

function getHint(question: MasteryQuestion, level: number): string {
  if (question.hints?.[level - 1]) return question.hints[level - 1];
  if (question.markingPoints.length > 0) {
    return question.markingPoints[Math.min(level - 1, question.markingPoints.length - 1)];
  }
  return `${question.marks} mark${question.marks === 1 ? "" : "s"} · ${question.assessmentObjective}`;
}

const ratingStyles: Record<ReviewRating, string> = {
  again: "bg-orange-dark hover:brightness-110",
  hard: "bg-yellow-dark hover:brightness-110",
  good: "bg-moss hover:brightness-110",
  easy: "bg-teal hover:brightness-110",
};

const ratingLabels: Record<ReviewRating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

interface FlashcardProps {
  question: MasteryQuestion;
  flipped: boolean;
  onFlip: () => void;
  isExam: boolean;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  hintLevel: number;
  onHintLevelChange: (level: number) => void;
  onRate: (rating: ReviewRating, hintsUsed: number) => void;
}

export default function Flashcard({
  question,
  flipped,
  onFlip,
  isExam,
  bookmarked,
  onToggleBookmark,
  hintLevel,
  onHintLevelChange,
  onRate,
}: FlashcardProps) {
  const clickable = !isExam || flipped;

  const handleCardClick = () => {
    if (!clickable) return;
    onFlip();
    onHintLevelChange(0);
  };

  return (
    <div style={{ perspective: "1600px" }}>
      <article
        onClick={handleCardClick}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={(event) => {
          if (clickable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            handleCardClick();
          }
        }}
        className={`relative min-h-[24rem] rounded-3xl transition-transform duration-500 ${clickable ? "cursor-pointer" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex h-full flex-col rounded-3xl border-2 border-ink bg-card p-8 shadow-[6px_6px_0_0_var(--color-ink)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Question</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label={hintLevel >= 3 ? "Hints exhausted" : `Show hint ${hintLevel + 1}`}
                aria-pressed={hintLevel > 0}
                onClick={(event) => {
                  event.stopPropagation();
                  onHintLevelChange(Math.min(3, hintLevel + 1));
                }}
                disabled={hintLevel >= 3}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition disabled:opacity-40 ${
                  hintLevel > 0
                    ? "border-ink bg-yellow-soft text-ink"
                    : "border-ink bg-card text-ink-soft hover:bg-yellow-soft"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark this question"}
                aria-pressed={bookmarked}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleBookmark();
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                  bookmarked
                    ? "border-ink bg-orange text-white"
                    : "border-ink bg-card text-ink-soft hover:bg-orange-soft hover:text-orange-dark"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3V5z" />
                </svg>
              </button>
            </div>
          </div>

          <h2 className="mt-5 font-display text-2xl font-bold leading-9 text-ink">{question.question}</h2>

          {hintLevel > 0 && (
            <div
              onClick={(event) => event.stopPropagation()}
              className="mt-4 rounded-xl border-2 border-ink bg-yellow-soft p-4 text-sm leading-6 text-ink"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Hint {hintLevel} of 3</p>
              <p className="mt-1">{getHint(question, hintLevel)}</p>
            </div>
          )}

          <div className="mt-auto pt-6">
            {isExam ? (
              !flipped ? (
                <>
                  <p className="text-sm text-ink-soft">Write your answer independently, then reveal the mark scheme.</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFlip();
                    }}
                    className="sm-btn mt-4 bg-ink px-5 py-3 text-cream"
                  >
                    Finish answer &amp; reveal mark scheme
                  </button>
                </>
              ) : null
            ) : (
              <p className="text-sm text-ink-soft">Click card or press Space to reveal the answer</p>
            )}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex h-full flex-col overflow-y-auto rounded-3xl border-2 border-ink bg-card p-8 shadow-[6px_6px_0_0_var(--color-ink)]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Answer &amp; marking points</p>
            <button
              type="button"
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark this question"}
              aria-pressed={bookmarked}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBookmark();
              }}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                bookmarked
                  ? "border-ink bg-orange text-white"
                  : "border-ink bg-card text-ink-soft hover:bg-orange-soft hover:text-orange-dark"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3V5z" />
              </svg>
            </button>
          </div>

          <div className="mt-4 space-y-2.5 text-[15px] leading-6 text-ink">
            {question.markingPoints.map((point, pointIndex) => (
              <p key={pointIndex} className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-moss text-xs font-bold text-white">
                  ✓
                </span>
                <span>{point}</span>
              </p>
            ))}
            {question.modelAnswer && (
              <p className="rounded-xl border-2 border-ink bg-cream-soft p-4">{question.modelAnswer}</p>
            )}
          </div>

          <div className="mt-auto pt-6">
            <p className="mb-2 text-xs font-semibold text-ink-soft/70">How did it go? Press 1–4 or tap a rating.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["again", "hard", "good", "easy"] as ReviewRating[]).map((rating, ratingIndex) => (
                <button
                  key={rating}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRate(rating, hintLevel);
                  }}
                  className={`rounded-xl border-2 border-ink px-3 py-3 text-sm font-bold text-white transition ${ratingStyles[rating]}`}
                >
                  <span className="block">{ratingLabels[rating]}</span>
                  <span className="mt-0.5 block text-xs font-semibold opacity-80">{ratingIndex + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
