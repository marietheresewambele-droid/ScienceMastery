"use client";

/* Client-only localStorage hydration/persistence is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getChallenge, getConnections, getStages } from "@/data/challenges/registry";
import ConnectionMap from "@/components/challenge/ConnectionMap";
import { adaptiveEngine } from "@/lib/adaptive";
import type { MasteryQuestion } from "@/types/questions";

type Phase = "intro" | "stage" | "final" | "reveal";

function bestScoreKey(challengeId: string) {
  return `challenge_${challengeId}_best`;
}

export default function ChallengeRunner({ challengeId }: { challengeId: string }) {
  const challenge = getChallenge(challengeId);
  const stages = getStages(challengeId);
  const connections = getConnections(challengeId);

  const [phase, setPhase] = useState<Phase>("intro");
  const [stageIndex, setStageIndex] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [revealedModel, setRevealedModel] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finalAnswer, setFinalAnswer] = useState("");
  const [selfMarks, setSelfMarks] = useState<Record<string, boolean>>({});
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(bestScoreKey(challengeId));
      setBestScore(stored ? Number(stored) : null);
    } catch {
      setBestScore(null);
    }
  }, [challengeId]);

  const madeCount = connections.filter((connection) => selfMarks[connection.id]).length;

  useEffect(() => {
    if (phase !== "reveal") return;
    try {
      const stored = localStorage.getItem(bestScoreKey(challengeId));
      const previousBest = stored ? Number(stored) : 0;
      const next = Math.max(previousBest, madeCount);
      if (next !== previousBest) {
        localStorage.setItem(bestScoreKey(challengeId), String(next));
        setBestScore(next);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [phase, madeCount, challengeId]);

  if (!challenge) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-bold text-ink-soft">Challenge not found.</p>
        <Link href="/challenge-me" className="sm-btn mt-4 inline-flex bg-orange px-5 py-3 text-white">
          Back to Challenge Me
        </Link>
      </main>
    );
  }

  const currentStage = stages[stageIndex];
  const isLastStage = stageIndex === stages.length - 1;

  const recordChallengeEvidence = (connectionId: string, made: boolean) => {
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection || !challenge) return;
    const question: MasteryQuestion = {
      id: connection.id,
      subject: challenge.subject,
      topicSlug: challenge.id,
      topic: challenge.topic,
      subtopic: "Challenge Me",
      question: connection.evidenceRequired,
      marks: connection.maxPoints,
      assessmentObjective: "AO3",
      markingPoints: [],
      modelAnswer: connection.successFeedback,
      questionFamily: connection.concept,
    };
    adaptiveEngine.recordModeEvidence({ question, score: made ? connection.maxPoints : 0, maxScore: connection.maxPoints, hintsUsed: hintLevel, fullAnswerViewed: phase === "reveal", responseTimeMs: 0 });
  };

  const restart = () => {
    setPhase("intro");
    setStageIndex(0);
    setHintLevel(0);
    setRevealedModel(false);
    setAnswers({});
    setFinalAnswer("");
    setSelfMarks({});
  };

  const goNextStage = () => {
    if (isLastStage) {
      setPhase("final");
    } else {
      setStageIndex((value) => value + 1);
      setHintLevel(0);
      setRevealedModel(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link href="/challenge-me" className="font-display font-bold">
            Sci<span className="text-orange">Mastery</span>
          </Link>
          <Link href={challenge.topicRoute} className="text-sm font-bold text-orange-dark">Back to {challenge.topic}</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          <span className="sm-tag px-3 py-1 text-xs capitalize">{challenge.subject}</span>
          <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">Topic {challenge.topicNumber} · {challenge.topic}</span>
          <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">{challenge.paper}</span>
          <span className="rounded-md border-2 border-ink bg-orange-soft px-3 py-1 text-xs font-bold text-orange-dark">Grades {challenge.gradeDemand}</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{challenge.title}</h1>

        {phase === "intro" && (
          <section className="sm-panel mt-8 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Starting scenario</p>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-ink">{challenge.scenario}</p>
            <div className="mt-6 rounded-2xl border-2 border-ink bg-cream-soft p-5 text-sm leading-6 text-ink-soft">
              You will work through {stages.length} staged questions that build up the science you need. Then you will
              answer one big-picture question from memory, with no checklist to help you — and only afterwards will the
              full connection map be revealed.
            </div>
            <button
              onClick={() => setPhase("stage")}
              className="sm-btn mt-6 bg-orange px-6 py-3 text-white"
            >
              Start challenge
            </button>
          </section>
        )}

        {phase === "stage" && currentStage && (
          <section className="mt-8">
            <div className="mb-3 flex justify-between text-sm font-bold">
              <span>{currentStage.title}</span>
              <span>Stage {stageIndex + 1} of {stages.length}</span>
            </div>
            <article className="sm-panel p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Prompt</p>
              <h2 className="mt-3 font-display text-xl font-semibold leading-8">{currentStage.prompt}</h2>

              <textarea
                value={answers[currentStage.id] ?? ""}
                onChange={(event) => setAnswers((prev) => ({ ...prev, [currentStage.id]: event.target.value }))}
                rows={4}
                placeholder="Write your reasoning here…"
                className="mt-5 w-full rounded-xl border-2 border-ink bg-card p-4 text-ink focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange"
              />

              {hintLevel >= 1 && (
                <p className="mt-3 rounded-xl border-2 border-ink bg-yellow-soft p-4 text-sm leading-6 text-ink">
                  <span className="font-bold">Hint 1: </span>{currentStage.hint1}
                </p>
              )}
              {hintLevel >= 2 && (
                <p className="mt-3 rounded-xl border-2 border-ink bg-yellow-soft p-4 text-sm leading-6 text-ink">
                  <span className="font-bold">Hint 2: </span>{currentStage.hint2}
                </p>
              )}

              {revealedModel && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border-2 border-ink bg-moss-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-moss-dark">Model response</p>
                    <p className="mt-2 leading-6 text-ink">{currentStage.modelResponse}</p>
                  </div>
                  <div className="rounded-xl border-2 border-ink bg-cream-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Common misconception</p>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">{currentStage.misconception}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {!revealedModel && hintLevel < 1 && (
                  <button onClick={() => setHintLevel(1)} className="rounded-xl border-2 border-ink bg-card px-4 py-2.5 text-sm font-bold text-ink-soft hover:border-orange hover:text-orange-dark">
                    Show hint 1
                  </button>
                )}
                {!revealedModel && hintLevel === 1 && (
                  <button onClick={() => setHintLevel(2)} className="rounded-xl border-2 border-ink bg-card px-4 py-2.5 text-sm font-bold text-ink-soft hover:border-orange hover:text-orange-dark">
                    Show hint 2
                  </button>
                )}
                {!revealedModel && (
                  <button onClick={() => setRevealedModel(true)} className="sm-btn bg-ink px-5 py-3 text-cream">
                    Reveal model response
                  </button>
                )}
                {revealedModel && (
                  <button onClick={goNextStage} className="sm-btn bg-orange px-6 py-3 text-white">
                    {isLastStage ? "Continue to final question →" : "Next stage →"}
                  </button>
                )}
              </div>
            </article>
          </section>
        )}

        {phase === "final" && (
          <section className="sm-panel mt-8 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Final big-picture question</p>
            <h2 className="mt-3 font-display text-xl font-semibold leading-8">{challenge.finalPrompt}</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Answer from memory. There is no checklist here — connect the ideas yourself, the way you would in an exam.
            </p>
            <textarea
              value={finalAnswer}
              onChange={(event) => setFinalAnswer(event.target.value)}
              rows={10}
              placeholder="Write your full explanation here…"
              className="mt-5 w-full rounded-xl border-2 border-ink bg-card p-4 text-ink focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange"
            />
            <button
              onClick={() => setPhase("reveal")}
              disabled={!finalAnswer.trim()}
              className="sm-btn mt-5 bg-orange px-6 py-3 text-white disabled:opacity-40"
            >
              Submit final answer &amp; reveal connection map
            </button>
          </section>
        )}

        {phase === "reveal" && (
          <section className="mt-8 space-y-6">
            <article className="sm-panel p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Your final answer</p>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-ink">{finalAnswer}</p>
              <div className="mt-5 rounded-2xl border-2 border-ink bg-moss-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-moss-dark">Final model answer</p>
                <p className="mt-2 leading-7 text-ink">{challenge.finalModelAnswer}</p>
              </div>
            </article>

            <article className="sm-panel p-6 sm:p-8">
              <ConnectionMap
                connections={connections}
                selfMarks={selfMarks}
                onMark={(connectionId, made) => { setSelfMarks((prev) => ({ ...prev, [connectionId]: made })); recordChallengeEvidence(connectionId, made); }}
              />
            </article>

            <div className="flex flex-wrap items-center gap-4 rounded-3xl border-2 border-ink bg-ink p-6 text-cream sm:p-8">
              <div>
                <p className="text-sm font-semibold text-cream/70">Best score for this challenge</p>
                <p className="mt-1 font-display text-2xl font-bold">{bestScore ?? madeCount} / {connections.length}</p>
              </div>
              <div className="ml-auto flex gap-3">
                <button onClick={restart} className="sm-btn bg-cream px-5 py-3 text-ink">Try again</button>
                <Link href="/challenge-me" className="rounded-xl border-2 border-cream/40 px-5 py-3 font-bold text-cream hover:border-cream">All challenges</Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
