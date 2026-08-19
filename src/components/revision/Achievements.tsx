"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { challengeRegistry } from "@/data/challenges/registry";
import { getPracticalQuestions, practicalRegistry } from "@/data/practicals/registry";

interface DashboardTopic {
  topic: { title: string };
  completed: number;
  total: number;
  percent: number;
}

interface DashboardSubject {
  subject: string;
  completed: number;
  total: number;
}

interface AchievementsProps {
  completed: number;
  total: number;
  bookmarks: number;
  subjects: DashboardSubject[];
  topics: DashboardTopic[];
}

interface Achievement {
  id: string;
  badge: string;
  title: string;
  description: string;
  unlocked: boolean;
  colour: "orange" | "moss" | "teal" | "yellow";
}

export default function Achievements({ completed, total, bookmarks, subjects, topics }: AchievementsProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const workStats = useMemo(() => {
    if (!ready) {
      return { challengesStarted: 0, challengesPerfect: 0, practicalsStarted: 0, practicalsPerfect: 0 };
    }

    let challengesStarted = 0;
    let challengesPerfect = 0;
    for (const challenge of challengeRegistry) {
      try {
        const stored = localStorage.getItem(`challenge_${challenge.id}_best`);
        if (!stored) continue;
        challengesStarted += 1;
        if (Number(stored) >= challenge.possibleConnections) challengesPerfect += 1;
      } catch {
        /* localStorage unavailable */
      }
    }

    let practicalsStarted = 0;
    let practicalsPerfect = 0;
    for (const practical of practicalRegistry) {
      try {
        const stored = localStorage.getItem(`practical_${practical.id}_best`);
        if (!stored) continue;
        practicalsStarted += 1;
        const totalQuestions = getPracticalQuestions(practical.id).length;
        if (totalQuestions > 0 && Number(stored) >= totalQuestions) practicalsPerfect += 1;
      } catch {
        /* localStorage unavailable */
      }
    }

    return { challengesStarted, challengesPerfect, practicalsStarted, practicalsPerfect };
  }, [ready]);

  const topicChampion = topics.some((t) => t.total > 0 && t.percent >= 100);
  const subjectSpecialist = subjects.some((s) => s.total > 0 && s.completed >= s.total);
  const allRounder = subjects.every((s) => s.completed > 0);

  const achievements: Achievement[] = [
    {
      id: "first-steps",
      badge: "1",
      title: "First Steps",
      description: "Answer your first mastery question.",
      unlocked: completed >= 1,
      colour: "orange",
    },
    {
      id: "quarter-century",
      badge: "25",
      title: "Quick Learner",
      description: "Complete 25 questions.",
      unlocked: completed >= 25,
      colour: "orange",
    },
    {
      id: "century-club",
      badge: "100",
      title: "Century Club",
      description: "Complete 100 questions.",
      unlocked: completed >= 100,
      colour: "orange",
    },
    {
      id: "deep-diver",
      badge: "300",
      title: "Deep Diver",
      description: "Complete 300 questions.",
      unlocked: completed >= 300,
      colour: "orange",
    },
    {
      id: "topic-champion",
      badge: "T",
      title: "Topic Champion",
      description: "Finish every question in one topic.",
      unlocked: topicChampion,
      colour: "moss",
    },
    {
      id: "subject-specialist",
      badge: "S",
      title: "Subject Specialist",
      description: "Finish every question in a whole subject.",
      unlocked: subjectSpecialist,
      colour: "moss",
    },
    {
      id: "all-rounder",
      badge: "3",
      title: "All-Rounder",
      description: "Attempt questions in Biology, Chemistry and Physics.",
      unlocked: allRounder,
      colour: "moss",
    },
    {
      id: "curator",
      badge: "★",
      title: "Curator",
      description: "Bookmark 10 questions to revisit.",
      unlocked: bookmarks >= 10,
      colour: "yellow",
    },
    {
      id: "challenge-accepted",
      badge: "C",
      title: "Challenge Accepted",
      description: "Complete a Challenge Me scenario.",
      unlocked: workStats.challengesStarted >= 1,
      colour: "teal",
    },
    {
      id: "challenge-master",
      badge: "C+",
      title: "Challenge Master",
      description: "Make every connection in a Challenge Me.",
      unlocked: workStats.challengesPerfect >= 1,
      colour: "teal",
    },
    {
      id: "lab-ready",
      badge: "P",
      title: "Lab Ready",
      description: "Complete a required practical.",
      unlocked: workStats.practicalsStarted >= 1,
      colour: "teal",
    },
    {
      id: "practical-pro",
      badge: "P+",
      title: "Practical Pro",
      description: "Score full marks on a required practical.",
      unlocked: workStats.practicalsPerfect >= 1,
      colour: "teal",
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const colourClasses: Record<Achievement["colour"], string> = {
    orange: "bg-orange text-white",
    moss: "bg-moss text-white",
    teal: "bg-teal text-white",
    yellow: "bg-yellow text-ink",
  };

  return (
    <article className="sm-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Achievements</h2>
        <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">
          {unlockedCount}/{achievements.length} unlocked
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Badges unlock automatically as you complete practice questions, Challenge Me scenarios and required practicals.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`rounded-xl border-2 p-4 transition ${
              achievement.unlocked ? "border-ink bg-card" : "border-ink/25 bg-cream-soft"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${
                achievement.unlocked ? `border-ink ${colourClasses[achievement.colour]}` : "border-ink/25 bg-cream text-ink-soft/50"
              }`}
            >
              {achievement.badge}
            </span>
            <p className={`mt-3 font-display text-sm font-semibold ${achievement.unlocked ? "text-ink" : "text-ink-soft/60"}`}>
              {achievement.title}
            </p>
            <p className={`mt-1 text-xs leading-5 ${achievement.unlocked ? "text-ink-soft" : "text-ink-soft/50"}`}>
              {achievement.description}
            </p>
            {!achievement.unlocked && (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ink-soft/50">Locked</p>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
