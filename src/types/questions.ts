export interface MasteryQuestion {
  id: string;
  subject: "biology" | "chemistry" | "physics";
  topicSlug: string;
  subtopic: string;
  question: string;
  marks: number;
  assessmentObjective: "AO1" | "AO2" | "AO3";
  difficulty?: "Foundation" | "Higher" | "Both";
  commandWord?: string;
  specificationReference?: string;
  markingPoints: string[];
  modelAnswer?: string;
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
