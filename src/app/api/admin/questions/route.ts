import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

const PAGE_SIZE_MAX = 100;
const CATALOG_FIELDS = "id,content_version_id,subject,topic_slug,topic,subtopic,family_id,question,model_answer,marking_points,marks,assessment_objective,command_word,tier,grade_demand,specification_reference,initial_retrieval_days,active,created_at";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") || "1") || 1);
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(params.get("pageSize") || "50") || 50));
    const search = params.get("search")?.trim() || "";
    const filters = [
      ["subject", "subject"],
      ["topic", "topic_slug"],
      ["subtopic", "subtopic"],
      ["tier", "tier"],
      ["grade", "grade_demand"],
      ["assessmentObjective", "assessment_objective"],
    ] as const;

    let query = auth.admin.from("question_catalog").select(CATALOG_FIELDS, { count: "exact" });
    for (const [param, column] of filters) {
      const value = params.get(param)?.trim();
      if (value) query = query.eq(column, value);
    }
    const active = params.get("active");
    if (active === "true" || active === "false") query = query.eq("active", active === "true");
    if (search) {
      const escaped = search.replace(/[%_]/g, (match) => `\\${match}`);
      query = query.or(`id.ilike.%${escaped}%,question.ilike.%${escaped}%,model_answer.ilike.%${escaped}%`);
    }

    const from = (page - 1) * pageSize;
    const [{ data: rows, error, count }, { count: allCount, error: totalError }, { count: activeCount, error: activeError }, { data: facets, error: facetError }, { data: versions, error: versionError }] = await Promise.all([
      query.order("topic_slug").order("id").range(from, from + pageSize - 1),
      auth.admin.from("question_catalog").select("id", { count: "exact", head: true }),
      auth.admin.from("question_catalog").select("id", { count: "exact", head: true }).eq("active", true),
      auth.admin.from("question_catalog").select("subject,topic_slug,subtopic,tier,grade_demand,assessment_objective").limit(10000),
      auth.admin.from("content_versions").select("id,subject,status,published_at,created_at").order("created_at", { ascending: false }),
    ]);
    if (error || totalError || activeError || facetError || versionError) {
      throw error || totalError || activeError || facetError || versionError;
    }

    const values = (key: "subject" | "topic_slug" | "subtopic" | "tier" | "grade_demand" | "assessment_objective") =>
      [...new Set((facets ?? []).map((row) => row[key]).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
    const total = count ?? 0;
    const all = allCount ?? 0;
    const activeTotal = activeCount ?? 0;

    return NextResponse.json({
      rows: rows ?? [],
      total,
      page,
      pageSize,
      totals: { all, active: activeTotal, inactive: all - activeTotal },
      facets: {
        subjects: values("subject"),
        topics: values("topic_slug"),
        subtopics: values("subtopic"),
        tiers: values("tier"),
        grades: values("grade_demand"),
        assessmentObjectives: values("assessment_objective"),
      },
      versions: versions ?? [],
    });
  } catch (error) {
    console.error("Question catalog request failed:", error);
    return NextResponse.json({ error: "Questions could not be loaded. Check the Supabase server configuration and question_catalog schema." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => null);
    const question = body?.question;
    const contentVersionId = typeof body?.contentVersionId === "string" ? body.contentVersionId.trim() : "";
    const validationError = validateQuestion(question);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    if (!contentVersionId) return NextResponse.json({ error: "Choose a content version for this question." }, { status: 400 });

    const { data: version, error: versionError } = await auth.admin
      .from("content_versions")
      .select("id,subject")
      .eq("id", contentVersionId)
      .eq("subject", question.subject)
      .maybeSingle();
    if (versionError) throw versionError;
    if (!version) return NextResponse.json({ error: "The selected content version does not exist for this subject." }, { status: 400 });

    const row = toCatalogRow(question, contentVersionId);
    row.active = false;
    const { error } = await auth.admin.from("question_catalog").insert(row);
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "That question ID already exists. Edit its existing catalog row instead." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ saved: true, id: row.id, active: false }, { status: 201 });
  } catch (error) {
    console.error("Question create failed:", error);
    return NextResponse.json({ error: "The question could not be saved. Check the Supabase server configuration and catalog schema." }, { status: 500 });
  }
}

function validateQuestion(question: Record<string, unknown> | null | undefined): string | null {
  if (!question || typeof question !== "object") return "Question data is required.";
  const required = ["id", "subject", "topicSlug", "subtopic", "question"];
  for (const field of required) if (typeof question[field] !== "string" || !String(question[field]).trim()) return `${field} is required.`;
  if (!["biology", "chemistry", "physics"].includes(String(question.subject))) return "Subject must be Biology, Chemistry or Physics.";
  if (!Number.isInteger(question.marks) || Number(question.marks) < 1 || Number(question.marks) > 6) return "Marks must be a whole number from 1 to 6.";
  if (!["AO1", "AO2", "AO3", "AO1/AO2", "AO1/AO3", "AO2/AO3", "AO1/AO2/AO3"].includes(String(question.assessmentObjective))) return "Choose a valid assessment objective.";
  if (question.tier != null && !["Foundation", "Higher", "Both"].includes(String(question.tier))) return "Choose a valid tier.";
  if (!Array.isArray(question.markingPoints) || question.markingPoints.some((point) => typeof point !== "string")) return "Marking points must be a list of text values.";
  return null;
}

function toCatalogRow(question: Record<string, unknown>, contentVersionId: string) {
  const subject = String(question.subject);
  const topicSlug = String(question.topicSlug).trim();
  const subtopic = String(question.subtopic).trim();
  const points = question.markingPoints as string[];
  const id = String(question.id).trim();
  return {
    id,
    content_version_id: contentVersionId,
    subject,
    topic_slug: topicSlug,
    topic: typeof question.topic === "string" && question.topic.trim() ? question.topic.trim() : topicSlug,
    subtopic,
    family_id: typeof question.questionFamily === "string" && question.questionFamily.trim()
      ? question.questionFamily.trim()
      : `${topicSlug}:${subtopic}:${typeof question.commandWord === "string" ? question.commandWord : "question"}`,
    question: String(question.question).trim(),
    model_answer: typeof question.modelAnswer === "string" && question.modelAnswer.trim() ? question.modelAnswer : points.join("\n"),
    marking_points: points,
    marks: Number(question.marks),
    assessment_objective: String(question.assessmentObjective),
    command_word: typeof question.commandWord === "string" ? question.commandWord : null,
    tier: typeof question.tier === "string" ? question.tier : null,
    grade_demand: typeof question.gradeDemand === "string" ? question.gradeDemand : null,
    specification_reference: typeof question.specificationReference === "string" ? question.specificationReference : null,
    initial_retrieval_days: 7,
    active: false,
  };
}
