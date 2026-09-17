import "server-only";
import * as XLSX from "xlsx";
import type { MasteryQuestion } from "@/types/questions";
import type { WorkbookRelationship } from "@/lib/contentValidation";

/**
 * Parses the "Chemistry Mastery Audit — Website Ready" workbook format into
 * MasteryQuestion rows. Mirrors scripts/import-chemistry-audit-workbook.mjs,
 * adapted to read an in-memory buffer instead of writing to src/data/*.json.
 */

export const CHEMISTRY_TOPIC_SHEETS: [sheet: string, topicSlug: string][] = [
  ["T1 Atomic Structure", "atomic-structure-and-the-periodic-table"],
  ["T2 Bonding and Structure", "bonding-structure-and-properties-of-matter"],
  ["T3 Quantitative Chemistry", "quantitative-chemistry"],
  ["T4 Chemical Changes", "chemical-changes"],
  ["T5 Energy Changes", "energy-changes"],
  ["T6 Rates and Equilibrium", "rate-and-extent-of-chemical-change"],
  ["T7 Organic Chemistry", "organic-chemistry"],
  ["T8 Chemical Analysis", "chemical-analysis"],
  ["T9 Atmosphere", "chemistry-of-the-atmosphere"],
  ["T10 Using Resources", "using-resources"],
];

const text = (value: unknown) => String(value ?? "").trim();
const splitPoints = (value: unknown) => text(value).split(/\r?\n+/).map((point) => point.trim()).filter(Boolean);

const validElementSymbols = new Set(
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr".split(" "),
);

const splitKeywords = (value: unknown) =>
  text(value)
    .split(/[;,]/)
    .map((keyword) => keyword.trim())
    .filter((keyword) => {
      if (!keyword) return false;
      if (/^[A-Z][a-z]?$/.test(keyword)) return validElementSymbols.has(keyword);
      return keyword.length >= 3 || /\d|%|Δ|pH|Rf/i.test(keyword);
    });

const hintStopWords = new Set(
  "about after again also because before being between both can could each from give have into more must only other should that than their there these this those through using when which with would your form forms then where while under over such made make made made".split(
    " ",
  ),
);

const fallbackKeywords = (answer: string) => {
  const source = text(answer);
  const formulas = source.match(/(?:[A-Z][a-z]?(?:[₀-₉0-9²³⁺⁻+\-]+)?){1,4}/g) ?? [];
  const words = source.match(/[A-Za-z]{5,}/g) ?? [];
  const cleanedFormulas = formulas.map((term) => term.trim()).filter((term) => validElementSymbols.has(term) || /[₀-₉0-9²³⁺⁻+\-]/.test(term));
  return [
    ...new Set(
      [...cleanedFormulas, ...words]
        .map((term) => term.trim())
        .filter((term) => {
          const lower = term.toLowerCase();
          return (lower.length >= 3 || /[₀-₉0-9²³⁺⁻+\-]/.test(term)) && !hintStopWords.has(lower);
        }),
    ),
  ].slice(0, 6);
};

const formattedKeywords = (sheet: XLSX.WorkSheet, rowNumber: number, columnNumber: number | undefined) => {
  if (!Number.isInteger(rowNumber) || !Number.isInteger(columnNumber)) return [];
  const cellAddress = XLSX.utils.encode_cell({ r: rowNumber, c: columnNumber as number });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cell = sheet[cellAddress] as any;
  if (!cell) return [];
  const keywords: string[] = [];
  if (Array.isArray(cell.r)) {
    for (const run of cell.r) {
      if (run?.rPr?.b || run?.rPr?.bold) {
        const value = text(run.t);
        if (value) keywords.push(value);
      }
    }
  }
  const html = text(cell.h);
  for (const match of html.matchAll(/<(?:b|strong)[^>]*>(.*?)<\/(?:b|strong)>/gi)) {
    const value = text(match[1].replace(/<[^>]+>/g, ""));
    if (value) keywords.push(value);
  }
  return [...new Set(keywords)];
};

const commandWordFor = (question: string) => {
  const first = text(question).match(
    /^(state|give|name|define|describe|explain|compare|calculate|determine|evaluate|suggest|write|draw|complete|predict|identify)/i,
  )?.[1];
  const normalized = first?.toLowerCase();
  if (normalized && ["state", "give", "name", "define", "write", "draw", "complete", "identify"].includes(normalized)) return "State";
  return normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : "Answer";
};

export type ParsedTopic = {
  sheet: string;
  topicSlug: string;
  questions: MasteryQuestion[];
  incomplete: { id: string; question: string }[];
};

export type ChemistryWorkbookParseResult = {
  topics: ParsedTopic[];
  missingSheets: string[];
  questions: MasteryQuestion[];
  relationships: WorkbookRelationship[];
};

export function parseChemistryWorkbook(buffer: ArrayBuffer | Buffer): ChemistryWorkbookParseResult {
  // cellRichText is a real SheetJS runtime option (needed to detect bold hint keywords) that's
  // missing from the bundled type definitions.
  const workbook = XLSX.read(buffer, { cellDates: false, cellHTML: true, cellRichText: true, type: "buffer" } as XLSX.ParsingOptions);

  const topics: ParsedTopic[] = [];
  const missingSheets: string[] = [];

  for (const [sheetName, topicSlug] of CHEMISTRY_TOPIC_SHEETS) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet["!ref"]) {
      missingSheets.push(sheetName);
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", range: 3 });
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const headerRow = range.s.r + 3;
    const answerColumn = Array.from({ length: range.e.c - range.s.c + 1 }, (_, offset) => range.s.c + offset).find(
      (column) => text(sheet[XLSX.utils.encode_cell({ r: headerRow, c: column })]?.v) === "Model answer / marking points",
    );

    const incomplete: { id: string; question: string }[] = [];
    const questions: MasteryQuestion[] = rows
      .filter((row) => {
        const id = text(row["Website question ID"] || row.ID).toLowerCase();
        const ao = text(row["Primary AO"] || row.AO).toUpperCase();
        return id && id !== "null" && id !== "total marks" && text(row.Question) && /^AO[123]$/.test(ao);
      })
      .flatMap((row) => {
        const question = text(row.Question);
        const answer = text(row["Model answer / marking points"]);
        if (!answer) {
          incomplete.push({ id: text(row.ID), question });
          return [];
        }
        const specificationReference = text(row["AQA specification reference"]);
        const commandWord = commandWordFor(question);
        const id = text(row["Website question ID"] || row.ID);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rowNumber = (row as any).__rowNum__;
        const boldKeywords = formattedKeywords(sheet, rowNumber, answerColumn);
        const hintKeywords = boldKeywords.length ? boldKeywords : splitKeywords(row["Hint keywords"]);

        const parsed: MasteryQuestion = {
          id,
          subject: "chemistry",
          topicSlug,
          questionFamily: `${sheetName} · ${specificationReference || "AQA Chemistry"} · ${commandWord}`,
          subtopic: `${sheetName} · ${specificationReference || "AQA Chemistry"}`,
          tier: (text(row["Tier / content"]) || "Foundation and Higher") as MasteryQuestion["tier"],
          question,
          marks: Number(row["Marks (1–6)"] || row.Marks) || 1,
          modelAnswer: answer,
          markingPoints: splitPoints(answer),
          commandWord,
          assessmentObjective: (text(row["Primary AO"] || row.AO) || "AO1") as MasteryQuestion["assessmentObjective"],
          specificationReference,
          gradeDemand: text(row["Grade demand"] || row["Approximate grade demand"]) || "Low",
          hintKeywords: hintKeywords.length ? hintKeywords : fallbackKeywords(answer),
          databaseId: `CHE-${topicSlug}-${id}`,
        };
        return [parsed];
      });

    if (questions.length) topics.push({ sheet: sheetName, topicSlug, questions, incomplete });
  }

  return {
    topics,
    missingSheets,
    questions: topics.flatMap((topic) => topic.questions),
    relationships: [],
  };
}
