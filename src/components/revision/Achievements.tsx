"use client";

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
  /** Number of courses on the dashboard. */
  courses?: number;
  /** Average secure-mastery percentage across subjects. */
  mastery?: number;
  /** Consecutive study days, best ever, and days the daily goal was met. */
  streak?: number;
  bestStreak?: number;
  goalDays?: number;
}

interface Achievement {
  id: string;
  badge: string;
  title: string;
  description: string;
  unlocked: boolean;
  colour: "orange" | "moss" | "yellow";
}

export default function Achievements({ completed, total, bookmarks, subjects, topics, courses = 0, mastery = 0, streak = 0, bestStreak = 0, goalDays = 0 }: AchievementsProps) {
  const topicsFinished = topics.filter((t) => t.total > 0 && t.percent >= 100).length;
  const topicsStarted = topics.filter((t) => t.completed > 0).length;
  const subjectSpecialist = subjects.some((s) => s.total > 0 && s.completed >= s.total);
  const allRounder = subjects.every((s) => s.completed > 0);
  const subjectDone = (name: string, amount: number) => (subjects.find((s) => s.subject === name)?.completed ?? 0) >= amount;
  const subjectHalf = subjects.some((s) => s.total > 0 && s.completed / s.total >= 0.5);

  const milestone = (id: string, badge: string, title: string, description: string, unlocked: boolean, colour: Achievement["colour"]): Achievement =>
    ({ id, badge, title, description, unlocked, colour });

  const achievements: Achievement[] = [
    milestone("first-steps", "1", "First Steps", "Answer your first mastery question.", completed >= 1, "orange"),
    milestone("ten", "10", "Warm-Up", "Complete 10 questions.", completed >= 10, "orange"),
    milestone("quarter-century", "25", "Quick Learner", "Complete 25 questions.", completed >= 25, "orange"),
    milestone("fifty", "50", "Half Century", "Complete 50 questions.", completed >= 50, "orange"),
    milestone("century-club", "100", "Century Club", "Complete 100 questions.", completed >= 100, "orange"),
    milestone("two-fifty", "250", "Quarter Thousand", "Complete 250 questions.", completed >= 250, "orange"),
    milestone("deep-diver", "300", "Deep Diver", "Complete 300 questions.", completed >= 300, "orange"),
    milestone("five-hundred", "500", "Unstoppable", "Complete 500 questions.", completed >= 500, "orange"),
    milestone("thousand", "1K", "Question Master", "Complete 1,000 questions.", completed >= 1000, "orange"),
    milestone("explorer", "E", "Explorer", "Start 3 different topics.", topicsStarted >= 3, "moss"),
    milestone("globetrotter", "G", "Globetrotter", "Start 10 different topics.", topicsStarted >= 10, "moss"),
    milestone("topic-champion", "T", "Topic Champion", "Finish every question in one topic.", topicsFinished >= 1, "moss"),
    milestone("topic-trio", "T3", "Topic Trio", "Finish every question in 3 topics.", topicsFinished >= 3, "moss"),
    milestone("topic-collector", "T5", "Topic Collector", "Finish every question in 5 topics.", topicsFinished >= 5, "moss"),
    milestone("halfway", "½", "Halfway There", "Complete half of a whole subject.", subjectHalf, "moss"),
    milestone("subject-specialist", "S", "Subject Specialist", "Finish every question in a whole subject.", subjectSpecialist, "moss"),
    milestone("all-rounder", "3", "All-Rounder", "Attempt questions in Biology, Chemistry and Physics.", allRounder, "moss"),
    milestone("biologist", "B", "Budding Biologist", "Complete 50 Biology questions.", subjectDone("biology", 50), "moss"),
    milestone("chemist", "C", "Keen Chemist", "Complete 50 Chemistry questions.", subjectDone("chemistry", 50), "moss"),
    milestone("physicist", "P", "Future Physicist", "Complete 50 Physics questions.", subjectDone("physics", 50), "moss"),
    milestone("secure-25", "25%", "Getting Secure", "Reach 25% secure mastery.", mastery >= 25, "yellow"),
    milestone("secure-50", "50%", "Mastery Builder", "Reach 50% secure mastery.", mastery >= 50, "yellow"),
    milestone("secure-75", "75%", "Mastery Expert", "Reach 75% secure mastery.", mastery >= 75, "yellow"),
    milestone("first-bookmark", "☆", "Bookworm", "Bookmark your first question.", bookmarks >= 1, "yellow"),
    milestone("curator", "★", "Curator", "Bookmark 10 questions to revisit.", bookmarks >= 10, "yellow"),
    milestone("archivist", "★★", "Archivist", "Bookmark 25 questions to revisit.", bookmarks >= 25, "yellow"),
    milestone("first-course", "C1", "Course Chosen", "Add your first course to the dashboard.", courses >= 1, "yellow"),
    milestone("course-collector", "C3", "Course Collector", "Add 3 courses to the dashboard.", courses >= 3, "yellow"),
    milestone("streak-3", "3d", "On a Roll", "Study 3 days in a row.", Math.max(streak, bestStreak) >= 3, "yellow"),
    milestone("streak-7", "7d", "Week Warrior", "Study 7 days in a row.", Math.max(streak, bestStreak) >= 7, "yellow"),
    milestone("streak-14", "14d", "Fortnight Focus", "Study 14 days in a row.", Math.max(streak, bestStreak) >= 14, "yellow"),
    milestone("streak-30", "30d", "Unbreakable", "Study 30 days in a row.", Math.max(streak, bestStreak) >= 30, "yellow"),
    milestone("goal-1", "G1", "Goal Getter", "Hit your daily goal once.", goalDays >= 1, "orange"),
    milestone("goal-7", "G7", "Habit Builder", "Hit your daily goal on 7 days.", goalDays >= 7, "orange"),
    milestone("completionist", "✓", "Completionist", "Complete 90% of every question available.", total > 0 && completed / total >= 0.9, "yellow"),
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const colourClasses: Record<Achievement["colour"], string> = {
    orange: "bg-orange text-white",
    moss: "bg-moss text-white",
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
        Badges unlock automatically as you complete practice questions.
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
