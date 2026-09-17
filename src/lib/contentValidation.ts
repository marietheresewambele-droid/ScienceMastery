import type { MasteryQuestion } from "@/types/questions";

export type WorkbookRelationship = { sourceId?: string; relationship?: string; targetId?: string };
export type ValidationIssue = { code: string; message: string; row?: number; id?: string; severity: "error" | "warning" };

export function validateQuestionWorkbook(questions: MasteryQuestion[], relationships: WorkbookRelationship[] = []): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  // Raw question ids are only unique within a topic (e.g. "CD10" legitimately appears in
  // multiple topic sheets of the same workbook) - dedupe on subject+topic+id, not id alone.
  const topicScopedIds = new Set<string>();
  const allowedRelationships = new Set(["Prerequisite", "Diagnostic", "Remediation", "Easier", "Parallel", "Harder", "Retrieval", "Cross-topic"]);
  for (const [index, question] of questions.entries()) {
    const dedupeKey = `${question.subject}:${question.topicSlug}:${question.id}`;
    if (topicScopedIds.has(dedupeKey)) issues.push({ code: "DUPLICATE_ID", message: `Duplicate Question ID: ${question.id}`, row: index + 1, id: question.id, severity: "error" });
    topicScopedIds.add(dedupeKey);
    ids.add(question.id);
    if (!question.question?.trim()) issues.push({ code: "MISSING_QUESTION", message: "Question text is missing", row: index + 1, id: question.id, severity: "error" });
    if (!question.modelAnswer?.trim() && question.markingPoints.length === 0) issues.push({ code: "MISSING_ANSWER", message: "Model answer or marking points are required", row: index + 1, id: question.id, severity: "error" });
    // Marking points may be written one-per-mark or as compact prose (e.g. a single sentence
    // covering a 4-mark recall list) - only flag more listed points than available marks, since
    // that's the actual authoring error; fewer points than marks is a legitimate, common style.
    // Not database-enforced (marking_points has no CHECK against marks), so this is advisory -
    // worth an editorial look, but shouldn't block publishing the rest of a batch.
    if (question.markingPoints.length > question.marks) issues.push({ code: "MARK_MISMATCH", message: `More marking points than marks for ${question.id}`, row: index + 1, id: question.id, severity: "warning" });
    if (!/^AO[123](\/AO[123])*$/.test(question.assessmentObjective)) issues.push({ code: "INVALID_AO", message: `Invalid assessment objective for ${question.id}`, row: index + 1, id: question.id, severity: "error" });
    if (question.hints && question.hints.length !== 2) issues.push({ code: "INVALID_HINTS", message: `Exactly two hints are required for ${question.id}`, row: index + 1, id: question.id, severity: "error" });
  }
  for (const [index, relationship] of relationships.entries()) {
    if (!relationship.sourceId || !ids.has(relationship.sourceId) || !relationship.targetId || !ids.has(relationship.targetId)) issues.push({ code: "BROKEN_RELATIONSHIP", message: "Relationship source and target must reference existing questions", row: index + 1, severity: "error" });
    if (relationship.relationship && !allowedRelationships.has(relationship.relationship)) issues.push({ code: "INVALID_RELATIONSHIP", message: `Unsupported relationship: ${relationship.relationship}`, row: index + 1, severity: "error" });
  }
  return issues;
}

export const hasBlockingIssues = (issues: ValidationIssue[]) => issues.some((issue) => issue.severity === "error");