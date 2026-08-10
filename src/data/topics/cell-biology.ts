import cellBiologyQuestionBank from "@/data/biology/cell-biology-questions.json";
import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion, TopicMetadata } from "@/types/questions";

interface RawCellBiologyQuestion {
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

interface RawCellBiologyQuestionBank {
  questions: RawCellBiologyQuestion[];
}

function normaliseAssessmentObjective(value: unknown): MasteryQuestion["assessmentObjective"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const source = value.trim().toUpperCase();
  const tokens = Array.from(new Set((source.match(/AO[123]/g) ?? []).map((match) => match.toUpperCase())));

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

function normaliseSubtopic(subtopic: string): string {
  switch (subtopic) {
    case "1.1 Cell Structure":
    case "Cell Structure":
      return "Cell Structure";
    case "1.2 Cell Division":
    case "Cell Division":
      return "Cell Division";
    case "1.3 Transport in Cells":
    case "Transport in Cells":
      return "Transport in Cells";
    default:
      return subtopic;
  }
}

function mapCellBiologyRecord(
  question: RawCellBiologyQuestion,
  index: number
): MasteryQuestion {
  if (!question.id || typeof question.id !== "string") {
    throw new Error(`Rejected Cell Biology record ${index + 1}: missing stable id`);
  }

  if (!question.question || typeof question.question !== "string" || !question.question.trim()) {
    throw new Error(`Rejected Cell Biology record ${question.id}: blank question text`);
  }

  if (typeof question.marks !== "number" || Number.isNaN(question.marks)) {
    throw new Error(`Rejected Cell Biology record ${question.id}: invalid marks`);
  }

  const markingPoints =
    Array.isArray(question.markingPoints)
      ? question.markingPoints.filter(
          (point): point is string =>
            typeof point === "string" && point.trim().length > 0
        )
      : [];

  const modelAnswerIsUsable =
    typeof question.modelAnswer === "string" &&
    question.modelAnswer.trim().length > 0;

  if (!modelAnswerIsUsable && markingPoints.length === 0) {
    throw new Error(`Rejected Cell Biology record ${question.id}: usable answer content is missing`);
  }

  const normalisedAssessmentObjective = normaliseAssessmentObjective(
    question.assessmentObjective
  );

  if (!normalisedAssessmentObjective) {
    throw new Error(`Rejected Cell Biology record ${question.id}: invalid assessmentObjective`);
  }

  const rawSubtopic = question.subtopic ?? question.sourceSubtopic ?? "";
  if (!rawSubtopic || typeof rawSubtopic !== "string") {
    throw new Error(`Rejected Cell Biology record ${question.id}: missing subtopic`);
  }

  const normalisedSubtopic = normaliseSubtopic(rawSubtopic);

  const difficulty =
    question.tier === "Foundation" || question.tier === "Higher" || question.tier === "Both"
      ? question.tier
      : undefined;

  return {
    id: question.id,
    subject: "biology",
    topicSlug: "cell-biology",
    topic: question.topic ?? "Cell Biology",
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

const cellBiologyData = cellBiologyQuestionBank as RawCellBiologyQuestionBank;

export const cellBiologyMetadata: TopicMetadata = {
  subject: "biology",
  title: "Cell Biology",
  slug: "cell-biology",
  examBoard: "AQA",
  topicNumber: "Topic 1",
  description:
    "Review cell structure, microscopy, cell division, stem cells and transport in cells through structured mastery practice.",
  subtopics: ["Cell Structure", "Cell Division", "Transport in Cells"],
};

export const cellBiologyQuestions: MasteryQuestion[] = cellBiologyData.questions.map(
  mapCellBiologyRecord
);

const cellBiologySubtopics: BiologySubtopicConfig[] = [
  {
    id: "cell-structure",
    title: "Cell Structure",
    description: "Study the structure and function of cells and organelles.",
  },
  {
    id: "cell-division",
    title: "Cell Division",
    description: "Review cell division, chromosomes and mitosis.",
  },
  {
    id: "transport-in-cells",
    title: "Transport in Cells",
    description: "Explore diffusion, osmosis and active transport.",
  },
];

export const cellBiologyConfig: BiologyTopicConfig = {
  id: "cell-biology",
  title: "Cell Biology",
  description:
    "Master the fundamentals of cell biology through focused practice questions. Compare your answers with marking points and use active recall to build lasting understanding.",
  route: "/biology/cell-biology",
  storageNamespace: "sciencemastery_cellbiology",
  questions: cellBiologyQuestions,
  subtopics: cellBiologySubtopics,
  subject: "biology",
  examBoard: "AQA",
  topicNumber: "Topic 1",
};
