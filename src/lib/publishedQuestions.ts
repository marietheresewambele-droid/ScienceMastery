"use client";

import { topicRegistry } from "@/data/topics/registry";
import type { MasteryQuestion } from "@/types/questions";

export interface LoadPublishedQuestionsResult {
  questions: MasteryQuestion[];
  error: string | null;
}

/** Returns the workbook question bank bundled with the site while the importer is offline. */
export async function loadPublishedQuestions(subjects: string[]): Promise<LoadPublishedQuestionsResult> {
  const selectedSubjects = new Set(subjects.map((subject) => subject.toLowerCase()));
  const questions = topicRegistry
    .filter((topic) => selectedSubjects.has(topic.subject ?? "biology"))
    .flatMap((topic) => topic.questions);
  return { questions, error: null };
}
