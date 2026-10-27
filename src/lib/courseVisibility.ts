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
export const DIFFICULTIES = ["Core", "Standard", "Stretch"] as const;

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
