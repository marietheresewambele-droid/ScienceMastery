import "server-only";
import * as XLSX from "xlsx";
import type { WebsiteQuestionRow, WebsiteAssessmentObjective, WebsiteTier, WebsiteQuestionType } from "@/types/websiteQuestion";

/** The importer only ever reads the worksheet with exactly this name. */
export const REQUIRED_SHEET_NAME = "Website Upload";

/** Required column headers. Order in the workbook does not matter. */
export const REQUIRED_HEADERS = [
  "Question ID",
  "Subject",
  "Unit",
  "Topic",
  "Subtopic",
  "Specification Reference",
  "Question",
  "Model Answer",
  "Marks",
  "Assessment Objective",
  "Tier",
  "Grade",
  "Key Terms",
  "Image File",
  "Question Type",
] as const;

const ASSESSMENT_OBJECTIVES: WebsiteAssessmentObjective[] = ["AO1", "AO2", "AO3"];
const TIERS: WebsiteTier[] = ["Foundation", "Higher", "Both"];
const QUESTION_TYPES: WebsiteQuestionType[] = ["Short answer", "Multiple choice", "Calculation", "Extended response"];
const SUBJECTS = ["Biology", "Chemistry", "Physics"] as const;

export interface RowIssue {
  row: number;
  questionId?: string;
  message: string;
}

export interface ValidationResult {
  rows: WebsiteQuestionRow[];
  issues: RowIssue[];
  totalRows: number;
}

const text = (value: unknown) => String(value ?? "").trim();

function normalizeEnum<T extends string>(value: string, options: T[]): T | null {
  const match = options.find((option) => option.toLowerCase() === value.trim().toLowerCase());
  return match ?? null;
}

/** Validates raw string cells (already split by header) into typed rows + row-numbered issues. */
export function validateRows(rawRows: Array<Record<string, string>>, firstRowNumber = 2): ValidationResult {
  const issues: RowIssue[] = [];
  const rows: WebsiteQuestionRow[] = [];
  const seenIds = new Map<string, number>();

  rawRows.forEach((raw, index) => {
    const row = firstRowNumber + index;
    const questionId = text(raw["Question ID"]);
    const subjectText = text(raw["Subject"]);
    const subject = subjectText ? normalizeEnum(subjectText, [...SUBJECTS]) : null;
    const fail = (message: string) => issues.push({ row, questionId: questionId || undefined, message });

    const required: Array<[string, string]> = [
      ["Question ID", questionId],
      ["Subject", text(raw["Subject"])],
      ["Unit", text(raw["Unit"])],
      ["Topic", text(raw["Topic"])],
      ["Subtopic", text(raw["Subtopic"])],
      ["Specification Reference", text(raw["Specification Reference"])],
      ["Question", text(raw["Question"])],
      ["Model Answer", text(raw["Model Answer"])],
      ["Marks", text(raw["Marks"])],
      ["Assessment Objective", text(raw["Assessment Objective"])],
      ["Tier", text(raw["Tier"])],
      ["Grade", text(raw["Grade"])],
      ["Question Type", text(raw["Question Type"])],
    ];

    // Skip entirely blank rows (common trailing rows in exported sheets) without reporting them.
    if (required.every(([, value]) => !value) && !text(raw["Key Terms"]) && !text(raw["Image File"])) return;

    let hasError = false;
    for (const [label, value] of required) {
      if (!value) {
        fail(`${label} is required.`);
        hasError = true;
      }
    }

    if (subjectText && !subject) {
      fail(`Subject must be Biology, Chemistry or Physics (found "${subjectText}").`);
      hasError = true;
    }

    if (questionId) {
      const firstRow = seenIds.get(questionId);
      if (firstRow !== undefined) {
        fail(`Duplicate Question ID "${questionId}" also used in row ${firstRow}.`);
        hasError = true;
      } else {
        seenIds.set(questionId, row);
      }
    }

    const marksText = text(raw["Marks"]);
    let marks = NaN;
    if (marksText) {
      marks = Number(marksText);
      if (!Number.isInteger(marks) || marks < 1 || marks > 6) {
        fail(`Marks must be a whole number from 1 to 6 (found "${marksText}").`);
        hasError = true;
      }
    }

    const aoText = text(raw["Assessment Objective"]);
    const assessmentObjective = aoText ? normalizeEnum(aoText, ASSESSMENT_OBJECTIVES) : null;
    if (aoText && !assessmentObjective) {
      fail(`Assessment Objective must be AO1, AO2 or AO3 (found "${aoText}").`);
      hasError = true;
    }

    const tierText = text(raw["Tier"]);
    const tier = tierText
      ? normalizeEnum(tierText === "HT" ? "Higher" : tierText, TIERS)
      : null;
    if (tierText && !tier) {
      fail(`Tier must be Foundation, Higher or Both (found "${tierText}").`);
      hasError = true;
    }

    const questionTypeText = text(raw["Question Type"]);
    const questionType = questionTypeText ? normalizeEnum(questionTypeText, QUESTION_TYPES) : null;
    if (questionTypeText && !questionType) {
      fail(`Question Type must be Short answer, Multiple choice, Calculation or Extended response (found "${questionTypeText}").`);
      hasError = true;
    }

    if (hasError) return;

    rows.push({
      questionId,
      subject: subject as string,
      unit: text(raw["Unit"]),
      topic: text(raw["Topic"]),
      subtopic: text(raw["Subtopic"]),
      specificationReference: text(raw["Specification Reference"]),
      // .trim() only strips leading/trailing whitespace, so internal line breaks survive.
      question: text(raw["Question"]),
      modelAnswer: text(raw["Model Answer"]),
      marks,
      assessmentObjective: assessmentObjective as WebsiteAssessmentObjective,
      tier: tier as WebsiteTier,
      grade: text(raw["Grade"]),
      keyTerms: text(raw["Key Terms"]),
      imageFile: text(raw["Image File"]),
      questionType: questionType as WebsiteQuestionType,
    });
  });

  return { rows, issues, totalRows: rawRows.length };
}

export interface WorkbookParseResult extends ValidationResult {
  sheetFound: boolean;
  missingHeaders: string[];
}

/** Reads the exact "Website Upload" worksheet and validates every row. Never writes to Supabase. */
export function parseWebsiteUploadWorkbook(buffer: Buffer | ArrayBuffer): WorkbookParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames.find((name) => name === REQUIRED_SHEET_NAME);
  if (!sheetName) {
    return { sheetFound: false, missingHeaders: [], rows: [], issues: [], totalRows: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  // header: 1 keeps every cell as a raw string and preserves embedded line breaks.
  const grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false, blankrows: false });
  const [headerRow, ...dataRows] = grid;
  if (!headerRow) {
    return { sheetFound: true, missingHeaders: [...REQUIRED_HEADERS], rows: [], issues: [], totalRows: 0 };
  }

  const headers = headerRow.map((value) => text(value));
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    return { sheetFound: true, missingHeaders, rows: [], issues: [], totalRows: dataRows.length };
  }

  const rawRows = dataRows.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, columnIndex) => {
      record[header] = text(cells[columnIndex]);
    });
    return record;
  });

  const result = validateRows(rawRows, 2);
  return { sheetFound: true, missingHeaders: [], ...result };
}

/**
 * Re-validates already-typed rows server-side before publishing. Used so the publish
 * endpoint never trusts a client-supplied "this passed validation" claim on its own.
 */
export function revalidateTypedRows(rows: WebsiteQuestionRow[]): RowIssue[] {
  const issues: RowIssue[] = [];
  const seenIds = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const fail = (message: string) => issues.push({ row: rowNumber, questionId: row.questionId || undefined, message });

    const required: Array<[string, string]> = [
      ["Question ID", row.questionId],
      ["Subject", row.subject],
      ["Unit", row.unit],
      ["Topic", row.topic],
      ["Subtopic", row.subtopic],
      ["Specification Reference", row.specificationReference],
      ["Question", row.question],
      ["Model Answer", row.modelAnswer],
      ["Grade", row.grade],
    ];
    for (const [label, value] of required) {
      if (!text(value)) fail(`${label} is required.`);
    }
    if (!SUBJECTS.some((subject) => subject.toLowerCase() === text(row.subject).toLowerCase())) {
      fail(`Subject must be Biology, Chemistry or Physics (found "${row.subject}").`);
    }

    if (row.questionId) {
      const firstRow = seenIds.get(row.questionId);
      if (firstRow !== undefined) fail(`Duplicate Question ID "${row.questionId}" also used in row ${firstRow}.`);
      else seenIds.set(row.questionId, rowNumber);
    }

    if (!Number.isInteger(row.marks) || row.marks < 1 || row.marks > 6) {
      fail(`Marks must be a whole number from 1 to 6 (found "${row.marks}").`);
    }
    if (!ASSESSMENT_OBJECTIVES.includes(row.assessmentObjective)) {
      fail(`Assessment Objective must be AO1, AO2 or AO3 (found "${row.assessmentObjective}").`);
    }
    if (!TIERS.includes(row.tier)) {
      fail(`Tier must be Foundation, Higher or Both (found "${row.tier}").`);
    }
    if (!QUESTION_TYPES.includes(row.questionType)) {
      fail(`Question Type must be Short answer, Multiple choice, Calculation or Extended response (found "${row.questionType}").`);
    }
  });

  return issues;
}
