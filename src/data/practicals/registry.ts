import type { ModeLayer, PracticalQuestion, QuestionFamily, RequiredPractical } from "@/types/practical";
import biologyPracticals from "./biology-practicals.json";
import biologyQuestions from "./biology-questions.json";
import chemistryPracticals from "./chemistry-practicals.json";
import chemistryQuestions from "./chemistry-questions.json";
import physicsPracticals from "./physics-practicals.json";
import physicsQuestions from "./physics-questions.json";
import questionFamiliesData from "./question-families.json";

export const MODE_LAYER_ORDER: ModeLayer[] = ["Core", "Deepen", "Exam", "Challenge"];

export const practicalRegistry: RequiredPractical[] = [
  ...(biologyPracticals as RequiredPractical[]),
  ...(chemistryPracticals as RequiredPractical[]),
  ...(physicsPracticals as RequiredPractical[]),
];

const questions: PracticalQuestion[] = [
  ...(biologyQuestions as PracticalQuestion[]),
  ...(chemistryQuestions as PracticalQuestion[]),
  ...(physicsQuestions as PracticalQuestion[]),
];

export const questionFamilies: QuestionFamily[] = questionFamiliesData as QuestionFamily[];

export function getPractical(id: string): RequiredPractical | undefined {
  return practicalRegistry.find((practical) => practical.id === id);
}

export function getPracticalQuestions(practicalId: string): PracticalQuestion[] {
  return questions
    .filter((question) => question.practicalId === practicalId)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getPracticalsBySubject(subject: string): RequiredPractical[] {
  return practicalRegistry
    .filter((practical) => practical.subject === subject)
    .sort((a, b) => a.rpNumber - b.rpNumber);
}
