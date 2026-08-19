export type PracticalSubject = "biology" | "chemistry" | "physics";
export type ModeLayer = "Core" | "Deepen" | "Exam" | "Challenge";

export interface RequiredPractical {
  id: string;
  subject: PracticalSubject;
  rpNumber: number;
  title: string;
  qualificationCoverage: string;
  paper: string;
  topic: string;
  topicRoute: string;
  apparatus: string;
  independentVariable: string;
  dependentVariable: string;
  controlVariables: string;
  methodOverview: string;
  accuracyReliability: string;
  safety: string;
  scientificRationale: string;
  expectedPattern: string;
  dataGraphFocus: string;
  commonError: string;
  improvement: string;
  pmtSource: string;
  officialSource: string;
}

export interface PracticalQuestion {
  id: string;
  practicalId: string;
  subject: PracticalSubject;
  questionFamily: string;
  modeLayer: ModeLayer;
  ao: string;
  wsMs: string;
  atSkills: string;
  marks: number;
  examFrequency: string;
  question: string;
  hint1: string;
  hint2: string;
  modelAnswer: string;
  misconception: string;
  containsCalculation: boolean;
  transferQuestion: boolean;
  pmtSource: string;
  officialSource: string;
}

export interface QuestionFamily {
  family: string;
  modeLayer: ModeLayer;
  primaryPurpose: string;
  typicalAo: string;
  typicalMarks: number;
  frequency: string;
  masteryEvidence: string;
  appBehaviour: string;
}
