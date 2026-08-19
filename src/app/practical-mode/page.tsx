"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPracticalQuestions, practicalRegistry } from "@/data/practicals/registry";
import { useHomeHref } from "@/hooks/useHomeHref";

const subjectLabels: Record<string, string> = {
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
};

export default function PracticalModePage() {
  const homeHref = useHomeHref();
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const scores: Record<string, number> = {};
    for (const practical of practicalRegistry) {
      try {
        const stored = localStorage.getItem(`practical_${practical.id}_best`);
        if (stored) scores[practical.id] = Number(stored);
      } catch {
        /* localStorage unavailable */
      }
    }
    setBestScores(scores);
  }, []);

  const subjects = Array.from(new Set(practicalRegistry.map((practical) => practical.subject)));

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href={homeHref} className="font-display font-bold">
            Sci<span className="text-orange">Mastery</span>
          </Link>
          <Link href="/dashboard" className="font-bold text-orange-dark">My Learning</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Practical Lab Mode</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Master every required practical</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-soft">
          Work through every AQA required practical, one at a time. Each practical opens with the verified method,
          then tests you with the commonly asked question types — variables, method, apparatus, safety, reasoning,
          prediction, data, calculation, error, improvement, evaluation and a transfer challenge — across Core,
          Deepen, Exam and Challenge layers.
        </p>

        {subjects.map((subject) => (
          <section key={subject} className="mt-10">
            <h2 className="font-display text-xl font-bold capitalize">{subjectLabels[subject] ?? subject}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {practicalRegistry
                .filter((practical) => practical.subject === subject)
                .sort((a, b) => a.rpNumber - b.rpNumber)
                .map((practical) => {
                  const best = bestScores[practical.id];
                  const questionCount = getPracticalQuestions(practical.id).length;
                  return (
                    <article
                      key={practical.id}
                      className="sm-panel-sm flex flex-col justify-between p-5 transition hover:-translate-y-1"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="sm-tag px-3 py-1 text-xs">
                            RP{practical.rpNumber} · {practical.topic}
                          </span>
                          {practical.qualificationCoverage.toLowerCase().includes("separate") && !practical.qualificationCoverage.toLowerCase().includes("combined") && (
                            <span className="rounded-md border-2 border-ink bg-orange-soft px-3 py-1 text-xs font-bold text-orange-dark">
                              Separate only
                            </span>
                          )}
                          {best !== undefined && (
                            <span className="rounded-md border-2 border-ink bg-ink px-3 py-1 text-xs font-bold text-cream">
                              Best: {best}/{questionCount}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 font-display text-lg font-semibold leading-7 text-ink">{practical.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink-soft">{practical.paper} · {questionCount} questions</p>
                      </div>
                      <Link
                        href={`/practical-mode/${practical.id}`}
                        className="sm-btn !rounded-xl mt-4 bg-orange px-4 py-2.5 text-sm text-white"
                      >
                        {best !== undefined ? "Try again" : "Start practical"}
                      </Link>
                    </article>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
