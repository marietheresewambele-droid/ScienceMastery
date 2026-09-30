"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { MasteryQuestion } from "@/types/questions";

/** Matches a workbook "Topic" value (e.g. "Cell Biology") to a site topic slug ("cell-biology"). */
export function slugifyTopic(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TOPIC_SLUGS: Record<string, Record<string, string>> = {
  biology: {
    "cell biology": "cell-biology",
    organisation: "organisation",
    infection: "infection-and-response",
    bioenergetics: "bioenergetics",
    homeostasis: "homeostasis-and-response",
    inheritance: "inheritance-variation-and-evolution",
    ecology: "ecology",
  },
  chemistry: {
    "atomic structure": "atomic-structure-and-the-periodic-table",
    "bonding and structure": "bonding-structure-and-properties-of-matter",
    "quantitative chemistry": "quantitative-chemistry",
    "chemical changes": "chemical-changes",
    "energy changes": "energy-changes",
    "rates and equilibrium": "rate-and-extent-of-chemical-change",
    "organic chemistry": "organic-chemistry",
    "chemical analysis": "chemical-analysis",
    atmosphere: "chemistry-of-the-atmosphere",
    "using resources": "using-resources",
  },
  physics: {
    energy: "energy",
    electricity: "electricity",
    "particle model": "particle-model-of-matter",
    "atomic structure": "atomic-structure",
    forces: "forces",
    waves: "waves",
    magnetism: "magnetism-and-electromagnetism",
    "space physics": "space-physics",
  },
};

interface QuestionsTableRow {
  question_id: string;
  subject: string;
  unit: string;
  topic: string;
  subtopic: string;
  specification_reference: string;
  question: string;
  model_answer: string;
  marks: number;
  assessment_objective: string;
  tier: string;
  grade: string;
  key_terms: string;
  image_file: string;
  question_type: string;
}

const SUBJECTS = ["biology", "chemistry", "physics"] as const;

export function topicSlugFor(subject: string, topic: string): string {
  return TOPIC_SLUGS[subject.trim().toLowerCase()]?.[topic.trim().toLowerCase()] ?? slugifyTopic(topic);
}

function toMasteryQuestion(row: QuestionsTableRow): MasteryQuestion | null {
  const subject = row.subject.trim().toLowerCase();
  if (!SUBJECTS.includes(subject as (typeof SUBJECTS)[number])) return null;

  return {
    id: row.question_id,
    subject: subject as MasteryQuestion["subject"],
    topicSlug: topicSlugFor(subject, row.topic),
    topic: row.topic,
    subtopic: row.subtopic,
    question: row.question,
    marks: row.marks,
    assessmentObjective: row.assessment_objective as MasteryQuestion["assessmentObjective"],
    tier: row.tier as MasteryQuestion["tier"],
    difficulty: row.tier as MasteryQuestion["difficulty"],
    specificationReference: row.specification_reference,
    modelAnswer: row.model_answer,
    // The flashcard splits marking points on line breaks, so one multi-line string works directly.
    markingPoints: [row.model_answer],
    gradeDemand: row.grade,
    hintKeywords: row.key_terms
      ? row.key_terms.split(/[;,]/).map((term) => term.trim()).filter(Boolean)
      : undefined,
    databaseId: row.question_id,
  };
}

export interface LoadPublishedQuestionsResult {
  questions: MasteryQuestion[];
  error: string | null;
}

/** Loads every published question for the given subjects from Supabase (student-facing, read-only). */
export async function loadPublishedQuestions(subjects: string[]): Promise<LoadPublishedQuestionsResult> {
  const supabase = getSupabaseBrowserClient();
  const wanted = subjects.map((subject) => subject.toLowerCase());

  const pageSize = 1000;
  const rows: QuestionsTableRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("questions")
      .select(
        "question_id, subject, unit, topic, subtopic, specification_reference, question, model_answer, marks, assessment_objective, tier, grade, key_terms, image_file, question_type",
      )
      .eq("is_published", true)
      .in("subject", [...new Set([...wanted, ...wanted.map((s) => s.charAt(0).toUpperCase() + s.slice(1))])])
      .range(from, from + pageSize - 1);

    if (error) return { questions: [], error: "Published questions could not be loaded. Please try again in a moment." };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  const questions = rows.map(toMasteryQuestion).filter((question): question is MasteryQuestion => question !== null);
  return { questions, error: null };
}
