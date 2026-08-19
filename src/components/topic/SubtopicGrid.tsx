"use client";

import Link from "next/link";
import { BiologyTopicConfig, MasteryQuestion } from "@/types/questions";

interface SubtopicCardProps {
  title: string;
  description: string;
  questionCount: number;
  isCompleted: boolean;
  practiceHref: string;
  examHref: string;
}

function SubtopicCard({
  title,
  description,
  questionCount,
  isCompleted,
  practiceHref,
  examHref,
}: SubtopicCardProps) {
  const hasQuestions = questionCount > 0;

  return (
    <article
      className={`sm-panel-sm flex flex-col justify-between p-5 transition hover:-translate-y-1 ${
        isCompleted ? "bg-moss-soft" : ""
      }`}
    >
      <div>
        <div className="flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          {isCompleted && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-moss text-white"
              aria-label="Completed"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
      </div>

      <div className="mt-4">
        <span
          className={`text-xs font-bold ${
            hasQuestions ? "text-orange-dark" : "text-ink-soft/50"
          }`}
        >
          {questionCount} {questionCount === 1 ? "question" : "questions"}
        </span>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {hasQuestions ? (
            <>
              <Link
                href={practiceHref}
                className="sm-btn !rounded-xl bg-orange px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
                aria-label={`Start practice mode flashcards for ${title}`}
              >
                Practice Mode
              </Link>
              <Link
                href={examHref}
                className="sm-btn !rounded-xl bg-card px-4 py-2.5 text-sm text-orange-dark focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
                aria-label={`Start exam mode flashcards for ${title}`}
              >
                Exam Mode
              </Link>
            </>
          ) : (
            <>
              <span className="cursor-not-allowed rounded-xl border-2 border-ink/30 bg-cream-soft px-4 py-2.5 text-center text-sm font-bold text-ink-soft/50">
                Practice Mode
              </span>
              <span className="cursor-not-allowed rounded-xl border-2 border-ink/30 bg-cream-soft px-4 py-2.5 text-center text-sm font-bold text-ink-soft/50">
                Exam Mode
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

interface SubtopicGridProps {
  config: BiologyTopicConfig;
  questions: MasteryQuestion[];
  completedQuestions?: Set<string> | string[];
}

export default function SubtopicGrid({
  config,
  questions,
  completedQuestions,
}: SubtopicGridProps) {
  const completedQuestionSet = new Set<string>();

  if (completedQuestions instanceof Set) {
    completedQuestions.forEach((id) => completedQuestionSet.add(id));
  } else if (Array.isArray(completedQuestions)) {
    completedQuestions.forEach((id) => {
      if (typeof id === "string") {
        completedQuestionSet.add(id);
      }
    });
  }

  const subtopicCounts = new Map<string, number>();
  config.subtopics.forEach((subtopic) => {
    const count = questions.filter((q) => q.subtopic === subtopic.title).length;
    subtopicCounts.set(subtopic.title, count);
  });

  const getSubtopicCompletion = (subtopic: string): boolean => {
    const subtopicQuestions = questions.filter((q) => q.subtopic === subtopic);
    if (subtopicQuestions.length === 0) return false;
    return subtopicQuestions.every((q) => completedQuestionSet.has(q.id));
  };

  return (
    <section aria-labelledby="subtopics-heading">
      <h2 id="subtopics-heading" className="sr-only">
        {config.title} Subtopics
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.subtopics.map((subtopic) => {
          const subject = config.subject ?? "biology";
          const params = `subject=${subject}&topic=${config.id}&subtopic=${encodeURIComponent(subtopic.title)}`;
          return (
            <SubtopicCard
              key={subtopic.id}
              title={subtopic.title}
              description={subtopic.description || "Practice questions for this subtopic."}
              questionCount={subtopicCounts.get(subtopic.title) || 0}
              practiceHref={`/practice?mode=flashcards&${params}`}
              examHref={`/practice?mode=exam&${params}`}
              isCompleted={getSubtopicCompletion(subtopic.title)}
            />
          );
        })}
      </div>
    </section>
  );
}
