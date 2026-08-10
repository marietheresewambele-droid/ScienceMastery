import homeostasisAndResponseQuestionBank from "@/data/biology/AQA-GCSE-Biology-JSON-All-Topics/homeostasis-and-response-questions.json";
import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";
import { createTopicQuestions } from "@/data/topics/biology-topic-utils";

interface HomeostasisAndResponseQuestionBank {
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

const homeostasisAndResponseData = homeostasisAndResponseQuestionBank as HomeostasisAndResponseQuestionBank;

export const homeostasisAndResponseQuestions: MasteryQuestion[] = createTopicQuestions(
  homeostasisAndResponseData,
  "homeostasis-and-response",
  "Homeostasis and Response"
);

const homeostasisAndResponseSubtopics: BiologySubtopicConfig[] =
  homeostasisAndResponseData.metadata?.subtopics?.map((subtopic, index) => ({
    id: `${subtopic.title ?? `subtopic-${index + 1}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: subtopic.title ?? "Unknown subtopic",
    description: "Practice questions for this subtopic.",
  })) ?? [];

export const homeostasisAndResponseConfig: BiologyTopicConfig = {
  id: "homeostasis-and-response",
  title: "Homeostasis and Response",
  description:
    "Review homeostasis, the nervous system, hormonal control and plant responses through structured mastery practice.",
  route: "/biology/homeostasis-and-response",
  storageNamespace: "sciencemastery_homeostasisresponse",
  questions: homeostasisAndResponseQuestions,
  subtopics: homeostasisAndResponseSubtopics,
  subject: "biology",
  examBoard: "AQA",
  topicNumber: "Topic 5",
};
