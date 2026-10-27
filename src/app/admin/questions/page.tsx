"use client";

/* Client-side admin catalog data is fetched only after the session gate resolves. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import Flashcard from "@/components/flashcard/Flashcard";
import { authorizedFetch } from "@/lib/adminFetch";
import {
  COMBINATIONS,
  COVERAGE_LABEL,
  COVERAGE_VALUES,
  DIFFICULTIES,
  LEGACY_TIER,
  TIER_LABEL,
  TIER_VALUES,
  reviewReasons,
  visibleTo,
  type Combination,
} from "@/lib/courseVisibility";
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
  difficulty: string | null;
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
  difficulty: string;
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

interface CoverageRow extends Combination {
  total: number;
  subjects: Record<string, number>;
}

const NEW_SUBTOPIC = "__new__";
const SUBJECTS: Subject[] = ["biology", "chemistry", "physics"];
const TIER_VALUE_MAP: Record<string, NonNullable<MasteryQuestion["tier"]>> = {
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
    tier: TIER_VALUE_MAP[row.tier],
    keyTerms: row.key_terms?.length ? row.key_terms : undefined,
  };
}

const emptyForm: QuestionForm = {
  id: "",
  subject: "",
  topicId: "",
  subtopic: "",
  question: "",
  modelAnswer: "",
  marks: 1,
  assessmentObjective: "AO1",
  qualification: COVERAGE_VALUES[0],
  tier: TIER_VALUES[0],
  difficulty: "",
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
    difficulty: row.difficulty || "",
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
  const [coverage, setCoverage] = useState<CoverageRow[] | null>(null);
  const [coverageError, setCoverageError] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [studentView, setStudentView] = useState<Combination | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newSubtopic, setNewSubtopic] = useState(false);
  const [selected, setSelected] = useState<Map<string, BankQuestion>>(new Map());
  const [bulk, setBulk] = useState({ qualification: "", tier: "", difficulty: "", subtopic: "" });
  const [bulkMessage, setBulkMessage] = useState("");

  const setFilter = (patch: Record<string, string>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

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

  const loadCoverage = useCallback(async () => {
    setCoverageError("");
    try {
      const response = await authorizedFetch("/api/admin/questions/coverage");
      const body = await response.json();
      if (!response.ok) { setCoverageError(body.error || "Coverage counts could not be loaded."); return; }
      setCoverage(body.combinations as CoverageRow[]);
    } catch (caught) {
      setCoverageError(caught instanceof Error ? caught.message : "Coverage counts could not be loaded.");
    }
  }, []);
  useEffect(() => { void loadCoverage(); }, [loadCoverage]);

  const refreshAll = () => { void load(); void loadCoverage(); void loadTaxonomy(); };

  const topicsForSubject = (subject: string) => taxonomy.filter((topic) => topic.subject === subject);
  const filterTopic = taxonomy.find((topic) => topic.slug === filters.topic && (!filters.subject || topic.subject === filters.subject));
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
      refreshAll();
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
      refreshAll();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The question status could not be changed.");
    }
  }

  const toggleSelected = (row: BankQuestion) =>
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(row.id)) next.delete(row.id); else next.set(row.id, row);
      return next;
    });
  const pageSelected = !!data?.rows.length && data.rows.every((row) => selected.has(row.id));
  const togglePage = () =>
    setSelected((current) => {
      const next = new Map(current);
      for (const row of data?.rows ?? []) { if (pageSelected) next.delete(row.id); else next.set(row.id, row); }
      return next;
    });

  // Subtopics can only be reassigned within one unit.
  const selectedTopics = [...new Set([...selected.values()].map((row) => row.topic_id))];
  const bulkTopic = selectedTopics.length === 1 ? taxonomy.find((topic) => topic.id === selectedTopics[0]) : undefined;

  async function applyBulk() {
    setBulkMessage("");
    setActionError("");
    try {
      const response = await authorizedFetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected.keys()], ...Object.fromEntries(Object.entries(bulk).filter(([, value]) => value)) }),
      });
      const body = await response.json();
      if (!response.ok) { setActionError(body.error || "The tags could not be applied."); return; }
      setBulkMessage(`Updated ${body.updated} question${body.updated === 1 ? "" : "s"}.`);
      setSelected(new Map());
      setBulk({ qualification: "", tier: "", difficulty: "", subtopic: "" });
      refreshAll();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The tags could not be applied.");
    }
  }

  /** Student preview: filter to what one course combination sees (published only) and open the flashcards. */
  function previewAsStudent(combination: Combination) {
    setStudentView(combination);
    setSearch("");
    setFilters({ course: combination.pathway, level: combination.tier, active: "true" });
    setPage(1);
    setPreviewFlipped(false);
    setPreviewId("__first__");
  }
  function clearStudentView() {
    setStudentView(null);
    setFilters({});
    setPage(1);
  }

  // The first card opens once the student-preview list has loaded.
  useEffect(() => {
    if (previewId === "__first__" && data && !loading) setPreviewId(data.rows[0]?.id ?? null);
  }, [previewId, data, loading]);

  const previewIndex = data && previewId ? data.rows.findIndex((row) => row.id === previewId) : -1;
  const previewRow = previewIndex >= 0 ? data?.rows[previewIndex] : undefined;
  function stepPreview(direction: 1 | -1) {
    const next = data?.rows[previewIndex + direction];
    if (next) { setPreviewFlipped(false); setPreviewId(next.id); }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const editingExisting = editorMode === "edit";
  const tierOptions = editor?.tier === LEGACY_TIER ? [...TIER_VALUES, LEGACY_TIER] : TIER_VALUES;

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm font-bold text-orange-dark">← Admin</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-dark">One shared question bank</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Manage questions</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/questions/upload" className="sm-btn bg-card px-5 py-3 text-ink">Import Excel</Link>
            <button onClick={() => { setStudentView(null); setPreviewFlipped(false); setPreviewId("__first__"); }} disabled={!data?.rows.length} className="sm-btn bg-card px-5 py-3 text-ink disabled:opacity-40">Preview flashcards</button>
            <button onClick={startNew} className="sm-btn bg-orange px-5 py-3 text-white">Add question</button>
          </div>
        </div>

        <section className="sm-panel mt-6 p-5" aria-label="Coverage and student preview">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Student preview &amp; coverage</h2>
            <p className="text-xs font-semibold text-ink-soft">Published questions each course combination contains. Foundation content stays available to Higher students.</p>
          </div>
          {coverageError && <p role="alert" className="mt-3 text-sm font-semibold text-orange-dark">{coverageError}</p>}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b-2 border-ink">{["Course", "Published", "Biology", "Chemistry", "Physics", ""].map((label) => <th key={label} className="px-3 py-2 font-bold">{label}</th>)}</tr></thead>
              <tbody>
                {COMBINATIONS.map((combination) => {
                  const row = coverage?.find((entry) => entry.label === combination.label);
                  const active = studentView?.label === combination.label;
                  return <tr key={combination.label} className={`border-b border-ink/10 ${active ? "bg-yellow-soft" : ""}`}>
                    <td className="px-3 py-2 font-bold">{combination.label}</td>
                    <td className="px-3 py-2 font-display text-lg font-bold">{row ? row.total : "…"}</td>
                    {SUBJECTS.map((subject) => <td key={subject} className="px-3 py-2">{row ? row.subjects[subject] : "…"}</td>)}
                    <td className="px-3 py-2 text-right"><button onClick={() => previewAsStudent(combination)} className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold hover:bg-yellow-soft">Preview as student</button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          {studentView && <p className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-yellow-soft p-3 text-sm font-semibold">
            Showing what a {studentView.label} student sees (published only).
            <button onClick={clearStudentView} className="rounded-md border-2 border-ink bg-card px-3 py-1 text-xs font-bold">Exit student preview</button>
          </p>}
        </section>

        <section className="sm-panel mt-6 p-5" aria-label="Filters">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-sm font-bold">Subject
              <select value={filters.subject || ""} onChange={(event) => setFilter({ subject: event.target.value, topic: "", subtopic: "" })} className={fieldClass}>
                <option value="">All</option>
                {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject[0].toUpperCase() + subject.slice(1)}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Unit
              <select value={filters.topic || ""} onChange={(event) => setFilter({ topic: event.target.value, subtopic: "" })} className={fieldClass}>
                <option value="">All</option>
                {taxonomy.filter((topic) => !filters.subject || topic.subject === filters.subject).map((topic) => <option key={topic.id} value={topic.slug}>{filters.subject ? "" : `${topic.subject[0].toUpperCase()}${topic.subject.slice(1, 4)} · `}T{topic.number} {topic.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Subtopic
              <select value={filters.subtopic || ""} disabled={!filterTopic} onChange={(event) => setFilter({ subtopic: event.target.value })} className={`${fieldClass} disabled:opacity-40`}>
                <option value="">All</option>
                {(filterTopic?.subtopics ?? []).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Course
              <select value={filters.course || ""} onChange={(event) => { setStudentView(null); setFilter({ course: event.target.value }); }} className={fieldClass}>
                <option value="">All</option>
                <option value="combined">Combined Science</option>
                <option value="triple">Separate Science (Triple)</option>
              </select>
            </label>
            <label className="text-sm font-bold">Tier
              <select value={filters.level || ""} onChange={(event) => { setStudentView(null); setFilter({ level: event.target.value }); }} className={fieldClass}>
                <option value="">All</option>
                <option value="Foundation">Foundation</option>
                <option value="Higher">Higher</option>
              </select>
            </label>
            <label className="text-sm font-bold">Draft / Published
              <select value={filters.active || ""} onChange={(event) => { setStudentView(null); setFilter({ active: event.target.value }); }} className={fieldClass}>
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </label>
            <label className="text-sm font-bold sm:col-span-2">Search ID or question
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search the bank" className={fieldClass} />
            </label>
            <label className="text-sm font-bold">Difficulty
              <select value={filters.difficulty || ""} onChange={(event) => setFilter({ difficulty: event.target.value })} className={fieldClass}>
                <option value="">All</option>
                {DIFFICULTIES.map((value) => <option key={value} value={value}>{value}</option>)}
                <option value="none">Not set</option>
              </select>
            </label>
            <label className="flex items-end gap-2 pb-3 text-sm font-bold sm:col-span-2">
              <input type="checkbox" checked={filters.needsReview === "true"} onChange={(event) => setFilter({ needsReview: event.target.checked ? "true" : "" })} className="h-4 w-4 accent-[color:var(--color-orange)]" />
              Needs review (course or tier tag missing or invalid)
            </label>
          </div>
          <p className="mt-3 text-xs text-ink-soft">Course and Tier filter by what students on that course see: Triple sees every question, Combined skips &ldquo;Separate only&rdquo;, and Foundation skips &ldquo;Higher only&rdquo;.</p>
        </section>

        {data && <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          {([["", "total", data.totals.all, "bg-card"], ["true", "published", data.totals.active, "bg-moss-soft text-moss-dark"], ["false", "draft", data.totals.inactive, "bg-cream-soft text-ink-soft"]] as const).map(([value, label, number, tone]) => (
            <button key={label} type="button" aria-pressed={(filters.active || "") === value} onClick={() => { setStudentView(null); setFilter({ active: value }); }} className={`rounded-md border-2 border-ink px-3 py-1 ${tone} ${(filters.active || "") === value ? "ring-2 ring-orange" : ""}`}>{number} {label}</button>
          ))}
        </div>}

        {selected.size > 0 && <section className="sticky top-2 z-30 mt-4 rounded-2xl border-2 border-ink bg-yellow-soft p-4 shadow-[4px_4px_0_0_var(--color-ink)]" aria-label="Bulk tagging">
          <div className="flex flex-wrap items-end gap-3">
            <p className="font-display text-lg font-bold">{selected.size} selected</p>
            <label className="text-xs font-bold">Coverage
              <select value={bulk.qualification} onChange={(event) => setBulk({ ...bulk, qualification: event.target.value })} className={`${fieldClass} !mt-0.5 !p-2`}>
                <option value="">No change</option>
                {COVERAGE_VALUES.map((value) => <option key={value} value={value}>{COVERAGE_LABEL[value]}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold">Tier
              <select value={bulk.tier} onChange={(event) => setBulk({ ...bulk, tier: event.target.value })} className={`${fieldClass} !mt-0.5 !p-2`}>
                <option value="">No change</option>
                {TIER_VALUES.map((value) => <option key={value} value={value}>{TIER_LABEL[value]}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold">Difficulty
              <select value={bulk.difficulty} onChange={(event) => setBulk({ ...bulk, difficulty: event.target.value })} className={`${fieldClass} !mt-0.5 !p-2`}>
                <option value="">No change</option>
                {DIFFICULTIES.map((value) => <option key={value} value={value}>{value}</option>)}
                <option value="none">Clear</option>
              </select>
            </label>
            <label className="text-xs font-bold">Subtopic
              <select value={bulk.subtopic} disabled={!bulkTopic} onChange={(event) => setBulk({ ...bulk, subtopic: event.target.value })} title={bulkTopic ? "" : "Select questions from a single unit to move subtopic"} className={`${fieldClass} !mt-0.5 !p-2 disabled:opacity-40`}>
                <option value="">No change</option>
                {(bulkTopic?.subtopics ?? []).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <button onClick={() => void applyBulk()} disabled={!Object.values(bulk).some(Boolean)} className="sm-btn bg-orange px-5 py-2 text-sm text-white disabled:opacity-40">Apply to {selected.size}</button>
            <button onClick={() => setSelected(new Map())} className="rounded-xl border-2 border-ink bg-card px-4 py-2 text-sm font-bold">Clear selection</button>
          </div>
          {!bulkTopic && <p className="mt-2 text-xs font-semibold text-ink-soft">Subtopic can be changed only when every selected question is in the same unit.</p>}
        </section>}
        {bulkMessage && <p role="status" className="mt-4 rounded-xl border-2 border-ink bg-moss-soft p-3 text-sm font-semibold text-moss-dark">{bulkMessage}</p>}

        {loading && <p className="mt-6 text-sm font-semibold text-ink-soft">Loading questions…</p>}
        {error && <p role="alert" className="mt-6 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">{error}</p>}
        {actionError && <p role="alert" className="mt-4 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm font-semibold text-orange-dark">{actionError}</p>}

        {data && !loading && <>
          <div className="mt-6 overflow-x-auto rounded-xl border-2 border-ink">
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead className="bg-ink text-cream"><tr>
                <th className="px-3 py-2"><input type="checkbox" aria-label="Select all on this page" checked={pageSelected} onChange={togglePage} className="h-4 w-4" /></th>
                {["ID", "Question", "Unit · subtopic", "Coverage", "Tier", "Difficulty", "Status", "Actions"].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}
              </tr></thead>
              <tbody>
                {data.rows.map((row) => {
                  const reasons = reviewReasons(row);
                  const legacy = row.tier === LEGACY_TIER;
                  return <tr key={row.id} className={`border-t-2 border-ink/10 align-top ${selected.has(row.id) ? "bg-yellow-soft/60" : ""}`}>
                    <td className="px-3 py-2"><input type="checkbox" aria-label={`Select ${row.id}`} checked={selected.has(row.id)} onChange={() => toggleSelected(row)} className="h-4 w-4" /></td>
                    <td className="px-3 py-2 font-bold">{row.id}</td>
                    <td className="max-w-sm px-3 py-2">{row.question}</td>
                    <td className="px-3 py-2 text-xs"><span className="font-bold capitalize">{row.subject}</span> · T{row.topic_number}<br />{row.subtopic}</td>
                    <td className="px-3 py-2">{COVERAGE_LABEL[row.qualification] ?? <Flag text={row.qualification || "Missing"} />}</td>
                    <td className="px-3 py-2">{TIER_LABEL[row.tier] ?? <Flag text={row.tier || "Missing"} />}{legacy && <Flag text="Needs review" />}</td>
                    <td className="px-3 py-2">{row.difficulty ?? <span className="text-ink-soft">—</span>}</td>
                    <td className="px-3 py-2"><span className={`rounded-md border-2 border-ink px-2 py-0.5 text-xs font-bold ${row.active ? "bg-moss-soft text-moss-dark" : "bg-cream-soft text-ink-soft"}`}>{row.active ? "Published" : "Draft"}</span>{reasons.length > 0 && <Flag text="Needs review" />}</td>
                    <td className="px-3 py-2"><div className="flex gap-2">
                      <button onClick={() => { setPreviewFlipped(false); setPreviewId(row.id); }} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">Preview</button>
                      <button onClick={() => { setSaveError(""); setEditorMode("edit"); setEditor(formFromRecord(row)); }} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">Edit</button>
                      <button onClick={() => void toggleActive(row)} className="rounded-md border-2 border-ink bg-card px-2 py-1 text-xs font-bold">{row.active ? "Unpublish" : "Publish"}</button>
                    </div></td>
                  </tr>;
                })}
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
                {studentView && <span className="mr-2 rounded-md border-2 border-ink bg-yellow px-2 py-0.5 text-xs">Student view: {studentView.label}</span>}
                <span className="capitalize">{previewRow.subject}</span> · {previewRow.id} · card {previewIndex + 1} of {data?.rows.length}
                <span className={`ml-2 rounded-md border-2 border-ink px-2 py-0.5 text-xs ${previewRow.active ? "bg-moss-soft text-moss-dark" : "bg-cream-soft text-ink-soft"}`}>{previewRow.active ? "Published · live" : "Draft · hidden from students"}</span>
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
              <button onClick={() => void toggleActive(previewRow)} className="rounded-xl border-2 border-ink bg-orange px-4 py-2 text-sm font-bold text-white">{previewRow.active ? "Unpublish (make draft)" : "Publish"}</button>
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
                    {SUBJECTS.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold">Unit
                  <select value={editor.topicId} disabled={!editor.subject} onChange={(event) => chooseTopic(event.target.value)} className={`${fieldClass} disabled:opacity-40`}>
                    <option value="">Select a unit…</option>
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
                  <input value={editor.id} readOnly className={`${fieldClass} bg-cream-soft`} placeholder="Chosen from the unit" />
                  <span className="mt-1 block text-xs font-normal text-ink-soft">The next free number in the unit is filled in for you.</span>
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

              <fieldset className="rounded-xl border-2 border-ink bg-cream-soft p-4 sm:col-span-2">
                <legend className="px-2 text-sm font-extrabold uppercase tracking-wide">Where this question appears</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-bold">Content coverage
                    <select value={editor.qualification} onChange={(event) => setEditor({ ...editor, qualification: event.target.value })} className={fieldClass}>
                      <option value="Combined and Separate Science">Combined and Separate</option>
                      <option value="Separate Science only">Separate only</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold">Tier availability
                    <select value={editor.tier} onChange={(event) => setEditor({ ...editor, tier: event.target.value })} className={fieldClass}>
                      {tierOptions.map((value) => <option key={value} value={value}>{value === LEGACY_TIER ? "Foundation only (legacy, retag)" : value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-bold">Difficulty
                    <select value={editor.difficulty} onChange={(event) => setEditor({ ...editor, difficulty: event.target.value })} className={fieldClass}>
                      <option value="">Not set</option>
                      {DIFFICULTIES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                </div>
                <p className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  {COMBINATIONS.map((combination) => {
                    const shown = visibleTo(editor, combination.pathway, combination.tier);
                    return <span key={combination.label} className={`rounded-md border-2 border-ink px-2 py-1 ${shown ? "bg-moss-soft text-moss-dark" : "bg-card text-ink-soft line-through"}`}>{shown ? "✓" : "—"} {combination.label}</span>;
                  })}
                </p>
              </fieldset>

              <label className="text-sm font-bold">Marks<input type="number" min={1} max={6} value={editor.marks} onChange={(event) => setEditor({ ...editor, marks: Number(event.target.value) })} className={fieldClass} /></label>
              <label className="text-sm font-bold">Assessment objective<select value={editor.assessmentObjective} onChange={(event) => setEditor({ ...editor, assessmentObjective: event.target.value as AssessmentObjective })} className={fieldClass}>{objectives.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-bold">Grade<input value={editor.grade} onChange={(event) => setEditor({ ...editor, grade: event.target.value })} className={fieldClass} placeholder="Grades 5–7" /></label>
              <label className="text-sm font-bold">Question type<input value={editor.questionType} onChange={(event) => setEditor({ ...editor, questionType: event.target.value })} className={fieldClass} placeholder="Explain" /></label>
              <label className="text-sm font-bold">Specification reference<input value={editor.specificationReference} onChange={(event) => setEditor({ ...editor, specificationReference: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold">Legacy ID<input value={editor.legacyId} onChange={(event) => setEditor({ ...editor, legacyId: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold sm:col-span-2">Source / notes<input value={editor.sourceNotes} onChange={(event) => setEditor({ ...editor, sourceNotes: event.target.value })} className={fieldClass} /></label>
            </div>
            {saveError && <p role="alert" className="mt-4 rounded-xl border-2 border-ink bg-orange-soft p-3 text-sm text-orange-dark">{saveError}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => void saveQuestion()} disabled={saving} className="sm-btn bg-orange px-5 py-2.5 text-white disabled:opacity-40">{saving ? "Saving…" : editingExisting ? "Save changes" : "Add as draft"}</button>
              <button onClick={() => setEditor(null)} className="rounded-xl border-2 border-ink bg-card px-5 py-2.5 font-bold">Cancel</button>
            </div>
          </section>
        </div>}
      </div>
    </main>
  );
}

function Flag({ text }: { text: string }) {
  return <span className="ml-1 rounded-md border-2 border-ink bg-orange-soft px-1.5 py-0.5 text-[11px] font-bold text-orange-dark">{text}</span>;
}
