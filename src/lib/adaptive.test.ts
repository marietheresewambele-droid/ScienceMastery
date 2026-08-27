import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { MasteryQuestion } from "@/types/questions";
import { AdaptiveEngine, type LearningSnapshot, aggregateMastery } from "@/lib/adaptive";
import { validateQuestionWorkbook } from "@/lib/contentValidation";

class MemoryStore {
  snapshot: LearningSnapshot = { attempts: [], mastery: {} };
  read() { return this.snapshot; }
  write(snapshot: LearningSnapshot) { this.snapshot = snapshot; }
  recordBookmark() {}
}

const question: MasteryQuestion = {
  id: "BIO-TEST-001", subject: "biology", topicSlug: "cells", topic: "Cell Biology", subtopic: "Transport",
  question: "Explain osmosis", marks: 1, assessmentObjective: "AO2", markingPoints: ["Water moves through a partially permeable membrane"],
  questionFamily: "Osmosis", hints: ["Name the process", "Identify the membrane", "State the direction"],
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
  store.snapshot.mastery[question.id].lastAttemptAt = new Date(Date.now() - 3 * 86400000).toISOString();
  const result = engine.evaluateAttempt({ question, score: 1, maxScore: 1, hintsUsed: 0, fullAnswerViewed: false, responseTimeMs: 100 });
  assert.equal(result.level, "Secure");
  assert.equal(aggregateMastery(store.snapshot, [question])["family:Osmosis"].masteryPercent, 100);
});

test("validator rejects duplicates and broken relationships", () => {
  const issues = validateQuestionWorkbook([question, question], [{ sourceId: question.id, targetId: "missing", relationship: "Parallel" }]);
  assert.ok(issues.some((issue) => issue.code === "DUPLICATE_ID"));
  assert.ok(issues.some((issue) => issue.code === "BROKEN_RELATIONSHIP"));
});
