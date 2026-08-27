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
import { adaptiveEngine, aggregateMastery } from "@/lib/adaptive";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [adaptive, setAdaptive] = useState<{ secure: number; supported: number; developing: number; due: number } | null>(null);
  const homeHref = useHomeHref();
  useEffect(() => setReady(true), []);
  useEffect(() => {
    const refresh = () => setDataVersion((value) => value + 1);
    window.addEventListener("sciencemastery:learning-updated", refresh);
    return () => window.removeEventListener("sciencemastery:learning-updated", refresh);
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: states } = await supabase
        .from("student_question_state")
        .select("mastery_status,due_at")
        .eq("user_id", data.user.id);
      if (!states) return;
      const now = Date.now();
      setAdaptive({
        secure: states.filter((state) => state.mastery_status === "secure").length,
        supported: states.filter((state) => state.mastery_status === "supported").length,
        developing: states.filter((state) => state.mastery_status === "developing").length,
        due: states.filter((state) => state.due_at && new Date(state.due_at).getTime() <= now).length,
      });
    });

  }, []);

  const data = useMemo(() => {
    if (!ready) return null;
    const now = Date.now();
    const adaptive = adaptiveEngine.getSnapshot();
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
        masteryPercent: aggregateMastery(adaptive, topic.questions)[`topic:${topic.id}`]?.masteryPercent ?? 0,
        due,
        total: topic.questions.length,
        percent: Math.round((completed / topic.questions.length) * 100),
      };
    });
    const subjects = ["biology", "chemistry", "physics"].map((subject) => {
      const rows = topics.filter((x) => (x.topic.subject ?? "biology") === subject);
      return {
        mastery: Math.round(rows.reduce((n, x) => n + x.masteryPercent * x.total, 0) / Math.max(1, rows.reduce((n, x) => n + x.total, 0))),
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
  }, [ready, dataVersion]);

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
            ["Due today", String(data.due)],
            ["Secure mastery", `${Math.round(data.subjects.reduce((sum, subject) => sum + subject.mastery, 0) / data.subjects.length)}%`],
            ["Attempted", String(data.completed)],
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
            <h2 className="font-display text-xl font-bold">Progress by subject</h2>
            {data.subjects.map((s) => (
              <div key={s.subject} className="mt-5">
                <div className="flex justify-between font-bold capitalize">
                  <span>{s.subject}</span>
                  <span>{s.mastery}% secure · {s.completed}/{s.total}</span>
                </div>
                <div className="mt-2 h-3 rounded-full border-2 border-ink bg-cream-soft">
                  <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${s.mastery}%` }} />
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

        <section className="sm-panel mt-8 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Adaptive engine</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Independent mastery evidence</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Secure mastery requires repeated correct answers without hints. Supported answers are tracked separately so help never inflates mastery.</p>
            </div>
            <Link href="/practice?mode=adaptive" className="sm-btn bg-orange px-5 py-3 text-white">Start adaptive practice</Link>
          </div>
          {adaptive ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {[["Secure", adaptive.secure], ["Supported", adaptive.supported], ["Developing", adaptive.developing], ["Due", adaptive.due]].map(([label, value]) => (
                <div key={label} className="rounded-xl border-2 border-ink bg-cream-soft p-4"><p className="text-xs font-bold uppercase text-ink-soft">{label}</p><p className="mt-1 font-display text-2xl font-bold">{value}</p></div>
              ))}
            </div>
          ) : <p className="mt-5 text-sm font-semibold text-ink-soft">Sign in and complete an adaptive session to build this evidence profile.</p>}
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
