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

const stopWords = new Set("a an and are as at be because by can for from has have if in is it of on or that the their then this to use was were with you your".split(" "));
const scientificWord = (word: string) => {
  const clean = word.replace(/[^A-Za-z]/g, "").toLowerCase();
  return clean.length >= 5 && !stopWords.has(clean);
};

function answerSource(question: MasteryQuestion) {
  return (question.modelAnswer || question.markingPoints.filter(Boolean).join(" ")).trim();
}

function isCalculation(question: MasteryQuestion, source: string) {
  return /\d/.test(question.question) && /\d/.test(source) && /[=÷×*/^]/.test(source);
}

function calculationHint(question: MasteryQuestion, source: string, revealValues: boolean) {
  const formula = source.match(/[^.!?]*(?:=|÷|×|\*|\/|\^)[^.!?]*/)?.[0]?.trim() || source;
  const result = formula.match(/^(.+?=\s*[^=]+?)(?:\s*=\s*([^\s]+))?(\s+[^=]*)?$/);
  if (!result) return `Formula: ${formula.replace(/\d+(?:\.\d+)?/g, "____")}`;
  const expression = result[1];
  if (!revealValues) return `Formula: ${expression.replace(/\d+(?:\.\d+)?/g, "____")}`;
  return `Substitute the values into the formula: ${expression}${result[2] ? " = ____" : ""}${result[3] || ""}`;
}

function wordHints(source: string): [string, string] {
  const words = source.split(/(\s+)/);
  const candidates = words.reduce<number[]>((indexes, word, index) => {
    if (scientificWord(word)) indexes.push(index);
    return indexes;
  }, []);
  const hintOne = words.map((word, index) => candidates.includes(index) ? "____" : word).join("");
  const revealCount = Math.max(1, Math.floor(candidates.length / 2));
  const revealed = new Set(candidates.slice(0, revealCount));
  const hintTwo = words.map((word, index) => candidates.includes(index) && !revealed.has(index) ? "____" : word).join("");
  return [`Complete the answer: ${hintOne}`, `Complete the remaining key terms: ${hintTwo}`];
}

function keywordHints(source: string, keywords: string[]): [string, string] {
  const approved = [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  if (!approved.length) return wordHints(source);
  const pattern = new RegExp(`(${approved.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const structure = source.replace(pattern, "____");
  return [
    `Complete the answer structure:\n${structure}`,
    `Use these key terms: ${approved.join(", ")}\n\nNow complete the answer structure:\n${structure}`,
  ];
}

export function getAdaptiveHints(question: MasteryQuestion): [string, string] {
  if (question.adaptiveHints?.length === 2) return question.adaptiveHints;
  const source = answerSource(question);
  if (!source) return ["Use the wording of the question to structure your answer.", "State the key point asked for in the question."];
  if (question.hintKeywords?.length) return keywordHints(source, question.hintKeywords);
  return isCalculation(question, source) ? [calculationHint(question, source, false), calculationHint(question, source, true)] : wordHints(source);
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
  if (evidence.answerRevealed) return 1;
  if (evidence.hintsUsed >= 2) return 2;
  if (evidence.hintsUsed === 1) return 3;
  const intervals = [7, 14, 30, 60];
  return intervals[Math.min(intervals.length - 1, Math.max(0, intervals.indexOf(previousDays) + 1))];
}
