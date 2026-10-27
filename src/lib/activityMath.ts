/** Daily review counts keyed by local date ("2026-10-27"), and the streak maths on top of them. */

export type DayCounts = Record<string, number>;

export const GOAL_OPTIONS = [10, 20, 30, 50] as const;
export const DEFAULT_GOAL = 20;

const pad = (value: number) => String(value).padStart(2, "0");

/** The student's local calendar day, so a streak rolls over at their midnight and not UTC's. */
export const dayKey = (date: Date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function fromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(key: string, amount: number): string {
  const date = fromKey(key);
  date.setDate(date.getDate() + amount);
  return dayKey(date);
}

/**
 * Consecutive days with at least one review, counted back from today. A day you have not studied yet
 * does not break the streak: it stays alive until the end of today.
 */
export function currentStreak(days: DayCounts, today: Date = new Date()): number {
  let cursor = dayKey(today);
  if (!(days[cursor] > 0)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days[cursor] > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreak(days: DayCounts): number {
  const keys = Object.keys(days).filter((key) => days[key] > 0).sort();
  let best = 0;
  let run = 0;
  let previous = "";
  for (const key of keys) {
    run = previous && addDays(previous, 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return best;
}

export const goalDaysMet = (days: DayCounts, goal: number) => Object.values(days).filter((count) => count >= goal).length;

/** The last `count` days, oldest first, ending today. */
export function recentDays(days: DayCounts, count = 7, today: Date = new Date()): { key: string; label: string; count: number }[] {
  const end = dayKey(today);
  return Array.from({ length: count }, (_, index) => {
    const key = addDays(end, index - (count - 1));
    return { key, label: fromKey(key).toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2), count: days[key] ?? 0 };
  });
}
