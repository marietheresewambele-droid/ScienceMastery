import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const root = process.cwd();
const workbookRoot = process.env.SCIENCEMASTERY_WORKBOOK_DIR ||
  "C:\\Users\\marie\\OneDrive\\Desktop\\ScienceMastery\\Mastery Questions and Answers - Adaptive Engine format";

const sources = [
  { subject: "biology", prefix: "BIO", file: "AQA_GCSE_Biology_Mastery_Workbook_Adaptive_Ready.xlsx", version: "BIO-2026.1", topics: [
    ["Topic 1 - Cell Biology", "cell-biology-questions.json"], ["Topic 2 - Organisation", "organisation-questions.json"],
    ["Topic 3 - Infection", "infection-and-response-questions.json"], ["Topic 4 - Bioenergetics", "bioenergetics-questions.json"],
    ["Topic 5 - Homeostasis", "homeostasis-and-response-questions.json"], ["Topic 6 - Inheritance", "inheritance-variation-and-evolution-questions.json"],
    ["Topic 7 - Ecology", "ecology-questions.json"],
  ] },
  { subject: "chemistry", prefix: "CHE", file: "AQA_GCSE_Chemistry_Mastery_Workbook_Adaptive_Ready.xlsx", version: "CHE-2026.1", topics: [
    ["T1 Atomic Structure", "atomic-structure-and-the-periodic-table-questions.json"], ["T2 Bonding and Structure", "bonding-structure-and-properties-of-matter-questions.json"],
    ["T3 Quantitative Chemistry", "quantitative-chemistry-questions.json"], ["T4 Chemical Changes", "chemical-changes-questions.json"],
    ["T5 Energy Changes", "energy-changes-questions.json"], ["T6 Rates and Equilibrium", "rate-and-extent-of-chemical-change-questions.json"],
    ["T7 Organic Chemistry", "organic-chemistry-questions.json"], ["T8 Chemical Analysis", "chemical-analysis-questions.json"],
    ["T9 Atmosphere", "chemistry-of-the-atmosphere-questions.json"], ["T10 Using Resources", "using-resources-questions.json"],
  ] },
  { subject: "physics", prefix: "PHY", file: "AQA_GCSE_Physics_Mastery_Workbook_Adaptive_Ready.xlsx", version: "PHY-2026.1", topics: [
    ["Topic 1 - Energy", "energy-questions.json"], ["Topic 2 - Electricity", "electricity-questions.json"],
    ["Topic 3 - Particle Model", "particle-model-of-matter-questions.json"], ["Topic 4 - Atomic Structure", "atomic-structure-questions.json"],
    ["Topic 5 - Forces", "forces-questions.json"], ["Topic 6 - Waves", "waves-questions.json"],
    ["Topic 7 - Magnetism", "magnetism-and-electromagnetism-questions.json"], ["Topic 8 - Space Physics", "space-physics-questions.json"],
  ] },
];

const text = (value) => String(value ?? "").trim();
const splitPoints = (answer) => text(answer).split(/\r?\n+/).map((point) => point.trim()).filter(Boolean);
const relationshipColumns = { prerequisite: "Prerequisite ID", diagnostic: "Diagnostic ID", easier: "Easier ID", parallel: "Parallel ID", harder: "Harder ID" };
const normalizeRelationshipId = (prefix, value) => value.startsWith(`${prefix}-`) ? value : `${prefix}-${value}`;

for (const source of sources) {
  const workbookPath = path.join(workbookRoot, source.file);
  if (!fs.existsSync(workbookPath)) throw new Error(`Workbook not found: ${workbookPath}`);
  const workbook = XLSX.readFile(workbookPath, { cellDates: false });
  const adaptiveRows = XLSX.utils.sheet_to_json(workbook.Sheets["Adaptive Question Map"], { defval: "" });
  const map = new Map(adaptiveRows.map((row) => [text(row["Source ID"]), row]));

  for (const [sheetName, outputName] of source.topics) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Missing sheet '${sheetName}' in ${source.file}`);
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 3 });
    const questions = rows.filter((row) => text(row.ID) && map.has(text(row.ID))).map((row) => {
      const id = text(row.ID);
      const adaptive = map.get(id);
      const answer = text(row["Model answer / creditworthy marking points"]) || text(row["Model answer / marking points"]);
      const relationships = Object.fromEntries(Object.entries(relationshipColumns)
        .map(([type, column]) => [type, text(adaptive?.[column])])
        .filter(([, value]) => value)
        .map(([type, value]) => [type, normalizeRelationshipId(source.prefix, value)]));
      return {
        id,
        questionFamily: text(row["Question family"]) || text(adaptive?.["Family label"]),
        subtopic: text(row.Subtopic) || text(adaptive?.Subtopic) || sheetName,
        sourceSubtopic: text(row.Subtopic) || text(adaptive?.Subtopic) || sheetName,
        tier: text(row.Tier) || text(row["Tier / content"]) || text(adaptive?.Tier),
        question: text(row["Self-contained mastery question"]) || text(row.Question),
        marks: Number(row.Marks) || 1,
        modelAnswer: answer,
        markingPoints: splitPoints(answer),
        commandWord: text(row["Command word"]) || text(adaptive?.["Command word"]),
        assessmentObjective: text(row["Assessment objective"]) || text(row.AO) || text(adaptive?.AO) || "AO1",
        specificationReference: text(row["AQA specification reference"]),
        gradeDemand: text(row["Approximate grade demand"]),
        knowledgeType: text(row["Knowledge type"]),
        questionFamilyId: text(adaptive?.["Family ID"]),
        databaseId: `${source.prefix}-${id}`,
        adaptiveRelationships: Object.keys(relationships).length ? relationships : undefined,
      };
    });
    if (!questions.length) throw new Error(`No questions found in '${sheetName}'`);
    const outputPath = path.join(root, "src", "data", source.subject, outputName);
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    fs.writeFileSync(outputPath, `${JSON.stringify({ ...existing, questions }, null, 2)}\n`);
    console.log(`${source.subject}/${outputName}: imported ${questions.length} questions from ${sheetName} (${source.version})`);
  }
}
