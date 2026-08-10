import ecologyQuestionBank from "@/data/biology/AQA-GCSE-Biology-JSON-All-Topics/ecology-questions.json";
import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";
import { createTopicQuestions } from "@/data/topics/biology-topic-utils";

interface EcologyQuestionBank {
  metadata?: {
    topicId?: string;
    topic?: string;
    questionCount?: number;
    subtopics?: Array<{
      title?: string;
      questionCount?: number;
    }>;
  };
  questions: Array<{
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
  }>;
}

const ecologyData = ecologyQuestionBank as EcologyQuestionBank;

export const ecologyQuestions: MasteryQuestion[] = createTopicQuestions(
  ecologyData,
  "ecology",
  "Ecology"
);

const ecologySubtopics: BiologySubtopicConfig[] =
  ecologyData.metadata?.subtopics?.map((subtopic, index) => ({
    id: `${subtopic.title ?? `subtopic-${index + 1}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: subtopic.title ?? "Unknown subtopic",
    description: "Practice questions for this subtopic.",
  })) ?? [];

export const ecologyConfig: BiologyTopicConfig = {
  id: "ecology",
  title: "Ecology",
  description:
    "Review ecosystems, biodiversity, adaptation and human impacts through structured mastery practice.",
  route: "/biology/ecology",
  storageNamespace: "sciencemastery_ecology",
  questions: ecologyQuestions,
  subtopics: ecologySubtopics,
  subject: "biology",
  examBoard: "AQA",
  topicNumber: "Topic 7",
};
