import infectionAndResponseQuestionBank from "@/data/biology/AQA-GCSE-Biology-JSON-All-Topics/infection-and-response-questions.json";
import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";
import { createTopicQuestions } from "@/data/topics/biology-topic-utils";

interface InfectionAndResponseQuestionBank {
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

const infectionAndResponseData = infectionAndResponseQuestionBank as InfectionAndResponseQuestionBank;

export const infectionAndResponseQuestions: MasteryQuestion[] = createTopicQuestions(
  infectionAndResponseData,
  "infection-and-response",
  "Infection and Response"
);

const infectionAndResponseSubtopics: BiologySubtopicConfig[] =
  infectionAndResponseData.metadata?.subtopics?.map((subtopic, index) => ({
    id: `${subtopic.title ?? `subtopic-${index + 1}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: subtopic.title ?? "Unknown subtopic",
    description: "Practice questions for this subtopic.",
  })) ?? [];

export const infectionAndResponseConfig: BiologyTopicConfig = {
  id: "infection-and-response",
  title: "Infection and Response",
  description:
    "Review pathogens, immunity, drugs and disease prevention through structured mastery practice.",
  route: "/biology/infection-and-response",
  storageNamespace: "sciencemastery_infectionresponse",
  questions: infectionAndResponseQuestions,
  subtopics: infectionAndResponseSubtopics,
  subject: "biology",
  examBoard: "AQA",
  topicNumber: "Topic 3",
};
