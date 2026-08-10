import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";

interface RawBiologyQuestion {
  id: string;
  topic?: string;
  question?: string;
  questionFamily?: string;
  subtopic?: string;
  sourceSubtopic?: string;
  tier?: "Foundation" | "Higher" | "Both" | string;
  questionText?: string;
  questionType?: string;
  marks?: number;
  modelAnswer?: string;
  markingPoints?: string[];
  commandWord?: string;
  assessmentObjective?: "AO1" | "AO2" | "AO3" | string;
  evidenceSource?: string;
  specificationReference?: string;
  gradeDemand?: string;
  knowledgeType?: string;
  originalSubtopic?: string;
}

interface RawBiologyQuestionBank {
  questions: RawBiologyQuestion[];
}

export function normaliseAssessmentObjective(value: unknown): MasteryQuestion["assessmentObjective"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const source = value.trim().toUpperCase();
  const tokens = Array.from(
    new Set((source.match(/AO[123]/g) ?? []).map((match) => match.toUpperCase()))
  );

  if (tokens.length === 0) {
    return null;
  }

  if (tokens.includes("AO1") && tokens.includes("AO2") && tokens.includes("AO3")) {
    return "AO1/AO2/AO3";
  }

  if (tokens.includes("AO1") && tokens.includes("AO2")) {
    return "AO1/AO2";
  }

  if (tokens.includes("AO2") && tokens.includes("AO3")) {
    return "AO2/AO3";
  }

  if (tokens.includes("AO1") && tokens.includes("AO3")) {
    return "AO1/AO3";
  }

  if (tokens.includes("AO1")) {
    return "AO1";
  }

  if (tokens.includes("AO2")) {
    return "AO2";
  }

  if (tokens.includes("AO3")) {
    return "AO3";
  }

  return null;
}

export function normaliseSubtopic(subtopic: string): string {
  return subtopic;
}

export function mapQuestionRecord(
  question: RawBiologyQuestion,
  index: number,
  topicSlug: string,
  topicTitle: string
): MasteryQuestion {
  if (!question.id || typeof question.id !== "string") {
    throw new Error(`Rejected ${topicTitle} record ${index + 1}: missing stable id`);
  }

  if (!question.question || typeof question.question !== "string" || !question.question.trim()) {
    throw new Error(`Rejected ${topicTitle} record ${question.id}: blank question text`);
  }

  if (typeof question.marks !== "number" || Number.isNaN(question.marks)) {
    throw new Error(`Rejected ${topicTitle} record ${question.id}: invalid marks`);
  }

  const markingPoints =
    Array.isArray(question.markingPoints)
      ? question.markingPoints.filter(
          (point): point is string => typeof point === "string" && point.trim().length > 0
        )
      : [];

  const modelAnswerIsUsable =
    typeof question.modelAnswer === "string" && question.modelAnswer.trim().length > 0;

  if (!modelAnswerIsUsable && markingPoints.length === 0) {
    throw new Error(`Rejected ${topicTitle} record ${question.id}: usable answer content is missing`);
  }

  const normalisedAssessmentObjective = normaliseAssessmentObjective(question.assessmentObjective);

  if (!normalisedAssessmentObjective) {
    throw new Error(`Rejected ${topicTitle} record ${question.id}: invalid assessmentObjective`);
  }

  const rawSubtopic = question.subtopic ?? question.sourceSubtopic ?? "";
  if (!rawSubtopic || typeof rawSubtopic !== "string") {
    throw new Error(`Rejected ${topicTitle} record ${question.id}: missing subtopic`);
  }

  const normalisedSubtopic = normaliseSubtopic(rawSubtopic);

  const difficulty =
    question.tier === "Foundation" || question.tier === "Higher" || question.tier === "Both"
      ? question.tier
      : undefined;

  return {
    id: question.id,
    subject: "biology",
    topicSlug,
    topic: question.topic ?? topicTitle,
    subtopic: normalisedSubtopic,
    question: question.question,
    marks: question.marks,
    assessmentObjective: normalisedAssessmentObjective,
    difficulty,
    commandWord: question.commandWord,
    specificationReference: question.specificationReference,
    markingPoints,
    modelAnswer: question.modelAnswer,
    tier: typeof question.tier === "string" ? (question.tier as "Foundation" | "Higher" | "Both") : undefined,
    gradeDemand: question.gradeDemand,
    questionFamily: question.questionFamily,
    originalSubtopic: question.sourceSubtopic ?? question.subtopic,
  };
}

export function createTopicQuestions<T extends RawBiologyQuestionBank>(
  bank: T,
  topicSlug: string,
  topicTitle: string
): MasteryQuestion[] {
  return bank.questions.map((question, index) => mapQuestionRecord(question, index, topicSlug, topicTitle));
}

export function createTopicSubtopics(subtopics: Array<{ title: string; description?: string }>): BiologySubtopicConfig[] {
  return subtopics.map((subtopic, index) => ({
    id: `${subtopic.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
    title: subtopic.title,
    description: subtopic.description,
  }));
}

export function createTopicConfig(
  config: Omit<BiologyTopicConfig, "questions" | "subtopics">
): Omit<BiologyTopicConfig, "questions" | "subtopics"> {
  return config;
}
