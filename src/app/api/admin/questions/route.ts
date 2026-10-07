import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { catalogColumns, parseQuestionInput, resolveSubtopicId, topicIdFromQuestionId } from "@/lib/questionBankAdmin";

const PAGE_SIZE_MAX = 100;
const BANK_FIELDS = "id,legacy_id,subject,topic_id,topic_number,topic,topic_slug,subtopic,subtopic_order,specification_reference,question,model_answer,marks,assessment_objective,qualification,tier,grade,question_type,key_terms,source_notes,sort_order,active,created_at";

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
      ["qualification", "qualification"],
      ["grade", "grade"],
      ["assessmentObjective", "assessment_objective"],
    ] as const;

    let query = auth.admin.from("question_bank").select(BANK_FIELDS, { count: "exact" });
    for (const [param, column] of filters) {
      const value = params.get(param)?.trim();
      if (value) query = query.eq(column, value);
    }
    const active = params.get("active");
    if (active === "true" || active === "false") query = query.eq("active", active === "true");
    if (search) {
      const escaped = search.replace(/[%_,()]/g, (match) => `\\${match}`);
      query = query.or(`id.ilike.%${escaped}%,question.ilike.%${escaped}%,model_answer.ilike.%${escaped}%`);
    }

    const from = (page - 1) * pageSize;
    const [{ data: rows, error, count }, { count: allCount, error: totalError }, { count: activeCount, error: activeError }, { data: facets, error: facetError }] = await Promise.all([
      query.order("subject").order("topic_number").order("subtopic_order").order("sort_order").range(from, from + pageSize - 1),
      auth.admin.from("question_catalog").select("id", { count: "exact", head: true }),
      auth.admin.from("question_catalog").select("id", { count: "exact", head: true }).eq("active", true),
      auth.admin.from("question_bank").select("subject,topic_slug,subtopic,tier,qualification,grade,assessment_objective").limit(10000),
    ]);
    if (error || totalError || activeError || facetError) throw error || totalError || activeError || facetError;

    type FacetKey = "subject" | "topic_slug" | "subtopic" | "tier" | "qualification" | "grade" | "assessment_objective";
    const values = (key: FacetKey) =>
      [...new Set((facets ?? []).map((row) => row[key]).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const all = allCount ?? 0;
    const activeTotal = activeCount ?? 0;

    return NextResponse.json({
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totals: { all, active: activeTotal, inactive: all - activeTotal },
      facets: {
        subjects: values("subject"),
        topics: values("topic_slug"),
        subtopics: values("subtopic"),
        tiers: values("tier"),
        qualifications: values("qualification"),
        grades: values("grade"),
        assessmentObjectives: values("assessment_objective"),
      },
    });
  } catch (error) {
    console.error("Question catalog request failed:", error);
    return NextResponse.json({ error: "Questions could not be loaded. Check the Supabase server configuration and that the question hierarchy migration has been applied." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => null);
    const parsed = parseQuestionInput(body?.question);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { input } = parsed;

    const topicId = topicIdFromQuestionId(input.id);
    const { data: topic, error: topicError } = await auth.admin.from("topics").select("id").eq("id", topicId).maybeSingle();
    if (topicError) throw topicError;
    if (!topic) return NextResponse.json({ error: `Topic ${topicId} does not exist.` }, { status: 400 });

    const { data: last, error: lastError } = await auth.admin
      .from("question_bank").select("sort_order").eq("topic_id", topicId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    if (lastError) throw lastError;

    const subtopicId = await resolveSubtopicId(auth.admin, topicId, input.subtopic);
    const { error } = await auth.admin.from("question_catalog").insert({
      id: input.id,
      subtopic_id: subtopicId,
      ...catalogColumns(input),
      sort_order: (last?.sort_order ?? -1) + 1,
      active: false,
    });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "That question ID already exists. Edit the existing question instead." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ saved: true, id: input.id, active: false }, { status: 201 });
  } catch (error) {
    console.error("Question create failed:", error);
    return NextResponse.json({ error: "The question could not be saved. Check the Supabase server configuration and catalog schema." }, { status: 500 });
  }
}
