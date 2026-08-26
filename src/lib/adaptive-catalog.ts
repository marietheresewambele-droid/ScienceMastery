import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { MasteryQuestion } from "@/types/questions";

type CatalogRow = {
  id: string;
  subject: MasteryQuestion["subject"];
  topic_slug: string;
  topic: string | null;
  subtopic: string;
  question: string;
  model_answer: string;
  marking_points: string[];
  marks: number;
  assessment_objective: MasteryQuestion["assessmentObjective"];
  command_word: string | null;
  tier: MasteryQuestion["tier"] | null;
  grade_demand: string | null;
  specification_reference: string | null;
  family_id: string;
};

// Supabase's fluent query builder changes type after each filter; this boundary is kept internal.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function paged<T>(table: string, select: string, filters?: (query: any) => any): Promise<T[]> {
  const client = getSupabaseBrowserClient();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    let query = client.from(table).select(select).range(from, from + 999);
    if (filters) query = filters(query);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data || []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function loadAdaptiveCatalog(subjects: string[]): Promise<MasteryQuestion[]> {
  const [catalog, hints, relationships] = await Promise.all([
    paged<CatalogRow>("question_catalog", "id,subject,topic_slug,topic,subtopic,question,model_answer,marking_points,marks,assessment_objective,command_word,tier,grade_demand,specification_reference,family_id", (query) => query.in("subject", subjects).eq("active", true)),
    paged<{ question_id: string; level: number; hint: string }>("question_hints", "question_id,level,hint"),
    paged<{ source_question_id: string; relationship_type: "prerequisite" | "diagnostic" | "easier" | "parallel" | "harder"; target_question_id: string }>("question_relationships", "source_question_id,relationship_type,target_question_id"),
  ]);
  const hintMap = new Map<string, string[]>();
  for (const row of hints) {
    const values = hintMap.get(row.question_id) || [];
    values[row.level - 1] = row.hint;
    hintMap.set(row.question_id, values);
  }
  const relationshipMap = new Map<string, MasteryQuestion["adaptiveRelationships"]>();
  for (const row of relationships) {
    const values = relationshipMap.get(row.source_question_id) || {};
    if (!values[row.relationship_type]) values[row.relationship_type] = row.target_question_id;
    relationshipMap.set(row.source_question_id, values);
  }
  return catalog.map((row) => {
    const prefix = row.subject === "biology" ? "BIO" : row.subject === "chemistry" ? "CHE" : "PHY";
    const rawId = row.id.replace(`${prefix}-${row.topic_slug}-`, "");
    const approvedHints = hintMap.get(row.id);
    return {
      id: rawId,
      databaseId: row.id,
      subject: row.subject,
      topicSlug: row.topic_slug,
      topic: row.topic || undefined,
      subtopic: row.subtopic,
      question: row.question,
      modelAnswer: row.model_answer,
      markingPoints: row.marking_points,
      marks: row.marks,
      assessmentObjective: row.assessment_objective,
      commandWord: row.command_word || undefined,
      tier: row.tier || undefined,
      gradeDemand: row.grade_demand || undefined,
      specificationReference: row.specification_reference || undefined,
      questionFamily: row.family_id,
      adaptiveHints: approvedHints?.length === 3 ? approvedHints as [string, string, string] : undefined,
      adaptiveRelationships: relationshipMap.get(row.id),
    };
  });
}
