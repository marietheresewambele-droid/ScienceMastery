"use client";

import { useState } from "react";
import { SUBJECT_NAMES, type Course, type CourseTier } from "@/lib/courses";
import type { Subject } from "@/types/questions";

type Draft = Omit<Course, "id">;
type Group = Subject | "combined";

const GROUPS: { id: Group; label: string }[] = [
  { id: "biology", label: "Biology" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
  { id: "combined", label: "Combined Science" },
];
const SCIENCES = Object.keys(SUBJECT_NAMES) as Subject[];
const TIERS: CourseTier[] = ["Higher", "Foundation"];

const selectClass = "mt-1 w-full rounded-xl border-2 border-ink bg-card p-2.5 font-normal outline-none focus:border-orange";
const choiceClass = (active: boolean) =>
  `rounded-lg border-2 border-ink px-3.5 py-1.5 font-display text-sm font-semibold transition hover:-translate-y-0.5 ${active ? "bg-ink text-cream" : "bg-card text-ink"}`;

/**
 * Qualification -> subject -> (science, for Combined) -> exam board -> tier.
 * The same steps drive both the full /courses page ("cards") and the dashboard's
 * add-course menu ("dropdown"). `onSelect` reports the finished choice, or null while incomplete.
 */
export default function CourseSelector({
  variant,
  onSelect,
}: {
  variant: "cards" | "dropdown";
  onSelect: (draft: Draft | null) => void;
}) {
  const [qualification, setQualification] = useState<"GCSE" | "">("");
  const [group, setGroup] = useState<Group | "">("");
  const [science, setScience] = useState<Subject | "">("");
  const [board, setBoard] = useState<"AQA" | "">("");
  const [tier, setTier] = useState<CourseTier>("Higher");

  function report(next: { qualification: string; group: string; science: string; board: string; tier: CourseTier }) {
    const subject = next.group === "combined" ? next.science : next.group;
    if (next.qualification !== "GCSE" || !subject || next.board !== "AQA") return onSelect(null);
    onSelect({
      qualification: "GCSE",
      subject: subject as Subject,
      board: "AQA",
      pathway: next.group === "combined" ? "combined" : "triple",
      tier: next.tier,
    });
  }
  const current = { qualification, group, science, board, tier };
  const update = (patch: Partial<typeof current>) => {
    const next = { ...current, ...patch };
    if (patch.group !== undefined && patch.group !== "combined") next.science = "";
    if (patch.qualification !== undefined && !patch.qualification) Object.assign(next, { group: "", science: "", board: "" });
    setQualification(next.qualification as "GCSE" | "");
    setGroup(next.group as Group | "");
    setScience(next.science as Subject | "");
    setBoard(next.board as "AQA" | "");
    setTier(next.tier);
    report(next);
  };

  const showSubjects = qualification === "GCSE";
  const showScience = showSubjects && group === "combined";
  const showBoard = showSubjects && group !== "" && (group !== "combined" || science !== "");
  const showTier = showBoard && board === "AQA";

  if (variant === "dropdown") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm font-bold">Qualification
          <select value={qualification} onChange={(event) => update({ qualification: event.target.value as "GCSE" | "", group: "", science: "", board: "" })} className={selectClass}>
            <option value="">Select…</option>
            <option value="GCSE">GCSE</option>
          </select>
        </label>
        <label className="text-sm font-bold">Subject
          <select disabled={!showSubjects} value={group} onChange={(event) => update({ group: event.target.value as Group | "", science: "", board: "" })} className={`${selectClass} disabled:opacity-40`}>
            <option value="">Select…</option>
            {GROUPS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        {showScience && <label className="text-sm font-bold">Science
          <select value={science} onChange={(event) => update({ science: event.target.value as Subject | "", board: "" })} className={selectClass}>
            <option value="">Select…</option>
            {SCIENCES.map((id) => <option key={id} value={id}>{SUBJECT_NAMES[id]}</option>)}
          </select>
        </label>}
        <label className="text-sm font-bold">Exam board
          <select disabled={!showBoard} value={board} onChange={(event) => update({ board: event.target.value as "AQA" | "" })} className={`${selectClass} disabled:opacity-40`}>
            <option value="">Select…</option>
            <option value="AQA">AQA</option>
          </select>
        </label>
        <label className="text-sm font-bold">Tier
          <select disabled={!showTier} value={tier} onChange={(event) => update({ tier: event.target.value as CourseTier })} className={`${selectClass} disabled:opacity-40`}>
            {TIERS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showTier && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border-2 border-ink bg-yellow-soft px-3 py-2.5" role="group" aria-label="Tier">
          <span className="text-xs font-extrabold uppercase tracking-wide">Tier</span>
          {TIERS.map((value) => (
            <button key={value} type="button" aria-pressed={tier === value} onClick={() => update({ tier: value })} className={choiceClass(tier === value)}>{value}</button>
          ))}
        </div>
      )}
      <section>
        <h2 className="font-display text-base font-bold">1. Qualification</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-pressed={qualification === "GCSE"} onClick={() => update({ qualification: "GCSE", group: "", science: "", board: "" })} className={choiceClass(qualification === "GCSE")}>GCSE</button>
        </div>
      </section>
      {showSubjects && (
        <section>
          <h2 className="font-display text-base font-bold">2. Subject</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {GROUPS.map((item) => (
              <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => update({ group: item.id, science: "", board: "" })} className={choiceClass(group === item.id)}>{item.label}</button>
            ))}
          </div>
        </section>
      )}
      {showScience && (
        <section>
          <h2 className="font-display text-base font-bold">Which Combined Science?</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {SCIENCES.map((id) => (
              <button key={id} type="button" aria-pressed={science === id} onClick={() => update({ science: id, board: "" })} className={choiceClass(science === id)}>{SUBJECT_NAMES[id]}</button>
            ))}
          </div>
        </section>
      )}
      {showBoard && (
        <section>
          <h2 className="font-display text-base font-bold">3. Exam board</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" aria-pressed={board === "AQA"} onClick={() => update({ board: "AQA" })} className={choiceClass(board === "AQA")}>AQA</button>
          </div>
        </section>
      )}
    </div>
  );
}
