"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useCourses, type Course, type CoursePathway, type CourseTier } from "@/lib/courses";
import type { MasteryQuestion, Qualification, Subject, SubtopicSummary, WorkbookTier } from "@/types/questions";

/** One row of the public.question_bank view (subjects -> topics -> subtopics -> questions). */
type QuestionBankRow = {
  id: string;
  legacy_id: string | null;
  subject: Subject;
  topic_number: number;
  topic: string;
  topic_slug: string;
  subtopic: string;
  subtopic_order: number;
  specification_reference: string | null;
  question: string;
  model_answer: string;
  marks: number;
  assessment_objective: "AO1" | "AO2" | "AO3";
  qualification: Qualification;
  tier: WorkbookTier;
  grade: string | null;
  question_type: string | null;
  key_terms: string[] | null;
  sort_order: number;
};

const COLUMNS = "id,legacy_id,subject,topic_number,topic,topic_slug,subtopic,subtopic_order,specification_reference,question,model_answer,marks,assessment_objective,qualification,tier,grade,question_type,key_terms,sort_order";
const PAGE_SIZE = 1000;

const TIERS: Record<WorkbookTier, NonNullable<MasteryQuestion["tier"]>> = {
  "Foundation and Higher": "Both",
  "Foundation only": "Foundation",
  "Higher only": "Higher",
};

function toQuestion(row: QuestionBankRow): MasteryQuestion {
  return {
    id: row.id,
    legacyId: row.legacy_id || undefined,
    subject: row.subject,
    topicSlug: row.topic_slug,
    topic: row.topic,
    topicNumber: row.topic_number,
    subtopic: row.subtopic,
    subtopicOrder: row.subtopic_order,
    sortOrder: row.sort_order,
    question: row.question,
    questionType: row.question_type || undefined,
    commandWord: row.question_type || undefined,
    marks: row.marks,
    assessmentObjective: row.assessment_objective,
    specificationReference: row.specification_reference || undefined,
    modelAnswer: row.model_answer,
    markingPoints: row.model_answer.split(/\n+/).map((point) => point.trim()).filter(Boolean),
    tier: TIERS[row.tier],
    qualification: row.qualification,
    gradeDemand: row.grade || undefined,
    keyTerms: row.key_terms?.length ? row.key_terms : undefined,
  };
}

const aoRank = (ao: string) => (ao.includes("AO1") ? 1 : ao.includes("AO2") ? 2 : 3);

/**
 * Study order: topic, then numbered subtopic (1.1, 1.2, ...), then AO1 -> AO2 -> AO3 within each
 * subtopic so recall comes before analysis, then the workbook row order.
 */
export function compareQuestions(left: MasteryQuestion, right: MasteryQuestion) {
  return (left.topicNumber ?? 0) - (right.topicNumber ?? 0)
    || (left.subtopicOrder ?? 0) - (right.subtopicOrder ?? 0)
    || aoRank(left.assessmentObjective) - aoRank(right.assessmentObjective)
    || (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
    || left.id.localeCompare(right.id);
}

/** Subtopics that have at least one active question, in their database order. */
export function subtopicsFor(questions: MasteryQuestion[]): SubtopicSummary[] {
  const byTitle = new Map<string, SubtopicSummary>();
  for (const question of questions) {
    const existing = byTitle.get(question.subtopic);
    if (existing) existing.questionCount += 1;
    else byTitle.set(question.subtopic, { id: question.subtopic, title: question.subtopic, order: question.subtopicOrder ?? 0, questionCount: 1 });
  }
  return [...byTitle.values()].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
}

let cache: Promise<MasteryQuestion[]> | null = null;

async function fetchQuestionBank(): Promise<MasteryQuestion[]> {
  const client = getSupabaseBrowserClient();
  const rows: QuestionBankRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("question_bank")
      .select(COLUMNS)
      .eq("active", true)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as QuestionBankRow[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows.map(toQuestion).sort(compareQuestions);
}

/** Every active question, loaded once per page session and shared by all components. */
export function loadQuestionBank(): Promise<MasteryQuestion[]> {
  if (!cache) {
    cache = fetchQuestionBank().catch((error) => {
      cache = null; // let the next caller retry
      throw error;
    });
  }
  return cache;
}

/** Same rules as the admin matrix: Separate-only hides from Combined, Higher-only hides from Foundation. */
export function visibleForCourse(question: MasteryQuestion, pathway: CoursePathway, tier: CourseTier): boolean {
  if (question.qualification === "Separate Science only" && pathway === "combined") return false;
  if (question.tier === "Higher" && tier === "Foundation") return false;
  return true;
}

/**
 * Narrows a deck to the student's saved courses. A subject with no saved course is left whole, and a
 * subject with several saved courses shows anything visible to at least one of them.
 */
export function filterForCourses(questions: MasteryQuestion[], courses: Pick<Course, "subject" | "pathway" | "tier">[]): MasteryQuestion[] {
  if (!courses.length) return questions;
  return questions.filter((question) => {
    const mine = courses.filter((course) => course.subject === question.subject);
    return !mine.length || mine.some((course) => visibleForCourse(question, course.pathway, course.tier));
  });
}

/**
 * The published question bank. By default it is filtered to the student's saved courses; pass
 * `unfiltered` to get every question (used to show counts for a course before it is saved).
 */
export function useQuestionBank({ unfiltered = false }: { unfiltered?: boolean } = {}): { questions: MasteryQuestion[] | null; error: string } {
  const [state, setState] = useState<{ questions: MasteryQuestion[] | null; error: string }>({ questions: null, error: "" });
  const { courses, ready } = useCourses();
  useEffect(() => {
    let cancelled = false;
    loadQuestionBank().then(
      (questions) => { if (!cancelled) setState({ questions, error: "" }); },
      (error: unknown) => {
        if (!cancelled) setState({ questions: null, error: error instanceof Error ? error.message : "The question bank could not be loaded." });
      },
    );
    return () => { cancelled = true; };
  }, []);
  const questions = useMemo(
    () => (state.questions && (unfiltered || ready) ? (unfiltered ? state.questions : filterForCourses(state.questions, courses)) : null),
    [state.questions, courses, ready, unfiltered],
  );
  return { questions, error: state.error };
}
