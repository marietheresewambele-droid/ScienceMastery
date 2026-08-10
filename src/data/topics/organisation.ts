import organisationQuestionBank from "@/data/biology/AQA-GCSE-Biology-JSON-All-Topics/organisation-questions.json";
import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";
import { createTopicQuestions } from "@/data/topics/biology-topic-utils";

interface OrganisationQuestionBank {
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

const organisationData = organisationQuestionBank as OrganisationQuestionBank;

export const organisationQuestions: MasteryQuestion[] = createTopicQuestions(
  organisationData,
  "organisation",
  "Organisation"
);

const organisationSubtopics: BiologySubtopicConfig[] =
  organisationData.metadata?.subtopics?.map((subtopic, index) => ({
    id: `${subtopic.title ?? `subtopic-${index + 1}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: subtopic.title ?? "Unknown subtopic",
    description: "Practice questions for this subtopic.",
  })) ?? [];

export const organisationConfig: BiologyTopicConfig = {
  id: "organisation",
  title: "Organisation",
  description:
    "Review organisation in animals and plants through structured mastery practice.",
  route: "/biology/organisation",
  storageNamespace: "sciencemastery_organisation",
  questions: organisationQuestions,
  subtopics: organisationSubtopics,
  subject: "biology",
  examBoard: "AQA",
  topicNumber: "Topic 2",
};
