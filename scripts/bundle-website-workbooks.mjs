import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";

register("./test-server-only-stub-loader.mjs", import.meta.url);
const { parseWebsiteUploadWorkbook } = await import("../src/lib/websiteQuestionImport.ts");

const topicSlugs = {
  biology: {
    "cell biology": "cell-biology", organisation: "organisation", infection: "infection-and-response",
    bioenergetics: "bioenergetics", homeostasis: "homeostasis-and-response",
    inheritance: "inheritance-variation-and-evolution", ecology: "ecology",
  },
  chemistry: {
    "atomic structure": "atomic-structure-and-the-periodic-table",
    "bonding and structure": "bonding-structure-and-properties-of-matter",
    "quantitative chemistry": "quantitative-chemistry", "chemical changes": "chemical-changes",
    "energy changes": "energy-changes", "rates and equilibrium": "rate-and-extent-of-chemical-change",
    "organic chemistry": "organic-chemistry", "chemical analysis": "chemical-analysis",
    atmosphere: "chemistry-of-the-atmosphere", "using resources": "using-resources",
  },
  physics: {
    energy: "energy", electricity: "electricity", "particle model": "particle-model-of-matter",
    "atomic structure": "atomic-structure", forces: "forces", waves: "waves",
    magnetism: "magnetism-and-electromagnetism", "space physics": "space-physics",
  },
};

const sources = process.argv.slice(2);
if (sources.length !== 3) {
  throw new Error("Usage: node --experimental-strip-types scripts/bundle-website-workbooks.mjs <biology.xlsx> <chemistry.xlsx> <physics.xlsx>");
}

const subjects = ["biology", "chemistry", "physics"];
const outputDirectory = path.resolve("src/data/workbook-questions");
fs.mkdirSync(outputDirectory, { recursive: true });
const globalIds = new Set();

for (const [index, subject] of subjects.entries()) {
  const workbookBuffer = fs.readFileSync(path.resolve(sources[index]));
  const result = parseWebsiteUploadWorkbook(workbookBuffer);
  if (!result.sheetFound || result.missingHeaders.length || result.issues.length || !result.rows.length) {
    throw new Error(`${subject} workbook failed validation: ${JSON.stringify(result.issues.slice(0, 10))}`);
  }

  const questions = result.rows.map((row) => {
    if (globalIds.has(row.questionId)) throw new Error(`Question ID is duplicated across workbook files: ${row.questionId}`);
    globalIds.add(row.questionId);

    const topicSlug = topicSlugs[subject][row.topic.trim().toLowerCase()]
      ?? row.topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const markingPoints = row.modelAnswer.split(/\r?\n+/).map((point) => point.trim()).filter(Boolean);
    const commandWord = row.question.match(/^(state|give|name|define|describe|explain|compare|calculate|determine|evaluate|suggest|write|draw|complete|predict|identify)\b/i)?.[1];

    return {
      id: row.questionId,
      subject,
      topicSlug,
      topic: row.topic,
      unit: row.unit,
      subtopic: row.subtopic,
      question: row.question,
      questionType: row.questionType,
      marks: row.marks,
      assessmentObjective: row.assessmentObjective,
      tier: row.tier,
      difficulty: row.tier,
      commandWord: commandWord ? commandWord[0].toUpperCase() + commandWord.slice(1).toLowerCase() : undefined,
      specificationReference: row.specificationReference,
      markingPoints,
      modelAnswer: row.modelAnswer,
      gradeDemand: row.grade,
      hintKeywords: row.keyTerms ? row.keyTerms.split(/[;,]/).map((term) => term.trim()).filter(Boolean) : undefined,
      imageFile: row.imageFile || undefined,
      databaseId: row.questionId,
    };
  });

  const destination = path.join(outputDirectory, `${subject}.json`);
  fs.writeFileSync(destination, `${JSON.stringify(questions)}\n`);
  console.log(`${subject}: bundled ${questions.length} questions into ${destination}`);
}
