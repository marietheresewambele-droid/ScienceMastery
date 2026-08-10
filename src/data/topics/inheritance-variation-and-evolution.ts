import inheritanceVariationAndEvolutionQuestionBank from "@/data/biology/AQA-GCSE-Biology-JSON-All-Topics/inheritance-variation-and-evolution-questions.json";
import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";
import { createTopicQuestions } from "@/data/topics/biology-topic-utils";

interface InheritanceVariationAndEvolutionQuestionBank {
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

const inheritanceVariationAndEvolutionData = inheritanceVariationAndEvolutionQuestionBank as InheritanceVariationAndEvolutionQuestionBank;

export const inheritanceVariationAndEvolutionQuestions: MasteryQuestion[] = createTopicQuestions(
  inheritanceVariationAndEvolutionData,
  "inheritance-variation-and-evolution",
  "Inheritance, Variation and Evolution"
);

const inheritanceVariationAndEvolutionSubtopics: BiologySubtopicConfig[] =
  inheritanceVariationAndEvolutionData.metadata?.subtopics?.map((subtopic, index) => ({
    id: `${subtopic.title ?? `subtopic-${index + 1}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: subtopic.title ?? "Unknown subtopic",
    description: "Practice questions for this subtopic.",
  })) ?? [];

export const inheritanceVariationAndEvolutionConfig: BiologyTopicConfig = {
  id: "inheritance-variation-and-evolution",
  title: "Inheritance, Variation and Evolution",
  description:
    "Review inheritance, genetic variation and evolution through structured mastery practice.",
  route: "/biology/inheritance-variation-and-evolution",
  storageNamespace: "sciencemastery_inheritancevariationevolution",
  questions: inheritanceVariationAndEvolutionQuestions,
  subtopics: inheritanceVariationAndEvolutionSubtopics,
  subject: "biology",
  examBoard: "AQA",
  topicNumber: "Topic 6",
};
