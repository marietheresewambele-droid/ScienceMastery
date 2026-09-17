import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

const SUBJECTS = new Set(["biology", "chemistry", "physics"]);
const RESULT_LIMIT = 200;

export async function GET(request: Request) {
  try {
    return await handleList(request);
  } catch (error) {
    console.error("Question search failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Questions could not be loaded." }, { status: 500 });
  }
}

async function handleList(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { admin } = auth;

  const url = new URL(request.url);
  const subject = url.searchParams.get("subject");
  const topicSlug = url.searchParams.get("topicSlug")?.trim();
  const search = url.searchParams.get("search")?.trim();
  if (!subject || !SUBJECTS.has(subject)) return NextResponse.json({ error: "A valid subject is required." }, { status: 400 });

  let query = admin
    .from("question_catalog")
    .select("id,subject,topic_slug,subtopic,question,marks,active,content_version_id", { count: "exact" })
    .eq("subject", subject)
    .order("topic_slug")
    .order("id")
    .limit(RESULT_LIMIT);

  if (topicSlug) query = query.eq("topic_slug", topicSlug);
  if (search) {
    const escaped = search.replace(/[%_]/g, (match) => `\\${match}`);
    query = query.or(`id.ilike.%${escaped}%,question.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    questions: data ?? [],
    totalMatching: count ?? (data?.length ?? 0),
    truncated: (count ?? 0) > RESULT_LIMIT,
  });
}
