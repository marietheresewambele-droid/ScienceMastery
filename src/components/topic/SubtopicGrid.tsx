"use client";

import { MasteryQuestion, TopicMetadata } from "@/types/questions";

interface SubtopicCardProps {
  title: string;
  description: string;
  questionCount: number;
  isCompleted: boolean;
  onPractise: () => void;
}

function SubtopicCard({
  title,
  description,
  questionCount,
  isCompleted,
  onPractise,
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

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`text-xs font-bold ${
            hasQuestions ? "text-[#00a551]" : "text-[#9ca3af]"
          }`}
        >
          {questionCount} {questionCount === 1 ? "question" : "questions"}
        </span>
        <button
          type="button"
          onClick={onPractise}
          disabled={!hasQuestions}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] focus:ring-offset-2 ${
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
          Practise
        </button>
      </div>
    </article>
  );
}

interface SubtopicGridProps {
  metadata: TopicMetadata;
  questions: MasteryQuestion[];
  completedQuestions?: Set<string> | string[];
  onSubtopicSelect: (subtopic: string) => void;
}

export default function SubtopicGrid({
  metadata,
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

  // Calculate question counts per subtopic
  const subtopicCounts = new Map<string, number>();
  metadata.subtopics.forEach((subtopic) => {
    const count = questions.filter((q) => q.subtopic === subtopic).length;
    subtopicCounts.set(subtopic, count);
  });

  // Get completion status per subtopic
  const getSubtopicCompletion = (subtopic: string): boolean => {
    const subtopicQuestions = questions.filter((q) => q.subtopic === subtopic);
    if (subtopicQuestions.length === 0) return false;
    return subtopicQuestions.every((q) => completedQuestionSet.has(q.id));
  };

  const subtopicDescriptions: Record<string, string> = {
    "Cell structure":
      "Identify and describe the functions of cell organelles in plant and animal cells.",
    "Cell specialisation and differentiation":
      "Understand how cells become specialised for specific functions.",
    Microscopy:
      "Learn to use microscopes and calculate magnification and actual size.",
    "Chromosomes and the cell cycle":
      "Explore DNA, chromosomes and the stages of the cell cycle.",
    Mitosis:
      "Understand the process of cell division and its importance.",
    "Stem cells":
      "Learn about stem cells and their uses in medicine and research.",
    Diffusion:
      "Understand how substances move across cell membranes by diffusion.",
    Osmosis:
      "Explore water movement across partially permeable membranes.",
    "Active transport":
      "Learn how cells move substances against concentration gradients.",
    "Required practical: microscopy":
      "Prepare slides and observe plant and animal cells under a microscope.",
    "Required practical: osmosis":
      "Investigate the effect of salt or sugar solutions on plant tissue.",
  };

  return (
    <section aria-labelledby="subtopics-heading">
      <h2 id="subtopics-heading" className="sr-only">
        Cell Biology Subtopics
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metadata.subtopics.map((subtopic) => (
          <SubtopicCard
            key={subtopic}
            title={subtopic}
            description={
              subtopicDescriptions[subtopic] ||
              "Practice questions for this subtopic."
            }
            questionCount={subtopicCounts.get(subtopic) || 0}
            onPractise={() => onSubtopicSelect(subtopic)}
            isCompleted={getSubtopicCompletion(subtopic)}
          />
        ))}
      </div>
    </section>
  );
}
