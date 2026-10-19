"use client";

/* Analytics are fetched only after the admin session gate resolves. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { authorizedFetch } from "@/lib/adminFetch";

interface QuestionRef {
  id: string;
  question: string;
  subject: string;
  topic: string;
  subtopic: string;
}
interface Analytics {
  generatedAt: string;
  accounts: { total: number; new7d: number; new30d: number; withAttempts: number; active7d: number; active30d: number; withBookmarks: number };
  attempts: {
    total: number; last7d: number; independentCorrect: number; supportedCorrect: number; incorrect: number;
    withHints: number; answerRevealed: number; avgResponseSeconds: number | null; questionsAttempted: number;
  };
  hintLevels: { hints: number; attempts: number }[];
  ratings: { rating: string; attempts: number }[];
  modes: { mode: string; attempts: number }[];
  mastery: { status: string; count: number }[];
  daily: { day: string; attempts: number; students: number; signups: number }[];
  byAssessmentObjective: { ao: string; attempts: number; incorrect: number; hinted: number }[];
  byTopic: { subject: string; topic: string; attempts: number; students: number; incorrect: number; hinted: number; questionsAttempted: number }[];
  topHinted: (QuestionRef & { attempts: number; students: number; hinted: number; hintsTotal: number; revealed: number })[];
  topIncorrect: (QuestionRef & { attempts: number; students: number; incorrect: number })[];
  topBookmarked: (QuestionRef & { bookmarks: number })[];
}

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");
const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="sm-panel-sm p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
          <span className="font-semibold">{row.label}</span>
          <span className="h-3 rounded-full bg-ink/10">
            <span className="block h-3 rounded-full bg-orange-dark" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

function QuestionTable<T extends QuestionRef>({ rows, columns, empty }: {
  rows: T[];
  columns: { header: string; cell: (row: T) => React.ReactNode }[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-sm text-ink-soft">{empty}</p>;
  return (
    <div className="sm-panel-sm overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-xs uppercase tracking-widest text-ink-soft">
            <th className="p-3">Question</th>
            {columns.map((column) => <th key={column.header} className="p-3 text-right">{column.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-ink/5 align-top last:border-0">
              <td className="max-w-md p-3">
                <p className="font-semibold">{row.question}</p>
                <p className="mt-1 text-xs text-ink-soft">{row.id} · {cap(row.subject)} · {row.topic} · {row.subtopic}</p>
              </td>
              {columns.map((column) => <td key={column.header} className="p-3 text-right tabular-nums">{column.cell(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/analytics?top=15");
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not load analytics.");
      setData(body as Analytics);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const attempts = data?.attempts;

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-cream px-4 py-10 text-ink sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link href="/admin" className="text-sm font-bold text-orange-dark">← Admin</Link>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl font-bold">Student learning</h1>
              <p className="mt-2 max-w-2xl text-ink-soft">
                Aggregate activity across all student accounts. Individual students are never shown, and admin accounts are excluded.
              </p>
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="sm-btn">
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {error && <p className="sm-panel mt-6 p-4 font-semibold text-red-700">{error}</p>}

          {data && attempts && (
            <>
              <Section title="Accounts">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <Stat label="Total accounts" value={data.accounts.total} note={`${data.accounts.new7d} new in 7 days · ${data.accounts.new30d} in 30 days`} />
                  <Stat label="Active, last 7 days" value={data.accounts.active7d} note={`${pct(data.accounts.active7d, data.accounts.total)} of accounts`} />
                  <Stat label="Active, last 30 days" value={data.accounts.active30d} note={`${pct(data.accounts.active30d, data.accounts.total)} of accounts`} />
                  <Stat label="Ever answered" value={data.accounts.withAttempts} note={`${data.accounts.total - data.accounts.withAttempts} signed up but never practised`} />
                </div>
              </Section>

              <Section title="Practice overview" hint="Attempts are only recorded for signed-in students answering question-bank questions.">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <Stat label="Attempts" value={attempts.total} note={`${attempts.last7d} in last 7 days`} />
                  <Stat label="Questions attempted" value={attempts.questionsAttempted} />
                  <Stat label="Answered incorrectly" value={pct(attempts.incorrect, attempts.total)} note={`${attempts.incorrect} attempts`} />
                  <Stat label="Used a hint" value={pct(attempts.withHints, attempts.total)} note={`${attempts.withHints} attempts`} />
                  <Stat label="Independent correct" value={pct(attempts.independentCorrect, attempts.total)} />
                  <Stat label="Supported correct" value={pct(attempts.supportedCorrect, attempts.total)} note="Hints used or rated hard" />
                  <Stat label="Answer revealed" value={pct(attempts.answerRevealed, attempts.total)} />
                  <Stat label="Avg. time per question" value={attempts.avgResponseSeconds == null ? "–" : `${attempts.avgResponseSeconds}s`} />
                </div>
              </Section>

              <Section title="Activity, last 30 days" hint="Attempts per day.">
                <div className="sm-panel-sm p-4">
                  <div className="flex h-32 items-end gap-1" role="img" aria-label="Attempts per day for the last 30 days">
                    {(() => {
                      const max = Math.max(1, ...data.daily.map((d) => d.attempts));
                      return data.daily.map((d) => (
                        <div
                          key={d.day}
                          title={`${d.day}: ${d.attempts} attempts, ${d.students} students, ${d.signups} signups`}
                          className="flex-1 rounded-t bg-orange-dark"
                          style={{ height: `${Math.max(2, (d.attempts / max) * 100)}%`, opacity: d.attempts ? 1 : 0.25 }}
                        />
                      ));
                    })()}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-ink-soft">
                    <span>{data.daily[0]?.day}</span>
                    <span>{data.daily[data.daily.length - 1]?.day}</span>
                  </div>
                </div>
              </Section>

              <Section title="Questions with the highest hint use" hint="Ranked by attempts where a hint was opened. Frequent hints suggest the question wording or the topic is hard.">
                <QuestionTable
                  rows={data.topHinted}
                  empty="No hints have been used yet."
                  columns={[
                    { header: "With hint", cell: (r) => `${r.hinted} / ${r.attempts}` },
                    { header: "Hint rate", cell: (r) => pct(r.hinted, r.attempts) },
                    { header: "Avg hints", cell: (r) => (r.hintsTotal / r.attempts).toFixed(1) },
                    { header: "Students", cell: (r) => r.students },
                  ]}
                />
              </Section>

              <Section title="Questions answered incorrectly most" hint="Ranked by attempts rated “again”.">
                <QuestionTable
                  rows={data.topIncorrect}
                  empty="No incorrect answers recorded yet."
                  columns={[
                    { header: "Incorrect", cell: (r) => `${r.incorrect} / ${r.attempts}` },
                    { header: "Error rate", cell: (r) => pct(r.incorrect, r.attempts) },
                    { header: "Students", cell: (r) => r.students },
                  ]}
                />
              </Section>

              <Section title="Most bookmarked questions" hint={`Counts students who bookmarked the question. ${data.accounts.withBookmarks} students have synced bookmarks.`}>
                <QuestionTable
                  rows={data.topBookmarked}
                  empty="No bookmarks synced yet. Bookmarks sync the next time a signed-in student opens revision."
                  columns={[{ header: "Bookmarks", cell: (r) => r.bookmarks }]}
                />
              </Section>

              <Section title="By topic" hint="Where students are practising and where they struggle.">
                <div className="sm-panel-sm overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink/10 text-xs uppercase tracking-widest text-ink-soft">
                        <th className="p-3">Topic</th>
                        <th className="p-3 text-right">Attempts</th>
                        <th className="p-3 text-right">Students</th>
                        <th className="p-3 text-right">Incorrect</th>
                        <th className="p-3 text-right">Hint rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byTopic.map((row) => (
                        <tr key={`${row.subject}:${row.topic}`} className="border-b border-ink/5 last:border-0">
                          <td className="p-3"><span className="font-semibold">{row.topic}</span> <span className="text-xs text-ink-soft">{cap(row.subject)}</span></td>
                          <td className="p-3 text-right tabular-nums">{row.attempts}</td>
                          <td className="p-3 text-right tabular-nums">{row.students}</td>
                          <td className="p-3 text-right tabular-nums">{pct(row.incorrect, row.attempts)}</td>
                          <td className="p-3 text-right tabular-nums">{pct(row.hinted, row.attempts)}</td>
                        </tr>
                      ))}
                      {!data.byTopic.length && <tr><td className="p-3 text-ink-soft" colSpan={5}>No attempts yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Section>

              <div className="grid gap-8 md:grid-cols-2">
                <Section title="Hints per attempt">
                  <Bars rows={data.hintLevels.map((h) => ({ label: h.hints === 0 ? "No hints" : `${h.hints} hint${h.hints > 1 ? "s" : ""}`, value: h.attempts }))} />
                </Section>
                <Section title="Self-rating">
                  <Bars rows={data.ratings.map((r) => ({ label: cap(r.rating), value: r.attempts }))} />
                </Section>
                <Section title="Assessment objective" hint="Error rate by AO.">
                  <Bars rows={data.byAssessmentObjective.map((a) => ({ label: `${a.ao} · ${pct(a.incorrect, a.attempts)} wrong`, value: a.attempts }))} />
                </Section>
                <Section title="Mastery of attempted questions" hint="Student × question pairs.">
                  <Bars rows={data.mastery.map((m) => ({ label: cap(m.status), value: m.count }))} />
                </Section>
                <Section title="Practice mode">
                  <Bars rows={data.modes.map((m) => ({ label: cap(m.mode), value: m.attempts }))} />
                </Section>
              </div>

              <p className="mt-10 text-xs text-ink-soft">Generated {new Date(data.generatedAt).toLocaleString()}</p>
            </>
          )}
        </div>
      </main>
    </RequireAdmin>
  );
}
