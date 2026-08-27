import type { MasteryQuestion } from "@/types/questions";
import { validateQuestionWorkbook, type WorkbookRelationship, type ValidationIssue } from "@/lib/contentValidation";

export type ContentImport = {
  id: string;
  subject: "biology" | "chemistry" | "physics";
  version: string;
  questions: MasteryQuestion[];
  relationships: WorkbookRelationship[];
  issues: ValidationIssue[];
  publishedAt?: string;
};

export interface ContentImportStore {
  list(): ContentImport[];
  save(contentImport: ContentImport): void;
}

const STORAGE_KEY = "sciencemastery_content_imports_v1";

export class LocalContentImportStore implements ContentImportStore {
  list(): ContentImport[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  save(contentImport: ContentImport) {
    try {
      const imports = this.list().filter((item) => item.id !== contentImport.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...imports, contentImport]));
    } catch {
      /* localStorage unavailable */
    }
  }
}

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

export function publishContentImport(contentImport: ContentImport, store: ContentImportStore = new LocalContentImportStore()): ContentImport {
  if (contentImport.issues.length > 0) throw new Error("Cannot publish content with validation errors");
  const published = { ...contentImport, publishedAt: new Date().toISOString() };
  store.save(published);
  return published;
}

export function rollbackContentImport(subject: ContentImport["subject"], version: string, store: ContentImportStore = new LocalContentImportStore()): ContentImport | undefined {
  return store.list().find((item) => item.subject === subject && item.version === version && Boolean(item.publishedAt));
}
