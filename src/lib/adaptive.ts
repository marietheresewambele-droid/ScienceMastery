import type { MasteryQuestion } from "@/types/questions";

export type MasteryLevel = "New" | "Learning" | "Secure";
export type LearningEvidence = {
  question: MasteryQuestion;
  score: number;
  maxScore: number;
  confidence?: number;
  hintsUsed: number;
  fullAnswerViewed: boolean;
  responseTimeMs: number;
  markingPointsMissed?: string[];
};
export type AttemptRecord = LearningEvidence & { id: string; createdAt: string };
export type QuestionMastery = {
  level: MasteryLevel;
  independentSuccesses: number;
  supportedSuccesses: number;
  retrievalSuccesses: number;
  lastAttemptAt: string;
  nextReviewAt: string;
};
export type LearningSnapshot = {
  attempts: AttemptRecord[];
  mastery: Record<string, QuestionMastery>;
};

export type MasteryAggregate = {
  key: string;
  attempts: number;
  independentSuccesses: number;
  supportedSuccesses: number;
  secureQuestions: number;
  masteryPercent: number;
};

export interface LearningStore {
  read(): LearningSnapshot;
  write(snapshot: LearningSnapshot): void;
  recordBookmark(key: string, bookmarked: boolean): void;
}

const STORAGE_KEY = "sciencemastery_adaptive_v1";
const emptySnapshot = (): LearningSnapshot => ({ attempts: [], mastery: {} });

export class LocalLearningStore implements LearningStore {
  read(): LearningSnapshot {
    if (typeof window === "undefined") return emptySnapshot();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptySnapshot();
      const parsed = JSON.parse(raw) as Partial<LearningSnapshot>;
      return {
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
        mastery: parsed.mastery && typeof parsed.mastery === "object" ? parsed.mastery : {},
      };
    } catch {
      return emptySnapshot();
    }
  }

  write(snapshot: LearningSnapshot) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      window.dispatchEvent(new Event("sciencemastery:learning-updated"));
    } catch { /* storage unavailable */ }
  }

  recordBookmark(key: string, bookmarked: boolean) {
    try {
      const bookmarks = new Set(JSON.parse(localStorage.getItem("sciencemastery_bookmarks") ?? "[]"));
      bookmarked ? bookmarks.add(key) : bookmarks.delete(key);
      localStorage.setItem("sciencemastery_bookmarks", JSON.stringify([...bookmarks]));
    } catch { /* storage unavailable */ }
  }
}

export class AdaptiveEngine {
  constructor(private readonly store: LearningStore = new LocalLearningStore()) {}

  evaluateAttempt(evidence: LearningEvidence): QuestionMastery {
    const snapshot = this.store.read();
    const previous = snapshot.mastery[evidence.question.id];
    const independent = !evidence.fullAnswerViewed && evidence.hintsUsed === 0 && evidence.score >= evidence.maxScore;
    const supported = !evidence.fullAnswerViewed && evidence.score >= evidence.maxScore;
    const retrieval = independent && Boolean(previous?.lastAttemptAt) &&
      Date.now() - new Date(previous.lastAttemptAt).getTime() >= 2 * 86400000;
    const next: QuestionMastery = {
      level: previous?.level ?? "New",
      independentSuccesses: (previous?.independentSuccesses ?? 0) + (independent ? 1 : 0),
      supportedSuccesses: (previous?.supportedSuccesses ?? 0) + (supported && !independent ? 1 : 0),
      retrievalSuccesses: (previous?.retrievalSuccesses ?? 0) + (retrieval ? 1 : 0),
      lastAttemptAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() + (independent ? 3 : 1) * 86400000).toISOString(),
    };
    if (next.independentSuccesses >= 2 && next.retrievalSuccesses >= 1) next.level = "Secure";
    else if (independent || supported) next.level = "Learning";
    snapshot.mastery[evidence.question.id] = next;
    snapshot.attempts.push({ ...evidence, id: `${evidence.question.id}:${Date.now()}`, createdAt: new Date().toISOString() });
    this.store.write(snapshot);
    return next;
  }

  selectNextQuestion(current: MasteryQuestion, questions: MasteryQuestion[], evidence: LearningEvidence): MasteryQuestion | undefined {
    const byId = new Map(questions.map((question) => [question.id, question]));
    const ids = evidence.score < evidence.maxScore
      ? [...(current.prerequisiteIds ?? []), ...(current.easierQuestionIds ?? []), ...(current.parallelQuestionIds ?? [])]
      : evidence.hintsUsed > 0 ? [...(current.parallelQuestionIds ?? [])] : [...(current.harderQuestionIds ?? []), ...(current.parallelQuestionIds ?? [])];
    return ids.map((id) => byId.get(id)).find(Boolean) ?? questions.find((question) => question.id !== current.id && question.questionFamily === current.questionFamily);
  }

  recordModeEvidence(evidence: LearningEvidence) {
    return this.evaluateAttempt(evidence);
  }

  getSnapshot() { return this.store.read(); }
}

export function aggregateMastery(snapshot: LearningSnapshot, questions: MasteryQuestion[]): Record<string, MasteryAggregate> {
  const groups = new Map<string, { questions: Set<string>; attempts: number; independent: number; supported: number; secure: number }>();
  for (const question of questions) {
    const dimensions = [
      ["question", question.id],
      ["family", question.questionFamily ?? "Uncategorised"],
      ["subtopic", question.subtopic],
      ["topic", question.topicSlug],
      ["subject", question.subject],
      ...question.assessmentObjective.split("/").map((ao) => ["ao", ao]),
    ];
    const mastery = snapshot.mastery[question.id];
    for (const [dimension, value] of dimensions) {
      const key = `${dimension}:${value}`;
      const group = groups.get(key) ?? { questions: new Set<string>(), attempts: 0, independent: 0, supported: 0, secure: 0 };
      group.questions.add(question.id);
      if (mastery) {
        group.attempts += snapshot.attempts.filter((attempt) => attempt.question.id === question.id).length;
        group.independent += mastery.independentSuccesses;
        group.supported += mastery.supportedSuccesses;
        if (mastery.level === "Secure") group.secure += 1;
      }
      groups.set(key, group);
    }
  }
  return Object.fromEntries([...groups].map(([key, group]) => [key, {
    key,
    attempts: group.attempts,
    independentSuccesses: group.independent,
    supportedSuccesses: group.supported,
    secureQuestions: group.secure,
    masteryPercent: Math.round((group.secure / Math.max(1, group.questions.size)) * 100),
  }]));
}

export const adaptiveEngine = new AdaptiveEngine();