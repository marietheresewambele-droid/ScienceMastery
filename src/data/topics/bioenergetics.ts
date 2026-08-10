import bioenergeticsQuestionBank from "@/data/biology/AQA-GCSE-Biology-JSON-All-Topics/bioenergetics-questions.json";
import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";
import { createTopicQuestions } from "@/data/topics/biology-topic-utils";

interface BioenergeticsQuestionBank {
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

const bioenergeticsData = bioenergeticsQuestionBank as BioenergeticsQuestionBank;

export const bioenergeticsQuestions: MasteryQuestion[] = createTopicQuestions(
  bioenergeticsData,
  "bioenergetics",
  "Bioenergetics"
);

const bioenergeticsSubtopics: BiologySubtopicConfig[] =
  bioenergeticsData.metadata?.subtopics?.map((subtopic, index) => ({
    id: `${subtopic.title ?? `subtopic-${index + 1}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: subtopic.title ?? "Unknown subtopic",
    description: "Practice questions for this subtopic.",
  })) ?? [];

export const bioenergeticsConfig: BiologyTopicConfig = {
  id: "bioenergetics",
  title: "Bioenergetics",
  description:
    "Review photosynthesis, respiration and the energy changes that support living systems.",
  route: "/biology/bioenergetics",
  storageNamespace: "sciencemastery_bioenergetics",
  questions: bioenergeticsQuestions,
  subtopics: bioenergeticsSubtopics,
  subject: "biology",
  examBoard: "AQA",
  topicNumber: "Topic 4",
};
