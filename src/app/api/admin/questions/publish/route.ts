import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { revalidateTypedRows } from "@/lib/websiteQuestionImport";
import type { WebsiteQuestionRow } from "@/types/websiteQuestion";

const subjectMap = {
  Biology: "biology",
  Chemistry: "chemistry",
  Physics: "physics",
} as const;
type SubjectLabel = keyof typeof subjectMap;

const topicSlugs: Record<string, Record<string, string>> = {
  biology: {
    "cell biology": "cell-biology", organisation: "organisation", infection: "infection-and-response",
    bioenergetics: "bioenergetics", homeostasis: "homeostasis-and-response",
    inheritance: "inheritance-variation-and-evolution", ecology: "ecology",
  },
  chemistry: {
    "atomic structure": "atomic-structure-and-the-periodic-table",
    "bonding and structure": "bonding-structure-and-properties-of-matter",
    "quantitative chemistry": "quantitative-chemistry", "chemical changes": "chemical-changes",
    "energy changes": "energy-changes", "rates and equilibrium": "rate-and-extent-of-chemical-change",
    "organic chemistry": "organic-chemistry", "chemical analysis": "chemical-analysis",
    atmosphere: "chemistry-of-the-atmosphere", "using resources": "using-resources",
  },
  physics: {
    energy: "energy", electricity: "electricity", "particle model": "particle-model-of-matter",
    "atomic structure": "atomic-structure", forces: "forces", waves: "waves",
    magnetism: "magnetism-and-electromagnetism", "space physics": "space-physics",
  },
};

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => null);
    const rows = body?.rows as WebsiteQuestionRow[] | undefined;
    if (!Array.isArray(rows) || !rows.length) return NextResponse.json({ error: "No valid rows were supplied." }, { status: 400 });

    const issues = revalidateTypedRows(rows);
    if (issues.length) return NextResponse.json({ error: "Rows failed validation and were not saved.", issues }, { status: 422 });

    const { data: versions, error: versionsError } = await auth.admin
      .from("content_versions")
      .select("id,subject")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (versionsError) throw versionsError;

    const versionBySubject = new Map<string, string>();
    for (const version of versions ?? []) if (!versionBySubject.has(version.subject)) versionBySubject.set(version.subject, version.id);
    const missingSubjects = [...new Set(rows.map((row) => subjectMap[row.subject as SubjectLabel]).filter((subject) => !versionBySubject.has(subject)))];
    if (missingSubjects.length) {
      return NextResponse.json({ error: `No published content version exists for: ${missingSubjects.join(", ")}. Create/publish a version first.` }, { status: 409 });
    }

    const previousById = new Map<string, { active: boolean; created_at: string }>();
    for (let start = 0; start < rows.length; start += 500) {
      const ids = rows.slice(start, start + 500).map((row) => row.questionId);
      const { data, error } = await auth.admin.from("question_catalog").select("id,active,created_at").in("id", ids);
      if (error) throw error;
      for (const previous of data ?? []) previousById.set(previous.id, previous);
    }

    const catalogRows = rows.map((row) => {
      const subject = subjectMap[row.subject as SubjectLabel];
      const topicSlug = topicSlugs[subject][row.topic.toLowerCase()] || slugify(row.topic);
      const previous = previousById.get(row.questionId);
      const markingPoints = row.modelAnswer.split(/\r?\n+/).map((point) => point.trim()).filter(Boolean);
      return {
        id: row.questionId,
        content_version_id: versionBySubject.get(subject)!,
        subject,
        topic_slug: topicSlug,
        topic: row.topic,
        subtopic: row.subtopic,
        family_id: `${topicSlug}:${row.subtopic}:question`,
        question: row.question,
        model_answer: row.modelAnswer,
        marking_points: markingPoints,
        marks: row.marks,
        assessment_objective: row.assessmentObjective,
        command_word: null,
        tier: row.tier,
        grade_demand: row.grade,
        specification_reference: row.specificationReference,
        initial_retrieval_days: 7,
        active: previous?.active ?? false,
        ...(previous ? { created_at: previous.created_at } : {}),
      };
    });

    for (let start = 0; start < catalogRows.length; start += 500) {
      const { error } = await auth.admin.from("question_catalog").upsert(catalogRows.slice(start, start + 500), { onConflict: "id" });
      if (error) throw error;
    }

    return NextResponse.json({ saved: catalogRows.length, inactive: catalogRows.filter((row) => !row.active).length });
  } catch (error) {
    console.error("Question import failed:", error);
    return NextResponse.json({ error: "The questions could not be saved. Check Supabase configuration and the existing catalog/version schema." }, { status: 500 });
  }
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
