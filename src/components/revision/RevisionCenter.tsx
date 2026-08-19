"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { topicRegistry, questionKey } from "@/data/topics/registry";
import { readProgress, saveRating, toggleBookmark } from "@/lib/progress";
import { useHomeHref } from "@/hooks/useHomeHref";
import Flashcard from "@/components/flashcard/Flashcard";
import type { MasteryQuestion, ReviewRating } from "@/types/questions";

type Mode = "mixed" | "flashcards" | "exam" | "bookmarks" | "due";
type Item = {
  key: string;
  topic: (typeof topicRegistry)[number];
  question: MasteryQuestion;
  priority: number;
  bookmarked: boolean;
  due: boolean;
};

const labels: Record<Mode, string> = {
  mixed: "Mixed Practice",
  flashcards: "Practice Mode",
  exam: "Exam Mode",
  bookmarks: "Bookmarked Review",
  due: "Due for Review",
};

export default function RevisionCenter({
  initialMode = "mixed",
  initialSubject,
  initialTopic,
  initialSubtopic,
}: {
  initialMode?: Mode;
  initialSubject?: string;
  initialTopic?: string;
  initialSubtopic?: string;
}) {
  const skipSetup = Boolean(initialSubject && initialTopic && initialSubtopic);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [subjects, setSubjects] = useState<string[]>(
    initialSubject ? [initialSubject] : ["biology", "chemistry", "physics"],
  );
  const [topicIds, setTopicIds] = useState<string[]>(
    initialSubject && initialTopic ? [`${initialSubject}:${initialTopic}`] : [],
  );
  const [subtopic] = useState(initialSubtopic ?? "all");
  const [count, setCount] = useState(skipSetup ? 200 : 10);
  const [order, setOrder] = useState("random");
  const [session, setSession] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const autoStarted = useRef(false);
  const homeHref = useHomeHref();

  useEffect(() => setReady(true), []);

  const all = useMemo(() => {
    if (!ready) return [];
    const now = Date.now();
    return topicRegistry.flatMap((topic) => {
      const progress = readProgress(topic);
      return topic.questions.map((question) => {
        const review = progress.reviews[question.id];
        return {
          key: questionKey(topic.subject ?? "biology", topic.id, question.id),
          topic,
          question,
          priority:
            (progress.needs.has(question.id) ? 3 : 0) +
            (review?.rating === "again" ? 3 : review?.rating === "hard" ? 2 : 0),
          bookmarked: progress.bookmarks.has(question.id),
          due: Boolean(review && new Date(review.dueAt).getTime() <= now),
        };
      });
    });
  }, [ready, version]);

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
  const candidates = useMemo(
    () =>
      selectedItems.filter(
        (item) =>
          (subtopic === "all" || item.question.subtopic === subtopic) &&
          (mode !== "bookmarks" || item.bookmarked) &&
          (mode !== "due" || item.due),
      ),
    [selectedItems, subtopic, mode],
  );

  const start = useCallback(() => {
    const next =
      order === "weakest"
        ? [...candidates].sort((a, b) => b.priority - a.priority)
        : [...candidates].sort(() => Math.random() - 0.5);
    setSession(next.slice(0, count));
    setIndex(0);
    setFlipped(false);
  }, [candidates, count, order]);

  useEffect(() => {
    if (skipSetup && ready && !autoStarted.current && !session.length && candidates.length) {
      autoStarted.current = true;
      start();
    }
  }, [skipSetup, ready, candidates.length, session.length, start]);

  const rate = useCallback(
    (rating: ReviewRating) => {
      const item = session[index];
      if (!item) return;
      saveRating(item.topic, item.question.id, rating);
      setVersion((value) => value + 1);
      setFlipped(false);
      setIndex((value) => Math.min(value + 1, session.length));
    },
    [session, index],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!session[index]) return;
      if (event.code === "Space") {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (flipped && ["1", "2", "3", "4"].includes(event.key)) {
        rate(
          (["again", "hard", "good", "easy"] as ReviewRating[])[
            Number(event.key) - 1
          ],
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [session, index, flipped, rate]);

  const current = session[index];
  const isExam = mode === "exam";
  const showPicker = !session.length && (!skipSetup || (ready && candidates.length === 0));

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href={homeHref} className="font-display font-bold">
            Sci<span className="text-orange">Mastery</span>
          </Link>
          <Link href="/dashboard" className="font-bold text-orange-dark">My Learning</Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10">
        {!current && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Revision centre</p>
            <h1 className="mt-2 font-display text-4xl font-bold">{labels[mode]}</h1>
            <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(labels) as Mode[]).map((nextMode) => (
                <button
                  key={nextMode}
                  onClick={() => { setMode(nextMode); setSession([]); autoStarted.current = true; }}
                  className={`rounded-xl border-2 border-ink px-4 py-2 font-bold ${mode === nextMode ? "bg-ink text-cream" : "bg-card text-ink"}`}
                >
                  {labels[nextMode]}
                </button>
              ))}
            </div>
          </>
        )}

        {showPicker && (
          <section className="sm-panel mt-8 p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
              <div className="space-y-6">
                <fieldset>
                  <legend className="text-sm font-extrabold uppercase tracking-wide text-ink">Subjects</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["biology", "chemistry", "physics"].map((subject) => (
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
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
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
                </fieldset>
              </div>

              <div className="flex flex-col gap-4 lg:w-56">
                <label className="text-sm font-bold">
                  Questions
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border-2 border-ink bg-card p-2.5 font-normal"
                  />
                </label>
                <label className="text-sm font-bold">
                  Order
                  <select
                    value={order}
                    onChange={(event) => setOrder(event.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-ink bg-card p-2.5 font-normal"
                  >
                    <option value="random">Random</option>
                    <option value="weakest">Weakest first</option>
                  </select>
                </label>
              </div>
            </div>
            <p className="mt-5 text-sm text-ink-soft">{candidates.length} questions match.</p>
            <button onClick={start} disabled={!candidates.length} className="sm-btn mt-4 bg-orange px-6 py-3 text-white disabled:opacity-40">
              {isExam ? "Start exam" : "Start session"}
            </button>
            {!candidates.length && <p className="mt-4 font-semibold text-ink-soft">No questions match this selection. Adjust your subjects/topics or add bookmarks/reviews first.</p>}
          </section>
        )}

        {session.length > 0 && !current && (
          <section className="sm-panel mt-8 p-10 text-center">
            <h2 className="font-display text-2xl font-bold">Session complete</h2>
            <button
              onClick={() => {
                if (skipSetup) {
                  start();
                } else {
                  setSession([]);
                }
              }}
              className="sm-btn mt-5 bg-orange px-6 py-3 text-white"
            >
              Start another
            </button>
          </section>
        )}

        {current && (
          <section className="mt-8">
            <div className="mb-3 flex justify-between text-sm font-bold">
              <span>{current.topic.title} · {current.question.subtopic}</span>
              <span>{index + 1} of {session.length}</span>
            </div>
            <Flashcard
              question={current.question}
              flipped={flipped}
              onFlip={() => setFlipped((value) => !value)}
              isExam={isExam}
              bookmarked={current.bookmarked}
              onToggleBookmark={() => {
                toggleBookmark(current.topic, current.question.id);
                setVersion((value) => value + 1);
              }}
              onRate={rate}
            />
          </section>
        )}
      </div>
    </main>
  );
}
