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
const validElementSymbols = new Set("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr".split(" "));
const splitKeywords = (value) => text(value).split(/[;,]/).map((keyword) => keyword.trim()).filter((keyword) => {
  if (!keyword) return false;
  if (/^[A-Z][a-z]?$/.test(keyword)) return validElementSymbols.has(keyword);
  return keyword.length >= 3 || /\d|%|Δ|pH|Rf/i.test(keyword);
});
const hintStopWords = new Set("about after again also because before being between both can could each from give have into more must only other should that than their there these this those through using when which with would your form forms then where while under over such made make made made".split(" "));
const fallbackKeywords = (answer) => {
  const source = text(answer);
  const formulas = source.match(/(?:[A-Z][a-z]?(?:[₀-₉0-9²³⁺⁻+\-]+)?){1,4}/g) ?? [];
  const words = source.match(/[A-Za-z]{5,}/g) ?? [];
  const cleanedFormulas = formulas.map((term) => term.trim()).filter((term) =>
    validElementSymbols.has(term) || /[₀-₉0-9²³⁺⁻+\-]/.test(term),
  );
  return [...new Set([...cleanedFormulas, ...words].map((term) => term.trim()).filter((term) => {
    const lower = term.toLowerCase();
    return (lower.length >= 3 || /[₀-₉0-9²³⁺⁻+\-]/.test(term)) && !hintStopWords.has(lower);
  }))].slice(0, 6);
};
const commandWordFor = (question) => {
  const first = text(question).match(/^(state|give|name|define|describe|explain|compare|calculate|determine|evaluate|suggest|write|draw|complete|predict|identify)/i)?.[1];
  const normalized = first?.toLowerCase();
  if (["state", "give", "name", "define", "write", "draw", "complete", "identify"].includes(normalized)) return "State";
  return normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : "Answer";
};
const familyKey = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 42) || "recall";
const specificationParts = (value) => {
  const source = text(value);
  const match = source.match(/^\s*(4\.\d+(?:\.\d+)*)/);
  return match ? match[1].split(".").map(Number) : [99];
};
const specificationCompare = (left, right) => {
  const a = specificationParts(left.specificationReference);
  const b = specificationParts(right.specificationReference);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? -1) - (b[index] ?? -1);
    if (difference) return difference;
  }
  return 0;
};
const tierRank = (tier) => {
  const value = text(tier).toLowerCase();
  if (value.includes("foundation") && !value.includes("higher")) return 0;
  if (value === "both" || value === "all" || value.includes("foundation and higher")) return 1;
  if (value.includes("higher") && !value.includes("chemistry only")) return 2;
  if (value.includes("chemistry only")) return 3;
  return 4;
};
const gradeRank = (grade) => {
  const label = text(grade).toLowerCase();
  if (label === "low") return 1;
  if (label === "medium") return 5;
  if (label === "high") return 7;
  const numbers = text(grade).match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.min(...numbers) : 99;
};
const aoRank = (ao) => {
  const value = text(ao);
  if (value.startsWith("AO1")) return 1;
  if (value.startsWith("AO2")) return 2;
  if (value.startsWith("AO3")) return 3;
  return 4;
};
const studentProgressionCompare = (left, right) =>
  specificationCompare(left, right) ||
  tierRank(left.tier) - tierRank(right.tier) ||
  gradeRank(left.gradeDemand) - gradeRank(right.gradeDemand) ||
  left.marks - right.marks ||
  aoRank(left.assessmentObjective) - aoRank(right.assessmentObjective) ||
  left.question.localeCompare(right.question);

const workbook = XLSX.readFile(workbookPath, { cellDates: false });
for (const [sheetName, outputName] of topics) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Missing worksheet: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 3 });
  const incomplete = [];
  const questions = rows.filter((row) => {
    const id = text(row["Website question ID"] || row.ID).toLowerCase();
    const ao = text(row["Primary AO"] || row.AO).toUpperCase();
    return id && id !== "null" && id !== "total marks" && text(row.Question) && /^AO[123]$/.test(ao);
  }).flatMap((row) => {
    const question = text(row.Question);
    const answer = text(row["Model answer / marking points"]);
    if (!answer) {
      incomplete.push({ id: text(row.ID), question });
      return [];
    }
    const specificationReference = text(row["AQA specification reference"]);
    const commandWord = commandWordFor(question);
    const id = text(row["Website question ID"] || row.ID);
    const hintKeywords = splitKeywords(row["Hint keywords"]);
    return [{
      id,
      questionFamily: `${sheetName} · ${specificationReference || "AQA Chemistry"} · ${commandWord}`,
      subtopic: `${sheetName} · ${specificationReference || "AQA Chemistry"}`,
      sourceSubtopic: `${sheetName} · ${specificationReference || "AQA Chemistry"}`,
      tier: text(row["Tier / content"]) || "Foundation and Higher",
      question,
      marks: Number(row["Marks (1–6)"] || row.Marks) || 1,
      modelAnswer: answer,
      markingPoints: splitPoints(answer),
      commandWord,
      assessmentObjective: text(row["Primary AO"] || row.AO) || "AO1",
      specificationReference,
      gradeDemand: text(row["Grade demand"] || row["Approximate grade demand"]) || "Low",
      knowledgeType: text(row["Knowledge type"]) || "Quiz recall",
      hintKeywords: hintKeywords.length ? hintKeywords : fallbackKeywords(answer),
      questionFamilyId: `CHE-${familyKey(`${sheetName}-${specificationReference}-${commandWord}`)}`,
      databaseId: `CHE-${id}`,
    }];
  });
  questions.sort(studentProgressionCompare);
  if (!questions.length) throw new Error(`No usable questions found in ${sheetName}`);
  const outputPath = path.join(root, "src", "data", "chemistry", outputName);
  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  const subtopics = [...new Set(questions.map((question) => question.subtopic))].map((title) => ({ title, questionCount: questions.filter((question) => question.subtopic === title).length }));
  fs.writeFileSync(outputPath, `${JSON.stringify({ ...existing, metadata: { ...existing.metadata, subtopics }, questions }, null, 2)}\n`);
  console.log(`${sheetName}: ${questions.length} published questions; ${incomplete.length} incomplete workbook rows held back`);
}
