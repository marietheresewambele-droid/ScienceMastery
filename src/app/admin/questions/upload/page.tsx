"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { authorizedFetch } from "@/lib/adminFetch";
import type { WebsiteQuestionRow } from "@/types/websiteQuestion";

interface RowIssue {
  row: number;
  questionId?: string;
  message: string;
}

interface ParseResponse {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  issues: RowIssue[];
  canPublish: boolean;
  rows: WebsiteQuestionRow[];
}

export default function UploadQuestionsPage() {
  return (
    <RequireAdmin>
      <UploadForm />
    </RequireAdmin>
  );
}

function UploadForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [publishMessage, setPublishMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setResult(null);
    setPublishMessage("");
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx files are accepted.");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await authorizedFetch("/api/admin/questions/parse", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "The workbook could not be parsed.");
        return;
      }
      setResult(body as ParseResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The workbook could not be parsed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!result || !result.canPublish) return;
    setPublishing(true);
    setPublishMessage("");
    try {
      const response = await authorizedFetch("/api/admin/questions/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: result.rows }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "The questions could not be saved.");
        return;
      }
      setPublishMessage(`Saved ${body.saved} question(s). New questions are unpublished until you publish them from Manage Questions.`);
      setResult(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The questions could not be saved.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-bold text-orange-dark">← Admin</Link>
        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-orange-dark">Question importer</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Upload a workbook</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Upload an .xlsx workbook containing a worksheet named exactly <strong>Website Upload</strong>. Nothing is saved until every row passes validation and you press Publish.
        </p>

        <div className="sm-panel mt-8 p-6">
          <label className="block text-sm font-bold">
            Workbook file (.xlsx)
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
              className="mt-2 block w-full rounded-xl border-2 border-ink bg-card p-2.5 text-sm"
            />
          </label>

          {busy && <p className="mt-4 text-sm font-semibold text-ink-soft">Reading and validating the workbook…</p>}
          {error && <p className="mt-4 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">{error}</p>}
          {publishMessage && <p className="mt-4 rounded-xl border-2 border-ink bg-moss-soft p-3 text-sm font-semibold text-moss-dark">{publishMessage}</p>}
        </div>

        {result && (
          <div className="sm-panel mt-6 p-6">
            <h2 className="font-display text-xl font-bold">Validation summary</h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-md border-2 border-ink bg-card px-3 py-1">{result.totalRows} row(s) read</span>
              <span className="rounded-md border-2 border-ink bg-moss-soft px-3 py-1 text-moss-dark">{result.validCount} valid</span>
              <span className={`rounded-md border-2 border-ink px-3 py-1 ${result.invalidCount ? "bg-orange-soft text-orange-dark" : "bg-card"}`}>
                {result.invalidCount} invalid
              </span>
            </div>

            {result.issues.length > 0 && (
              <div className="mt-5">
                <h3 className="font-display text-lg font-semibold">Row issues ({result.issues.length})</h3>
                <p className="mt-1 text-sm text-ink-soft">Fix these in the spreadsheet and re-upload. Nothing has been saved.</p>
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {result.issues.map((issue, index) => (
                    <li key={index} className="rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm text-orange-dark">
                      Row {issue.row}{issue.questionId ? ` (${issue.questionId})` : ""}: {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.rows.length > 0 && (
              <div className="mt-5">
                <h3 className="font-display text-lg font-semibold">Preview ({Math.min(20, result.rows.length)} of {result.rows.length} valid rows)</h3>
                <div className="mt-3 overflow-x-auto rounded-xl border-2 border-ink">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-ink text-cream">
                      <tr>
                        {["Question ID", "Subject", "Topic", "Subtopic", "Marks", "AO", "Tier", "Grade", "Type"].map((header) => (
                          <th key={header} className="px-3 py-2 font-bold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.slice(0, 20).map((row) => (
                        <tr key={row.questionId} className="border-t-2 border-ink/10">
                          <td className="px-3 py-2 font-bold">{row.questionId}</td>
                          <td className="px-3 py-2">{row.subject}</td>
                          <td className="px-3 py-2">{row.topic}</td>
                          <td className="px-3 py-2">{row.subtopic}</td>
                          <td className="px-3 py-2">{row.marks}</td>
                          <td className="px-3 py-2">{row.assessmentObjective}</td>
                          <td className="px-3 py-2">{row.tier}</td>
                          <td className="px-3 py-2">{row.grade}</td>
                          <td className="px-3 py-2">{row.questionType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={publish}
              disabled={!result.canPublish || publishing}
              className="sm-btn mt-6 bg-orange px-6 py-3 text-white disabled:opacity-40"
            >
              {publishing ? "Saving…" : `Import ${result.rows.length} question(s)`}
            </button>
            {!result.canPublish && <p className="mt-2 text-sm font-semibold text-ink-soft">Resolve every row issue above before you can publish.</p>}
          </div>
        )}
      </div>
    </main>
  );
}
