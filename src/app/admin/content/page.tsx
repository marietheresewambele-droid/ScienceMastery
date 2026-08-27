"use client";

import { useState } from "react";
import { prepareContentImport, publishContentImport } from "@/lib/contentImports";
import type { MasteryQuestion } from "@/types/questions";
import type { WorkbookRelationship } from "@/lib/contentValidation";

export default function ContentAdminPage() {
  const [subject, setSubject] = useState<"biology" | "chemistry" | "physics">("biology");
  const [version, setVersion] = useState("");
  const [payload, setPayload] = useState("");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<string[]>([]);

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

  const publish = () => {
    try {
      const parsed = JSON.parse(payload) as { questions?: MasteryQuestion[]; relationships?: WorkbookRelationship[] };
      const contentImport = prepareContentImport(subject, version || "draft", parsed.questions ?? [], parsed.relationships ?? []);
      publishContentImport(contentImport);
      setIssues([]);
      setMessage(`Published ${subject} version ${version || "draft"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Content could not be published.");
    }
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-ink">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Content administration</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Validate approved workbook content</h1>
        <p className="mt-4 max-w-3xl text-ink-soft">Paste a normalized workbook export to validate it locally. Only validated content can be published to this browser; student attempt data remains separate.</p>
        <section className="sm-panel mt-8 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-bold">Subject<select value={subject} onChange={(event) => setSubject(event.target.value as typeof subject)} className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3"><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label>
            <label className="font-bold">Content version<input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="2026.08" className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3" /></label>
          </div>
          <label className="mt-5 block font-bold">Normalized workbook JSON<textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={16} placeholder='{"questions": [], "relationships": []}' className="mt-1 block w-full rounded-xl border-2 border-ink bg-card p-3 font-mono text-sm" /></label>
          <div className="mt-5 flex flex-wrap gap-3"><button onClick={validate} className="sm-btn bg-ink px-5 py-3 text-cream">Validate</button><button onClick={publish} disabled={!payload} className="sm-btn bg-orange px-5 py-3 text-white disabled:opacity-40">Publish validated version</button></div>
          {message && <p className="mt-5 rounded-xl border-2 border-ink bg-moss-soft p-4 font-semibold">{message}</p>}
          {issues.length > 0 && <ul className="mt-5 space-y-2 rounded-xl border-2 border-ink bg-orange-soft p-4 text-sm">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        </section>
      </div>
    </main>
  );
}
