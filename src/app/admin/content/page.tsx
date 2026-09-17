"use client";

import { useState } from "react";
import { prepareContentImport } from "@/lib/contentImports";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { MasteryQuestion } from "@/types/questions";
import { hasBlockingIssues, type ValidationIssue, type WorkbookRelationship } from "@/lib/contentValidation";
import RequireAdmin from "@/components/admin/RequireAdmin";

type PublishResponse = {
  contentVersionId: string;
  publishedQuestions: number;
  publishedHints: number;
  publishedRelationships: number;
  skippedRelationships: string[];
  warnings: ValidationIssue[];
};

type ParseWorkbookResponse = {
  questions: MasteryQuestion[];
  relationships: WorkbookRelationship[];
  topicsFound: { sheet: string; topicSlug: string; count: number; incomplete: number }[];
  missingSheets: string[];
};

export default function ContentAdminPage() {
  return (
    <RequireAdmin>
      <ContentAdminForm />
    </RequireAdmin>
  );
}

function ContentAdminForm() {
  const [subject, setSubject] = useState<"biology" | "chemistry" | "physics">("biology");
  const [version, setVersion] = useState("");
  const [payload, setPayload] = useState("");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const invalidJsonIssue: ValidationIssue = {
    code: "INVALID_JSON",
    message: "Upload or paste a normalized workbook export containing questions and relationships.",
    severity: "error",
  };

  const uploadWorkbook = async (file: File) => {
    setMessage("");
    setIssues([]);
    setUploading(true);
    try {
      const { data: sessionData } = await getSupabaseBrowserClient().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessage("Your session has expired. Sign in again to upload a workbook.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("subject", subject);
      const response = await fetch("/api/admin/content/parse-workbook", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "The workbook could not be parsed.");
        return;
      }

      const parsed = result as ParseWorkbookResponse;
      setPayload(JSON.stringify({ questions: parsed.questions, relationships: parsed.relationships }, null, 2));
      const topicSummary = parsed.topicsFound.map((topic) => `${topic.sheet}: ${topic.count}${topic.incomplete ? ` (${topic.incomplete} incomplete, held back)` : ""}`).join("; ");
      setMessage(
        `Loaded ${parsed.questions.length} question(s) from ${parsed.topicsFound.length} topic sheet(s). ${topicSummary}.` +
          (parsed.missingSheets.length ? ` Sheets not found in this workbook: ${parsed.missingSheets.join(", ")}.` : "") +
          " Review below, then Validate and Publish.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The workbook could not be parsed.");
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    setMessage("");
    try {
      const parsed = JSON.parse(payload) as { questions?: MasteryQuestion[]; relationships?: WorkbookRelationship[] };
      const contentImport = prepareContentImport(subject, version || "draft", parsed.questions ?? [], parsed.relationships ?? []);
      setIssues(contentImport.issues);
      if (contentImport.issues.length === 0) setMessage("Workbook content is valid and ready to publish.");
      else if (!hasBlockingIssues(contentImport.issues)) setMessage(`Ready to publish, with ${contentImport.issues.length} warning(s) below worth reviewing.`);
    } catch {
      setIssues([invalidJsonIssue]);
    }
  };

  const publish = async () => {
    setMessage("");
    setIssues([]);

    let parsed: { questions?: MasteryQuestion[]; relationships?: WorkbookRelationship[] };
    try {
      parsed = JSON.parse(payload);
    } catch {
      setIssues([invalidJsonIssue]);
      return;
    }

    const contentImport = prepareContentImport(subject, version || "draft", parsed.questions ?? [], parsed.relationships ?? []);
    if (hasBlockingIssues(contentImport.issues)) {
      setIssues(contentImport.issues);
      return;
    }

    setPublishing(true);
    try {
      const { data: sessionData } = await getSupabaseBrowserClient().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessage("Your session has expired. Sign in again to publish.");
        return;
      }

      const response = await fetch("/api/admin/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, version: version || "draft", questions: parsed.questions ?? [], relationships: parsed.relationships ?? [] }),
      });
      const result = await response.json();

      if (!response.ok) {
        if (Array.isArray(result.issues)) setIssues(result.issues as ValidationIssue[]);
        setMessage(result.error || "Content could not be published.");
        return;
      }

      const published = result as PublishResponse;
      setIssues(published.warnings ?? []);
      setMessage(
        `Published ${published.publishedQuestions} question(s) to ${published.contentVersionId} ` +
          `(${published.publishedHints} hint set(s), ${published.publishedRelationships} relationship(s)).` +
          (published.warnings?.length ? ` ${published.warnings.length} warning(s) below worth reviewing.` : "") +
          (published.skippedRelationships.length
            ? ` Skipped unsupported relationship types: ${published.skippedRelationships.join(", ")}.`
            : ""),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Content could not be published.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-ink">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Content administration</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Validate and publish workbook content</h1>
        <p className="mt-4 max-w-3xl text-ink-soft">Upload an approved Excel workbook, or paste a normalized workbook export, then validate and publish it live. Publishing writes directly to the question catalogue students see — there is no separate review step.</p>

        <section className="sm-panel mt-8 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-bold">Subject<select value={subject} onChange={(event) => setSubject(event.target.value as typeof subject)} className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3"><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label>
            <label className="font-bold">Content version<input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="2026.08" className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3" /></label>
          </div>
        </section>

        <section className="sm-panel mt-6 p-6">
          <h2 className="font-display text-xl font-bold">Upload a {subject === "biology" ? "Biology" : subject === "physics" ? "Physics" : "Chemistry"} workbook</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {subject === "chemistry"
              ? "Accepts the Chemistry Mastery Audit (Website Ready) format — one sheet per topic (T1–T10), with a “Website question ID”, “Question”, “Model answer / marking points” and related columns."
              : "Accepts the Mastery Audit format — one sheet per topic (e.g. “Topic 1 - Cell Biology”), with an “ID”, “Self-contained mastery question”, “Model answer / creditworthy marking points” and related columns."}
            {" "}
            {subject === "physics" && <strong>Not yet tested against a real Physics workbook — check the topic/question counts below carefully before publishing.</strong>}
          </p>
          <input
            type="file"
            accept=".xlsx"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadWorkbook(file);
            }}
            className="mt-4 block w-full rounded-xl border-2 border-dashed border-ink bg-card p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:font-bold file:text-cream disabled:opacity-40"
          />
          {uploading && <p className="mt-3 text-sm font-semibold text-ink-soft">Parsing workbook…</p>}
        </section>

        <section className="sm-panel mt-6 p-6">
          <label className="block font-bold">Normalized workbook JSON<textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={16} placeholder='{"questions": [], "relationships": []}' className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3 font-mono text-sm" /></label>
          <div className="mt-5 flex flex-wrap gap-3"><button onClick={validate} className="sm-btn bg-ink px-5 py-3 text-cream">Validate</button><button onClick={publish} disabled={!payload || publishing} className="sm-btn bg-orange px-5 py-3 text-white disabled:opacity-40">{publishing ? "Publishing…" : "Publish live"}</button></div>
          {message && <p className="mt-5 rounded-xl border-2 border-ink bg-moss-soft p-4 font-semibold">{message}</p>}
          {issues.some((issue) => issue.severity === "error") && (
            <ul className="mt-5 space-y-2 rounded-xl border-2 border-ink bg-orange-soft p-4 text-sm">
              {issues.filter((issue) => issue.severity === "error").map((issue, index) => <li key={index}><strong>Error</strong> — {issue.code}: {issue.message}</li>)}
            </ul>
          )}
          {issues.some((issue) => issue.severity === "warning") && (
            <ul className="mt-5 space-y-2 rounded-xl border-2 border-ink bg-yellow-soft p-4 text-sm">
              {issues.filter((issue) => issue.severity === "warning").map((issue, index) => <li key={index}><strong>Warning</strong> — {issue.code}: {issue.message}</li>)}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
