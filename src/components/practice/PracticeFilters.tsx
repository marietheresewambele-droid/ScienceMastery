"use client";

import { MasteryQuestion } from "@/types/questions";

interface PracticeFiltersProps {
  questions: MasteryQuestion[];
  selectedSubtopic: string | null;
  selectedAO: "AO1" | "AO2" | "AO3" | null;
  selectedDifficulty: "Foundation" | "Higher" | "Both" | null;
  showBookmarkedOnly: boolean;
  showNeedsPracticeOnly: boolean;
  showDueOnly: boolean;
  onSubtopicChange: (subtopic: string | null) => void;
  onAOChange: (ao: "AO1" | "AO2" | "AO3" | null) => void;
  onDifficultyChange: (difficulty: "Foundation" | "Higher" | "Both" | null) => void;
  onBookmarkedToggle: () => void;
  onNeedsPracticeToggle: () => void;
  onDueToggle: () => void;
}

export default function PracticeFilters({
  questions,
  selectedSubtopic,
  selectedAO,
  selectedDifficulty,
  showBookmarkedOnly,
  showNeedsPracticeOnly,
  showDueOnly,
  onSubtopicChange,
  onAOChange,
  onDifficultyChange,
  onBookmarkedToggle,
  onNeedsPracticeToggle,
  onDueToggle,
}: PracticeFiltersProps) {
  // Get unique subtopics from questions
  const subtopics = Array.from(
    new Set(questions.map((q) => q.subtopic))
  ).sort();

  // Calculate totals for each filter option
  const getSubtopicCount = (subtopic: string) =>
    questions.filter((q) => q.subtopic === subtopic).length;

  const getAOCount = (ao: "AO1" | "AO2" | "AO3") =>
    questions.filter((q) => q.assessmentObjective.includes(ao)).length;

  const getDifficultyCount = (diff: "Foundation" | "Higher" | "Both") =>
    questions.filter((q) => q.difficulty === diff).length;

  return (
    <div className="rounded-2xl border border-[#e6eaee] bg-white p-4">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#00a551]">
        Filters
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Subtopic filter */}
        <div>
          <label
            htmlFor="subtopic-filter"
            className="block text-xs font-semibold text-[#5a6b7f]"
          >
            Subtopic
          </label>
          <select
            id="subtopic-filter"
            value={selectedSubtopic || ""}
            onChange={(e) =>
              onSubtopicChange(e.target.value || null)
            }
            className="mt-1 w-full rounded-xl border border-[#dce2e7] bg-white px-3 py-2 text-sm font-medium text-[#0b1d33] focus:border-[#00a551] focus:outline-none focus:ring-2 focus:ring-[#00a551]"
          >
            <option value="">All subtopics</option>
            {subtopics.map((subtopic) => (
              <option key={subtopic} value={subtopic}>
                {subtopic} ({getSubtopicCount(subtopic)})
              </option>
            ))}
          </select>
        </div>

        {/* Assessment Objective filter */}
        <div>
          <label
            htmlFor="ao-filter"
            className="block text-xs font-semibold text-[#5a6b7f]"
          >
            Assessment Objective
          </label>
          <select
            id="ao-filter"
            value={selectedAO || ""}
            onChange={(e) =>
              onAOChange(
                (e.target.value as "AO1" | "AO2" | "AO3") || null
              )
            }
            className="mt-1 w-full rounded-xl border border-[#dce2e7] bg-white px-3 py-2 text-sm font-medium text-[#0b1d33] focus:border-[#00a551] focus:outline-none focus:ring-2 focus:ring-[#00a551]"
          >
            <option value="">All AOs</option>
            <option value="AO1">AO1 ({getAOCount("AO1")})</option>
            <option value="AO2">AO2 ({getAOCount("AO2")})</option>
            <option value="AO3">AO3 ({getAOCount("AO3")})</option>
          </select>
        </div>

        {/* Difficulty filter */}
        <div>
          <label
            htmlFor="difficulty-filter"
            className="block text-xs font-semibold text-[#5a6b7f]"
          >
            Difficulty
          </label>
          <select
            id="difficulty-filter"
            value={selectedDifficulty || ""}
            onChange={(e) =>
              onDifficultyChange(
                (e.target.value as "Foundation" | "Higher" | "Both") || null
              )
            }
            className="mt-1 w-full rounded-xl border border-[#dce2e7] bg-white px-3 py-2 text-sm font-medium text-[#0b1d33] focus:border-[#00a551] focus:outline-none focus:ring-2 focus:ring-[#00a551]"
          >
            <option value="">All difficulties</option>
            <option value="Foundation">
              Foundation ({getDifficultyCount("Foundation")})
            </option>
            <option value="Higher">
              Higher ({getDifficultyCount("Higher")})
            </option>
            <option value="Both">
              Both ({getDifficultyCount("Both")})
            </option>
          </select>
        </div>

        {/* Toggle filters */}
        <div className="flex flex-col justify-center gap-2">
          <button
            type="button"
            onClick={onBookmarkedToggle}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
              showBookmarkedOnly
                ? "bg-[#00a551] text-white"
                : "border border-[#dce2e7] bg-white text-[#5a6b7f] hover:border-[#00a551]"
            }`}
            aria-pressed={showBookmarkedOnly}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill={showBookmarkedOnly ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3V5z" />
            </svg>
            Bookmarked
          </button>

          <button
            type="button"
            onClick={onNeedsPracticeToggle}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
              showNeedsPracticeOnly
                ? "bg-[#00a551] text-white"
                : "border border-[#dce2e7] bg-white text-[#5a6b7f] hover:border-[#00a551]"
            }`}
            aria-pressed={showNeedsPracticeOnly}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            Needs practice
          </button>

          <button
            type="button"
            onClick={onDueToggle}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00a551] ${
              showDueOnly
                ? "bg-[#00a551] text-white"
                : "border border-[#dce2e7] bg-white text-[#5a6b7f] hover:border-[#00a551]"
            }`}
            aria-pressed={showDueOnly}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Due now
          </button>
        </div>
      </div>
    </div>
  );
}
