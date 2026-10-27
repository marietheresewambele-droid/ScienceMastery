import assert from "node:assert/strict";
import test from "node:test";
import { COMBINATIONS, reviewReasons, toggleCombination, visibleTo } from "@/lib/courseVisibility";

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

test("clicking a course picks the nearest valid setting", () => {
  const tripleHigher = COMBINATIONS[3];
  const combinedFoundation = COMBINATIONS[0];
  const combinedHigher = COMBINATIONS[1];
  const everywhere = { qualification: SHARED, tier: BOTH };
  // Triple Higher always shows every question, so it cannot be removed.
  assert.equal(toggleCombination(everywhere, tripleHigher), null);
  // Removing Combined Foundation also drops Triple Foundation (it shares the tier tag); coverage stays shared.
  const noCombinedFoundation = toggleCombination(everywhere, combinedFoundation);
  assert.deepEqual([noCombinedFoundation?.qualification, noCombinedFoundation?.tier], [SHARED, HIGHER]);
  assert.deepEqual(noCombinedFoundation?.alsoChanged, ["Triple · Foundation"]);
  // Removing Combined Higher leaves it Triple-only, so Combined Foundation goes too.
  const noCombinedHigher = toggleCombination(everywhere, combinedHigher);
  assert.deepEqual([noCombinedHigher?.qualification, noCombinedHigher?.tier], [SEPARATE, BOTH]);
  // Adding Combined Foundation to a Triple-Higher-only question makes it appear everywhere.
  const added = toggleCombination({ qualification: SEPARATE, tier: HIGHER }, combinedFoundation);
  assert.deepEqual([added?.qualification, added?.tier], [SHARED, BOTH]);
});
