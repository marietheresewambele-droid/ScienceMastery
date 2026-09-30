import assert from "node:assert/strict";
import fs from "node:fs";
import { register } from "node:module";
import path from "node:path";
import XLSX from "xlsx";

register("./test-server-only-stub-loader.mjs", import.meta.url);
const { parseWebsiteUploadWorkbook, REQUIRED_HEADERS, validateRows } = await import("../src/lib/websiteQuestionImport.ts");

const sample = {
  "Question ID": "BIO-TEST-001",
  Subject: "Biology",
  Unit: "Paper 1",
  Topic: "Cell Biology",
  Subtopic: "Cell structure",
  "Specification Reference": "4.1.1.2",
  Question: "Name two structures.\nGive one function.",
  "Model Answer": "Nucleus.\nControls cell activities.",
  Marks: "2",
  "Assessment Objective": "AO1",
  Tier: "Both",
  Grade: "Grades 5-7",
  "Key Terms": "nucleus; control",
  "Image File": "",
  "Question Type": "Short answer",
};

function makeWorkbook(rows, headers = [...REQUIRED_HEADERS], sheetName = "Website Upload") {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function checkWorkbook(buffer, label) {
  const result = parseWebsiteUploadWorkbook(buffer);
  assert.equal(result.sheetFound, true, `${label}: expected Website Upload worksheet`);
  assert.deepEqual(result.missingHeaders, [], `${label}: required headers must be present`);
  assert.equal(result.issues.length, 0, `${label}: workbook should have no validation errors: ${JSON.stringify(result.issues.slice(0, 5))}`);
  assert.equal(result.rows.length, result.totalRows, `${label}: all rows should validate`);
  assert.ok(result.rows.every((row) => ["Foundation", "Higher", "Both"].includes(row.tier)), `${label}: tiers should be canonical`);
  return result;
}

let totalImported = 0;
const globalQuestionIds = new Set();
for (const [subject, file] of [
  ["Biology", "Biology_Website_Importer_Ready.xlsx"],
  ["Chemistry", "Chemistry_Website_Importer_Ready.xlsx"],
  ["Physics", "Physics_Website_Importer_Ready.xlsx"],
]) {
  const workbookPath = process.argv[2]
    ? path.resolve(process.argv[2], file)
    : path.join(process.env.HOME, "Downloads", file);
  assert.ok(fs.existsSync(workbookPath), `${subject} workbook not found: ${workbookPath}`);
  const result = checkWorkbook(fs.readFileSync(workbookPath), subject);
  for (const row of result.rows) {
    assert.ok(!globalQuestionIds.has(row.questionId), `Question ID must be unique across all workbooks: ${row.questionId}`);
    globalQuestionIds.add(row.questionId);
  }
  totalImported += result.rows.length;
  console.log(`${subject}: ${result.rows.length} valid question rows`);
}

const headersInDifferentOrder = [...REQUIRED_HEADERS].reverse();
const valid = checkWorkbook(makeWorkbook([sample], headersInDifferentOrder), "reordered headers");
assert.equal(valid.rows[0].question, sample.Question, "question line breaks must be preserved");
assert.equal(valid.rows[0].modelAnswer, sample["Model Answer"], "answer line breaks must be preserved");

const duplicate = validateRows([sample, { ...sample }]);
assert.ok(duplicate.issues.some((issue) => issue.row === 3 && issue.message.includes("Duplicate Question ID")), "duplicate IDs must include the later row number");

const missing = validateRows([{ ...sample, "Model Answer": "", Subtopic: "" }]);
assert.ok(missing.issues.some((issue) => issue.message === "Subtopic is required."), "missing fields should be reported");
assert.ok(missing.issues.some((issue) => issue.message === "Model Answer is required."), "missing model answer should be reported");

const badMarks = validateRows([{ ...sample, Marks: "6.5" }]);
assert.ok(badMarks.issues.some((issue) => issue.message.includes("whole number from 1 to 6")), "fractional/out-of-range marks must fail");

const badAo = validateRows([{ ...sample, "Assessment Objective": "AO1/AO2" }]);
assert.ok(badAo.issues.some((issue) => issue.message.includes("must be AO1, AO2 or AO3")), "combined/invalid AO must fail");

const wrongSheet = parseWebsiteUploadWorkbook(makeWorkbook([sample], [...REQUIRED_HEADERS], "Sheet1"));
assert.equal(wrongSheet.sheetFound, false, "other sheets must not be read");

console.log(`Validation cases passed: duplicate ID, missing required values, invalid marks, invalid AO, header order, line breaks, exact worksheet. Total actual workbook rows: ${totalImported}.`);
