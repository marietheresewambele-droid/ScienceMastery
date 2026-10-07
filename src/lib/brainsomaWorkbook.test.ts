import { strict as assert } from "node:assert";
import { test } from "node:test";
import * as XLSX from "xlsx";
import { orderSubtopics, parseBrainsomaWorkbook } from "@/lib/brainsomaWorkbook";

const HEADERS = ["Question ID", "Legacy ID", "Subject", "Unit", "Topic", "Subtopic", "Specification Reference", "Question", "Model Answer", "Marks (1–6)", "Assessment Objective", "Qualification", "Tier", "Grade", "Question Type", "Key Terms", "Source / Notes"];

function row(overrides: Record<string, string | number> = {}) {
  const base: Record<string, string | number> = {
    "Question ID": "BIO-T01-Q001", "Legacy ID": "CS01", Subject: "Biology", Unit: "T1", Topic: "Cell Biology",
    Subtopic: "1.1 Cell Structure", "Specification Reference": "4.1.1.2", Question: "Name two structures in an animal cell.",
    "Model Answer": "Nucleus.\nCell membrane.", "Marks (1–6)": 2, "Assessment Objective": "AO1",
    Qualification: "Combined and Separate Science", Tier: "Foundation and Higher", Grade: "Grades 3–5",
    "Question Type": "Name", "Key Terms": "nucleus; cell membrane", "Source / Notes": "Very common",
  };
  const merged = { ...base, ...overrides };
  return HEADERS.map((header) => merged[header] ?? "");
}

function workbook(sheets: Record<string, (string | number)[][]>) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Guide"], ["Total questions", "2"]]), "Guide");
  for (const [name, rows] of Object.entries(sheets)) {
    // Same layout as the BrainSoma files: title, subtitle, blank row, then the header row.
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([[`BIO ${name}`], ["2 questions"], [], HEADERS, ...rows]), name);
  }
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

test("parses a BrainSoma topic sheet into subject/topic/subtopic rows", () => {
  const result = parseBrainsomaWorkbook(workbook({
    "T1 Cell Biology": [row(), row({ "Question ID": "BIO-T01-Q002", Subtopic: "1.2 Cell Division", "Assessment Objective": "AO2" })],
  }));
  assert.deepEqual(result.issues.filter((issue) => issue.severity === "error"), []);
  assert.equal(result.rows.length, 2);
  const [first] = result.rows;
  assert.equal(first.subject, "biology");
  assert.equal(first.topicNumber, 1);
  assert.equal(first.subtopic, "1.1 Cell Structure");
  assert.equal(first.marks, 2);
  assert.equal(first.modelAnswer, "Nucleus.\nCell membrane.");
  assert.deepEqual(first.keyTerms, ["nucleus", "cell membrane"]);
  assert.deepEqual(result.topics[0].subtopics.map((subtopic) => subtopic.name), ["1.1 Cell Structure", "1.2 Cell Division"]);
});

test("rejects bad values, mismatched IDs, duplicates and leftover total rows", () => {
  const result = parseBrainsomaWorkbook(workbook({
    "T1 Cell Biology": [
      row(),
      row(),
      row({ "Question ID": "CHEM-T01-Q003" }),
      row({ "Question ID": "BIO-T02-Q004" }),
      row({ "Question ID": "BIO-T01-Q005", Tier: "Both", "Assessment Objective": "AO4", "Marks (1–6)": 7 }),
      row({ "Question ID": "BIO-T01-Q006", Question: "159.0", "Model Answer": "Student total." }),
    ],
  }));
  const messages = result.issues.filter((issue) => issue.severity === "error").map((issue) => `${issue.questionId}: ${issue.message}`);
  assert.ok(messages.some((message) => message.startsWith("BIO-T01-Q001: Duplicate Question ID")));
  assert.ok(messages.some((message) => message.startsWith("CHEM-T01-Q003: Question ID prefix CHEM")));
  assert.ok(messages.some((message) => message.startsWith("BIO-T02-Q004: Question ID topic T02")));
  assert.ok(messages.some((message) => message.startsWith("BIO-T01-Q005: Tier must be")));
  assert.ok(messages.some((message) => message.startsWith("BIO-T01-Q005: Assessment Objective")));
  assert.ok(messages.some((message) => message.startsWith("BIO-T01-Q005: Marks must")));
  assert.ok(messages.some((message) => message.startsWith("BIO-T01-Q006: Question is only a number")));
  assert.equal(result.rows.length, 1);
});

test("warns about unnumbered subtopics and key terms missing from the answer", () => {
  const result = parseBrainsomaWorkbook(workbook({
    "T1 Cell Biology": [row(), row({ "Question ID": "BIO-T01-Q002", Subtopic: "Microscopy", "Key Terms": "magnification" })],
  }));
  const warnings = result.issues.filter((issue) => issue.severity === "warning").map((issue) => issue.message);
  assert.ok(warnings.some((message) => message.startsWith('Subtopic "Microscopy" (1 question) is not one of the numbered subtopics')));
  assert.ok(warnings.some((message) => message.includes("not found in the Model Answer") && message.includes("magnification")));
  assert.equal(result.rows.length, 2);
});

test("numbered subtopics sort numerically; unnumbered ones follow in sheet order", () => {
  assert.deepEqual(
    orderSubtopics(["1.10 Late", "Microscopy", "1.2 Cell Division", "1.1 Cell Structure", "Osmosis", "1.2 Cell Division"]),
    ["1.1 Cell Structure", "1.2 Cell Division", "1.10 Late", "Microscopy", "Osmosis"],
  );
});
