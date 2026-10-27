"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthButtons } from "@/components/auth/AuthButtons";
import CourseSelector from "@/components/courses/CourseSelector";
import { topicRegistry } from "@/data/topics/registry";
import { useHomeHref } from "@/hooks/useHomeHref";
import { SUBJECT_NAMES, addCourse, courseLabel, courseId, removeCourse, useCourses, type Course } from "@/lib/courses";
import { useQuestionBank, visibleForCourse } from "@/lib/questionBank";

type Draft = Omit<Course, "id">;

export default function CoursesPage() {
  const homeHref = useHomeHref();
  const { courses } = useCourses();
  const bank = useQuestionBank({ unfiltered: true });
  const [draft, setDraft] = useState<Draft | null>(null);
  // Remounting the selector clears it, so another course can be picked right after one is added.
  const [selectorKey, setSelectorKey] = useState(0);
  const [justAdded, setJustAdded] = useState("");

  const topics = draft ? topicRegistry.filter((topic) => topic.subject === draft.subject) : [];
  const alreadyAdded = draft ? courses.some((course) => course.id === courseId(draft)) : false;
  const countFor = (subject: string, slug: string) =>
    bank.questions?.filter((question) => question.subject === subject && question.topicSlug === slug && (!draft || visibleForCourse(question, draft.pathway, draft.tier))).length;

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href={homeHref} className="font-display font-bold">Sci<span className="text-orange">Mastery</span></Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-ink-soft">
            <Link href="/courses" className="text-orange-dark">Courses</Link>
            <Link href="/practice" className="hover:text-orange-dark">Revision centre</Link>
            <AuthButtons />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Courses</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Choose your course</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">Pick a qualification, subject, exam board and tier. Add the course to put it on your dashboard, or open a topic to start revising straight away.</p>

        {courses.length > 0 && (
          <section className="mt-5">
            <h2 className="font-display text-sm font-bold">Your courses</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {courses.map((course) => (
                <span key={course.id} className="flex items-center gap-2 rounded-lg border-2 border-ink bg-card px-2.5 py-1 text-xs">
                  <span><strong className="font-display">{SUBJECT_NAMES[course.subject]}</strong> · {courseLabel(course)}</span>
                  <button type="button" onClick={() => removeCourse(course.id)} aria-label={`Remove ${SUBJECT_NAMES[course.subject]} ${courseLabel(course)}`} className="font-bold text-orange-dark">✕</button>
                </span>
              ))}
              <Link href="/dashboard" className="inline-flex items-center rounded-lg border-2 border-ink bg-orange px-3 py-1 text-xs font-bold text-white">Go to dashboard</Link>
            </div>
          </section>
        )}

        {justAdded && <p role="status" className="mt-5 rounded-lg border-2 border-ink bg-moss-soft px-3 py-2 text-xs font-semibold text-moss-dark">{justAdded} added to your dashboard. Choose another course below to add more, or <Link href="/dashboard" className="underline">go to your dashboard</Link>.</p>}
        <div className="mt-5"><CourseSelector key={selectorKey} variant="dropdown" onSelect={(next) => { setDraft(next); if (next) setJustAdded(""); }} /></div>

        {draft && (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold">{SUBJECT_NAMES[draft.subject]} topics</h2>
                <p className="mt-0.5 text-xs font-semibold text-ink-soft">{SUBJECT_NAMES[draft.subject]} · {courseLabel({ ...draft, id: "" })}</p>
              </div>
              <button type="button" disabled={alreadyAdded} onClick={() => {
                  addCourse(draft);
                  setJustAdded(`${SUBJECT_NAMES[draft.subject]} · ${courseLabel({ ...draft, id: "" })}`);
                  setDraft(null);
                  setSelectorKey((value) => value + 1);
                }} className="rounded-lg border-2 border-ink bg-orange px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                {alreadyAdded ? "Already on your dashboard ✓" : "Add course to dashboard"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <article key={topic.id} className="flex flex-col justify-between rounded-xl border-2 border-ink bg-card p-4">
                  <div>
                    <div className="flex gap-2">
                      <span className="rounded border-2 border-ink bg-moss px-2 py-0.5 text-[11px] font-bold text-white">{topic.topicNumber}</span>
                      <span className="rounded border-2 border-ink bg-card px-2 py-0.5 text-[11px] font-bold text-ink-soft">{countFor(topic.subject, topic.id) ?? "…"} questions</span>
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold">{topic.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{topic.description}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Link href={`/practice?mode=flashcards&subject=${topic.subject}&topic=${topic.id}`} className="rounded-lg border-2 border-ink bg-moss px-3 py-1 text-xs font-bold text-white">Practice</Link>
                    <Link href={`/practice?mode=exam&subject=${topic.subject}&topic=${topic.id}`} className="rounded-lg border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink">Exam</Link>
                    <Link href={topic.route} className="ml-1 text-xs font-bold text-orange-dark hover:underline">Subtopics →</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
