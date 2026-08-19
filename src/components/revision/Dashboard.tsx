"use client";
/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { topicRegistry } from "@/data/topics/registry";
import { readProgress } from "@/lib/progress";
import { useHomeHref } from "@/hooks/useHomeHref";
import Achievements from "@/components/revision/Achievements";
import ExamCalendar from "@/components/revision/ExamCalendar";

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const homeHref = useHomeHref();
  useEffect(() => setReady(true), []);

  const data = useMemo(() => {
    if (!ready) return null;
    const now = Date.now();
    const topics = topicRegistry.map((topic) => {
      const p = readProgress(topic);
      const valid = new Set(topic.questions.map((q) => q.id));
      const completed = [...p.completed].filter((id) => valid.has(id)).length;
      const bookmarks = [...p.bookmarks].filter((id) => valid.has(id)).length;
      const due = Object.entries(p.reviews).filter(([id, r]) => valid.has(id) && new Date(r.dueAt).getTime() <= now).length;
      return {
        topic,
        completed,
        bookmarks,
        due,
        total: topic.questions.length,
        percent: Math.round((completed / topic.questions.length) * 100),
      };
    });
    const subjects = ["biology", "chemistry", "physics"].map((subject) => {
      const rows = topics.filter((x) => (x.topic.subject ?? "biology") === subject);
      return {
        subject,
        completed: rows.reduce((n, x) => n + x.completed, 0),
        total: rows.reduce((n, x) => n + x.total, 0),
      };
    });
    const ranked = [...topics].sort((a, b) => b.percent - a.percent);
    const next = [...topics].sort((a, b) => b.due - a.due || a.percent - b.percent)[0];
    return {
      topics,
      subjects,
      total: topics.reduce((n, x) => n + x.total, 0),
      completed: topics.reduce((n, x) => n + x.completed, 0),
      bookmarks: topics.reduce((n, x) => n + x.bookmarks, 0),
      due: topics.reduce((n, x) => n + x.due, 0),
      strong: ranked[0],
      weak: [...ranked].reverse()[0],
      next,
    };
  }, [ready]);

  if (!data) return <main className="p-10 font-display">Loading your learning…</main>;

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link href={homeHref} className="font-display font-bold">
            Sci<span className="text-orange">Mastery</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-ink-soft">
            <Link href="/#subjects" className="hover:text-orange-dark">Subjects</Link>
            <Link href="/#features" className="hover:text-orange-dark">Features</Link>
            <Link href="/#how" className="hover:text-orange-dark">How it works</Link>
            <Link href="/challenge-me" className="hover:text-orange-dark">Challenge Me</Link>
            <Link href="/practical-mode" className="hover:text-orange-dark">Practical Lab</Link>
            <Link href="/practice" className="text-orange-dark">Revision centre</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">My Learning</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Your science dashboard</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Completed", `${data.completed} / ${data.total}`],
            ["Attempted", String(data.completed)],
            ["Bookmarked", String(data.bookmarks)],
            ["Due today", String(data.due)],
          ].map(([l, v]) => (
            <article key={l} className="sm-panel-sm p-6">
              <p className="text-sm font-bold text-ink-soft">{l}</p>
              <p className="mt-2 font-display text-3xl font-bold">{v}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="sm-panel p-6">
            <h2 className="font-display text-xl font-bold">Progress by subject</h2>
            {data.subjects.map((s) => (
              <div key={s.subject} className="mt-5">
                <div className="flex justify-between font-bold capitalize">
                  <span>{s.subject}</span>
                  <span>{s.completed}/{s.total}</span>
                </div>
                <div className="mt-2 h-3 rounded-full border-2 border-ink bg-cream-soft">
                  <div className="h-full rounded-full bg-orange" style={{ width: `${(s.completed / s.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </article>
          <article className="sm-panel p-6">
            <h2 className="font-display text-xl font-bold">Recommended next</h2>
            <p className="mt-4 text-ink-soft">
              {data.due
                ? `You have ${data.due} questions due across your subjects.`
                : `Build your first review schedule by practising ${data.next.topic.title}.`}
            </p>
            <Link
              href={data.due ? "/practice?mode=due" : data.next.topic.route}
              className="sm-btn mt-5 inline-flex bg-orange px-5 py-3 text-white"
            >
              {data.due ? "Review due questions" : `Continue ${data.next.topic.title}`}
            </Link>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-ink bg-moss-soft p-4">
                <p className="text-xs font-bold uppercase">Strongest</p>
                <p className="mt-1 font-display font-bold">{data.strong.topic.title}</p>
              </div>
              <div className="rounded-xl border-2 border-ink bg-yellow-soft p-4">
                <p className="text-xs font-bold uppercase">Needs focus</p>
                <p className="mt-1 font-display font-bold">{data.weak.topic.title}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <Achievements
            completed={data.completed}
            total={data.total}
            bookmarks={data.bookmarks}
            subjects={data.subjects}
            topics={data.topics}
          />
        </section>

        <section className="mt-8">
          <ExamCalendar />
        </section>
      </div>
    </main>
  );
}
