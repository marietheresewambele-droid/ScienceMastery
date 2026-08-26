import type { MasteryQuestion, ReviewRating } from "@/types/questions";

export type AdaptiveOutcome = "incorrect" | "supported_correct" | "independent_correct";
export type AdaptiveRelationship = "prerequisite" | "diagnostic" | "easier" | "parallel" | "harder";

export type AdaptiveEvidence = {
  rating: ReviewRating;
  hintsUsed: number;
  answerRevealed: boolean;
};

export const catalogQuestionId = (question: Pick<MasteryQuestion, "subject" | "topicSlug" | "id">) =>
  "databaseId" in question && typeof question.databaseId === "string"
    ? question.databaseId
    : `${question.subject === "biology" ? "BIO" : question.subject === "chemistry" ? "CHE" : "PHY"}-${question.topicSlug}-${question.id}`;

const aoRank = (ao: string) => (ao.includes("AO3") ? 3 : ao.includes("AO2") ? 2 : 1);
const demand = (q: MasteryQuestion) => aoRank(q.assessmentObjective) * 10 + q.marks;
const family = (q: MasteryQuestion) => q.questionFamily || `${q.topicSlug}:${q.subtopic}:${q.commandWord || "question"}`;

export function classifyOutcome({ rating, hintsUsed }: AdaptiveEvidence): AdaptiveOutcome {
  if (rating === "again") return "incorrect";
  if (hintsUsed > 0 || rating === "hard") return "supported_correct";
  return "independent_correct";
}

export function getAdaptiveHints(question: MasteryQuestion): [string, string, string] {
  if (question.adaptiveHints) return question.adaptiveHints;
  const command = question.commandWord || "answer";
  const points = question.markingPoints.filter(Boolean);
  const structure = `${command}: plan ${question.marks} distinct marking point${question.marks === 1 ? "" : "s"}. Use the scientific terms in the question.`;
  const guided = question.subtopic
    ? `Focus on ${question.subtopic}. State the relevant scientific idea, then apply it directly to this situation.`
    : "State the relevant scientific idea, then apply it directly to the situation in the question.";
  const scaffold = points.length
    ? `Begin with this approved marking point, then complete the explanation yourself: ${points[0]}`
    : `Use the exact scientific term needed for this ${question.assessmentObjective} question.`;
  return [structure, guided, scaffold];
}

export function relatedQuestion(
  current: MasteryQuestion,
  questions: MasteryQuestion[],
  relationship: AdaptiveRelationship,
): MasteryQuestion | undefined {
  const explicitTarget = current.adaptiveRelationships?.[relationship];
  if (explicitTarget) {
    const explicit = questions.find((question) => catalogQuestionId(question) === explicitTarget);
    if (explicit) return explicit;
  }
  const sameFamily = questions.filter((q) => q.id !== current.id && family(q) === family(current));
  const sameSubtopic = questions.filter((q) => q.id !== current.id && q.subtopic === current.subtopic);
  const pool = sameFamily.length ? sameFamily : sameSubtopic;
  const score = demand(current);
  if (relationship === "prerequisite" || relationship === "diagnostic") {
    return [...pool].sort((a, b) => aoRank(a.assessmentObjective) - aoRank(b.assessmentObjective) || demand(a) - demand(b))[0];
  }
  if (relationship === "easier") {
    return [...pool].filter((q) => demand(q) < score).sort((a, b) => demand(b) - demand(a))[0];
  }
  if (relationship === "harder") {
    return [...pool].filter((q) => demand(q) > score).sort((a, b) => demand(a) - demand(b))[0];
  }
  return [...pool].sort((a, b) => Math.abs(demand(a) - score) - Math.abs(demand(b) - score))[0];
}

export function nextAdaptiveQuestion(current: MasteryQuestion, questions: MasteryQuestion[], evidence: AdaptiveEvidence) {
  const outcome = classifyOutcome(evidence);
  if (outcome === "incorrect") {
    return relatedQuestion(current, questions, "prerequisite") || relatedQuestion(current, questions, "easier");
  }
  if (outcome === "supported_correct") return relatedQuestion(current, questions, "parallel");
  return relatedQuestion(current, questions, "harder");
}

export function retrievalDays(question: MasteryQuestion, evidence: AdaptiveEvidence, previousDays = 0) {
  const outcome = classifyOutcome(evidence);
  if (outcome === "incorrect") return 0;
  if (outcome === "supported_correct") return Math.max(1, previousDays || (aoRank(question.assessmentObjective) >= 3 ? 2 : 3));
  return Math.max(3, previousDays ? Math.round(previousDays * (evidence.rating === "easy" ? 3 : 2)) : aoRank(question.assessmentObjective) >= 3 ? 3 : 7);
}
