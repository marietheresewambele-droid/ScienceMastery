import "server-only";
import * as XLSX from "xlsx";
import type { MasteryQuestion } from "@/types/questions";
import type { WorkbookRelationship } from "@/lib/contentValidation";

/**
 * Parses the "Mastery Audit" / "Adaptive Ready" workbook format (one sheet
 * per topic, ID/Question family/Self-contained mastery question columns,
 * optionally an "Adaptive Question Map" sheet for relationships) into
 * MasteryQuestion rows. Mirrors scripts/import-adaptive-workbooks.mjs,
 * adapted to read an in-memory buffer instead of a file on disk, and to
 * tolerate a missing Adaptive Question Map sheet rather than requiring one.
 */

export type AdaptiveWorkbookSubject = "biology" | "physics";

const SUBJECT_PREFIX: Record<AdaptiveWorkbookSubject, string> = { biology: "BIO", physics: "PHY" };

export const ADAPTIVE_WORKBOOK_TOPICS: Record<AdaptiveWorkbookSubject, [sheet: string, topicSlug: string][]> = {
  biology: [
    ["Topic 1 - Cell Biology", "cell-biology"],
    ["Topic 2 - Organisation", "organisation"],
    ["Topic 3 - Infection", "infection-and-response"],
    ["Topic 4 - Bioenergetics", "bioenergetics"],
    ["Topic 5 - Homeostasis", "homeostasis-and-response"],
    ["Topic 6 - Inheritance", "inheritance-variation-and-evolution"],
    ["Topic 7 - Ecology", "ecology"],
  ],
  physics: [
    ["Topic 1 - Energy", "energy"],
    ["Topic 2 - Electricity", "electricity"],
    ["Topic 3 - Particle Model", "particle-model-of-matter"],
    ["Topic 4 - Atomic Structure", "atomic-structure"],
    ["Topic 5 - Forces", "forces"],
    ["Topic 6 - Waves", "waves"],
    ["Topic 7 - Magnetism", "magnetism-and-electromagnetism"],
    ["Topic 8 - Space Physics", "space-physics"],
  ],
};

const RELATIONSHIP_COLUMNS: Record<"prerequisite" | "diagnostic" | "easier" | "parallel" | "harder", string> = {
  prerequisite: "Prerequisite ID",
  diagnostic: "Diagnostic ID",
  easier: "Easier ID",
  parallel: "Parallel ID",
  harder: "Harder ID",
};

const RELATIONSHIP_LABELS: Record<keyof typeof RELATIONSHIP_COLUMNS, string> = {
  prerequisite: "Prerequisite",
  diagnostic: "Diagnostic",
  easier: "Easier",
  parallel: "Parallel",
  harder: "Harder",
};

const text = (value: unknown) => String(value ?? "").trim();
const splitPoints = (value: unknown) => text(value).split(/\r?\n+/).map((point) => point.trim()).filter(Boolean);
// The workbook sometimes writes "AO1 / AO2 / AO3" with spaces; the validator expects "AO1/AO2/AO3".
const normalizeAO = (value: string) => value.replace(/\s+/g, "");

export type ParsedTopic = {
  sheet: string;
  topicSlug: string;
  questions: MasteryQuestion[];
};

export type AdaptiveWorkbookParseResult = {
  topics: ParsedTopic[];
  missingSheets: string[];
  hasRelationshipMap: boolean;
  questions: MasteryQuestion[];
  relationships: WorkbookRelationship[];
};

export function parseAdaptiveWorkbook(buffer: ArrayBuffer | Buffer, subject: AdaptiveWorkbookSubject): AdaptiveWorkbookParseResult {
  const workbook = XLSX.read(buffer, { cellDates: false, type: "buffer" });
  const prefix = SUBJECT_PREFIX[subject];

  const mapSheet = workbook.Sheets["Adaptive Question Map"];
  const mapRows = mapSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(mapSheet, { defval: "" }) : [];
  const relationshipMap = new Map(mapRows.map((row) => [text(row["Source ID"]), row]));

  const topics: ParsedTopic[] = [];
  const missingSheets: string[] = [];
  const relationships: WorkbookRelationship[] = [];

  for (const [sheetName, topicSlug] of ADAPTIVE_WORKBOOK_TOPICS[subject]) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet["!ref"]) {
      missingSheets.push(sheetName);
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", range: 3 });
    const questions: MasteryQuestion[] = rows
      .filter((row) => text(row.ID) && text(row.Question || row["Self-contained mastery question"]))
      .map((row) => {
        const id = text(row.ID);
        const adaptive = relationshipMap.get(id);
        const answer = text(row["Model answer / creditworthy marking points"]) || text(row["Model answer / marking points"]);
        const assessmentObjective = normalizeAO(text(row["Assessment objective"]) || text(row.AO) || text(adaptive?.AO) || "AO1");

        if (adaptive) {
          for (const [type, column] of Object.entries(RELATIONSHIP_COLUMNS) as [keyof typeof RELATIONSHIP_COLUMNS, string][]) {
            const targetRaw = text(adaptive[column]);
            if (!targetRaw) continue;
            // Strip an already-applied subject prefix (e.g. "BIO-CS02") so this matches the raw
            // question id the validator checks relationships against.
            const targetId = targetRaw.startsWith(`${prefix}-`) ? targetRaw.slice(prefix.length + 1) : targetRaw;
            relationships.push({ sourceId: id, relationship: RELATIONSHIP_LABELS[type], targetId });
          }
        }

        const parsed: MasteryQuestion = {
          id,
          subject,
          topicSlug,
          questionFamily: text(row["Question family"]) || text(adaptive?.["Family label"]),
          subtopic: text(row.Subtopic) || text(adaptive?.Subtopic) || sheetName,
          // Real workbook tier text is freer than the "Foundation" | "Higher" | "Both" the type
          // declares (e.g. "Biology only", "Higher / Biology Only") - stored as-is since
          // question_catalog.tier has no matching CHECK constraint and guessing a canonical
          // mapping risks losing the author's actual meaning.
          tier: (text(row.Tier) || text(row["Tier / content"]) || text(adaptive?.Tier) || undefined) as MasteryQuestion["tier"],
          question: text(row["Self-contained mastery question"]) || text(row.Question),
          marks: Number(row.Marks) || 1,
          modelAnswer: answer,
          markingPoints: splitPoints(answer),
          commandWord: text(row["Command word"]) || text(adaptive?.["Command word"]) || undefined,
          assessmentObjective: assessmentObjective as MasteryQuestion["assessmentObjective"],
          specificationReference: text(row["AQA specification reference"]) || undefined,
          gradeDemand: text(row["Approximate grade demand"]) || undefined,
          databaseId: `${prefix}-${topicSlug}-${id}`,
        };
        return parsed;
      })
      .filter((question) => question.modelAnswer);

    if (questions.length) topics.push({ sheet: sheetName, topicSlug, questions });
  }

  return {
    topics,
    missingSheets,
    hasRelationshipMap: Boolean(mapSheet),
    questions: topics.flatMap((topic) => topic.questions),
    relationships,
  };
}
