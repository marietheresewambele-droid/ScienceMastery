"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { topicRegistry, questionKey } from "@/data/topics/registry";
import { readProgress, saveRating, toggleBookmark } from "@/lib/progress";
import { useHomeHref } from "@/hooks/useHomeHref";
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
  flashcards: "Flashcards",
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
  const [mode, setMode] = useState<Mode>(initialMode);
  const [subjects, setSubjects] = useState<string[]>(
    initialSubject ? [initialSubject] : ["biology", "chemistry", "physics"],
  );
  const [topicIds, setTopicIds] = useState<string[]>(
    initialSubject && initialTopic ? [`${initialSubject}:${initialTopic}`] : [],
  );
  const [subtopic, setSubtopic] = useState(initialSubtopic ?? "all");
  const [ao, setAo] = useState("all");
  const [tier, setTier] = useState("all");
  const [practical, setPractical] = useState(false);
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState("random");
  const [session, setSession] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
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
  const availableSubtopics = useMemo(
    () => Array.from(new Set(selectedItems.map((item) => item.question.subtopic))).sort(),
    [selectedItems],
  );
  const candidates = useMemo(
    () =>
      selectedItems.filter(
        (item) =>
          (subtopic === "all" || item.question.subtopic === subtopic) &&
          (ao === "all" || item.question.assessmentObjective.includes(ao)) &&
          (tier === "all" ||
            (item.question.tier ?? item.question.difficulty) === tier) &&
          (!practical ||
            /required practical|practical/i.test(
              `${item.question.question} ${item.question.subtopic} ${item.question.questionFamily ?? ""}`,
            )) &&
          (mode !== "bookmarks" || item.bookmarked) &&
          (mode !== "due" || item.due),
      ),
    [selectedItems, subtopic, ao, tier, practical, mode],
  );

  const start = () => {
    const next =
      order === "weakest"
        ? [...candidates].sort((a, b) => b.priority - a.priority)
        : [...candidates].sort(() => Math.random() - 0.5);
    setSession(next.slice(0, count));
    setIndex(0);
    setFlipped(false);
  };
  const rate = (rating: ReviewRating) => {
    const item = session[index];
    if (!item) return;
    saveRating(item.topic, item.question.id, rating);
    setVersion((value) => value + 1);
    setFlipped(false);
    setIndex((value) => Math.min(value + 1, session.length));
  };

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
  });

  const current = session[index];
  const isExam = mode === "exam";

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#0f1f3d]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href={homeHref} className="font-black">
            Sci<span className="text-[#00a551]">Mastery</span>
          </Link>
          <Link href="/dashboard" className="font-bold text-[#00a551]">My Learning</Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-[#00a551]">Revision centre</p>
        <h1 className="mt-2 text-4xl font-black">{labels[mode]}</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(labels) as Mode[]).map((nextMode) => (
            <button
              key={nextMode}
              onClick={() => { setMode(nextMode); setSession([]); }}
              className={`rounded-xl px-4 py-2 font-bold ${mode === nextMode ? "bg-[#0f1f3d] text-white" : "bg-white"}`}
            >
              {labels[nextMode]}
            </button>
          ))}
        </div>

        {!session.length && (
          <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-2">
              <fieldset>
                <legend className="font-extrabold">Subjects</legend>
                <div className="mt-3 flex gap-4">
                  {["biology", "chemistry", "physics"].map((subject) => (
                    <label key={subject} className="capitalize">
                      <input
                        type="checkbox"
                        checked={subjects.includes(subject)}
                        onChange={() => {
                          setSubjects((selected) =>
                            selected.includes(subject)
                              ? selected.filter((value) => value !== subject)
                              : [...selected, subject],
                          );
                          setSubtopic("all");
                        }}
                      />{" "}{subject}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="font-extrabold">
                Topics
                <select
                  multiple
                  value={topicIds}
                  onChange={(event) => {
                    setTopicIds([...event.currentTarget.selectedOptions].map((option) => option.value));
                    setSubtopic("all");
                  }}
                  className="mt-2 h-28 w-full rounded-xl border p-2 font-normal"
                >
                  {topicRegistry
                    .filter((topic) => subjects.includes(topic.subject ?? "biology"))
                    .map((topic) => (
                      <option key={`${topic.subject}:${topic.id}`} value={`${topic.subject}:${topic.id}`}>
                        {topic.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Subtopic
                <select value={subtopic} onChange={(event) => setSubtopic(event.target.value)} className="ml-2 rounded-lg border p-2">
                  <option value="all">All subtopics</option>
                  {availableSubtopics.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
              <label>
                Assessment objective
                <select value={ao} onChange={(event) => setAo(event.target.value)} className="ml-2 rounded-lg border p-2">
                  <option value="all">All</option><option>AO1</option><option>AO2</option><option>AO3</option>
                </select>
              </label>
              <label>
                Tier
                <select value={tier} onChange={(event) => setTier(event.target.value)} className="ml-2 rounded-lg border p-2">
                  <option value="all">All</option><option>Foundation</option><option>Higher</option><option>Both</option>
                </select>
              </label>
              <label><input type="checkbox" checked={practical} onChange={(event) => setPractical(event.target.checked)} /> Required practicals only</label>
              <label>Questions <input type="number" min="1" max="50" value={count} onChange={(event) => setCount(Number(event.target.value))} className="ml-2 w-20 rounded-lg border p-2" /></label>
              <label>
                Order
                <select value={order} onChange={(event) => setOrder(event.target.value)} className="ml-2 rounded-lg border p-2">
                  <option value="random">Random</option><option value="weakest">Weakest first</option>
                </select>
              </label>
            </div>
            <p className="mt-5 text-sm text-[#5a6b82]">{candidates.length} questions match. Hold Ctrl/Cmd to select several topics.</p>
            <button onClick={start} disabled={!candidates.length} className="mt-4 rounded-xl bg-[#00a551] px-6 py-3 font-bold text-white disabled:opacity-40">
              {isExam ? "Start exam" : "Start session"}
            </button>
            {!candidates.length && <p className="mt-4 font-semibold text-[#5a6b82]">No questions match this selection. Adjust the filters or add bookmarks/reviews first.</p>}
          </section>
        )}

        {session.length > 0 && !current && (
          <section className="mt-8 rounded-3xl border bg-white p-10 text-center">
            <h2 className="text-2xl font-black">Session complete</h2>
            <button onClick={() => setSession([])} className="mt-5 rounded-xl bg-[#00a551] px-6 py-3 font-bold text-white">Start another</button>
          </section>
        )}

        {current && (
          <section className="mt-8">
            <div className="mb-3 flex justify-between text-sm font-bold">
              <span>{current.topic.title} · {current.question.subtopic} · {current.question.assessmentObjective}</span>
              <span>{index + 1} of {session.length}</span>
            </div>
            <article
              onClick={() => !isExam && setFlipped((value) => !value)}
              className={`min-h-72 rounded-3xl border bg-white p-8 shadow-sm ${isExam ? "" : "cursor-pointer"}`}
              tabIndex={isExam ? undefined : 0}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#00a551]">{flipped ? "Answer / marking points" : "Question"}</p>
              {!flipped ? (
                <>
                  <h2 className="mt-5 text-2xl font-black leading-9">{current.question.question}</h2>
                  {isExam && <p className="mt-8 text-sm text-[#5a6b82]">Write your answer independently, then reveal the mark scheme.</p>}
                </>
              ) : (
                <div className="mt-5 space-y-3 text-lg">
                  {current.question.markingPoints.map((point, pointIndex) => <p key={pointIndex}>✓ {point}</p>)}
                  {current.question.modelAnswer && <p className="rounded-xl bg-[#f7f9fb] p-4">{current.question.modelAnswer}</p>}
                </div>
              )}
              {!isExam && <p className="mt-8 text-sm text-[#5a6b82]">Click card or press Space to {flipped ? "hide" : "reveal"}</p>}
            </article>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => { toggleBookmark(current.topic, current.question.id); setVersion((value) => value + 1); }} className="rounded-xl border bg-white px-4 py-3 font-bold">Bookmark</button>
              {isExam && !flipped && <button onClick={() => setFlipped(true)} className="rounded-xl bg-[#00a551] px-5 py-3 font-bold text-white">Finish answer &amp; reveal mark scheme</button>}
              {flipped && (["again", "hard", "good", "easy"] as ReviewRating[]).map((rating, ratingIndex) => (
                <button key={rating} onClick={() => rate(rating)} className="rounded-xl bg-[#0f1f3d] px-5 py-3 font-bold capitalize text-white">{ratingIndex + 1}. {rating}</button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
