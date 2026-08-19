export interface Challenge {
  id: string;
  subject: "biology" | "chemistry" | "physics";
  topicNumber: number;
  topic: string;
  topicRoute: string;
  paper: string;
  title: string;
  scenario: string;
  finalPrompt: string;
  conceptsCovered: string[];
  possibleConnections: number;
  gradeDemand: string;
  tier: string;
  requiredPracticalLinks: string;
  finalModelAnswer: string;
  sourceUrl: string;
}

export interface ChallengeStage {
  id: string;
  challengeId: string;
  stage: number;
  title: string;
  prompt: string;
  hint1: string;
  hint2: string;
  modelResponse: string;
  targetConnection: string;
  misconception: string;
  ao: string;
  marks: number;
}

export interface ChallengeConnection {
  id: string;
  challengeId: string;
  order: number;
  concept: string;
  targetLink: string;
  evidenceRequired: string;
  maxPoints: number;
  priority: string;
  successFeedback: string;
  missingFeedback: string;
}
