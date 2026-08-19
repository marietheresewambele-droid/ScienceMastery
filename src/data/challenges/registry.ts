import type { Challenge, ChallengeConnection, ChallengeStage } from "@/types/challenge";
import biologyChallenges from "./biology-challenges.json";
import biologyStages from "./biology-stages.json";
import biologyConnections from "./biology-connections.json";
import chemistryChallenges from "./chemistry-challenges.json";
import chemistryStages from "./chemistry-stages.json";
import chemistryConnections from "./chemistry-connections.json";
import physicsChallenges from "./physics-challenges.json";
import physicsStages from "./physics-stages.json";
import physicsConnections from "./physics-connections.json";

export const challengeRegistry: Challenge[] = [
  ...(biologyChallenges as Challenge[]),
  ...(chemistryChallenges as Challenge[]),
  ...(physicsChallenges as Challenge[]),
];

const stages: ChallengeStage[] = [
  ...(biologyStages as ChallengeStage[]),
  ...(chemistryStages as ChallengeStage[]),
  ...(physicsStages as ChallengeStage[]),
];

const connections: ChallengeConnection[] = [
  ...(biologyConnections as ChallengeConnection[]),
  ...(chemistryConnections as ChallengeConnection[]),
  ...(physicsConnections as ChallengeConnection[]),
];

export function getChallenge(id: string): Challenge | undefined {
  return challengeRegistry.find((challenge) => challenge.id === id);
}

export function getStages(challengeId: string): ChallengeStage[] {
  return stages
    .filter((stage) => stage.challengeId === challengeId)
    .sort((a, b) => a.stage - b.stage);
}

export function getConnections(challengeId: string): ChallengeConnection[] {
  return connections
    .filter((connection) => connection.challengeId === challengeId)
    .sort((a, b) => a.order - b.order);
}
