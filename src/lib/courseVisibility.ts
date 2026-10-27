import type { CoursePathway, CourseTier } from "@/lib/courses";

/**
 * Where a question appears. Two independent tags decide it:
 *  - coverage (stored in question_catalog.qualification): shared by Combined and Separate, or Separate only
 *  - tier availability (question_catalog.tier): Foundation and Higher, or Higher only
 * Foundation content stays available to Higher students, so tier only ever hides questions from Foundation.
 */
export const COVERAGE_VALUES = ["Combined and Separate Science", "Separate Science only"] as const;
export const TIER_VALUES = ["Foundation and Higher", "Higher only"] as const;
/** Older workbooks used "Foundation only". It is no longer a valid tag and is flagged for review. */
export const LEGACY_TIER = "Foundation only";

export const COVERAGE_LABEL: Record<string, string> = {
  "Combined and Separate Science": "Shared",
  "Separate Science only": "Separate only",
};
export const TIER_LABEL: Record<string, string> = {
  "Foundation and Higher": "Both",
  "Higher only": "Higher only",
  [LEGACY_TIER]: "Foundation only (legacy)",
};

export interface Combination {
  pathway: CoursePathway;
  tier: CourseTier;
  label: string;
}
export const COMBINATIONS: Combination[] = [
  { pathway: "combined", tier: "Foundation", label: "Combined · Foundation" },
  { pathway: "combined", tier: "Higher", label: "Combined · Higher" },
  { pathway: "triple", tier: "Foundation", label: "Triple · Foundation" },
  { pathway: "triple", tier: "Higher", label: "Triple · Higher" },
];

export function visibleTo(question: { qualification: string; tier: string }, pathway: CoursePathway, tier: CourseTier): boolean {
  if (question.qualification === "Separate Science only" && pathway === "combined") return false;
  if (question.tier === "Higher only" && tier === "Foundation") return false;
  return true;
}

/** Tags that are missing or no longer part of the scheme; such questions need an admin to retag them. */
export function reviewReasons(question: { qualification?: string | null; tier?: string | null }): string[] {
  const reasons: string[] = [];
  if (!question.qualification || !(COVERAGE_VALUES as readonly string[]).includes(question.qualification)) reasons.push("Course coverage tag missing or invalid");
  if (!question.tier || !(TIER_VALUES as readonly string[]).includes(question.tier)) reasons.push("Tier tag missing or invalid");
  return reasons;
}

const SETTINGS = COVERAGE_VALUES.flatMap((qualification) => TIER_VALUES.map((tier) => ({ qualification: qualification as string, tier: tier as string })));
const visibleLabels = (question: { qualification: string; tier: string }) =>
  COMBINATIONS.filter((combination) => visibleTo(question, combination.pathway, combination.tier)).map((combination) => combination.label);

/**
 * Clicking a course in the editor adds or removes the question from it. Only four coverage x tier
 * combinations exist, so this picks the nearest valid one: adding takes the smallest setting that
 * keeps everything already shown, removing keeps as much else as possible (preferring to leave
 * coverage alone). Returns null when the change is impossible: Triple Higher always shows every question.
 */
export function toggleCombination(
  current: { qualification: string; tier: string },
  combination: Combination,
): { qualification: string; tier: string; alsoChanged: string[] } | null {
  const now = new Set(visibleLabels(current));
  const adding = !now.has(combination.label);
  const options = SETTINGS.map((setting) => ({ setting, shown: new Set(visibleLabels(setting)) }));
  let pick: (typeof options)[number] | undefined;
  if (adding) {
    pick = options
      .filter((option) => option.shown.has(combination.label) && [...now].every((label) => option.shown.has(label)))
      .sort((left, right) => left.shown.size - right.shown.size)[0];
  } else {
    pick = options
      .filter((option) => !option.shown.has(combination.label) && option.shown.size > 0 && [...option.shown].every((label) => now.has(label)))
      .sort((left, right) => right.shown.size - left.shown.size || Number(right.setting.qualification === current.qualification) - Number(left.setting.qualification === current.qualification))[0];
  }
  if (!pick) return null;
  const alsoChanged = [...new Set([...now, ...pick.shown])].filter((label) => label !== combination.label && now.has(label) !== pick.shown.has(label));
  return { ...pick.setting, alsoChanged };
}
