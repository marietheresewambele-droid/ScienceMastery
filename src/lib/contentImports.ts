import type { MasteryQuestion } from "@/types/questions";
import { validateQuestionWorkbook, type WorkbookRelationship, type ValidationIssue } from "@/lib/contentValidation";

export type ContentImport = {
  id: string;
  subject: "biology" | "chemistry" | "physics";
  version: string;
  questions: MasteryQuestion[];
  relationships: WorkbookRelationship[];
  issues: ValidationIssue[];
};

export function prepareContentImport(
  subject: ContentImport["subject"],
  version: string,
  questions: MasteryQuestion[],
  relationships: WorkbookRelationship[] = [],
): ContentImport {
  return {
    id: `${subject}:${version}`,
    subject,
    version,
    questions,
    relationships,
    issues: validateQuestionWorkbook(questions, relationships),
  };
}
