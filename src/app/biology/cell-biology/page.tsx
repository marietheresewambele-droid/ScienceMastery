"use client";

import { useState, useEffect } from "react";
import SubtopicGrid from "@/components/topic/SubtopicGrid";

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

const subtopicsData: Subtopic[] = [
  {
    id: "cell-structure",
    name: "Cell Structure",
    questions: [
      { id: "q1", text: "Name two structures found in plant cells but not animal cells.", marks: 2 },
      { id: "q2", text: "Describe the function of the nucleus.", marks: 1 },
      { id: "q3", text: "Explain how mitochondria are adapted for respiration.", marks: 2 },
    ],
  },
  {
    id: "microscopy",
    name: "Microscopy",
    questions: [
      { id: "q4", text: "Calculate the magnification if the eyepiece is 10x and objective lens is 40x.", marks: 2 },
      { id: "q5", text: "Describe how to prepare a slide for viewing onion cells.", marks: 3 },
    ],
  },
  {
    id: "cell-division",
    name: "Cell Division",
    questions: [
      { id: "q6", text: "Name the type of cell division that produces gametes.", marks: 1 },
      { id: "q7", text: "Describe what happens during mitosis.", marks: 3 },
    ],
  },
];

const STORAGE_KEY = "sciencemastery_completed_questions";

export default function CellBiologyPage() {
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue) {
      try {
        const parsed: unknown = JSON.parse(storedValue);
        // Safely migrate existing localStorage data: convert valid stored values into a Set
        const completedQuestionIds = Array.isArray(parsed)
          ? new Set(
              parsed.filter((value): value is string => typeof value === "string")
            )
          : new Set<string>();
        setCompletedQuestions(completedQuestionIds);
      } catch {
        // If parsing fails (malformed JSON), keep empty Set
        setCompletedQuestions(new Set());
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever completedQuestions changes
  useEffect(() => {
    if (isLoaded) {
      // Serialise Set as array for JSON storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedQuestions]));
    }
  }, [completedQuestions, isLoaded]);

  const handleQuestionComplete = (questionId: string) => {
    setCompletedQuestions((previous) => {
      const next = new Set(previous);
      next.add(questionId);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-[#f7f9fa]">
      <header className="border-b border-[#e6eaee] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a551] text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M9 3h6" />
                <path d="M10 3v6.3L4.8 18a3 3 0 0 0 2.7 4.4h9a3 3 0 0 0 2.7-4.4L14 9.3V3" />
                <path d="M7.5 15h9" />
              </svg>
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Science<span className="text-[#00a551]">Mastery</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#5a6b7f] md:flex">
            <a href="/" className="transition hover:text-[#0b1d33]">Home</a>
            <a href="#biology" className="transition hover:text-[#0b1d33]">Biology</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <span className="rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#02753a]">
            Topic 1
          </span>
          <h1 className="mt-3 text-3xl font-black text-[#0b1d33] sm:text-4xl">
            Cell Biology
          </h1>
          <p className="mt-2 max-w-2xl text-lg leading-7 text-[#5a6b7f]">
            Review cell structure, microscopy, cell division, stem cells and transport in cells through structured mastery practice.
          </p>
        </div>

        <SubtopicGrid
          subtopics={subtopicsData}
          completedQuestions={completedQuestions}
          onQuestionComplete={handleQuestionComplete}
        />
      </section>
    </main>
  );
}
