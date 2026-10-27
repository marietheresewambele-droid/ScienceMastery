"use client";

/* Client-only localStorage hydration is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { DEFAULT_GOAL, GOAL_OPTIONS, bestStreak, currentStreak, dayKey, goalDaysMet, recentDays, type DayCounts } from "@/lib/activityMath";
import { ACTIVITY_KEY } from "@/lib/syncMerge";
import { markDirty } from "@/lib/sync";

type Stored = { days: DayCounts; goal: number; goalUpdatedAt: number };

function read(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? "{}");
    const days: DayCounts = {};
    if (parsed.days && typeof parsed.days === "object") {
      for (const [day, count] of Object.entries(parsed.days)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof count === "number" && count > 0) days[day] = count;
      }
    }
    const goal = (GOAL_OPTIONS as readonly number[]).includes(parsed.goal) ? parsed.goal : DEFAULT_GOAL;
    return { days, goal, goalUpdatedAt: typeof parsed.goalUpdatedAt === "number" ? parsed.goalUpdatedAt : 0 };
  } catch {
    return { days: {}, goal: DEFAULT_GOAL, goalUpdatedAt: 0 };
  }
}

function write(next: Stored) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
    markDirty(ACTIVITY_KEY);
    window.dispatchEvent(new Event("brainsoma:learning-updated"));
  } catch { /* storage unavailable */ }
}

/** Counts one reviewed card towards today's goal and streak. */
export function recordReview() {
  const stored = read();
  const today = dayKey();
  write({ ...stored, days: { ...stored.days, [today]: (stored.days[today] ?? 0) + 1 } });
}

export function setDailyGoal(goal: number) {
  write({ ...read(), goal, goalUpdatedAt: Date.now() });
}

export interface ActivitySummary {
  today: number;
  goal: number;
  goalMet: boolean;
  streak: number;
  best: number;
  goalDays: number;
  week: { key: string; label: string; count: number }[];
}

export function useActivity(): ActivitySummary {
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    setReady(true);
    window.addEventListener("brainsoma:learning-updated", refresh);
    return () => window.removeEventListener("brainsoma:learning-updated", refresh);
  }, []);
  void version;
  const { days, goal } = ready ? read() : { days: {} as DayCounts, goal: DEFAULT_GOAL };
  const today = days[dayKey()] ?? 0;
  return {
    today,
    goal,
    goalMet: today >= goal,
    streak: currentStreak(days),
    best: bestStreak(days),
    goalDays: goalDaysMet(days, goal),
    week: recentDays(days),
  };
}
