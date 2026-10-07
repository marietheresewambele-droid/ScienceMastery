import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { MasteryQuestion } from "@/types/questions";
import { AdaptiveEngine, type LearningSnapshot, aggregateMastery } from "@/lib/adaptive";
import { catalogQuestionId, getAdaptiveHints, keyTermHints } from "@/lib/adaptive-engine";
import { compareQuestions } from "@/lib/questionBank";

class MemoryStore {
  snapshot: LearningSnapshot = { attempts: [], mastery: {} };
  read() { return this.snapshot; }
  write(snapshot: LearningSnapshot) { this.snapshot = snapshot; }
  recordBookmark() {}
}

const question: MasteryQuestion = {
  id: "BIO-TEST-001", subject: "biology", topicSlug: "cells", topic: "Cell Biology", subtopic: "Transport",
  question: "Explain osmosis", marks: 1, assessmentObjective: "AO2", markingPoints: ["Water moves through a partially permeable membrane"],
  questionFamily: "Osmosis",
};

test("full answer view does not increase mastery", () => {
  const store = new MemoryStore();
  const engine = new AdaptiveEngine(store);
  const result = engine.evaluateAttempt({ question, score: 1, maxScore: 1, hintsUsed: 0, fullAnswerViewed: true, responseTimeMs: 100 });
  assert.equal(result.level, "New");
  assert.equal(result.independentSuccesses, 0);
});

test("two independent attempts and delayed retrieval produce secure mastery", () => {
  const store = new MemoryStore();
  const engine = new AdaptiveEngine(store);
  engine.evaluateAttempt({ question, score: 1, maxScore: 1, hintsUsed: 0, fullAnswerViewed: false, responseTimeMs: 100 });
  store.snapshot.mastery[catalogQuestionId(question)].lastAttemptAt = new Date(Date.now() - 3 * 86400000).toISOString();
  const result = engine.evaluateAttempt({ question, score: 1, maxScore: 1, hintsUsed: 0, fullAnswerViewed: false, responseTimeMs: 100 });
  assert.equal(result.level, "Secure");
  assert.equal(aggregateMastery(store.snapshot, [question])["family:Osmosis"].masteryPercent, 100);
});

test("questions that reuse the same raw id across topics do not share mastery state", () => {
  const store = new MemoryStore();
  const engine = new AdaptiveEngine(store);
  const other: MasteryQuestion = { ...question, topicSlug: "ecology", topic: "Ecology" };
  engine.evaluateAttempt({ question, score: 1, maxScore: 1, hintsUsed: 0, fullAnswerViewed: false, responseTimeMs: 100 });
  const otherResult = engine.evaluateAttempt({ question: other, score: 0, maxScore: 1, hintsUsed: 0, fullAnswerViewed: false, responseTimeMs: 100 });
  assert.notEqual(catalogQuestionId(question), catalogQuestionId(other));
  assert.equal(store.snapshot.mastery[catalogQuestionId(question)].independentSuccesses, 1);
  assert.equal(otherResult.independentSuccesses, 0);
});

test("bank question IDs are used as-is for mastery", () => {
  assert.equal(catalogQuestionId({ ...question, id: "CHEM-T01-Q001" }), "CHEM-T01-Q001");
});

test("hints hide the key terms from the model answer", () => {
  const [hidden, firstLetters] = keyTermHints("Delocalised electrons carry charge.\nThe alloy is harder.", ["delocalised electrons", "alloy"])!;
  assert.equal(hidden, "Fill in the missing key terms:\n____ ____ carry charge.\nThe ____ is harder.");
  assert.equal(firstLetters, "Fill in the key terms (first letters shown):\nD__________ e________ carry charge.\nThe a____ is harder.");
});

test("key terms match whole terms, including chemical formulae and ions", () => {
  const [hidden] = keyTermHints("K = Potassium, kinetic\nCl₂ + 2Br⁻ → 2Cl⁻ + Br₂\nCaCO₃", ["K", "Br⁻", "Cl⁻", "CaCO"])!;
  assert.equal(hidden, "Fill in the missing key terms:\n____ = Potassium, kinetic\nCl₂ + 2____⁻ → 2____⁻ + Br₂\n____₃");
});

test("questions without usable key terms fall back to automatic hints", () => {
  assert.equal(keyTermHints("Water moves by osmosis.", ["diffusion"]), null);
  const [first] = getAdaptiveHints({ ...question, modelAnswer: "Water moves through a partially permeable membrane", keyTerms: ["diffusion"] });
  assert.match(first, /^Complete the answer:/);
});

test("questions are ordered AO1 -> AO2 -> AO3, then subtopic, then workbook row", () => {
  const make = (id: string, assessmentObjective: "AO1" | "AO2" | "AO3", subtopicOrder: number, sortOrder: number): MasteryQuestion =>
    ({ ...question, id, assessmentObjective, subtopicOrder, sortOrder, topicNumber: 1 });
  const ordered = [make("c", "AO3", 1, 0), make("b", "AO2", 2, 0), make("a2", "AO1", 2, 5), make("a1", "AO1", 1, 9), make("b0", "AO2", 1, 3)]
    .sort(compareQuestions)
    .map((item) => item.id);
  assert.deepEqual(ordered, ["a1", "a2", "b0", "b", "c"]);
});
