export type ReviewRating = "again" | "hard" | "good" | "easy";

export type ReviewRecord = {
  rating: ReviewRating;
  reviewedAt: string;
  dueAt: string;
  intervalDays: number;
  repetitions: number;
};

export type ReviewMap = Record<string, ReviewRecord>;

export type AssessmentObjective =
  | "AO1"
  | "AO2"
  | "AO3"
  | "AO1/AO2"
  | "AO2/AO3"
  | "AO1/AO2/AO3";

export interface MasteryQuestion {
  id: string;
  subject: "biology" | "chemistry" | "physics";
  topicSlug: string;
  topic?: string;
  subtopic: string;
  question: string;
  marks: number;
  assessmentObjective: AssessmentObjective;
  difficulty?: "Foundation" | "Higher" | "Both";
  commandWord?: string;
  specificationReference?: string;
  markingPoints: string[];
  modelAnswer?: string;
  tier?: "Foundation" | "Higher" | "Both";
  gradeDemand?: string;
  questionFamily?: string;
  originalSubtopic?: string;
}

export interface BiologySubtopicConfig {
  id: string;
  title: string;
  description?: string;
}

export interface BiologyTopicConfig {
  id: string;
  title: string;
  description?: string;
  route: string;
  storageNamespace: string;
  questions: MasteryQuestion[];
  subtopics: BiologySubtopicConfig[];
  subject?: "biology" | "chemistry" | "physics";
  examBoard?: string;
  topicNumber?: string;
}

export interface TopicMetadata {
  subject: string;
  title: string;
  slug: string;
  examBoard: string;
  topicNumber: string;
  description: string;
  subtopics: string[];
}
