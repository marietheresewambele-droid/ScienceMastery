import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { summariseTopics, topicDatabaseId, type WorkbookQuestionRow } from "@/lib/brainsomaWorkbook";

const CHUNK = 500;

export interface PublishSummary {
  questions: number;
  created: number;
  updated: number;
  activeNew: boolean;
  subtopics: number;
  topics: string[];
}

/**
 * Writes validated workbook rows into subjects -> topics -> subtopics -> question_catalog.
 * Topics are seeded by the migration; subtopics are created on demand. Existing questions
 * keep their active/retired state; new questions are active only when `activateNew` is set.
 */
export async function publishWorkbookRows(admin: SupabaseClient, rows: WorkbookQuestionRow[], activateNew: boolean): Promise<PublishSummary> {
  const topicSummaries = summariseTopics(rows);
  const topicIds = topicSummaries.map((topic) => topicDatabaseId(topic.subject, topic.topicNumber));

  const { data: topics, error: topicsError } = await admin.from("topics").select("id").in("id", topicIds);
  if (topicsError) throw topicsError;
  const missingTopics = topicIds.filter((id) => !(topics ?? []).some((topic) => topic.id === id));
  if (missingTopics.length) throw new Error(`These topics are missing from public.topics: ${missingTopics.join(", ")}. Apply the question hierarchy migration first.`);

  const subtopicRows = topicSummaries.flatMap((topic) =>
    topic.subtopics.map((subtopic) => ({ topic_id: topicDatabaseId(topic.subject, topic.topicNumber), name: subtopic.name, sort_order: subtopic.order })),
  );
  const { data: savedSubtopics, error: subtopicError } = await admin
    .from("subtopics")
    .upsert(subtopicRows, { onConflict: "topic_id,name" })
    .select("id,topic_id,name");
  if (subtopicError) throw subtopicError;
  const subtopicId = new Map((savedSubtopics ?? []).map((subtopic) => [`${subtopic.topic_id}|${subtopic.name}`, subtopic.id as string]));

  const existing = new Map<string, boolean>();
  for (let start = 0; start < rows.length; start += CHUNK) {
    const ids = rows.slice(start, start + CHUNK).map((row) => row.questionId);
    const { data, error } = await admin.from("question_catalog").select("id,active").in("id", ids);
    if (error) throw error;
    for (const row of data ?? []) existing.set(row.id, row.active);
  }

  const catalogRows = rows.map((row) => {
    const key = `${topicDatabaseId(row.subject, row.topicNumber)}|${row.subtopic}`;
    const subtopic = subtopicId.get(key);
    if (!subtopic) throw new Error(`Subtopic was not saved: ${key}`);
    return {
      id: row.questionId,
      legacy_id: row.legacyId || null,
      subtopic_id: subtopic,
      specification_reference: row.specificationReference || null,
      question: row.question,
      model_answer: row.modelAnswer,
      marks: row.marks,
      assessment_objective: row.assessmentObjective,
      qualification: row.qualification,
      tier: row.tier,
      grade: row.grade || null,
      question_type: row.questionType || null,
      key_terms: row.keyTerms,
      source_notes: row.sourceNotes || null,
      sort_order: row.sortOrder,
      active: existing.get(row.questionId) ?? activateNew,
    };
  });

  for (let start = 0; start < catalogRows.length; start += CHUNK) {
    const { error } = await admin.from("question_catalog").upsert(catalogRows.slice(start, start + CHUNK), { onConflict: "id" });
    if (error) throw error;
  }

  const updated = catalogRows.filter((row) => existing.has(row.id)).length;
  return {
    questions: catalogRows.length,
    created: catalogRows.length - updated,
    updated,
    activeNew: activateNew,
    subtopics: subtopicRows.length,
    topics: topicIds,
  };
}

const QUALIFICATIONS = ["Combined and Separate Science", "Separate Science only"];
const TIERS = ["Foundation and Higher", "Foundation only", "Higher only"];
const QUESTION_ID = /^(BIO|CHEM|PHYS)-T(\d{2})-Q\d{3,}$/;

/** Form payload used by the Manage Questions editor. */
export interface QuestionInput {
  id: string;
  subtopic: string;
  question: string;
  modelAnswer: string;
  marks: number;
  assessmentObjective: string;
  qualification: string;
  tier: string;
  grade: string;
  questionType: string;
  keyTerms: string[];
  specificationReference: string;
  legacyId: string;
  sourceNotes: string;
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function parseQuestionInput(raw: unknown): { input: QuestionInput } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Question data is required." };
  const value = raw as Record<string, unknown>;
  const input: QuestionInput = {
    id: str(value.id),
    subtopic: str(value.subtopic).replace(/\s+/g, " "),
    question: str(value.question),
    modelAnswer: str(value.modelAnswer),
    marks: Number(value.marks),
    assessmentObjective: str(value.assessmentObjective),
    qualification: str(value.qualification),
    tier: str(value.tier),
    grade: str(value.grade),
    questionType: str(value.questionType),
    keyTerms: Array.isArray(value.keyTerms) ? [...new Set(value.keyTerms.map(str).filter(Boolean))] : [],
    specificationReference: str(value.specificationReference),
    legacyId: str(value.legacyId),
    sourceNotes: str(value.sourceNotes),
  };
  if (!QUESTION_ID.test(input.id)) return { error: "Question ID must look like CHEM-T01-Q001." };
  for (const [label, field] of [["Subtopic", input.subtopic], ["Question", input.question], ["Model answer", input.modelAnswer]] as const) {
    if (!field) return { error: `${label} is required.` };
  }
  if (!Number.isInteger(input.marks) || input.marks < 1 || input.marks > 6) return { error: "Marks must be a whole number from 1 to 6." };
  if (!["AO1", "AO2", "AO3"].includes(input.assessmentObjective)) return { error: "Assessment objective must be AO1, AO2 or AO3." };
  if (!QUALIFICATIONS.includes(input.qualification)) return { error: "Choose a valid qualification." };
  if (!TIERS.includes(input.tier)) return { error: "Choose a valid tier." };
  return { input };
}

/** CHEM-T05-Q060 -> CHEM-T05: the topic is part of the stable question ID. */
export const topicIdFromQuestionId = (questionId: string) => questionId.split("-").slice(0, 2).join("-");

/** Finds or creates the named subtopic in a topic (new subtopics go last). */
export async function resolveSubtopicId(admin: SupabaseClient, topicId: string, name: string): Promise<string> {
  const { data: found, error } = await admin.from("subtopics").select("id").eq("topic_id", topicId).eq("name", name).maybeSingle();
  if (error) throw error;
  if (found) return found.id;
  const { data: last, error: lastError } = await admin.from("subtopics").select("sort_order").eq("topic_id", topicId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (lastError) throw lastError;
  const { data: created, error: createError } = await admin
    .from("subtopics")
    .insert({ topic_id: topicId, name, sort_order: (last?.sort_order ?? 0) + 1 })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

export function catalogColumns(input: QuestionInput) {
  return {
    legacy_id: input.legacyId || null,
    specification_reference: input.specificationReference || null,
    question: input.question,
    model_answer: input.modelAnswer,
    marks: input.marks,
    assessment_objective: input.assessmentObjective,
    qualification: input.qualification,
    tier: input.tier,
    grade: input.grade || null,
    question_type: input.questionType || null,
    key_terms: input.keyTerms,
    source_notes: input.sourceNotes || null,
  };
}
