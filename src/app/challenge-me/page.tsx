"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import { challengeRegistry } from "@/data/challenges/registry";
import { useHomeHref } from "@/hooks/useHomeHref";

const subjectLabels: Record<string, string> = {
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
};

export default function ChallengeMePage() {
  const homeHref = useHomeHref();
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const scores: Record<string, number> = {};
    for (const challenge of challengeRegistry) {
      try {
        const stored = localStorage.getItem(`challenge_${challenge.id}_best`);
        if (stored) scores[challenge.id] = Number(stored);
      } catch {
        /* localStorage unavailable */
      }
    }
    setBestScores(scores);
  }, []);

  const subjects = Array.from(new Set(challengeRegistry.map((challenge) => challenge.subject)));

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
        <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Challenge Me</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Connect the whole topic</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-soft">
          Each challenge tests whether you can connect a whole topic to explain one real scenario — not just answer a
          hard question. Work through staged questions, then answer one big-picture prompt from memory with no
          checklist to help you. Only afterwards will the full connection map be revealed.
        </p>

        {subjects.map((subject) => (
          <section key={subject} className="mt-10">
            <h2 className="font-display text-xl font-bold capitalize">{subjectLabels[subject] ?? subject}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {challengeRegistry
                .filter((challenge) => challenge.subject === subject)
                .map((challenge) => {
                  const best = bestScores[challenge.id];
                  return (
                    <article
                      key={challenge.id}
                      className="sm-panel-sm flex flex-col justify-between p-5 transition hover:-translate-y-1"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="sm-tag px-3 py-1 text-xs">
                            Topic {challenge.topicNumber} · {challenge.topic}
                          </span>
                          {best !== undefined && (
                            <span className="rounded-md border-2 border-ink bg-ink px-3 py-1 text-xs font-bold text-cream">
                              Best: {best}/{challenge.possibleConnections}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 font-display text-lg font-semibold leading-7 text-ink">{challenge.title}</h3>
                      </div>
                      <Link
                        href={`/challenge-me/${challenge.id}`}
                        className="sm-btn !rounded-xl mt-4 bg-orange px-4 py-2.5 text-sm text-white"
                      >
                        {best !== undefined ? "Try again" : "Start challenge"}
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
