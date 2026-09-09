import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const workbookPath = process.env.CHEMISTRY_WORKBOOK_PATH;
if (!workbookPath || !fs.existsSync(workbookPath)) {
  throw new Error("Set CHEMISTRY_WORKBOOK_PATH to the approved Chemistry audit workbook.");
}

const topics = [
  ["T1 Atomic Structure", "atomic-structure-and-the-periodic-table-questions.json"],
  ["T2 Bonding and Structure", "bonding-structure-and-properties-of-matter-questions.json"],
  ["T3 Quantitative Chemistry", "quantitative-chemistry-questions.json"],
  ["T4 Chemical Changes", "chemical-changes-questions.json"],
  ["T5 Energy Changes", "energy-changes-questions.json"],
  ["T6 Rates and Equilibrium", "rate-and-extent-of-chemical-change-questions.json"],
  ["T7 Organic Chemistry", "organic-chemistry-questions.json"],
  ["T8 Chemical Analysis", "chemical-analysis-questions.json"],
  ["T9 Atmosphere", "chemistry-of-the-atmosphere-questions.json"],
  ["T10 Using Resources", "using-resources-questions.json"],
];

const root = process.cwd();
const text = (value) => String(value ?? "").trim();
const splitPoints = (value) => text(value).split(/\r?\n+/).map((point) => point.trim()).filter(Boolean);
const commandWordFor = (question) => {
  const first = text(question).match(/^(state|give|name|define|describe|explain|compare|calculate|determine|evaluate|suggest|write|draw|complete|predict|identify)/i)?.[1];
  const normalized = first?.toLowerCase();
  if (["state", "give", "name", "define", "write", "draw", "complete", "identify"].includes(normalized)) return "State";
  return normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : "Answer";
};
const familyKey = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 42) || "recall";

const workbook = XLSX.readFile(workbookPath, { cellDates: false });
for (const [sheetName, outputName] of topics) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Missing worksheet: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 3 });
  const incomplete = [];
  const questions = rows.filter((row) => text(row.ID) && text(row.Question)).flatMap((row) => {
    const question = text(row.Question);
    const answer = text(row["Model answer / marking points"]);
    if (!answer) {
      incomplete.push({ id: text(row.ID), question });
      return [];
    }
    const specificationReference = text(row["AQA specification reference"]);
    const commandWord = commandWordFor(question);
    const id = text(row.ID);
    return [{
      id,
      questionFamily: `${sheetName} · ${specificationReference || "AQA Chemistry"} · ${commandWord}`,
      subtopic: `${sheetName} · ${specificationReference || "AQA Chemistry"}`,
      sourceSubtopic: `${sheetName} · ${specificationReference || "AQA Chemistry"}`,
      tier: text(row["Tier / content"]) || "Foundation and Higher",
      question,
      marks: Number(row.Marks) || 1,
      modelAnswer: answer,
      markingPoints: splitPoints(answer),
      commandWord,
      assessmentObjective: text(row.AO) || "AO1",
      specificationReference,
      gradeDemand: text(row["Approximate grade demand"]) || "Low",
      knowledgeType: text(row["Knowledge type"]) || "Quiz recall",
      questionFamilyId: `CHE-${familyKey(`${sheetName}-${specificationReference}-${commandWord}`)}`,
      databaseId: `CHE-${id}`,
    }];
  });
  if (!questions.length) throw new Error(`No usable questions found in ${sheetName}`);
  const outputPath = path.join(root, "src", "data", "chemistry", outputName);
  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  const subtopics = [...new Set(questions.map((question) => question.subtopic))].map((title) => ({ title, questionCount: questions.filter((question) => question.subtopic === title).length }));
  fs.writeFileSync(outputPath, `${JSON.stringify({ ...existing, metadata: { ...existing.metadata, subtopics }, questions }, null, 2)}\n`);
  console.log(`${sheetName}: ${questions.length} published questions; ${incomplete.length} incomplete workbook rows held back`);
}
