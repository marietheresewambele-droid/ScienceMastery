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

  const topics = draft ? topicRegistry.filter((topic) => topic.subject === draft.subject) : [];
  const alreadyAdded = draft ? courses.some((course) => course.id === courseId(draft)) : false;
  const countFor = (subject: string, slug: string) =>
    bank.questions?.filter((question) => question.subject === subject && question.topicSlug === slug && (!draft || visibleForCourse(question, draft.pathway, draft.tier))).length;

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link href={homeHref} className="font-display font-bold">Sci<span className="text-orange">Mastery</span></Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-ink-soft">
            <Link href="/courses" className="text-orange-dark">Courses</Link>
            <Link href="/practice" className="hover:text-orange-dark">Revision centre</Link>
            <AuthButtons />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Courses</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Choose your course</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Pick a qualification, subject, exam board and tier. Add the course to put it on your dashboard, or open a topic to start revising straight away.</p>

        {courses.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">Your courses</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {courses.map((course) => (
                <span key={course.id} className="sm-panel-sm flex items-center gap-3 px-4 py-2 text-sm">
                  <span><strong className="font-display">{SUBJECT_NAMES[course.subject]}</strong> · {courseLabel(course)}</span>
                  <button type="button" onClick={() => removeCourse(course.id)} aria-label={`Remove ${SUBJECT_NAMES[course.subject]} ${courseLabel(course)}`} className="font-bold text-orange-dark">✕</button>
                </span>
              ))}
              <Link href="/dashboard" className="sm-btn bg-orange px-4 py-2 text-sm text-white">Go to dashboard</Link>
            </div>
          </section>
        )}

        <div className="mt-10"><CourseSelector variant="cards" onSelect={setDraft} /></div>

        {draft && (
          <section className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">{SUBJECT_NAMES[draft.subject]} topics</h2>
                <p className="mt-1 text-sm font-semibold text-ink-soft">{SUBJECT_NAMES[draft.subject]} · {courseLabel({ ...draft, id: "" })}</p>
              </div>
              <button type="button" disabled={alreadyAdded} onClick={() => addCourse(draft)} className="sm-btn bg-orange px-6 py-3 text-white disabled:opacity-50">
                {alreadyAdded ? "Added to dashboard ✓" : "Add course to dashboard"}
              </button>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {topics.map((topic) => (
                <article key={topic.id} className="sm-panel flex flex-col justify-between p-6">
                  <div>
                    <div className="flex gap-2">
                      <span className="rounded-md border-2 border-ink bg-moss px-3 py-1 text-xs font-bold text-white">{topic.topicNumber}</span>
                      <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">{countFor(topic.subject, topic.id) ?? "…"} questions</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-bold">{topic.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">{topic.description}</p>
                  </div>
                  <Link href={topic.route} className="sm-btn mt-5 inline-flex w-fit bg-moss px-5 py-2.5 text-white">Open topic</Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
