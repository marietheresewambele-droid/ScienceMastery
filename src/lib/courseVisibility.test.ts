import assert from "node:assert/strict";
import test from "node:test";
import { COMBINATIONS, reviewReasons, visibleTo } from "@/lib/courseVisibility";

const SHARED = "Combined and Separate Science";
const SEPARATE = "Separate Science only";
const BOTH = "Foundation and Higher";
const HIGHER = "Higher only";

// Order: Combined FT, Combined HT, Triple FT, Triple HT.
const matrix: [string, string, boolean[]][] = [
  [SHARED, BOTH, [true, true, true, true]],
  [SHARED, HIGHER, [false, true, false, true]],
  [SEPARATE, BOTH, [false, false, true, true]],
  [SEPARATE, HIGHER, [false, false, false, true]],
];

for (const [qualification, tier, expected] of matrix) {
  test(`${qualification} / ${tier} appears in the right courses`, () => {
    assert.deepEqual(COMBINATIONS.map((course) => visibleTo({ qualification, tier }, course.pathway, course.tier)), expected);
  });
}

test("legacy and missing tags are flagged for review", () => {
  assert.deepEqual(reviewReasons({ qualification: SHARED, tier: BOTH }), []);
  assert.equal(reviewReasons({ qualification: SHARED, tier: "Foundation only" }).length, 1);
  assert.equal(reviewReasons({ qualification: null, tier: null }).length, 2);
});
