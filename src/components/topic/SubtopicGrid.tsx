"use client";

import Link from "next/link";
import { BiologyTopicConfig, MasteryQuestion } from "@/types/questions";

interface SubtopicCardProps {
  title: string;
  description: string;
  questionCount: number;
  isCompleted: boolean;
  onPractise: () => void;
  flashcardsHref: string;
}

function SubtopicCard({
  title,
  description,
  questionCount,
  isCompleted,
  onPractise,
  flashcardsHref,
}: SubtopicCardProps) {
  const hasQuestions = questionCount > 0;

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${
        isCompleted
          ? "border-[#00a551] bg-[#f0fdf4]"
          : "border-[#e6eaee] bg-white"
      }`}
    >
      <div>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-extrabold text-[#0b1d33]">{title}</h3>
          {isCompleted && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00a551] text-white"
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
        <p className="mt-2 text-sm leading-6 text-[#5a6b7f]">{description}</p>
      </div>

      <div className="mt-4">
        <span
          className={`text-xs font-bold ${
            hasQuestions ? "text-[#00a551]" : "text-[#9ca3af]"
          }`}
        >
          {questionCount} {questionCount === 1 ? "question" : "questions"}
        </span>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPractise}
            disabled={!hasQuestions}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] focus:ring-offset-2 ${
              hasQuestions
                ? "cursor-pointer bg-[#00a551] text-white hover:bg-[#028f46]"
                : "cursor-not-allowed bg-[#dce2e7] text-[#9ca3af]"
            }`}
            aria-label={
              hasQuestions
                ? `Start practising ${title}`
                : `No questions available for ${title}`
            }
          >
            Practice
          </button>
          {hasQuestions ? (
            <Link
              href={flashcardsHref}
              className="rounded-xl border border-[#00a551] bg-white px-4 py-2.5 text-center text-sm font-bold text-[#02753a] transition hover:bg-[#e9f8f0] focus:outline-none focus:ring-2 focus:ring-[#00a551] focus:ring-offset-2"
              aria-label={`Open flashcards for ${title}`}
            >
              Flashcards
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-xl border border-[#dce2e7] bg-[#f7f9fa] px-4 py-2.5 text-center text-sm font-bold text-[#9ca3af]">
              Flashcards
            </span>
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
  onSubtopicSelect: (subtopic: string) => void;
}

export default function SubtopicGrid({
  config,
  questions,
  completedQuestions,
  onSubtopicSelect,
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
        {config.subtopics.map((subtopic) => (
          <SubtopicCard
            key={subtopic.id}
            title={subtopic.title}
            description={subtopic.description || "Practice questions for this subtopic."}
            questionCount={subtopicCounts.get(subtopic.title) || 0}
            onPractise={() => onSubtopicSelect(subtopic.title)}
            flashcardsHref={`/practice?mode=flashcards&subject=${config.subject ?? "biology"}&topic=${config.id}&subtopic=${encodeURIComponent(subtopic.title)}`}
            isCompleted={getSubtopicCompletion(subtopic.title)}
          />
        ))}
      </div>
    </section>
  );
}
