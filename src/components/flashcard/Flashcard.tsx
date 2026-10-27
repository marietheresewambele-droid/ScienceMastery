"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { getAdaptiveHints } from "@/lib/adaptive-engine";
import RichText from "@/components/flashcard/RichText";
import type { MasteryQuestion, ReviewRating } from "@/types/questions";

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

/** Hint button presses: 1 and 2 reveal hints, the third press hides the hint again. */
export const HINTS_HIDDEN = 3;

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
  /** Admin preview: hides bookmark, hint and rating controls. */
  readOnly?: boolean;
}

/** Controls clicked with the mouse keep focus, which would make Space press them again instead of flipping the card. */
const release = (event: MouseEvent<HTMLElement>) => event.currentTarget.blur();

function BookmarkButton({ bookmarked, onToggle }: { bookmarked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this question"}
      aria-pressed={bookmarked}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
        release(event);
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
  );
}

/** A scrolling region with a visible scrollbar plus up/down buttons when the content overflows. */
function ScrollArea({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ scrollable: false, top: true, bottom: true });

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    setOverflow({
      scrollable: element.scrollHeight > element.clientHeight + 2,
      top: element.scrollTop <= 2,
      bottom: element.scrollTop + element.clientHeight >= element.scrollHeight - 2,
    });
  }, []);

  useEffect(() => {
    measure();
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure, children]);

  const scrollBy = (event: MouseEvent<HTMLElement>, direction: 1 | -1) => {
    event.stopPropagation();
    ref.current?.scrollBy({ top: direction * 140, behavior: "smooth" });
    release(event);
  };
  const arrow = "flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-card text-sm font-bold transition hover:bg-yellow-soft disabled:opacity-30";

  return (
    <div className="relative mt-4 flex min-h-0 flex-1 gap-2">
      <div ref={ref} onScroll={measure} onClick={(event) => { if (event.target === event.currentTarget) event.stopPropagation(); }} className="sm-scroll min-h-0 flex-1 overflow-y-auto pr-2">
        {children}
      </div>
      {overflow.scrollable && (
        <div className="flex shrink-0 flex-col justify-between" aria-label="Scroll answer">
          <button type="button" aria-label="Scroll up" disabled={overflow.top} onClick={(event) => scrollBy(event, -1)} className={arrow}>▲</button>
          <button type="button" aria-label="Scroll down" disabled={overflow.bottom} onClick={(event) => scrollBy(event, 1)} className={arrow}>▼</button>
        </div>
      )}
    </div>
  );
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
  readOnly = false,
}: FlashcardProps) {
  const hints = getAdaptiveHints(question);
  const hintsUsed = Math.min(hintLevel, 2);
  const hintVisible = hintLevel === 1 || hintLevel === 2;
  const activeHint = hints[Math.min(Math.max(hintLevel - 1, 0), hints.length - 1)] ?? hints[0] ?? "";

  const markingPoints = question.markingPoints.flatMap((point) =>
    point.split(/\r?\n+/).map((section) => section.trim()).filter(Boolean),
  );

  return (
    <div style={{ perspective: "1600px" }}>
      <article
        onClick={onFlip}
        className="relative h-[30rem] max-h-[78vh] cursor-pointer rounded-3xl transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex h-full flex-col rounded-3xl border-2 border-ink bg-card p-8 shadow-[6px_6px_0_0_var(--color-ink)]"
          style={{ backfaceVisibility: "hidden" }}
          aria-hidden={flipped}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Question</p>
              {bookmarked && <span className="rounded-md border-2 border-ink bg-yellow-soft px-2 py-0.5 text-xs font-bold text-ink">Bookmarked</span>}
            </div>
            {!readOnly && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-label={hintLevel >= HINTS_HIDDEN ? "Hints used" : hintLevel === 2 ? "Hide hint" : `Show hint ${hintLevel + 1}`}
                  aria-pressed={hintVisible}
                  onClick={(event) => {
                    event.stopPropagation();
                    onHintLevelChange(Math.min(HINTS_HIDDEN, hintLevel + 1));
                    release(event);
                  }}
                  disabled={hintLevel >= HINTS_HIDDEN}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition disabled:opacity-40 ${
                    hintVisible ? "border-ink bg-yellow-soft text-ink" : "border-ink bg-card text-ink-soft hover:bg-yellow-soft"
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
                  </svg>
                </button>
                <BookmarkButton bookmarked={bookmarked} onToggle={onToggleBookmark} />
              </div>
            )}
          </div>

          <ScrollArea>
            <h2 className="font-display text-2xl font-bold leading-9 text-ink"><RichText text={question.question} /></h2>
            {hintVisible && (
              <div
                onClick={(event) => event.stopPropagation()}
                className="mt-4 rounded-xl border-2 border-ink bg-yellow-soft p-4 text-sm leading-6 text-ink"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Hint {hintLevel} of 2</p>
                <div className="mt-2 space-y-2">
                  <p className="whitespace-pre-line">{activeHint}</p>
                </div>
                <p className="mt-2 text-xs font-semibold text-ink-soft">
                  {hintLevel < 2 ? "Tap the lightbulb again for more support." : "Tap the lightbulb again to hide the hint."}
                </p>
              </div>
            )}
          </ScrollArea>

          <div className="pt-5">
            <p className="text-sm text-ink-soft">Hit spacebar for answer</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onFlip();
                release(event);
              }}
              className="sm-btn mt-3 bg-ink px-5 py-3 text-cream"
            >
              Answer
            </button>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex h-full flex-col rounded-3xl border-2 border-ink bg-card p-8 shadow-[6px_6px_0_0_var(--color-ink)]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          aria-hidden={!flipped}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Answer &amp; marking points</p>
              {bookmarked && <span className="rounded-md border-2 border-ink bg-yellow-soft px-2 py-0.5 text-xs font-bold text-ink">Bookmarked</span>}
            </div>
            {!readOnly && <BookmarkButton bookmarked={bookmarked} onToggle={onToggleBookmark} />}
          </div>

          <ScrollArea>
            <div className="space-y-3 text-[15px] leading-6 text-ink">
              {markingPoints.map((point, pointIndex) => (
                <div key={pointIndex} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-moss text-xs font-bold text-white">
                    ✓
                  </span>
                  <RichText text={point} />
                </div>
              ))}
            </div>
          </ScrollArea>

          {!readOnly && (
            <div className="pt-4">
              {isExam ? (
                <>
                  <p className="mb-2 text-xs font-semibold text-ink-soft/70">Did you get it right? Press 1 for correct or 2 for wrong.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([["good", "Correct", "bg-moss"], ["again", "Wrong", "bg-orange-dark"]] as const).map(([rating, label, colour], ratingIndex) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRate(rating, hintsUsed);
                        }}
                        className={`rounded-xl border-2 border-ink px-3 py-3 text-sm font-bold text-white transition hover:brightness-110 ${colour}`}
                      >
                        <span className="block">{label}</span>
                        <span className="mt-0.5 block text-xs font-semibold opacity-80">{ratingIndex + 1}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs font-semibold text-ink-soft/70">How did it go? Press 1–4 or tap a rating.</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["again", "hard", "good", "easy"] as ReviewRating[]).map((rating, ratingIndex) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRate(rating, hintsUsed);
                        }}
                        className={`rounded-xl border-2 border-ink px-3 py-3 text-sm font-bold text-white transition ${ratingStyles[rating]}`}
                      >
                        <span className="block">{ratingLabels[rating]}</span>
                        <span className="mt-0.5 block text-xs font-semibold opacity-80">{ratingIndex + 1}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
