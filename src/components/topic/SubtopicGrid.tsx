"use client";

interface Question {
  id: string;
  text: string;
  marks: number;
}

interface Subtopic {
  id: string;
  name: string;
  questions: Question[];
}

interface SubtopicGridProps {
  subtopics: Subtopic[];
  completedQuestions: Set<string>;
  onQuestionComplete: (questionId: string) => void;
}

export default function SubtopicGrid({
  subtopics,
  completedQuestions,
  onQuestionComplete,
}: SubtopicGridProps) {
  // Defensive normalisation at component boundary
  const completedQuestionIds =
    completedQuestions instanceof Set
      ? completedQuestions
      : new Set(completedQuestions);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subtopics.map((subtopic) => (
        <article
          key={subtopic.id}
          className="rounded-2xl border border-[#e6eaee] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <h3 className="text-lg font-bold text-[#0b1d33]">{subtopic.name}</h3>
          <div className="mt-4 space-y-3">
            {subtopic.questions.map((q) => {
              const isCompleted = completedQuestionIds.has(q.id);
              return (
                <div
                  key={q.id}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    isCompleted
                      ? "border-[#00a551] bg-[#e9f8f0]"
                      : "border-[#dce2e7] bg-[#f7f9fa]"
                  }`}
                >
                  <p
                    className={`text-sm ${isCompleted ? "font-bold text-[#02753a]" : "text-[#5a6b7f]"}`}
                  >
                    {q.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => onQuestionComplete(q.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isCompleted
                        ? "bg-[#00a551] text-white"
                        : "bg-[#0b1d33] text-white hover:bg-[#028f46]"
                    }`}
                    aria-label={
                      isCompleted ? "Already completed" : "Mark as complete"
                    }
                  >
                    {isCompleted ? "Done" : "I got it"}
                  </button>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
