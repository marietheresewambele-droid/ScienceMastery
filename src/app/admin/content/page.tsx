"use client";

import { useState } from "react";
import { prepareContentImport } from "@/lib/contentImports";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { MasteryQuestion } from "@/types/questions";
import type { WorkbookRelationship } from "@/lib/contentValidation";
import RequireAdmin from "@/components/admin/RequireAdmin";

type PublishResponse = {
  contentVersionId: string;
  publishedQuestions: number;
  publishedHints: number;
  publishedRelationships: number;
  skippedRelationships: string[];
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
  const [issues, setIssues] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const validate = () => {
    setMessage("");
    try {
      const parsed = JSON.parse(payload) as { questions?: MasteryQuestion[]; relationships?: WorkbookRelationship[] };
      const contentImport = prepareContentImport(subject, version || "draft", parsed.questions ?? [], parsed.relationships ?? []);
      setIssues(contentImport.issues.map((issue) => `${issue.code}: ${issue.message}`));
      if (contentImport.issues.length === 0) setMessage("Workbook content is valid and ready to publish.");
    } catch {
      setIssues(["INVALID_JSON: Upload or paste a normalized workbook export containing questions and relationships."]);
    }
  };

  const publish = async () => {
    setMessage("");
    setIssues([]);

    let parsed: { questions?: MasteryQuestion[]; relationships?: WorkbookRelationship[] };
    try {
      parsed = JSON.parse(payload);
    } catch {
      setIssues(["INVALID_JSON: Upload or paste a normalized workbook export containing questions and relationships."]);
      return;
    }

    const contentImport = prepareContentImport(subject, version || "draft", parsed.questions ?? [], parsed.relationships ?? []);
    if (contentImport.issues.length > 0) {
      setIssues(contentImport.issues.map((issue) => `${issue.code}: ${issue.message}`));
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
        if (Array.isArray(result.issues)) setIssues(result.issues.map((issue: { code: string; message: string }) => `${issue.code}: ${issue.message}`));
        setMessage(result.error || "Content could not be published.");
        return;
      }

      const published = result as PublishResponse;
      setMessage(
        `Published ${published.publishedQuestions} question(s) to ${published.contentVersionId} ` +
          `(${published.publishedHints} hint set(s), ${published.publishedRelationships} relationship(s)).` +
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
        <p className="mt-4 max-w-3xl text-ink-soft">Paste a normalized workbook export to validate it, then publish it live. Publishing writes directly to the question catalogue students see — there is no separate review step.</p>
        <section className="sm-panel mt-8 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-bold">Subject<select value={subject} onChange={(event) => setSubject(event.target.value as typeof subject)} className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3"><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label>
            <label className="font-bold">Content version<input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="2026.08" className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3" /></label>
          </div>
          <label className="mt-5 block font-bold">Normalized workbook JSON<textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={16} placeholder='{"questions": [], "relationships": []}' className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3 font-mono text-sm" /></label>
          <div className="mt-5 flex flex-wrap gap-3"><button onClick={validate} className="sm-btn bg-ink px-5 py-3 text-cream">Validate</button><button onClick={publish} disabled={!payload || publishing} className="sm-btn bg-orange px-5 py-3 text-white disabled:opacity-40">{publishing ? "Publishing…" : "Publish live"}</button></div>
          {message && <p className="mt-5 rounded-xl border-2 border-ink bg-moss-soft p-4 font-semibold">{message}</p>}
          {issues.length > 0 && <ul className="mt-5 space-y-2 rounded-xl border-2 border-ink bg-orange-soft p-4 text-sm">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        </section>
      </div>
    </main>
  );
}
