import "server-only";

/* The Supabase filter builder's generics are not worth spelling out for a chain of .eq/.or calls. */
/* eslint-disable @typescript-eslint/no-explicit-any */

const EXACT_FILTERS = [
  ["subject", "subject"],
  ["topic", "topic_slug"],
  ["subtopic", "subtopic"],
  ["tier", "tier"],
  ["qualification", "qualification"],
  ["grade", "grade"],
  ["assessmentObjective", "assessment_objective"],
] as const;

/** The admin question filters, shared by the list and the "select all matching" bulk update. */
export function applyQuestionFilters<T>(builder: T, params: URLSearchParams): T {
  let query = builder as any;
  for (const [param, column] of EXACT_FILTERS) {
    const value = params.get(param)?.trim();
    if (value) query = query.eq(column, value);
  }
  // Course / tier filters show what a student on that course sees (Triple sees everything; Foundation never sees Higher-only).
  if (params.get("course") === "combined") query = query.eq("qualification", "Combined and Separate Science");
  if (params.get("level") === "Foundation") query = query.neq("tier", "Higher only");
  // Questions whose coverage/tier tag is missing or no longer part of the scheme.
  if (params.get("needsReview") === "true") {
    query = query.or("qualification.is.null,tier.is.null,tier.eq.Foundation only,qualification.not.in.(Combined and Separate Science,Separate Science only),tier.not.in.(Foundation and Higher,Higher only,Foundation only)");
  }
  const active = params.get("active");
  if (active === "true" || active === "false") query = query.eq("active", active === "true");
  const search = params.get("search")?.trim() || "";
  if (search) {
    const escaped = search.replace(/[%_,()]/g, (match) => `\\${match}`);
    query = query.or(`id.ilike.%${escaped}%,question.ilike.%${escaped}%,model_answer.ilike.%${escaped}%`);
  }
  return query as T;
}
