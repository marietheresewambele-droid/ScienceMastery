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
  | "AO1/AO3"
  | "AO2/AO3"
  | "AO1/AO2/AO3";

export type Subject = "biology" | "chemistry" | "physics";

/** Workbook "Qualification" values (BrainSoma standard). */
export type Qualification = "Combined and Separate Science" | "Separate Science only";
/** Workbook "Tier" values (BrainSoma standard). */
export type WorkbookTier = "Foundation and Higher" | "Foundation only" | "Higher only";

export interface MasteryQuestion {
  /** Canonical question ID, e.g. CHEM-T01-Q001. Challenge Me evidence uses its own IDs. */
  id: string;
  subject: Subject;
  topicSlug: string;
  topic?: string;
  topicNumber?: number;
  subtopic: string;
  /** Position of the subtopic within its topic (from public.subtopics.sort_order). */
  subtopicOrder?: number;
  /** Row order within the topic sheet. */
  sortOrder?: number;
  question: string;
  /** Workbook "Question Type", usually the command word (State, Explain, Calculate…). */
  questionType?: string;
  marks: number;
  assessmentObjective: AssessmentObjective;
  commandWord?: string;
  specificationReference?: string;
  markingPoints: string[];
  modelAnswer?: string;
  tier?: "Foundation" | "Higher" | "Both";
  qualification?: Qualification;
  gradeDemand?: string;
  questionFamily?: string;
  /** Workbook "Key Terms": hidden from the model answer to build the hints. */
  keyTerms?: string[];
  legacyId?: string;
  prerequisiteIds?: string[];
  easierQuestionIds?: string[];
  parallelQuestionIds?: string[];
  harderQuestionIds?: string[];
}

export interface TopicDefinition {
  /** Route slug, e.g. "energy-changes". */
  id: string;
  /** Database topic id, e.g. CHEM-T05. */
  topicId: string;
  subject: Subject;
  /** Workbook "Unit" number (T5 -> 5). */
  number: number;
  title: string;
  description: string;
  route: string;
  storageNamespace: string;
  examBoard: string;
  topicNumber: string;
}

export interface SubtopicSummary {
  id: string;
  title: string;
  order: number;
  questionCount: number;
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
