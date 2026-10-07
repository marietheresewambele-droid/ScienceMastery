import "server-only";
import * as XLSX from "xlsx";
import type { Qualification, Subject, WorkbookTier } from "@/types/questions";

/**
 * Parser for the BrainSoma standard question workbook: a "Guide" sheet plus one sheet per
 * topic ("T1 Atomic Structure", …). Each topic sheet has a title block, then a header row
 * starting with "Question ID". Nothing here touches Supabase.
 */

export const SUBJECT_CODES: Record<Subject, "BIO" | "CHEM" | "PHYS"> = { biology: "BIO", chemistry: "CHEM", physics: "PHYS" };

/** Topic numbers (workbook "Unit" T1, T2, …) that exist per subject. Mirrors public.topics. */
export const TOPIC_COUNTS: Record<Subject, number> = { biology: 7, chemistry: 10, physics: 8 };

const COLUMNS = {
  questionId: "Question ID",
  legacyId: "Legacy ID",
  subject: "Subject",
  unit: "Unit",
  topic: "Topic",
  subtopic: "Subtopic",
  specificationReference: "Specification Reference",
  question: "Question",
  modelAnswer: "Model Answer",
  marks: "Marks",
  assessmentObjective: "Assessment Objective",
  qualification: "Qualification",
  tier: "Tier",
  grade: "Grade",
  questionType: "Question Type",
  keyTerms: "Key Terms",
  sourceNotes: "Source / Notes",
} as const;
type Column = keyof typeof COLUMNS;

const OPTIONAL_COLUMNS: Column[] = ["legacyId", "sourceNotes"];
export const REQUIRED_HEADERS = (Object.keys(COLUMNS) as Column[]).filter((key) => !OPTIONAL_COLUMNS.includes(key)).map((key) => COLUMNS[key]);

const QUALIFICATIONS: Qualification[] = ["Combined and Separate Science", "Separate Science only"];
const TIERS: WorkbookTier[] = ["Foundation and Higher", "Foundation only", "Higher only"];
const OBJECTIVES = ["AO1", "AO2", "AO3"] as const;
const ID_PATTERN = /^(BIO|CHEM|PHYS)-T(\d{2})-Q(\d{3,})$/;
const NUMBERED_SUBTOPIC = /^(\d+)\.(\d+)\s/;
const IGNORED_SHEETS = new Set(["guide"]);

export interface WorkbookQuestionRow {
  questionId: string;
  legacyId: string;
  subject: Subject;
  topicNumber: number;
  subtopic: string;
  specificationReference: string;
  question: string;
  modelAnswer: string;
  marks: number;
  assessmentObjective: (typeof OBJECTIVES)[number];
  qualification: Qualification;
  tier: WorkbookTier;
  grade: string;
  questionType: string;
  keyTerms: string[];
  sourceNotes: string;
  /** Position within its topic sheet, used to keep the workbook's question order. */
  sortOrder: number;
  sheet: string;
  row: number;
}

export interface WorkbookIssue {
  severity: "error" | "warning";
  sheet?: string;
  row?: number;
  questionId?: string;
  message: string;
}

export interface WorkbookTopicSummary {
  subject: Subject;
  topicNumber: number;
  sheet: string;
  questionCount: number;
  subtopics: { name: string; order: number; questionCount: number }[];
}

export interface WorkbookParseResult {
  rows: WorkbookQuestionRow[];
  issues: WorkbookIssue[];
  topics: WorkbookTopicSummary[];
}

const text = (value: unknown) => String(value ?? "").replace(/\r\n?/g, "\n").trim();
/** Header lookup ignores case and any bracketed hint such as "Marks (1–6)". */
const headerKey = (value: string) => value.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const matchOption = <T extends string>(value: string, options: readonly T[]) =>
  options.find((option) => option.toLowerCase() === value.replace(/\s+/g, " ").toLowerCase());

function subjectFromText(value: string): Subject | undefined {
  const key = value.trim().toLowerCase();
  return key === "biology" || key === "chemistry" || key === "physics" ? key : undefined;
}

/** "T3" / "t03" / "3" -> 3. */
function topicNumberFromUnit(value: string): number | undefined {
  const match = value.trim().match(/^T?(\d{1,2})$/i);
  return match ? Number(match[1]) : undefined;
}

export function splitKeyTerms(value: string): string[] {
  return [...new Set(value.split(";").map((term) => term.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

/** Numbered subtopics ("1.2 Cell Division") sort numerically; the rest keep first-appearance order after them. */
export function orderSubtopics(namesInSheetOrder: string[]): string[] {
  const unique = [...new Set(namesInSheetOrder)];
  const numbered = unique.filter((name) => NUMBERED_SUBTOPIC.test(name)).sort((left, right) => {
    const [, la, lb] = left.match(NUMBERED_SUBTOPIC)!;
    const [, ra, rb] = right.match(NUMBERED_SUBTOPIC)!;
    return Number(la) - Number(ra) || Number(lb) - Number(rb);
  });
  return [...numbered, ...unique.filter((name) => !NUMBERED_SUBTOPIC.test(name))];
}

export function parseBrainsomaWorkbook(buffer: Buffer | ArrayBuffer): WorkbookParseResult {
  const workbook = XLSX.read(buffer, { type: buffer instanceof ArrayBuffer ? "array" : "buffer" });
  const rows: WorkbookQuestionRow[] = [];
  const issues: WorkbookIssue[] = [];
  const seenIds = new Map<string, string>();

  for (const sheetName of workbook.SheetNames) {
    if (IGNORED_SHEETS.has(sheetName.trim().toLowerCase())) continue;
    const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false, blankrows: true });
    const headerIndex = grid.slice(0, 15).findIndex((cells) => cells.some((cell) => headerKey(text(cell)) === "question id"));
    if (headerIndex < 0) {
      issues.push({ severity: "warning", sheet: sheetName, message: 'Skipped: no header row with a "Question ID" column was found.' });
      continue;
    }

    const headerCells = grid[headerIndex].map((cell) => headerKey(text(cell)));
    const columnIndex = {} as Record<Column, number>;
    for (const key of Object.keys(COLUMNS) as Column[]) columnIndex[key] = headerCells.indexOf(headerKey(COLUMNS[key]));
    const missing = (Object.keys(COLUMNS) as Column[]).filter((key) => columnIndex[key] < 0 && !OPTIONAL_COLUMNS.includes(key));
    if (missing.length) {
      issues.push({ severity: "error", sheet: sheetName, message: `Missing column(s): ${missing.map((key) => COLUMNS[key]).join(", ")}.` });
      continue;
    }

    const sheetTopic = sheetName.match(/^T(\d{1,2})\b/i);
    let sortOrder = 0;

    grid.slice(headerIndex + 1).forEach((cells, offset) => {
      const rowNumber = headerIndex + offset + 2; // 1-based spreadsheet row
      const cell = (key: Column) => (columnIndex[key] >= 0 ? text(cells[columnIndex[key]]) : "");
      if (!cell("questionId") && !cell("question") && !cell("modelAnswer")) return;

      const questionId = cell("questionId");
      const fail = (message: string) => issues.push({ severity: "error", sheet: sheetName, row: rowNumber, questionId: questionId || undefined, message });
      const warn = (message: string) => issues.push({ severity: "warning", sheet: sheetName, row: rowNumber, questionId: questionId || undefined, message });
      const errorsBefore = issues.length;

      for (const key of ["questionId", "subject", "unit", "subtopic", "question", "modelAnswer", "marks", "assessmentObjective", "qualification", "tier"] as const) {
        if (!cell(key)) fail(`${COLUMNS[key]} is required.`);
      }

      if (/^[\d.,%\s]+$/.test(cell("question"))) {
        fail(`Question is only a number ("${cell("question")}"). This looks like a leftover total/percentage row; delete it from the sheet.`);
      }

      const subject = subjectFromText(cell("subject"));
      if (cell("subject") && !subject) fail(`Subject must be Biology, Chemistry or Physics (found "${cell("subject")}").`);

      const topicNumber = topicNumberFromUnit(cell("unit"));
      if (cell("unit") && !topicNumber) fail(`Unit must look like T1, T2… (found "${cell("unit")}").`);
      if (subject && topicNumber && (topicNumber < 1 || topicNumber > TOPIC_COUNTS[subject])) {
        fail(`${cell("subject")} has no topic T${topicNumber} (expected T1–T${TOPIC_COUNTS[subject]}).`);
      }
      if (topicNumber && sheetTopic && Number(sheetTopic[1]) !== topicNumber) {
        fail(`Unit T${topicNumber} does not match the sheet "${sheetName}".`);
      }

      if (questionId) {
        const idMatch = questionId.match(ID_PATTERN);
        if (!idMatch) fail(`Question ID must look like CHEM-T01-Q001 (found "${questionId}").`);
        else {
          if (subject && idMatch[1] !== SUBJECT_CODES[subject]) fail(`Question ID prefix ${idMatch[1]} does not match subject ${cell("subject")} (expected ${SUBJECT_CODES[subject]}).`);
          if (topicNumber && Number(idMatch[2]) !== topicNumber) fail(`Question ID topic T${idMatch[2]} does not match Unit T${topicNumber}.`);
        }
        const firstSeen = seenIds.get(questionId);
        if (firstSeen) fail(`Duplicate Question ID, already used at ${firstSeen}.`);
        else seenIds.set(questionId, `${sheetName} row ${rowNumber}`);
      }

      const marks = Number(cell("marks"));
      if (cell("marks") && (!Number.isInteger(marks) || marks < 1 || marks > 6)) fail(`Marks must be a whole number from 1 to 6 (found "${cell("marks")}").`);

      const assessmentObjective = matchOption(cell("assessmentObjective"), OBJECTIVES);
      if (cell("assessmentObjective") && !assessmentObjective) fail(`Assessment Objective must be AO1, AO2 or AO3 (found "${cell("assessmentObjective")}").`);

      const qualification = matchOption(cell("qualification"), QUALIFICATIONS);
      if (cell("qualification") && !qualification) fail(`Qualification must be "${QUALIFICATIONS.join('" or "')}" (found "${cell("qualification")}").`);

      const tier = matchOption(cell("tier"), TIERS);
      if (cell("tier") && !tier) fail(`Tier must be "${TIERS.join('", "')}" (found "${cell("tier")}").`);

      if (issues.length > errorsBefore) return;

      const modelAnswer = cell("modelAnswer").split("\n").map((line) => line.trimEnd()).join("\n");
      const keyTerms = splitKeyTerms(cell("keyTerms"));
      if (!cell("specificationReference")) warn("No Specification Reference.");
      if (!keyTerms.length) warn("No Key Terms: hints will fall back to automatically chosen words.");
      else {
        const lowerAnswer = modelAnswer.toLowerCase();
        const missingTerms = keyTerms.filter((term) => !lowerAnswer.includes(term.toLowerCase()));
        if (missingTerms.length) warn(`Key Term(s) not found in the Model Answer, so they can't be hidden in the hint: ${missingTerms.join("; ")}.`);
      }

      rows.push({
        questionId,
        legacyId: cell("legacyId"),
        subject: subject!,
        topicNumber: topicNumber!,
        subtopic: cell("subtopic").replace(/\s+/g, " "),
        specificationReference: cell("specificationReference"),
        question: cell("question"),
        modelAnswer,
        marks,
        assessmentObjective: assessmentObjective!,
        qualification: qualification!,
        tier: tier!,
        grade: cell("grade"),
        questionType: cell("questionType"),
        keyTerms,
        sourceNotes: cell("sourceNotes"),
        sortOrder: sortOrder++,
        sheet: sheetName,
        row: rowNumber,
      });
    });
  }

  const topics = summariseTopics(rows);
  for (const topic of topics) {
    const numbered = topic.subtopics.filter((subtopic) => NUMBERED_SUBTOPIC.test(subtopic.name));
    if (!numbered.length) continue;
    for (const subtopic of topic.subtopics.filter((item) => !NUMBERED_SUBTOPIC.test(item.name))) {
      issues.push({
        severity: "warning",
        sheet: topic.sheet,
        message: `Subtopic "${subtopic.name}" (${subtopic.questionCount} question${subtopic.questionCount === 1 ? "" : "s"}) is not one of the numbered subtopics (${numbered.map((item) => item.name).join(", ")}). It will show as a separate subtopic.`,
      });
    }
  }

  if (!rows.length && !issues.some((issue) => issue.severity === "error")) {
    issues.push({ severity: "error", message: "No questions were found. Each topic sheet needs a header row starting with \"Question ID\"." });
  }

  return { rows, issues, topics };
}

export function summariseTopics(rows: WorkbookQuestionRow[]): WorkbookTopicSummary[] {
  const groups = new Map<string, WorkbookQuestionRow[]>();
  for (const row of rows) {
    const key = `${row.subject}:${row.topicNumber}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()]
    .map((topicRows) => {
      const order = orderSubtopics(topicRows.map((row) => row.subtopic));
      return {
        subject: topicRows[0].subject,
        topicNumber: topicRows[0].topicNumber,
        sheet: topicRows[0].sheet,
        questionCount: topicRows.length,
        subtopics: order.map((name, index) => ({ name, order: index + 1, questionCount: topicRows.filter((row) => row.subtopic === name).length })),
      };
    })
    .sort((left, right) => left.subject.localeCompare(right.subject) || left.topicNumber - right.topicNumber);
}

export const hasBlockingIssues = (issues: WorkbookIssue[]) => issues.some((issue) => issue.severity === "error");

export const topicDatabaseId = (subject: Subject, topicNumber: number) => `${SUBJECT_CODES[subject]}-T${String(topicNumber).padStart(2, "0")}`;
