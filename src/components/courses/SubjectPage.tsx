"use client";

/* Selection is seeded from saved courses once they have loaded from localStorage. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { topicRegistry } from "@/data/topics/registry";
import { useHomeHref } from "@/hooks/useHomeHref";
import { SUBJECT_NAMES, addCourse, courseId, removeCourse, useCourses, type CoursePathway, type CourseTier } from "@/lib/courses";
import { useQuestionBank, visibleForCourse } from "@/lib/questionBank";
import type { Subject } from "@/types/questions";

const THEME: Record<Subject, { soft: string; solid: string; dark: string }> = {
  biology: { soft: "bg-moss-soft", solid: "bg-moss", dark: "text-moss-dark" },
  chemistry: { soft: "bg-teal-soft", solid: "bg-teal", dark: "text-teal-dark" },
  physics: { soft: "bg-orange-soft", solid: "bg-orange", dark: "text-orange-dark" },
};

const OPTIONS: { pathway: CoursePathway; tier: CourseTier }[] = [
  { pathway: "triple", tier: "Higher" },
  { pathway: "triple", tier: "Foundation" },
  { pathway: "combined", tier: "Higher" },
  { pathway: "combined", tier: "Foundation" },
];
const optionLabel = (option: { pathway: CoursePathway; tier: CourseTier }) =>
  `${option.pathway === "triple" ? "Triple" : "Combined"} · ${option.tier}`;

export default function SubjectPage({ subject }: { subject: Subject }) {
  const homeHref = useHomeHref();
  // Counts follow the course selected in the dropdown, whether or not it is saved yet.
  const { questions: allQuestions } = useQuestionBank({ unfiltered: true });
  const { courses, ready } = useCourses();
  const theme = THEME[subject];
  const name = SUBJECT_NAMES[subject];
  const topics = topicRegistry.filter((topic) => topic.subject === subject);
  const [selected, setSelected] = useState(OPTIONS[0]);
  const questions = allQuestions?.filter((q) => q.subject === subject && visibleForCourse(q, selected.pathway, selected.tier));
  const countFor = (slug: string) => questions?.filter((q) => q.topicSlug === slug).length;
  const questionTotal = questions ? questions.length : "…";
  const [seeded, setSeeded] = useState(false);
  const [open, setOpen] = useState(false);

  const idFor = (option: (typeof OPTIONS)[number]) => courseId({ qualification: "GCSE", subject, board: "AQA", ...option });
  const isSaved = (option: (typeof OPTIONS)[number]) => courses.some((course) => course.id === idFor(option));

  useEffect(() => {
    if (!ready || seeded) return;
    setSeeded(true);
    const saved = courses.find((course) => course.subject === subject);
    if (saved) setSelected({ pathway: saved.pathway, tier: saved.tier });
  }, [ready, seeded, courses, subject]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const saved = isSaved(selected);
  const toggleSaved = () => (saved ? removeCourse(idFor(selected)) : addCourse({ qualification: "GCSE", subject, board: "AQA", ...selected }));

  return <main className="min-h-screen bg-cream text-ink">
    <header className="border-b-2 border-ink bg-cream/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href={homeHref} className="font-display font-bold">Sci<span className="text-orange">Mastery</span></Link>
        <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-ink-soft">
          <Link href="/courses" className="hover:text-orange-dark">Courses</Link>
          <Link href="/practice" className="hover:text-orange-dark">Revision centre</Link>
          <AuthButtons />
        </nav>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 pb-4 pt-10 sm:px-6">
      <section className={`sm-panel relative ${theme.soft} p-6 pt-9 sm:p-8 sm:pt-10`} aria-label={`${name} course`}>
        <span className="sm-tag absolute -top-4 left-6 bg-card px-3 py-1 text-xs tracking-wide">GCSE · AQA</span>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-ink ${theme.solid} font-display text-3xl font-bold text-white shadow-[3px_3px_0_0_var(--color-ink)]`} aria-hidden="true">{name[0]}</span>
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{name}</h1>
              <div className="relative mt-3 flex items-center gap-3">
                <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full border-2 border-ink bg-card px-4 py-2 text-sm font-bold">
                  {optionLabel(selected)}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5M7 9l5-5 5 5" /></svg>
                </button>
                <button type="button" onClick={toggleSaved} aria-pressed={saved} aria-label={saved ? `Remove ${optionLabel(selected)} from my dashboard` : `Save ${optionLabel(selected)} to my dashboard`} title={saved ? "Saved to your dashboard" : "Save to your dashboard"} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink transition ${saved ? "bg-moss text-white" : "bg-card text-ink-soft hover:bg-moss-soft"}`}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                </button>
                {saved && <span className="text-xs font-bold text-moss-dark">On your dashboard</span>}

                {open && <>
                  <button type="button" aria-label="Close course menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
                  <div role="listbox" aria-label="Course" className="sm-panel absolute left-0 top-full z-20 mt-2 w-72 p-3">
                    <p className="px-3 pb-1 text-xs font-extrabold uppercase tracking-widest text-ink-soft">Course</p>
                    {OPTIONS.map((option) => {
                      const current = option.pathway === selected.pathway && option.tier === selected.tier;
                      return (
                        <button key={optionLabel(option)} type="button" role="option" aria-selected={current} onClick={() => { setSelected(option); setOpen(false); }} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-cream-soft ${current ? "bg-cream-soft" : ""}`}>
                          <span className="flex items-center gap-2">
                            {optionLabel(option)}
                            {isSaved(option) && <span className="rounded-full border-2 border-ink bg-teal-soft px-2 py-0.5 text-xs font-bold text-teal-dark">Saved</span>}
                          </span>
                          {current && <svg className="h-4 w-4 text-teal-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>}
                        </button>
                      );
                    })}
                    <Link href="/courses" className="mt-1 block border-t-2 border-ink/10 px-3 pb-1 pt-3 text-sm font-bold text-orange-dark">Browse all courses →</Link>
                  </div>
                </>}
              </div>
            </div>
          </div>
          <Link href={`/practice?mode=flashcards&subject=${subject}`} className="sm-btn bg-card px-6 py-3.5 text-ink">Study multiple subtopics →</Link>
        </div>
        <p className="mt-6 max-w-3xl leading-7 text-ink-soft">Practise all {topics.length} AQA {name} topics with {questionTotal} questions for {optionLabel(selected)}, complete with model answers and progress tracking.{!saved && " Save this course (the tick) to practise only its questions."}</p>
      </section>
    </div>

    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 md:grid-cols-2">
      {topics.map((topic) => <article key={topic.id} className="sm-panel flex flex-col justify-between p-7">
        <div>
          <div className="flex gap-2">
            <span className={`rounded-md border-2 border-ink ${theme.solid} px-3 py-1 text-xs font-bold text-white`}>{topic.topicNumber}</span>
            <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">{countFor(topic.id) ?? "…"} questions</span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">{topic.title}</h2>
          <p className="mt-2 leading-7 text-ink-soft">{topic.description}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link href={`/practice?mode=flashcards&subject=${subject}&topic=${topic.id}`} className={`sm-btn ${theme.solid} px-4 py-2 text-sm text-white`}>Practice</Link>
          <Link href={`/practice?mode=exam&subject=${subject}&topic=${topic.id}`} className="sm-btn bg-card px-4 py-2 text-sm text-ink">Exam</Link>
          <Link href={topic.route} className={`ml-1 text-sm font-bold ${theme.dark} hover:underline`}>Subtopics →</Link>
        </div>
      </article>)}
    </section>
  </main>;
}
