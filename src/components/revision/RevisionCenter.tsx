"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps */
import Link from "next/link";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { topicRegistry } from "@/data/topics/registry";
import { readProgress, saveRating, toggleBookmark } from "@/lib/progress";
import { recordAdaptiveAttempt, syncBookmarks } from "@/lib/adaptive-progress";
import { compareQuestions, useQuestionBank } from "@/lib/questionBank";
import { useHomeHref } from "@/hooks/useHomeHref";
import Flashcard, { HINTS_HIDDEN } from "@/components/flashcard/Flashcard";
import type { MasteryQuestion, ReviewRating } from "@/types/questions";

export type Mode = "flashcards" | "exam" | "bookmarks" | "due";
type Item = {
  key: string;
  topic: (typeof topicRegistry)[number];
  question: MasteryQuestion;
  bookmarked: boolean;
  /** Reviewed before and its spaced-repetition due date has passed. */
  due: boolean;
  /** Reviewed before. Cards that were never reviewed are "new". */
  reviewed: boolean;
  dueAt: number;
};

const labels: Record<Mode, string> = {
  flashcards: "Practice Mode",
  exam: "Exam Mode",
  bookmarks: "Bookmarked Review",
  due: "Review due questions",
};

const SUBJECTS = ["biology", "chemistry", "physics"];

function assessmentObjectiveRank(assessmentObjective: string) {
  if (assessmentObjective.includes("AO1")) return 1;
  if (assessmentObjective.includes("AO2")) return 2;
  return 3;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

type SavedSession = { keys: string[]; index: number; correct: number };

export default function RevisionCenter({
  initialMode = "flashcards",
  initialSubject,
  initialTopic,
  initialSubtopic,
}: {
  initialMode?: Mode;
  initialSubject?: string;
  initialTopic?: string;
  initialSubtopic?: string;
}) {
  const skipSetup = Boolean(initialSubject && initialTopic);
  const storageKey = `sciencemastery_session_v1:${initialMode}:${initialSubject ?? ""}:${initialTopic ?? ""}:${initialSubtopic ?? ""}`;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [subjects, setSubjects] = useState<string[]>(initialSubject ? [initialSubject] : SUBJECTS);
  const [topicIds, setTopicIds] = useState<string[]>(
    initialSubject && initialTopic ? [`${initialSubject}:${initialTopic}`] : [],
  );
  const [subtopic] = useState(initialSubtopic ?? "all");
  const [count, setCount] = useState(skipSetup ? 200 : 20);
  const [order, setOrder] = useState("ordered");
  const [session, setSession] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());

  const autoStarted = useRef(false);
  const homeHref = useHomeHref();

  useEffect(() => setReady(true), []);

  // Every mode reads the published question bank, narrowed to the student's saved courses.
  const { questions: bankQuestions, error: bankError } = useQuestionBank();

  const isExam = mode === "exam";

  // One-off backfill: bookmarks made before they were mirrored to Supabase only exist in localStorage.
  useEffect(() => {
    if (!ready) return;
    const ids = topicRegistry.flatMap((topic) => [...readProgress(topic).bookmarks]);
    void syncBookmarks(ids, true);
  }, [ready]);

  const all = useMemo(() => {
    if (!ready) return [];
    if (!bankQuestions) return [];
    const now = Date.now();
    return topicRegistry.flatMap((topic) => {
      const progress = readProgress(topic);
      const questions = bankQuestions.filter((question) => question.subject === topic.subject && question.topicSlug === topic.id);
      return questions.map((question): Item => {
        const review = progress.reviews[question.id];
        const dueAt = review ? new Date(review.dueAt).getTime() : 0;
        return {
          key: `${topic.id}:${question.id}`,
          topic,
          question,
          bookmarked: progress.bookmarks.has(question.id),
          reviewed: Boolean(review),
          due: Boolean(review && dueAt <= now),
          dueAt,
        };
      });
    });
  }, [ready, version, bankQuestions]);

  const selectedItems = useMemo(
    () =>
      all.filter(
        (item) =>
          subjects.includes(item.topic.subject ?? "biology") &&
          (!topicIds.length ||
            topicIds.includes(`${item.topic.subject}:${item.topic.id}`)),
      ),
    [all, subjects, topicIds],
  );

  // Practice and due sessions are driven by the spaced-repetition schedule: only cards that are due, or new, are served.
  const candidates = useMemo(
    () =>
      selectedItems.filter(
        (item) =>
          (subtopic === "all" || item.question.subtopic === subtopic) &&
          (mode === "exam" ||
            (mode === "bookmarks" && item.bookmarked) ||
            (mode === "due" && item.due) ||
            (mode === "flashcards" && (item.due || !item.reviewed))),
      ),
    [selectedItems, subtopic, mode],
  );

  const dueBySubject = useMemo(
    () => Object.fromEntries(SUBJECTS.map((subject) => [subject, all.filter((item) => item.due && item.topic.subject === subject).length])),
    [all],
  );

  const start = useCallback(() => {
    let next: Item[];
    if (mode === "due" || mode === "flashcards") {
      // Overdue cards first (longest overdue first), then new cards in syllabus order.
      next = [...candidates].sort((left, right) => {
        if (left.due !== right.due) return left.due ? -1 : 1;
        if (left.due) return left.dueAt - right.dueAt;
        return compareQuestions(left.question, right.question);
      });
    } else {
      const pool = order === "random" ? shuffled(candidates) : candidates;
      next = [...pool].sort((left, right) => {
        const objectiveOrder = assessmentObjectiveRank(left.question.assessmentObjective)
          - assessmentObjectiveRank(right.question.assessmentObjective);
        if (objectiveOrder !== 0) return objectiveOrder;
        return order === "random" ? 0 : compareQuestions(left.question, right.question);
      });
    }
    setSession(mode === "due" ? next : next.slice(0, count));
    setIndex(0);
    setCorrect(0);
    setFlipped(false);
    setHintLevel(0);
    setStartedAt(Date.now());
  }, [candidates, count, order, mode]);

  // Resume the saved session after a reload instead of starting again from card one.
  useEffect(() => {
    if (!ready || !bankQuestions || restored) return;
    setRestored(true);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as SavedSession | null;
      if (!saved || !Array.isArray(saved.keys)) return;
      const byKey = new Map(all.map((item) => [item.key, item]));
      const items = saved.keys.map((key) => byKey.get(key)).filter((item): item is Item => Boolean(item));
      // Cards removed from the deck (made inactive) drop out of the saved session.
      const removedBefore = saved.keys.slice(0, saved.index).filter((key) => !byKey.has(key)).length;
      const resumeAt = Math.max(0, saved.index - removedBefore);
      if (!items.length || resumeAt >= items.length) { localStorage.removeItem(storageKey); return; }
      autoStarted.current = true;
      setSession(items);
      setIndex(resumeAt);
      setCorrect(saved.correct ?? 0);
      setStartedAt(Date.now());
    } catch { /* ignore unreadable saved sessions */ }
  }, [ready, bankQuestions, restored, all, storageKey]);

  useEffect(() => {
    if (!restored || !session.length) return;
    try {
      if (index >= session.length) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify({ keys: session.map((item) => item.key), index, correct } satisfies SavedSession));
    } catch { /* storage unavailable */ }
  }, [restored, session, index, correct, storageKey]);

  useEffect(() => {
    if (skipSetup && ready && restored && !autoStarted.current && !session.length && candidates.length) {
      autoStarted.current = true;
      start();
    }
  }, [skipSetup, ready, restored, candidates.length, session.length, start]);

  const rate = useCallback(
    (rating: ReviewRating, hintsUsed = 0) => {
      const item = session[index];
      if (!item) return;
      saveRating(item.topic, item.question.id, rating, hintsUsed);
      void recordAdaptiveAttempt({
        question: item.question,
        evidence: { rating, hintsUsed, answerRevealed: true },
        mode,
        responseTimeMs: Date.now() - startedAt,
      });
      if (isExam && rating === "good") setCorrect((value) => value + 1);
      setVersion((value) => value + 1);
      setFlipped(false);
      setHintLevel(0);
      setIndex((value) => Math.min(value + 1, session.length));
      setStartedAt(Date.now());
    },
    [session, index, isExam, mode, startedAt],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!session[index] || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        setFlipped((value) => (isExam ? true : !value));
      }
      if (flipped && isExam && ["1", "2"].includes(event.key)) {
        rate(event.key === "1" ? "good" : "again", Math.min(hintLevel, HINTS_HIDDEN - 1));
      }
      if (flipped && !isExam && ["1", "2", "3", "4"].includes(event.key)) {
        rate(
          (["again", "hard", "good", "easy"] as ReviewRating[])[Number(event.key) - 1],
          Math.min(hintLevel, HINTS_HIDDEN - 1),
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [session, index, flipped, rate, hintLevel, isExam]);

  const current = session[index];
  const finished = session.length > 0 && !current;
  const loadingScopedQuestions = skipSetup && ready && bankQuestions === null && !bankError;
  const showPicker = !session.length && (!skipSetup || (ready && restored && candidates.length === 0 && (bankQuestions !== null || Boolean(bankError))));
  const dueSelected = subjects.reduce((total, subject) => total + (dueBySubject[subject] ?? 0), 0);

  function restart() {
    try { localStorage.removeItem(storageKey); } catch { /* storage unavailable */ }
    if (skipSetup) {
      autoStarted.current = false;
      start();
    } else {
      setSession([]);
    }
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href={homeHref} className="font-display font-bold">
            Sci<span className="text-orange">Mastery</span>
          </Link>
          <AuthButtons />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10">
        {!current && !finished && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Revision centre</p>
            <h1 className="mt-2 font-display text-4xl font-bold">{labels[mode]}</h1>
            {!skipSetup && <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(labels) as Mode[]).map((nextMode) => (
                <button
                  key={nextMode}
                  onClick={() => { setMode(nextMode); setSession([]); autoStarted.current = true; }}
                  className={`rounded-xl border-2 border-ink px-4 py-2 font-bold ${mode === nextMode ? "bg-ink text-cream" : "bg-card text-ink"}`}
                >
                  {labels[nextMode]}
                </button>
              ))}
            </div>}
          </>
        )}

        {loadingScopedQuestions && !session.length && (
          <section className="sm-panel mt-8 p-6" aria-live="polite">
            <p className="font-display text-lg font-semibold">Loading questions…</p>
            <p className="mt-2 text-sm text-ink-soft">Your flashcards will start as soon as the published questions are ready.</p>
          </section>
        )}

        {showPicker && (
          <section className="sm-panel mt-8 p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
              <div className="space-y-6">
                <fieldset>
                  <legend className="text-sm font-extrabold uppercase tracking-wide text-ink">
                    {mode === "due" ? "Choose what to study" : "Subjects"}
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUBJECTS.map((subject) => (
                      <label
                        key={subject}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 text-sm font-bold capitalize transition ${
                          subjects.includes(subject)
                            ? "bg-moss-soft text-moss-dark"
                            : "bg-card text-ink-soft hover:bg-moss-soft"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[color:var(--color-moss)]"
                          checked={subjects.includes(subject)}
                          onChange={() => {
                            setSubjects((selected) =>
                              selected.includes(subject)
                                ? selected.filter((value) => value !== subject)
                                : [...selected, subject],
                            );
                          }}
                        />
                        {subject}
                        {mode === "due" && <span className="rounded-md border-2 border-ink bg-card px-2 py-0.5 text-xs text-ink">{dueBySubject[subject] ?? 0} due</span>}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {mode !== "due" && <fieldset>
                  <legend className="text-sm font-extrabold uppercase tracking-wide text-ink">Topics</legend>
                  <p className="mt-1 text-xs text-ink-soft">Leave all unticked to include every topic in the selected subjects.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {topicRegistry
                      .filter((topic) => subjects.includes(topic.subject ?? "biology"))
                      .map((topic) => {
                        const id = `${topic.subject}:${topic.id}`;
                        const checked = topicIds.includes(id);
                        return (
                          <label
                            key={id}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 text-sm font-semibold transition ${
                              checked
                                ? "bg-moss-soft text-moss-dark"
                                : "bg-card text-ink-soft hover:bg-moss-soft"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[color:var(--color-moss)]"
                              checked={checked}
                              onChange={() => {
                                setTopicIds((selected) =>
                                  checked ? selected.filter((value) => value !== id) : [...selected, id],
                                );
                              }}
                            />
                            {topic.title}
                          </label>
                        );
                      })}
                  </div>
                </fieldset>}
              </div>

              {(mode === "exam" || mode === "bookmarks" || mode === "flashcards") && <div className="flex flex-col gap-4 lg:w-56">
                <label className="text-sm font-bold">
                  Questions
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border-2 border-ink bg-card p-2.5 font-normal"
                  />
                </label>
                {(mode === "exam" || mode === "bookmarks") && <label className="text-sm font-bold">
                  Order
                  <select
                    value={order}
                    onChange={(event) => setOrder(event.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-ink bg-card p-2.5 font-normal"
                  >
                    <option value="ordered">In order (AO1 → AO3)</option>
                    <option value="random">Random (AO1 → AO3)</option>
                  </select>
                </label>}
              </div>}
            </div>
            <p className="mt-5 text-sm text-ink-soft">
              {mode === "due" ? `${dueSelected} due question${dueSelected === 1 ? "" : "s"} in the selected subjects.` : `${candidates.length} questions match.`}
              {mode === "flashcards" && " Practice mode serves cards that are due or new, following your spaced-repetition schedule."}
            </p>
            {!bankQuestions && !bankError && <p className="mt-3 text-sm font-semibold text-ink-soft">Loading the question bank…</p>}
            {bankError && <p className="mt-3 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">The question bank could not be loaded ({bankError}).</p>}
            {bankQuestions && bankQuestions.length === 0 && !bankError && (
              <p className="mt-3 rounded-xl border-2 border-ink bg-cream-soft p-3 text-sm font-semibold text-ink-soft">No questions have been published yet.</p>
            )}
            <button onClick={start} disabled={!candidates.length} className="sm-btn mt-4 bg-orange px-6 py-3 text-white disabled:opacity-40">
              {isExam ? "Start exam" : "Start study session"}
            </button>
            {!candidates.length && bankQuestions && (
              <p className="mt-4 font-semibold text-ink-soft">
                {mode === "due"
                  ? "Nothing is due in these subjects right now. Practise new cards and they will return here when they are due."
                  : mode === "flashcards"
                    ? "You are all caught up: no cards are due or new for this selection."
                    : "No questions match this selection. Adjust your subjects/topics or add bookmarks first."}
              </p>
            )}
          </section>
        )}

        {finished && (
          <section className="sm-panel mt-8 p-10 text-center">
            <h2 className="font-display text-2xl font-bold">{isExam ? "Exam complete" : "Session complete"}</h2>
            {isExam && (
              <div className="mt-5">
                <p className="text-sm font-bold uppercase tracking-widest text-ink-soft">Final score</p>
                <p className="mt-1 font-display text-6xl font-bold text-orange-dark">{correct} / {session.length}</p>
                <p className="mt-2 font-display text-xl font-semibold">{Math.round((correct / session.length) * 100)}%</p>
                <p className="mt-1 text-sm text-ink-soft">{session.length - correct} marked wrong, scheduled for sooner review.</p>
              </div>
            )}
            {!isExam && <p className="mt-3 text-ink-soft">You reviewed {session.length} card{session.length === 1 ? "" : "s"}. Your due counts are up to date.</p>}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={restart} className="sm-btn bg-orange px-6 py-3 text-white">{isExam ? "Retake exam" : "Start another"}</button>
              <Link href="/dashboard" className="sm-btn bg-card px-6 py-3 text-ink">Back to dashboard</Link>
            </div>
          </section>
        )}

        {current && (
          <section className="mt-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Link href={current.topic.route} className="sm-btn bg-card px-4 py-2 text-sm text-ink">← Back to topic: {current.topic.title}</Link>
              <span className="text-sm font-bold">
                {labels[mode]} · {index + 1} of {session.length}{isExam && ` · Score ${correct}/${index}`}
              </span>
            </div>
            <div className="mb-3 text-sm font-bold">{current.topic.title} · {current.question.subtopic}</div>
            <Flashcard
              key={current.key}
              question={current.question}
              flipped={flipped}
              onFlip={() => setFlipped((value) => (isExam ? true : !value))}
              isExam={isExam}
              bookmarked={current.bookmarked}
              onToggleBookmark={() => {
                const nowBookmarked = toggleBookmark(current.topic, current.question.id);
                void syncBookmarks([current.question.id], nowBookmarked);
                setSession((items) => items.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, bookmarked: !item.bookmarked } : item,
                ));
                setVersion((value) => value + 1);
              }}
              hintLevel={hintLevel}
              onHintLevelChange={setHintLevel}
              onRate={rate}
            />
          </section>
        )}
      </div>
    </main>
  );
}
