import type { MasteryQuestion } from "@/types/questions";

export type WorkbookRelationship = { sourceId?: string; relationship?: string; targetId?: string };
export type ValidationIssue = { code: string; message: string; row?: number; id?: string };

export function validateQuestionWorkbook(questions: MasteryQuestion[], relationships: WorkbookRelationship[] = []): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const allowedRelationships = new Set(["Prerequisite", "Diagnostic", "Remediation", "Easier", "Parallel", "Harder", "Retrieval", "Cross-topic"]);
  for (const [index, question] of questions.entries()) {
    if (ids.has(question.id)) issues.push({ code: "DUPLICATE_ID", message: `Duplicate Question ID: ${question.id}`, row: index + 1, id: question.id });
    ids.add(question.id);
    if (!question.question?.trim()) issues.push({ code: "MISSING_QUESTION", message: "Question text is missing", row: index + 1, id: question.id });
    if (!question.modelAnswer?.trim() && question.markingPoints.length === 0) issues.push({ code: "MISSING_ANSWER", message: "Model answer or marking points are required", row: index + 1, id: question.id });
    if (question.marks !== question.markingPoints.length && question.markingPoints.length > 0) issues.push({ code: "MARK_MISMATCH", message: `Marks do not match marking points for ${question.id}`, row: index + 1, id: question.id });
    if (!/^AO[123](\/AO[123])*$/.test(question.assessmentObjective)) issues.push({ code: "INVALID_AO", message: `Invalid assessment objective for ${question.id}`, row: index + 1, id: question.id });
    if (question.hints && question.hints.length !== 3) issues.push({ code: "INVALID_HINTS", message: `Exactly three hints are required for ${question.id}`, row: index + 1, id: question.id });
  }
  for (const [index, relationship] of relationships.entries()) {
    if (!relationship.sourceId || !ids.has(relationship.sourceId) || !relationship.targetId || !ids.has(relationship.targetId)) issues.push({ code: "BROKEN_RELATIONSHIP", message: "Relationship source and target must reference existing questions", row: index + 1 });
    if (relationship.relationship && !allowedRelationships.has(relationship.relationship)) issues.push({ code: "INVALID_RELATIONSHIP", message: `Unsupported relationship: ${relationship.relationship}`, row: index + 1 });
  }
  return issues;
}