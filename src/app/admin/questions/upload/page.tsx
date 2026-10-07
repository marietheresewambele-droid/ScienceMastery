"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { authorizedFetch } from "@/lib/adminFetch";
import { topicRegistry } from "@/data/topics/registry";

interface WorkbookIssue {
  severity: "error" | "warning";
  sheet?: string;
  row?: number;
  questionId?: string;
  message: string;
}

interface TopicSummary {
  subject: "biology" | "chemistry" | "physics";
  topicNumber: number;
  sheet: string;
  questionCount: number;
  subtopics: { name: string; order: number; questionCount: number }[];
}

interface PreviewRow {
  questionId: string;
  subtopic: string;
  question: string;
  marks: number;
  assessmentObjective: string;
  tier: string;
  qualification: string;
  keyTerms: string[];
}

interface ParseResponse {
  questionCount: number;
  errorCount: number;
  warningCount: number;
  issues: WorkbookIssue[];
  topics: TopicSummary[];
  canPublish: boolean;
  preview: PreviewRow[];
}

interface PublishResponse {
  questions: number;
  created: number;
  updated: number;
  activeNew: boolean;
  subtopics: number;
}

const topicTitle = (topic: TopicSummary) =>
  topicRegistry.find((item) => item.subject === topic.subject && item.number === topic.topicNumber)?.title ?? topic.sheet;

const issueLabel = (issue: WorkbookIssue) =>
  [issue.sheet, issue.row ? `row ${issue.row}` : "", issue.questionId ? `(${issue.questionId})` : ""].filter(Boolean).join(" ");

export default function UploadQuestionsPage() {
  return (
    <RequireAdmin>
      <UploadForm />
    </RequireAdmin>
  );
}

function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [activateNew, setActivateNew] = useState(true);
  const [publishMessage, setPublishMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(selected: File) {
    setError("");
    setResult(null);
    setPublishMessage("");
    setFile(null);
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx files are accepted.");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const response = await authorizedFetch("/api/admin/questions/parse", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "The workbook could not be parsed.");
        return;
      }
      setFile(selected);
      setResult(body as ParseResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The workbook could not be parsed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!file || !result?.canPublish) return;
    setPublishing(true);
    setError("");
    setPublishMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("activateNew", String(activateNew));
      const response = await authorizedFetch("/api/admin/questions/publish", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "The questions could not be saved.");
        return;
      }
      const summary = body as PublishResponse;
      setPublishMessage(
        `Saved ${summary.questions} question(s): ${summary.created} new, ${summary.updated} updated, across ${summary.subtopics} subtopic(s). ` +
          (summary.created
            ? summary.activeNew ? "New questions are live for students now." : "New questions are inactive until you publish them from Manage Questions."
            : "Existing questions kept their published/unpublished state."),
      );
      setResult(null);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The questions could not be saved.");
    } finally {
      setPublishing(false);
    }
  }

  const errors = result?.issues.filter((issue) => issue.severity === "error") ?? [];
  const warnings = result?.issues.filter((issue) => issue.severity === "warning") ?? [];

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-bold text-orange-dark">← Admin</Link>
        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-orange-dark">Question importer</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Upload a workbook</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Upload a BrainSoma standard workbook (for example <strong>BrainSoma_Chemistry.xlsx</strong>): a Guide sheet plus one sheet per topic,
          each with a header row starting <strong>Question ID</strong>. Questions are filed by Subject → Topic (the Unit column, T1, T2…) → Subtopic.
          Nothing is saved until every error is fixed and you press Import.
        </p>

        <div className="sm-panel mt-8 p-6">
          <label className="block text-sm font-bold">
            Workbook file (.xlsx)
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) void handleFile(selected);
              }}
              className="mt-2 block w-full rounded-xl border-2 border-ink bg-card p-2.5 text-sm"
            />
          </label>

          {busy && <p className="mt-4 text-sm font-semibold text-ink-soft">Reading and validating the workbook…</p>}
          {error && <p role="alert" className="mt-4 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">{error}</p>}
          {publishMessage && <p className="mt-4 rounded-xl border-2 border-ink bg-moss-soft p-3 text-sm font-semibold text-moss-dark">{publishMessage}</p>}
        </div>

        {result && (
          <div className="sm-panel mt-6 p-6">
            <h2 className="font-display text-xl font-bold">Validation summary</h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-md border-2 border-ink bg-moss-soft px-3 py-1 text-moss-dark">{result.questionCount} valid question(s)</span>
              <span className={`rounded-md border-2 border-ink px-3 py-1 ${result.errorCount ? "bg-orange-soft text-orange-dark" : "bg-card"}`}>{result.errorCount} error(s)</span>
              <span className="rounded-md border-2 border-ink bg-yellow-soft px-3 py-1">{result.warningCount} warning(s)</span>
            </div>

            {errors.length > 0 && (
              <div className="mt-5">
                <h3 className="font-display text-lg font-semibold">Errors ({errors.length})</h3>
                <p className="mt-1 text-sm text-ink-soft">Fix these in the spreadsheet and re-upload. Nothing has been saved.</p>
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {errors.map((issue, index) => (
                    <li key={index} className="rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm text-orange-dark">
                      {issueLabel(issue) && <strong>{issueLabel(issue)}: </strong>}{issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <details className="mt-5">
                <summary className="cursor-pointer font-display text-lg font-semibold">Warnings ({warnings.length}): these don&apos;t block the import</summary>
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {warnings.map((issue, index) => (
                    <li key={index} className="rounded-xl border-2 border-ink bg-card p-3 text-sm text-ink-soft">
                      {issueLabel(issue) && <strong className="text-ink">{issueLabel(issue)}: </strong>}{issue.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {result.topics.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-lg font-semibold">Topics and subtopics</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {result.topics.map((topic) => (
                    <div key={`${topic.subject}-${topic.topicNumber}`} className="rounded-xl border-2 border-ink bg-card p-4 text-sm">
                      <p className="font-bold capitalize">{topic.subject} · T{topic.topicNumber} {topicTitle(topic)}</p>
                      <p className="text-ink-soft">{topic.questionCount} question(s), sheet &quot;{topic.sheet}&quot;</p>
                      <ol className="mt-2 list-decimal space-y-0.5 pl-5">
                        {topic.subtopics.map((subtopic) => (
                          <li key={subtopic.name}>{subtopic.name} <span className="text-ink-soft">({subtopic.questionCount})</span></li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.preview.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-lg font-semibold">Preview (first {result.preview.length} of {result.questionCount})</h3>
                <div className="mt-3 overflow-x-auto rounded-xl border-2 border-ink">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="bg-ink text-cream">
                      <tr>
                        {["Question ID", "Subtopic", "Question", "Marks", "AO", "Tier", "Key terms"].map((header) => (
                          <th key={header} className="px-3 py-2 font-bold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.preview.map((row) => (
                        <tr key={row.questionId} className="border-t-2 border-ink/10 align-top">
                          <td className="px-3 py-2 font-bold">{row.questionId}</td>
                          <td className="px-3 py-2">{row.subtopic}</td>
                          <td className="max-w-xs px-3 py-2">{row.question}</td>
                          <td className="px-3 py-2">{row.marks}</td>
                          <td className="px-3 py-2">{row.assessmentObjective}</td>
                          <td className="px-3 py-2">{row.tier}</td>
                          <td className="px-3 py-2">{row.keyTerms.join("; ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <label className="mt-6 flex items-start gap-3 text-sm font-semibold">
              <input type="checkbox" checked={activateNew} onChange={(event) => setActivateNew(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>
                Make new questions live for students immediately
                <span className="block font-normal text-ink-soft">Questions that already exist keep their current published/unpublished state either way.</span>
              </span>
            </label>

            <button
              onClick={publish}
              disabled={!result.canPublish || publishing}
              className="sm-btn mt-4 bg-orange px-6 py-3 text-white disabled:opacity-40"
            >
              {publishing ? "Saving…" : `Import ${result.questionCount} question(s)`}
            </button>
            {!result.canPublish && <p className="mt-2 text-sm font-semibold text-ink-soft">Resolve every error above before you can import.</p>}
          </div>
        )}
      </div>
    </main>
  );
}
