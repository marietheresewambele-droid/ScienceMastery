"use client";

/* Client-only localStorage hydration/persistence is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPractical, getPracticalQuestions } from "@/data/practicals/registry";
import { getPracticalDiagram } from "@/data/practicals/diagrams";
import PracticalDiagram from "@/components/practical/diagrams/PracticalDiagram";
import type { ModeLayer } from "@/types/practical";
import { adaptiveEngine } from "@/lib/adaptive";
import type { MasteryQuestion } from "@/types/questions";

type Phase = "intro" | "question" | "summary";

const LAYER_INTRO: Record<ModeLayer, { label: string; blurb: string }> = {
  Core: { label: "Core skills", blurb: "Variables, method, apparatus and safety — the foundation for this practical." },
  Deepen: { label: "Deepen understanding", blurb: "Explain why the method works and predict the outcome from theory." },
  Exam: { label: "Exam-style", blurb: "Process data, apply calculations, and evaluate the practical like a real exam question." },
  Challenge: { label: "Transfer challenge", blurb: "Apply the same practical logic to a changed, unfamiliar scenario." },
};

function bestScoreKey(practicalId: string) {
  return `practical_${practicalId}_best`;
}

export default function PracticalRunner({ practicalId }: { practicalId: string }) {
  const practical = getPractical(practicalId);
  const questions = getPracticalQuestions(practicalId);

  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [revealedModel, setRevealedModel] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selfMarks, setSelfMarks] = useState<Record<string, boolean>>({});
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(bestScoreKey(practicalId));
      setBestScore(stored ? Number(stored) : null);
    } catch {
      setBestScore(null);
    }
  }, [practicalId]);

  const correctCount = questions.filter((question) => selfMarks[question.id]).length;

  useEffect(() => {
    if (phase !== "summary") return;
    try {
      const stored = localStorage.getItem(bestScoreKey(practicalId));
      const previousBest = stored ? Number(stored) : 0;
      const next = Math.max(previousBest, correctCount);
      if (next !== previousBest) {
        localStorage.setItem(bestScoreKey(practicalId), String(next));
        setBestScore(next);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [phase, correctCount, practicalId]);

  if (!practical) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-bold text-ink-soft">Practical not found.</p>
        <Link href="/practical-mode" className="sm-btn mt-4 inline-flex bg-orange px-5 py-3 text-white">
          Back to Practical Lab Mode
        </Link>
      </main>
    );
  }

  const diagramItems = getPracticalDiagram(practicalId);
  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isFirstOfLayer = questionIndex === 0 || questions[questionIndex - 1].modeLayer !== currentQuestion?.modeLayer;

  const recordPracticalEvidence = (correct: boolean) => {
    if (!currentQuestion) return;
    const question: MasteryQuestion = {
      id: currentQuestion.id,
      subject: currentQuestion.subject,
      topicSlug: practical.id,
      topic: practical.title,
      subtopic: currentQuestion.modeLayer,
      question: currentQuestion.question,
      marks: currentQuestion.marks,
      assessmentObjective: currentQuestion.ao as MasteryQuestion["assessmentObjective"],
      markingPoints: [],
      modelAnswer: currentQuestion.modelAnswer,
      questionFamily: currentQuestion.questionFamily,
    };
    adaptiveEngine.recordModeEvidence({ question, score: correct ? currentQuestion.marks : 0, maxScore: currentQuestion.marks, hintsUsed: hintLevel, fullAnswerViewed: true, responseTimeMs: 0 });
  };

  const familyStats = Object.values(
    questions.reduce<Record<string, { family: string; total: number; correct: number }>>((acc, question) => {
      const entry = acc[question.questionFamily] ?? { family: question.questionFamily, total: 0, correct: 0 };
      entry.total += 1;
      if (selfMarks[question.id]) entry.correct += 1;
      acc[question.questionFamily] = entry;
      return acc;
    }, {})
  );

  const restart = () => {
    setPhase("intro");
    setQuestionIndex(0);
    setHintLevel(0);
    setRevealedModel(false);
    setAnswers({});
    setSelfMarks({});
  };

  const goNextQuestion = () => {
    if (isLastQuestion) {
      setPhase("summary");
    } else {
      setQuestionIndex((value) => value + 1);
      setHintLevel(0);
      setRevealedModel(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link href="/practical-mode" className="font-display font-bold">
            Sci<span className="text-orange">Mastery</span>
          </Link>
          <Link href={practical.topicRoute} className="text-sm font-bold text-orange-dark">Back to {practical.topic}</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          <span className="sm-tag px-3 py-1 text-xs capitalize">{practical.subject}</span>
          <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">RP{practical.rpNumber} · {practical.topic}</span>
          <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">{practical.paper}</span>
          <span className="rounded-md border-2 border-ink bg-orange-soft px-3 py-1 text-xs font-bold text-orange-dark">{practical.qualificationCoverage}</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{practical.title}</h1>

        {phase === "intro" && (
          <section className="sm-panel mt-8 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">Method overview</p>
            <p className="mt-3 max-w-3xl leading-7 text-ink">{practical.methodOverview}</p>

            {diagramItems.length > 0 && (
              <div className="mt-6">
                <PracticalDiagram items={diagramItems} caption={practical.apparatus} />
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-ink bg-cream-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Independent variable</p>
                <p className="mt-1 text-sm leading-6 text-ink">{practical.independentVariable}</p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-cream-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Dependent variable</p>
                <p className="mt-1 text-sm leading-6 text-ink">{practical.dependentVariable}</p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-cream-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Control variables</p>
                <p className="mt-1 text-sm leading-6 text-ink">{practical.controlVariables}</p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-cream-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Apparatus</p>
                <p className="mt-1 text-sm leading-6 text-ink">{practical.apparatus}</p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-yellow-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink">Safety</p>
                <p className="mt-1 text-sm leading-6 text-ink">{practical.safety}</p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-moss-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-moss-dark">Scientific rationale</p>
                <p className="mt-1 text-sm leading-6 text-ink">{practical.scientificRationale}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-ink bg-ink p-5 text-sm leading-6 text-cream/70">
              You will work through {questions.length} questions across four layers — Core, Deepen, Exam and Transfer
              Challenge. Hints reveal in two stages, and the model answer only appears once you ask for it. Mark
              yourself honestly at each question so your mastery-by-skill breakdown stays accurate.
            </div>

            <button
              onClick={() => setPhase("question")}
              className="sm-btn mt-6 bg-orange px-6 py-3 text-white"
            >
              Start practical
            </button>
          </section>
        )}

        {phase === "question" && currentQuestion && (
          <section className="mt-8">
            {isFirstOfLayer && (
              <div className="mb-4 rounded-2xl border-2 border-ink bg-ink p-5 text-cream">
                <p className="text-xs font-bold uppercase tracking-widest text-yellow">{LAYER_INTRO[currentQuestion.modeLayer].label}</p>
                <p className="mt-1 text-sm leading-6 text-cream/70">{LAYER_INTRO[currentQuestion.modeLayer].blurb}</p>
              </div>
            )}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
              <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs text-ink-soft">{currentQuestion.questionFamily}</span>
              <span>Question {questionIndex + 1} of {questions.length} · {currentQuestion.marks} marks</span>
            </div>
            <article className="sm-panel p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">{currentQuestion.modeLayer} · {currentQuestion.ao}</p>
              <h2 className="mt-3 font-display text-xl font-semibold leading-8">{currentQuestion.question}</h2>

              <textarea
                value={answers[currentQuestion.id] ?? ""}
                onChange={(event) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: event.target.value }))}
                rows={4}
                placeholder="Write your answer here…"
                className="mt-5 w-full rounded-xl border-2 border-ink bg-card p-4 text-ink focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange"
              />

              {hintLevel >= 1 && (
                <p className="mt-3 rounded-xl border-2 border-ink bg-yellow-soft p-4 text-sm leading-6 text-ink">
                  <span className="font-bold">Hint 1: </span>{currentQuestion.hint1}
                </p>
              )}
              {hintLevel >= 2 && (
                <p className="mt-3 rounded-xl border-2 border-ink bg-yellow-soft p-4 text-sm leading-6 text-ink">
                  <span className="font-bold">Hint 2: </span>{currentQuestion.hint2}
                </p>
              )}

              {revealedModel && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border-2 border-ink bg-moss-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-moss-dark">Model answer</p>
                    <p className="mt-2 leading-6 text-ink">{currentQuestion.modelAnswer}</p>
                  </div>
                  <div className="rounded-xl border-2 border-ink bg-cream-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Common misconception</p>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">{currentQuestion.misconception}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => { setSelfMarks((prev) => ({ ...prev, [currentQuestion.id]: true })); recordPracticalEvidence(true); }}
                      className={`rounded-lg border-2 border-ink px-4 py-2 text-sm font-bold transition ${
                        selfMarks[currentQuestion.id] === true ? "bg-moss text-white" : "bg-card text-ink-soft hover:bg-moss-soft"
                      }`}
                    >
                      I got this right
                    </button>
                    <button
                      onClick={() => { setSelfMarks((prev) => ({ ...prev, [currentQuestion.id]: false })); recordPracticalEvidence(false); }}
                      className={`rounded-lg border-2 border-ink px-4 py-2 text-sm font-bold transition ${
                        selfMarks[currentQuestion.id] === false ? "bg-orange-dark text-white" : "bg-card text-ink-soft hover:bg-orange-soft"
                      }`}
                    >
                      I missed this
                    </button>
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
                    Reveal model answer
                  </button>
                )}
                {revealedModel && (
                  <button
                    onClick={goNextQuestion}
                    disabled={selfMarks[currentQuestion.id] === undefined}
                    className="sm-btn bg-orange px-6 py-3 text-white disabled:opacity-40"
                  >
                    {isLastQuestion ? "Finish practical →" : "Next question →"}
                  </button>
                )}
              </div>
            </article>
          </section>
        )}

        {phase === "summary" && (
          <section className="mt-8 space-y-6">
            <article className="sm-panel p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-ink">Mastery by skill family</h2>
              <p className="mt-2 text-sm text-ink-soft">
                These families are shared across every required practical, so you can compare your progress across
                topics and subjects.
              </p>
              <div className="mt-5 space-y-3">
                {familyStats.map((stat) => (
                  <div key={stat.family} className="rounded-2xl border-2 border-ink p-4">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>{stat.family}</span>
                      <span>{stat.correct}/{stat.total}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full border-2 border-ink bg-cream-soft">
                      <div
                        className="h-full rounded-full bg-orange transition-all"
                        style={{ width: `${(stat.correct / stat.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <div className="flex flex-wrap items-center gap-4 rounded-3xl border-2 border-ink bg-ink p-6 text-cream sm:p-8">
              <div>
                <p className="text-sm font-semibold text-cream/70">Best score for this practical</p>
                <p className="mt-1 font-display text-2xl font-bold">{bestScore ?? correctCount} / {questions.length}</p>
              </div>
              <div className="ml-auto flex flex-wrap gap-3">
                <button onClick={restart} className="sm-btn bg-cream px-5 py-3 text-ink">Try again</button>
                <Link href="/practical-mode" className="rounded-xl border-2 border-cream/40 px-5 py-3 font-bold text-cream hover:border-cream">All practicals</Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
