"use client";

/* Client-side admin catalog data is fetched only after the session gate resolves. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { authorizedFetch } from "@/lib/adminFetch";

type Subject = "biology" | "chemistry" | "physics";
type AssessmentObjective = "AO1" | "AO2" | "AO3";

/** A row of the public.question_bank view. */
interface BankQuestion {
  id: string;
  legacy_id: string | null;
  subject: Subject;
  topic_id: string;
  topic_number: number;
  topic: string;
  topic_slug: string;
  subtopic: string;
  specification_reference: string | null;
  question: string;
  model_answer: string;
  marks: number;
  assessment_objective: AssessmentObjective;
  qualification: string;
  tier: string;
  grade: string | null;
  question_type: string | null;
  key_terms: string[];
  source_notes: string | null;
  active: boolean;
  created_at: string;
}

interface QuestionForm {
  id: string;
  subtopic: string;
  question: string;
  modelAnswer: string;
  marks: number;
  assessmentObjective: AssessmentObjective;
  qualification: string;
  tier: string;
  grade: string;
  questionType: string;
  keyTerms: string;
  specificationReference: string;
  legacyId: string;
  sourceNotes: string;
}

interface ListResponse {
  rows: BankQuestion[];
  total: number;
  page: number;
  pageSize: number;
  totals: { all: number; active: number; inactive: number };
  facets: {
    subjects: string[];
    topics: string[];
    subtopics: string[];
    tiers: string[];
    qualifications: string[];
    grades: string[];
    assessmentObjectives: string[];
  };
}

const QUALIFICATIONS = ["Combined and Separate Science", "Separate Science only"];
const TIERS = ["Foundation and Higher", "Foundation only", "Higher only"];

const emptyForm: QuestionForm = {
  id: "",
  subtopic: "",
  question: "",
  modelAnswer: "",
  marks: 1,
  assessmentObjective: "AO1",
  qualification: QUALIFICATIONS[0],
  tier: TIERS[0],
  grade: "",
  questionType: "",
  keyTerms: "",
  specificationReference: "",
  legacyId: "",
  sourceNotes: "",
};

const fieldClass = "mt-1 w-full rounded-xl border-2 border-ink bg-card p-2.5 font-normal outline-none focus:border-orange";
const objectives: AssessmentObjective[] = ["AO1", "AO2", "AO3"];

function formFromRecord(row: BankQuestion): QuestionForm {
  return {
    id: row.id,
    subtopic: row.subtopic,
    question: row.question,
    modelAnswer: row.model_answer,
    marks: row.marks,
    assessmentObjective: row.assessment_objective,
    qualification: row.qualification,
    tier: row.tier,
    grade: row.grade || "",
    questionType: row.question_type || "",
    keyTerms: (row.key_terms || []).join("; "),
    specificationReference: row.specification_reference || "",
    legacyId: row.legacy_id || "",
    sourceNotes: row.source_notes || "",
  };
}

function requestFromForm(form: QuestionForm) {
  return {
    ...form,
    id: form.id.trim(),
    marks: Number(form.marks),
    // Same convention as the workbook "Key Terms" column: semicolon separated.
    keyTerms: form.keyTerms.split(";").map((term) => term.trim()).filter(Boolean),
  };
}

export default function ManageQuestionsPage() {
  return <RequireAdmin><ManageQuestionsView /></RequireAdmin>;
}

function ManageQuestionsView() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<QuestionForm | null>(null);
  const [editorMode, setEditorMode] = useState<"new" | "edit">("new");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "50" });
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      if (search.trim()) params.set("search", search.trim());
      const response = await authorizedFetch(`/api/admin/questions?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Questions could not be loaded.");
        return;
      }
      setData(body as ListResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Questions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [filters, search, page]);

  useEffect(() => { void load(); }, [load]);

  function startNew() {
    setSaveError("");
    setEditorMode("new");
    setEditor({ ...emptyForm });
  }

  async function saveQuestion() {
    if (!editor) return;
    setSaving(true);
    setSaveError("");
    try {
      const response = editorMode === "edit"
        ? await authorizedFetch(`/api/admin/questions/${encodeURIComponent(editor.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: requestFromForm(editor) }),
          })
        : await authorizedFetch("/api/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: requestFromForm(editor) }),
          });
      const body = await response.json();
      if (!response.ok) {
        setSaveError(body.error || "The question could not be saved.");
        return;
      }
      setEditor(null);
      void load();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "The question could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: BankQuestion) {
    setActionError("");
    try {
      const response = await authorizedFetch(`/api/admin/questions/${encodeURIComponent(row.id)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      const body = await response.json();
      if (!response.ok) {
        setActionError(body.error || "The question status could not be changed.");
        return;
      }
      void load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The question status could not be changed.");
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const editingExisting = editorMode === "edit";

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm font-bold text-orange-dark">← Admin</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">Question catalog</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Manage questions</h1>
          </div>
          <button onClick={startNew} className="sm-btn bg-orange px-5 py-3 text-white">Add question</button>
        </div>

        {data && <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-md border-2 border-ink bg-card px-3 py-1">{data.totals.all} total</span>
          <span className="rounded-md border-2 border-ink bg-moss-soft px-3 py-1 text-moss-dark">{data.totals.active} active</span>
          <span className="rounded-md border-2 border-ink bg-cream-soft px-3 py-1 text-ink-soft">{data.totals.inactive} inactive</span>
        </div>}

        <section className="sm-panel mt-6 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-bold sm:col-span-2">Search ID or question
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search catalog" className={fieldClass} />
            </label>
            {data && ([
              ["subject", "Subject", data.facets.subjects],
              ["topic", "Topic", data.facets.topics],
              ["subtopic", "Subtopic", data.facets.subtopics],
              ["tier", "Tier", data.facets.tiers],
              ["qualification", "Qualification", data.facets.qualifications],
              ["grade", "Grade", data.facets.grades],
              ["assessmentObjective", "Assessment objective", data.facets.assessmentObjectives],
            ] as const).map(([key, label, options]) => (
              <label key={key} className="text-sm font-bold">{label}
                <select value={filters[key] || ""} onChange={(event) => { setFilters((current) => ({ ...current, [key]: event.target.value })); setPage(1); }} className={fieldClass}>
                  <option value="">All</option>
                  {options.map((value) => <option value={value} key={value}>{value}</option>)}
                </select>
              </label>
            ))}
          </div>
        </section>

        {loading && <p className="mt-6 text-sm font-semibold text-ink-soft">Loading questions…</p>}
        {error && <p role="alert" className="mt-6 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">{error}</p>}
        {actionError && <p role="alert" className="mt-4 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">{actionError}</p>}

        {data && !loading && <>
          <div className="mt-6 overflow-x-auto rounded-xl border-2 border-ink">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-ink text-cream"><tr>{["ID", "Subject", "Topic", "Subtopic", "Question", "Marks", "AO", "Tier", "Status", "Actions"].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}</tr></thead>
              <tbody>
                {data.rows.map((row) => <tr key={row.id} className="border-t-2 border-ink/10 align-top">
                  <td className="px-3 py-2 font-bold">{row.id}</td><td className="px-3 py-2 capitalize">{row.subject}</td><td className="px-3 py-2">T{row.topic_number} {row.topic}</td><td className="px-3 py-2">{row.subtopic}</td>
                  <td className="max-w-sm px-3 py-2">{row.question}</td><td className="px-3 py-2">{row.marks}</td><td className="px-3 py-2">{row.assessment_objective}</td><td className="px-3 py-2">{row.tier}</td>
                  <td className="px-3 py-2"><span className={`rounded-md border-2 border-ink px-2 py-0.5 text-xs font-bold ${row.active ? "bg-moss-soft text-moss-dark" : "bg-cream-soft text-ink-soft"}`}>{row.active ? "Active" : "Inactive"}</span></td>
                  <td className="px-3 py-2"><div className="flex gap-2"><button onClick={() => { setSaveError(""); setEditorMode("edit"); setEditor(formFromRecord(row)); }} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">Edit</button><button onClick={() => void toggleActive(row)} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">{row.active ? "Unpublish" : "Publish"}</button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {!data.rows.length && <p className="mt-5 rounded-xl border-2 border-ink bg-card p-5 text-sm text-ink-soft">No questions match these filters.</p>}
          <div className="mt-4 flex items-center justify-between text-sm font-bold">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="rounded-md border-2 border-ink bg-card px-3 py-1.5 disabled:opacity-40">Previous</button>
            <span>Page {page} of {pages} · {data.total} matching</span>
            <button onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page >= pages} className="rounded-md border-2 border-ink bg-card px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </>}

        {editor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="question-editor-title" className="sm-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6">
            <h2 id="question-editor-title" className="font-display text-2xl font-bold">{editingExisting ? `Edit ${editor.id}` : "Add question"}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {!editingExisting && <label className="text-sm font-bold">Question ID<input value={editor.id} onChange={(event) => setEditor({ ...editor, id: event.target.value })} className={fieldClass} placeholder="CHEM-T05-Q060" /><span className="mt-1 block text-xs font-normal text-ink-soft">The subject and topic come from the ID (CHEM-T05 = Chemistry topic 5).</span></label>}
              <label className="text-sm font-bold">Subtopic<input value={editor.subtopic} onChange={(event) => setEditor({ ...editor, subtopic: event.target.value })} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-ink-soft">Use an existing subtopic name exactly, or type a new one.</span></label>
              <label className="text-sm font-bold sm:col-span-2">Question<textarea rows={4} value={editor.question} onChange={(event) => setEditor({ ...editor, question: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold sm:col-span-2">Model answer (one marking point per line)<textarea rows={5} value={editor.modelAnswer} onChange={(event) => setEditor({ ...editor, modelAnswer: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold sm:col-span-2">Key terms, separated by semicolons (hidden from the model answer in hints)<input value={editor.keyTerms} onChange={(event) => setEditor({ ...editor, keyTerms: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold">Marks<input type="number" min={1} max={6} value={editor.marks} onChange={(event) => setEditor({ ...editor, marks: Number(event.target.value) })} className={fieldClass} /></label>
              <label className="text-sm font-bold">Assessment objective<select value={editor.assessmentObjective} onChange={(event) => setEditor({ ...editor, assessmentObjective: event.target.value as AssessmentObjective })} className={fieldClass}>{objectives.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-bold">Qualification<select value={editor.qualification} onChange={(event) => setEditor({ ...editor, qualification: event.target.value })} className={fieldClass}>{QUALIFICATIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-bold">Tier<select value={editor.tier} onChange={(event) => setEditor({ ...editor, tier: event.target.value })} className={fieldClass}>{TIERS.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-bold">Grade<input value={editor.grade} onChange={(event) => setEditor({ ...editor, grade: event.target.value })} className={fieldClass} placeholder="Grades 5–7" /></label>
              <label className="text-sm font-bold">Question type<input value={editor.questionType} onChange={(event) => setEditor({ ...editor, questionType: event.target.value })} className={fieldClass} placeholder="Explain" /></label>
              <label className="text-sm font-bold">Specification reference<input value={editor.specificationReference} onChange={(event) => setEditor({ ...editor, specificationReference: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold">Legacy ID<input value={editor.legacyId} onChange={(event) => setEditor({ ...editor, legacyId: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold sm:col-span-2">Source / notes<input value={editor.sourceNotes} onChange={(event) => setEditor({ ...editor, sourceNotes: event.target.value })} className={fieldClass} /></label>
            </div>
            {saveError && <p role="alert" className="mt-4 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm text-orange-dark">{saveError}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => void saveQuestion()} disabled={saving} className="sm-btn bg-orange px-5 py-2.5 text-white disabled:opacity-40">{saving ? "Saving…" : editingExisting ? "Save changes" : "Add as inactive"}</button>
              <button onClick={() => setEditor(null)} className="rounded-xl border-2 border-ink bg-card px-5 py-2.5 font-bold">Cancel</button>
            </div>
          </section>
        </div>}
      </div>
    </main>
  );
}
