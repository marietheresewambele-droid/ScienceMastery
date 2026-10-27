"use client";
/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthButtons } from "@/components/auth/AuthButtons";
import CourseSelector from "@/components/courses/CourseSelector";
import { topicRegistry } from "@/data/topics/registry";
import { readProgress } from "@/lib/progress";
import { useHomeHref } from "@/hooks/useHomeHref";
import Achievements from "@/components/revision/Achievements";
import ExamCalendar from "@/components/revision/ExamCalendar";
import { SUBJECT_NAMES, addCourse, courseLabel, removeCourse, useCourses, type Course } from "@/lib/courses";
import { subtopicsFor, useQuestionBank } from "@/lib/questionBank";
import type { Subject } from "@/types/questions";

/** A card is "secure" once the spaced-repetition schedule has pushed it a week or more ahead. */
const SECURE_INTERVAL_DAYS = 7;

const ALL_SUBJECTS: Subject[] = ["biology", "chemistry", "physics"];

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

function Bar({ value, tone = "bg-orange" }: { value: number; tone?: string }) {
  return (
    <div className="h-3 rounded-full border-2 border-ink bg-cream-soft" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Course, "id"> | null>(null);
  const homeHref = useHomeHref();
  const bank = useQuestionBank();
  const { courses, ready: coursesReady } = useCourses();

  useEffect(() => setReady(true), []);
  useEffect(() => {
    const refresh = () => setDataVersion((value) => value + 1);
    window.addEventListener("brainsoma:learning-updated", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("brainsoma:learning-updated", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  const courseSubjects = useMemo(
    () => (courses.length ? ALL_SUBJECTS.filter((subject) => courses.some((course) => course.subject === subject)) : ALL_SUBJECTS),
    [courses],
  );

  const data = useMemo(() => {
    if (!ready || !bank.questions) return null;
    const now = Date.now();
    const bankQuestions = bank.questions;
    const topics = topicRegistry.map((topic) => {
      const p = readProgress(topic);
      const questions = bankQuestions.filter((q) => q.subject === topic.subject && q.topicSlug === topic.id);
      const valid = new Set(questions.map((q) => q.id));
      const secureOf = (ids: Set<string>) =>
        questions.filter((q) => ids.has(q.id) && (p.reviews[q.id]?.intervalDays ?? 0) >= SECURE_INTERVAL_DAYS).length;
      const completed = [...p.completed].filter((id) => valid.has(id)).length;
      const bookmarks = [...p.bookmarks].filter((id) => valid.has(id)).length;
      const due = Object.entries(p.reviews).filter(([id, r]) => valid.has(id) && new Date(r.dueAt).getTime() <= now).length;
      const secure = secureOf(valid);
      const subtopics = subtopicsFor(questions).map((subtopic) => {
        const ids = new Set(questions.filter((q) => q.subtopic === subtopic.title).map((q) => q.id));
        const done = [...ids].filter((id) => p.completed.has(id)).length;
        return { title: subtopic.title, total: ids.size, completed: done, mastery: pct(secureOf(ids), ids.size), percent: pct(done, ids.size) };
      });
      return {
        topic,
        completed,
        bookmarks,
        secure,
        masteryPercent: pct(secure, questions.length),
        due,
        total: questions.length,
        percent: pct(completed, questions.length),
        subtopics,
      };
    });
    const subjects = ALL_SUBJECTS.map((subject) => {
      const rows = topics.filter((x) => x.topic.subject === subject);
      const total = rows.reduce((n, x) => n + x.total, 0);
      const secure = rows.reduce((n, x) => n + x.secure, 0);
      const completed = rows.reduce((n, x) => n + x.completed, 0);
      return { subject, rows, total, completed, mastery: pct(secure, total), percent: pct(completed, total) };
    });
    return {
      topics,
      subjects,
      completed: topics.reduce((n, x) => n + x.completed, 0),
      total: topics.reduce((n, x) => n + x.total, 0),
      bookmarks: topics.reduce((n, x) => n + x.bookmarks, 0),
    };
  }, [ready, dataVersion, bank.questions]);

  const view = useMemo(() => {
    if (!data) return null;
    const subjects = data.subjects.filter((s) => courseSubjects.includes(s.subject as Subject));
    const topics = data.topics.filter((t) => courseSubjects.includes(t.topic.subject) && t.total > 0);
    const total = subjects.reduce((n, s) => n + s.total, 0);
    const secure = topics.reduce((n, t) => n + t.secure, 0);
    // Recommended: the three topics with the most due questions, weakest mastery breaking ties.
    const recommended = [...topics]
      .sort((a, b) => b.due - a.due || a.masteryPercent - b.masteryPercent || a.percent - b.percent)
      .slice(0, 3);
    return { subjects, topics, mastery: pct(secure, total), recommended };
  }, [data, courseSubjects]);

  if (bank.error) return <main className="p-10 font-display">Your learning could not be loaded ({bank.error}). Please refresh to try again.</main>;
  if (!data || !view) return <main className="p-10 font-display">Loading your learning…</main>;

  const subjectRow = (subject: Subject) => data.subjects.find((s) => s.subject === subject);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link href={homeHref} className="font-display font-bold">
            Sci<span className="text-orange">Mastery</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-ink-soft">
            <Link href="/courses" className="hover:text-orange-dark">Courses</Link>
            <Link href="/#features" className="hover:text-orange-dark">Features</Link>
            <Link href="/#how" className="hover:text-orange-dark">How it works</Link>
            <Link href="/practice" className="text-orange-dark">Revision centre</Link>
            <AuthButtons showDashboard={false} />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">My Learning</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Your science dashboard</h1>

        <section className="mt-8" aria-labelledby="my-courses">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="my-courses" className="font-display text-2xl font-bold">My courses</h2>
            <button type="button" aria-expanded={adding} onClick={() => setAdding((value) => !value)} className="sm-btn bg-orange px-5 py-2.5 text-sm text-white">
              {adding ? "Close" : "+ Add course"}
            </button>
          </div>

          {adding && (
            <div className="sm-panel mt-4 p-5">
              <p className="mb-3 text-sm font-semibold text-ink-soft">Choose qualification, subject, exam board and tier to add a course.</p>
              <CourseSelector variant="dropdown" onSelect={setDraft} />
              <button
                type="button"
                disabled={!draft}
                onClick={() => { if (draft) { addCourse(draft); setDraft(null); setAdding(false); } }}
                className="sm-btn mt-4 bg-orange px-5 py-2.5 text-sm text-white disabled:opacity-40"
              >
                Add to dashboard
              </button>
              <Link href="/courses" className="ml-4 text-sm font-bold text-orange-dark">Browse the full course page →</Link>
            </div>
          )}

          {coursesReady && courses.length === 0 && !adding && (
            <div className="sm-panel mt-4 p-6">
              <p className="font-display text-lg font-semibold">You haven&apos;t added a course yet.</p>
              <p className="mt-1 text-sm text-ink-soft">Add one to see it here, e.g. Physics · GCSE - AQA - Triple - Higher. Until then your progress shows all three sciences.</p>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const row = subjectRow(course.subject);
              return (
                <article key={course.id} className="sm-panel p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-xl font-bold">{SUBJECT_NAMES[course.subject]}</h3>
                    <button type="button" onClick={() => removeCourse(course.id)} aria-label={`Remove ${SUBJECT_NAMES[course.subject]} ${courseLabel(course)}`} className="text-sm font-bold text-ink-soft hover:text-orange-dark">✕</button>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">{courseLabel(course)}</p>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs font-bold"><span>{row?.completed ?? 0}/{row?.total ?? 0} complete</span><span>{row?.percent ?? 0}%</span></div>
                    <Bar value={row?.percent ?? 0} />
                  </div>
                  <Link href={`/${course.subject}`} className="sm-btn mt-4 bg-moss px-4 py-2 text-sm text-white">Open topics</Link>
                </article>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Secure mastery", `${view.mastery}%`],
            ["Attempted", String(view.subjects.reduce((n, s) => n + s.completed, 0))],
            ["Bookmarked", String(data.bookmarks)],
          ].map(([l, v]) => (
            <article key={l} className="sm-panel-sm p-6">
              <p className="text-sm font-bold text-ink-soft">{l}</p>
              <p className="mt-2 font-display text-3xl font-bold">{v}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="sm-panel p-6">
            <h2 className="font-display text-xl font-bold">Progress tracking</h2>
            <p className="mt-1 text-sm text-ink-soft">Open a subject to see each topic, then each topic to see its subtopics.</p>
            <div className="mt-4 space-y-3">
              {view.subjects.map((s) => (
                <details key={s.subject} className="rounded-xl border-2 border-ink bg-card p-3" open={view.subjects.length === 1}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex justify-between font-bold capitalize">
                      <span>{s.subject} overall</span>
                      <span>{s.percent}% complete · {s.mastery}% secure</span>
                    </div>
                    <div className="mt-2"><Bar value={s.percent} /></div>
                  </summary>
                  <div className="mt-3 space-y-2 border-t-2 border-ink/10 pt-3">
                    {s.rows.filter((t) => t.total > 0).map((t) => (
                      <details key={t.topic.id} className="rounded-lg border-2 border-ink/20 bg-cream-soft p-2.5">
                        <summary className="cursor-pointer list-none">
                          <div className="flex justify-between gap-2 text-sm font-bold">
                            <span>{t.topic.title}</span>
                            <span className="shrink-0">{t.percent}% · {t.completed}/{t.total}</span>
                          </div>
                          <div className="mt-1.5"><Bar value={t.percent} tone="bg-moss" /></div>
                        </summary>
                        <ul className="mt-3 space-y-2 pl-2">
                          {t.subtopics.map((sub) => (
                            <li key={sub.title} className="text-xs">
                              <div className="flex justify-between gap-2 font-semibold">
                                <span>{sub.title}</span>
                                <span className="shrink-0">{sub.percent}% complete · {sub.mastery}% secure</span>
                              </div>
                              <div className="mt-1 h-2 rounded-full border border-ink bg-card"><div className="h-full rounded-full bg-teal" style={{ width: `${sub.percent}%` }} /></div>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </article>

          <article className="sm-panel p-6">
            <h2 className="font-display text-xl font-bold">Recommended next</h2>
            <p className="mt-1 text-sm text-ink-soft">Your three topics with the most questions due and the weakest mastery.</p>
            <ol className="mt-4 space-y-3">
              {view.recommended.map((t, rank) => (
                <li key={t.topic.id}>
                  <Link href={t.topic.route} className="flex items-center gap-3 rounded-xl border-2 border-ink bg-card p-3 transition hover:-translate-y-0.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-yellow font-display font-bold">{rank + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-semibold">{t.topic.title}</span>
                      <span className="block text-xs font-semibold capitalize text-ink-soft">{t.topic.subject} · {t.due} due · {t.masteryPercent}% secure</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/practice?mode=due" className="sm-btn mt-5 inline-flex bg-orange px-5 py-3 text-white">
              Review due questions
            </Link>
          </article>
        </section>

        <section className="mt-8">
          <Achievements
            completed={view.subjects.reduce((n, s) => n + s.completed, 0)}
            total={view.subjects.reduce((n, s) => n + s.total, 0)}
            bookmarks={data.bookmarks}
            subjects={view.subjects}
            topics={view.topics}
            courses={courses.length}
            mastery={view.mastery}
          />
        </section>

        <section className="mt-8">
          <ExamCalendar />
        </section>
      </div>
    </main>
  );
}
