"use client";

/* Client-only localStorage hydration/persistence is intentionally performed after mount. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

type ExamEntry = { id: string; subject: string; title: string; date: string };

const STORAGE_KEY = "sciencemastery_exam_calendar";
const SUBJECTS = ["Biology", "Chemistry", "Physics", "Other"];

function loadExams(): ExamEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is ExamEntry =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.subject === "string" &&
        typeof entry.title === "string" &&
        typeof entry.date === "string"
    );
  } catch {
    return [];
  }
}

function saveExams(exams: ExamEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  } catch {
    /* localStorage unavailable */
  }
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ExamCalendar() {
  const [ready, setReady] = useState(false);
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    setExams(loadExams());
    setReady(true);
  }, []);

  const addExam = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !date) return;
    const next = [...exams, { id: `exam_${Date.now()}`, subject, title: title.trim(), date }];
    setExams(next);
    saveExams(next);
    setTitle("");
    setDate("");
  };

  const removeExam = (id: string) => {
    const next = exams.filter((exam) => exam.id !== id);
    setExams(next);
    saveExams(next);
  };

  if (!ready) {
    return (
      <article className="sm-panel p-6">
        <h2 className="font-display text-xl font-bold">Exam calendar</h2>
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      </article>
    );
  }

  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((exam) => daysUntil(exam.date) >= 0);
  const past = sorted.filter((exam) => daysUntil(exam.date) < 0);

  return (
    <article className="sm-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Exam calendar</h2>
        <span className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold text-ink-soft">
          {upcoming.length} upcoming
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">Add your exam dates to see a countdown and stay on track.</p>

      <form onSubmit={addExam} className="mt-5 grid gap-3 sm:grid-cols-[9rem_1fr_10rem_auto]">
        <select
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          aria-label="Exam subject"
          className="rounded-xl border-2 border-ink bg-card px-3 py-2.5 text-sm font-semibold text-ink"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Exam name (e.g. Paper 1)"
          aria-label="Exam name"
          required
          className="rounded-xl border-2 border-ink bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/50"
        />
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Exam date"
          required
          className="rounded-xl border-2 border-ink bg-card px-3 py-2.5 text-sm text-ink"
        />
        <button type="submit" className="sm-btn !rounded-xl bg-orange px-4 py-2.5 text-sm text-white">
          Add exam
        </button>
      </form>

      <div className="mt-6 space-y-2.5">
        {upcoming.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-ink/30 bg-cream-soft p-4 text-sm text-ink-soft">
            No upcoming exams yet — add one above to start your countdown.
          </p>
        )}
        {upcoming.map((exam) => {
          const days = daysUntil(exam.date);
          const urgency =
            days === 0
              ? "bg-orange text-white"
              : days <= 7
                ? "bg-orange-soft text-orange-dark"
                : "bg-moss-soft text-moss-dark";
          return (
            <div
              key={exam.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink bg-card p-3.5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border-2 border-ink bg-yellow-soft px-2 py-0.5 text-xs font-bold text-ink">
                    {exam.subject}
                  </span>
                  <p className="font-display font-semibold text-ink">{exam.title}</p>
                </div>
                <p className="mt-1 text-xs text-ink-soft">{formatDate(exam.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-md border-2 border-ink px-3 py-1 text-xs font-bold ${urgency}`}>
                  {days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`}
                </span>
                <button
                  type="button"
                  onClick={() => removeExam(exam.id)}
                  aria-label={`Remove ${exam.title}`}
                  className="text-ink-soft transition hover:text-orange-dark"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {past.length > 0 && (
        <details className="mt-5 text-sm text-ink-soft">
          <summary className="cursor-pointer font-semibold text-ink-soft">Past exams ({past.length})</summary>
          <div className="mt-3 space-y-2">
            {past.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink/25 bg-cream-soft p-3"
              >
                <p>
                  {exam.subject} · {exam.title} · {formatDate(exam.date)}
                </p>
                <button
                  type="button"
                  onClick={() => removeExam(exam.id)}
                  aria-label={`Remove ${exam.title}`}
                  className="text-ink-soft transition hover:text-orange-dark"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}
