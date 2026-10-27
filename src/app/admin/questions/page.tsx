"use client";

/* Client-side admin catalog data is fetched only after the session gate resolves. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { authorizedFetch } from "@/lib/adminFetch";
import Flashcard from "@/components/flashcard/Flashcard";
import type { MasteryQuestion } from "@/types/questions";

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
  subject: string;
  topicId: string;
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

interface TaxonomyTopic {
  id: string;
  subject: string;
  number: number;
  name: string;
  slug: string;
  subtopics: string[];
  nextNumber: number;
}

const NEW_SUBTOPIC = "__new__";
const TIER_VALUES: Record<string, NonNullable<MasteryQuestion["tier"]>> = {
  "Foundation and Higher": "Both",
  "Foundation only": "Foundation",
  "Higher only": "Higher",
};

/** Adapts a catalog row to the shape the student flashcard expects, so previews match the live deck. */
function toFlashcardQuestion(row: BankQuestion): MasteryQuestion {
  return {
    id: row.id,
    subject: row.subject,
    topicSlug: row.topic_slug,
    topic: row.topic,
    topicNumber: row.topic_number,
    subtopic: row.subtopic,
    question: row.question,
    questionType: row.question_type || undefined,
    marks: row.marks,
    assessmentObjective: row.assessment_objective,
    modelAnswer: row.model_answer,
    markingPoints: row.model_answer.split(/\n+/).map((point) => point.trim()).filter(Boolean),
    tier: TIER_VALUES[row.tier],
    keyTerms: row.key_terms?.length ? row.key_terms : undefined,
  };
}

const QUALIFICATIONS = ["Combined and Separate Science", "Separate Science only"];
const TIERS = ["Foundation and Higher", "Foundation only", "Higher only"];

const emptyForm: QuestionForm = {
  id: "",
  subject: "",
  topicId: "",
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
    subject: row.subject,
    topicId: row.topic_id,
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
  const { subject: _subject, topicId: _topicId, ...rest } = form;
  void _subject; void _topicId;
  return {
    ...rest,
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
  const [taxonomy, setTaxonomy] = useState<TaxonomyTopic[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSubtopic, setNewSubtopic] = useState(false);

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

  const loadTaxonomy = useCallback(async () => {
    try {
      const response = await authorizedFetch("/api/admin/questions/taxonomy");
      if (response.ok) setTaxonomy((await response.json()).topics as TaxonomyTopic[]);
    } catch { /* the editor falls back to typing a subtopic */ }
  }, []);
  useEffect(() => { void loadTaxonomy(); }, [loadTaxonomy]);

  const topicsForSubject = (subject: string) => taxonomy.filter((topic) => topic.subject === subject);
  const selectedTopic = editor ? taxonomy.find((topic) => topic.id === editor.topicId) : undefined;

  function chooseTopic(topicId: string) {
    if (!editor) return;
    const topic = taxonomy.find((entry) => entry.id === topicId);
    setNewSubtopic(false);
    setEditor({
      ...editor,
      topicId,
      subtopic: "",
      id: topic ? `${topic.id}-Q${String(topic.nextNumber).padStart(3, "0")}` : "",
    });
  }

  /** Uploads a pasted/chosen image and inserts it into the text field as ![image](url) at the cursor. */
  async function insertImage(file: File, field: "question" | "modelAnswer", textarea: HTMLTextAreaElement | null) {
    if (!editor) return;
    setUploading(true);
    setSaveError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await authorizedFetch("/api/admin/images", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) { setSaveError(result.error || "The image could not be uploaded."); return; }
      const markdown = `![image](${result.url})`;
      const text = editor[field];
      const at = textarea?.selectionStart ?? text.length;
      const to = textarea?.selectionEnd ?? at;
      setEditor((current) => current && ({ ...current, [field]: `${text.slice(0, at)}${at > 0 && !text.slice(0, at).endsWith("\n") ? "\n" : ""}${markdown}\n${text.slice(to)}` }));
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  function pasteImage(event: React.ClipboardEvent<HTMLTextAreaElement>, field: "question" | "modelAnswer") {
    const file = [...event.clipboardData.files].find((item) => item.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    void insertImage(file, field, event.currentTarget);
  }

  const imageControls = (field: "question" | "modelAnswer") => (
    <span className="mt-1 flex flex-wrap items-center gap-3 text-xs font-normal text-ink-soft">
      Paste an image (Ctrl/Cmd+V) into the box, or
      <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void insertImage(file, field, null); event.target.value = ""; }} className="max-w-[16rem] text-xs" />
      {uploading && <strong>Uploading…</strong>}
    </span>
  );

  function startNew() {
    setSaveError("");
    setEditorMode("new");
    setNewSubtopic(false);
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
      void loadTaxonomy();
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

  const previewIndex = data && previewId ? data.rows.findIndex((row) => row.id === previewId) : -1;
  const previewRow = previewIndex >= 0 ? data?.rows[previewIndex] : undefined;
  function stepPreview(direction: 1 | -1) {
    const next = data?.rows[previewIndex + direction];
    if (next) { setPreviewFlipped(false); setPreviewId(next.id); }
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
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { if (data?.rows.length) { setPreviewFlipped(false); setPreviewId(data.rows[0].id); } }} disabled={!data?.rows.length} className="sm-btn bg-card px-5 py-3 text-ink disabled:opacity-40">Preview flashcards</button>
            <button onClick={startNew} className="sm-btn bg-orange px-5 py-3 text-white">Add question</button>
          </div>
        </div>

        {data && <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          {([["", "total", data.totals.all, "bg-card"], ["true", "active", data.totals.active, "bg-moss-soft text-moss-dark"], ["false", "inactive (unpublished)", data.totals.inactive, "bg-cream-soft text-ink-soft"]] as const).map(([value, label, number, tone]) => (
            <button key={label} type="button" aria-pressed={(filters.active || "") === value} onClick={() => { setFilters((current) => ({ ...current, active: value })); setPage(1); }} className={`rounded-md border-2 border-ink px-3 py-1 ${tone} ${(filters.active || "") === value ? "ring-2 ring-orange" : ""}`}>{number} {label}</button>
          ))}
        </div>}

        <section className="sm-panel mt-6 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-bold sm:col-span-2">Search ID or question
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search catalog" className={fieldClass} />
            </label>
            <label className="text-sm font-bold">Status
              <select value={filters.active || ""} onChange={(event) => { setFilters((current) => ({ ...current, active: event.target.value })); setPage(1); }} className={fieldClass}>
                <option value="">All</option>
                <option value="true">Active (live)</option>
                <option value="false">Inactive (unpublished)</option>
              </select>
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
                  <td className="px-3 py-2"><div className="flex gap-2"><button onClick={() => { setPreviewFlipped(false); setPreviewId(row.id); }} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">Preview</button><button onClick={() => { setSaveError(""); setEditorMode("edit"); setEditor(formFromRecord(row)); }} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">Edit</button><button onClick={() => void toggleActive(row)} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">{row.active ? "Mark inactive" : "Publish"}</button></div></td>
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

        {previewRow && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4">
          <section role="dialog" aria-modal="true" aria-label="Flashcard preview" className="w-full max-w-3xl py-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-card p-3">
              <div className="text-sm font-bold">
                <span className="capitalize">{previewRow.subject}</span> · {previewRow.id} · card {previewIndex + 1} of {data?.rows.length}
                <span className={`ml-2 rounded-md border-2 border-ink px-2 py-0.5 text-xs ${previewRow.active ? "bg-moss-soft text-moss-dark" : "bg-cream-soft text-ink-soft"}`}>{previewRow.active ? "Active · live" : "Inactive · hidden from students"}</span>
              </div>
              <button onClick={() => setPreviewId(null)} className="rounded-xl border-2 border-ink bg-card px-4 py-1.5 text-sm font-bold">Close</button>
            </div>
            <Flashcard
              key={previewRow.id + previewRow.question + previewRow.model_answer}
              question={toFlashcardQuestion(previewRow)}
              flipped={previewFlipped}
              onFlip={() => setPreviewFlipped((value) => !value)}
              isExam={false}
              bookmarked={false}
              onToggleBookmark={() => {}}
              hintLevel={0}
              onHintLevelChange={() => {}}
              onRate={() => {}}
              readOnly
            />
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-ink bg-card p-3">
              <button onClick={() => stepPreview(-1)} disabled={previewIndex <= 0} className="rounded-xl border-2 border-ink bg-card px-4 py-2 text-sm font-bold disabled:opacity-40">← Previous</button>
              <button onClick={() => setPreviewFlipped((value) => !value)} className="rounded-xl border-2 border-ink bg-ink px-4 py-2 text-sm font-bold text-cream">{previewFlipped ? "Show question" : "Show answer"}</button>
              <button onClick={() => stepPreview(1)} disabled={previewIndex >= (data?.rows.length ?? 0) - 1} className="rounded-xl border-2 border-ink bg-card px-4 py-2 text-sm font-bold disabled:opacity-40">Next →</button>
              <span className="mx-1 hidden h-6 border-l-2 border-ink/20 sm:block" />
              <button onClick={() => { setSaveError(""); setEditorMode("edit"); setEditor(formFromRecord(previewRow)); }} className="rounded-xl border-2 border-ink bg-yellow px-4 py-2 text-sm font-bold">Edit this card</button>
              <button onClick={() => void toggleActive(previewRow)} className="rounded-xl border-2 border-ink bg-orange px-4 py-2 text-sm font-bold text-white">{previewRow.active ? "Mark inactive" : "Mark active (publish)"}</button>
            </div>
            {actionError && <p role="alert" className="mt-3 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">{actionError}</p>}
          </section>
        </div>}

        {editor && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="question-editor-title" className="sm-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6">
            <h2 id="question-editor-title" className="font-display text-2xl font-bold">{editingExisting ? `Edit ${editor.id}` : "Add question"}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {!editingExisting ? <>
                <label className="text-sm font-bold">Subject
                  <select value={editor.subject} onChange={(event) => { setNewSubtopic(false); setEditor({ ...editor, subject: event.target.value, topicId: "", subtopic: "", id: "" }); }} className={fieldClass}>
                    <option value="">Select a subject…</option>
                    {["biology", "chemistry", "physics"].map((value) => <option key={value} value={value} className="capitalize">{value[0].toUpperCase() + value.slice(1)}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold">Topic
                  <select value={editor.topicId} disabled={!editor.subject} onChange={(event) => chooseTopic(event.target.value)} className={`${fieldClass} disabled:opacity-40`}>
                    <option value="">Select a topic…</option>
                    {topicsForSubject(editor.subject).map((topic) => <option key={topic.id} value={topic.id}>T{topic.number} {topic.name}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold">Subtopic
                  <select value={newSubtopic ? NEW_SUBTOPIC : editor.subtopic} disabled={!editor.topicId} onChange={(event) => {
                    if (event.target.value === NEW_SUBTOPIC) { setNewSubtopic(true); setEditor({ ...editor, subtopic: "" }); }
                    else { setNewSubtopic(false); setEditor({ ...editor, subtopic: event.target.value }); }
                  }} className={`${fieldClass} disabled:opacity-40`}>
                    <option value="">Select a subtopic…</option>
                    {(selectedTopic?.subtopics ?? []).map((name) => <option key={name} value={name}>{name}</option>)}
                    <option value={NEW_SUBTOPIC}>+ New subtopic…</option>
                  </select>
                  {newSubtopic && <input value={editor.subtopic} onChange={(event) => setEditor({ ...editor, subtopic: event.target.value })} placeholder="New subtopic name" className={fieldClass} />}
                </label>
                <label className="text-sm font-bold">Question ID
                  <input value={editor.id} readOnly className={`${fieldClass} bg-cream-soft`} placeholder="Chosen from the topic" />
                  <span className="mt-1 block text-xs font-normal text-ink-soft">The next free number in the topic is filled in for you.</span>
                </label>
              </> : (
                <label className="text-sm font-bold">Subtopic
                  <select value={editor.subtopic} onChange={(event) => setEditor({ ...editor, subtopic: event.target.value })} className={fieldClass}>
                    {!(taxonomy.find((topic) => topic.id === editor.topicId)?.subtopics ?? []).includes(editor.subtopic) && <option value={editor.subtopic}>{editor.subtopic}</option>}
                    {(taxonomy.find((topic) => topic.id === editor.topicId)?.subtopics ?? []).map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
              )}
              <label className="text-sm font-bold sm:col-span-2">Question<textarea rows={4} value={editor.question} onPaste={(event) => pasteImage(event, "question")} onChange={(event) => setEditor({ ...editor, question: event.target.value })} className={fieldClass} />{imageControls("question")}</label>
              <label className="text-sm font-bold sm:col-span-2">Model answer (one marking point per line)<textarea rows={5} value={editor.modelAnswer} onPaste={(event) => pasteImage(event, "modelAnswer")} onChange={(event) => setEditor({ ...editor, modelAnswer: event.target.value })} className={fieldClass} />{imageControls("modelAnswer")}</label>
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
