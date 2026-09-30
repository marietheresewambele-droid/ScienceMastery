"use client";

import { loadAdaptiveCatalog } from "@/lib/adaptive-catalog";
import type { MasteryQuestion } from "@/types/questions";

export interface LoadPublishedQuestionsResult {
  questions: MasteryQuestion[];
  error: string | null;
}

/** The catalog RLS policy exposes only active questions from published content versions. */
export async function loadPublishedQuestions(subjects: string[]): Promise<LoadPublishedQuestionsResult> {
  try {
    const questions = await loadAdaptiveCatalog(subjects.map((subject) => subject.toLowerCase()));
    return { questions, error: null };
  } catch {
    return {
      questions: [],
      error: "Published questions could not be loaded. Please check your connection and try again.",
    };
  }
}
