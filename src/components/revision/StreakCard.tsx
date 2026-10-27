"use client";

import { GOAL_OPTIONS } from "@/lib/activityMath";
import { setDailyGoal, useActivity } from "@/lib/activity";

const Flame = ({ lit }: { lit: boolean }) => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill={lit ? "var(--color-orange)" : "none"} stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

/** Daily goal progress, the current streak and the last seven days of activity. */
export default function StreakCard() {
  const activity = useActivity();
  const percent = Math.min(100, Math.round((activity.today / activity.goal) * 100));
  const peak = Math.max(activity.goal, ...activity.week.map((day) => day.count));

  return (
    <section className="sm-panel p-5" aria-label="Daily goal and streak">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Flame lit={activity.streak > 0} />
          <div>
            <p className="font-display text-2xl font-bold leading-none">{activity.streak}-day streak</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">
              {activity.streak === 0 ? "Review a card today to start a streak." : activity.today === 0 ? "Review a card today to keep it going." : "Streak safe for today."}
              {activity.best > 0 && ` Best: ${activity.best}`}
            </p>
          </div>
        </div>
        <label className="text-xs font-bold">Daily goal
          <select value={activity.goal} onChange={(event) => setDailyGoal(Number(event.target.value))} className="ml-2 rounded-lg border-2 border-ink bg-card px-2 py-1 text-xs font-semibold">
            {GOAL_OPTIONS.map((value) => <option key={value} value={value}>{value} cards</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-bold">
          <span>Today: {activity.today} / {activity.goal} cards</span>
          <span>{activity.goalMet ? "Goal reached 🎉" : `${activity.goal - activity.today} to go`}</span>
        </div>
        <div className="h-3 rounded-full border-2 border-ink bg-cream-soft" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Today's goal">
          <div className={`h-full rounded-full transition-all ${activity.goalMet ? "bg-moss" : "bg-orange"}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-end gap-2" aria-label="Cards reviewed in the last 7 days">
        {activity.week.map((day) => (
          <div key={day.key} className="flex flex-1 flex-col items-center gap-1" title={`${day.count} cards`}>
            <div className="flex h-12 w-full items-end rounded-md border-2 border-ink/20 bg-cream-soft">
              <div className={`w-full rounded-sm ${day.count >= activity.goal ? "bg-moss" : day.count > 0 ? "bg-orange" : ""}`} style={{ height: `${day.count ? Math.max(8, (day.count / peak) * 100) : 0}%` }} />
            </div>
            <span className="text-[10px] font-bold text-ink-soft">{day.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
