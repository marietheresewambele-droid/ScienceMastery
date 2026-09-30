export type WebsiteAssessmentObjective = "AO1" | "AO2" | "AO3";
export type WebsiteTier = "Foundation" | "Higher" | "Both";
export type WebsiteQuestionType = "Short answer" | "Multiple choice" | "Calculation" | "Extended response";

/** One validated row, shaped exactly like the required "Website Upload" worksheet columns. */
export interface WebsiteQuestionRow {
  questionId: string;
  subject: string;
  unit: string;
  topic: string;
  subtopic: string;
  specificationReference: string;
  question: string;
  modelAnswer: string;
  marks: number;
  assessmentObjective: WebsiteAssessmentObjective;
  tier: WebsiteTier;
  grade: string;
  keyTerms: string;
  imageFile: string;
  questionType: WebsiteQuestionType;
}

/** A row as stored in and returned from Supabase's public.questions table. */
export interface PublishedWebsiteQuestion extends WebsiteQuestionRow {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
