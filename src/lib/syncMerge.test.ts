import assert from "node:assert/strict";
import test from "node:test";
import { classifyKey, mergeValues, sameValue } from "@/lib/syncMerge";
import { bestStreak, currentStreak, dayKey, goalDaysMet, recentDays } from "@/lib/activityMath";

const review = (id: string, reviewedAt: string, rating = "good") => ({ id, rating, reviewedAt, dueAt: reviewedAt, intervalDays: 1, repetitions: 1 });

test("only progress keys are synced", () => {
  assert.equal(classifyKey("brainsoma_v2_physics_energy_reviews"), "reviews");
  assert.equal(classifyKey("brainsoma_v2_chemistry_organic_chemistry_completed"), "ids");
  assert.equal(classifyKey("brainsoma_v2_biology_ecology_bookmarks"), "lww");
  assert.equal(classifyKey("sciencemastery_courses_v1"), "courses");
  assert.equal(classifyKey("sciencemastery_activity_v1"), "activity");
  assert.equal(classifyKey("sciencemastery_session_v1:flashcards:physics:energy:"), null);
  assert.equal(classifyKey("sb-project-auth-token"), null);
});

test("reviews keep the newer record per question and lose nothing", () => {
  const phone = [review("Q1", "2026-10-01T10:00:00Z", "again"), review("Q2", "2026-10-03T10:00:00Z")];
  const laptop = [review("Q1", "2026-10-02T10:00:00Z", "easy"), review("Q3", "2026-10-02T10:00:00Z")];
  const merged = mergeValues("reviews", phone, 0, laptop, 0) as { id: string; rating: string }[];
  assert.deepEqual(merged.map((item) => item.id), ["Q1", "Q2", "Q3"]);
  assert.equal(merged[0].rating, "easy");
  // Merging is order independent.
  assert.ok(sameValue("reviews", merged, mergeValues("reviews", laptop, 0, phone, 0)));
});

test("completed questions are unioned", () => {
  assert.deepEqual(mergeValues("ids", ["B", "A"], 0, ["C", "A"], 0), ["A", "B", "C"]);
});

test("last-write-wins keys follow the newer timestamp", () => {
  assert.deepEqual(mergeValues("lww", ["old"], 100, ["new"], 200), ["new"]);
  assert.deepEqual(mergeValues("lww", ["mine"], 300, ["theirs"], 200), ["mine"]);
  assert.deepEqual(mergeValues("lww", undefined, 0, ["remote"], 5), ["remote"]);
});

test("courses added before sign-in are kept next to the account's", () => {
  const guest = [{ id: "a" }];
  const account = [{ id: "b" }];
  const merged = mergeValues("courses", guest, 0, account, 10) as { id: string }[];
  assert.deepEqual(merged.map((course) => course.id).sort(), ["a", "b"]);
  // Once the device has its own edit history a removal is respected.
  assert.deepEqual(mergeValues("courses", [], 500, account, 10), []);
});

test("activity keeps the larger count per day and the newer goal", () => {
  const merged = mergeValues("activity", { days: { "2026-10-01": 5, "2026-10-02": 2 }, goal: 20, goalUpdatedAt: 1 }, 0, { days: { "2026-10-01": 9 }, goal: 30, goalUpdatedAt: 5 }, 0) as { days: Record<string, number>; goal: number };
  assert.deepEqual(merged.days, { "2026-10-01": 9, "2026-10-02": 2 });
  assert.equal(merged.goal, 30);
});

test("streaks count consecutive days and stay alive until the end of today", () => {
  const today = new Date(2026, 9, 27, 15);
  const days = { "2026-10-23": 4, "2026-10-24": 1, "2026-10-25": 12, "2026-10-26": 3 };
  assert.equal(currentStreak(days, today), 4);
  assert.equal(currentStreak({ ...days, "2026-10-27": 1 }, today), 5);
  assert.equal(currentStreak({ "2026-10-20": 2 }, today), 0);
  assert.equal(bestStreak({ ...days, "2026-10-20": 1, "2026-10-21": 1 }), 4);
  assert.equal(bestStreak({}), 0);
  assert.equal(goalDaysMet({ a: 20, b: 19, c: 40 }, 20), 2);
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  const week = recentDays(days, 7, today);
  assert.equal(week.length, 7);
  assert.equal(week[6].key, "2026-10-27");
  assert.equal(week[5].count, 3);
});
