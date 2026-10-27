import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { COVERAGE_VALUES, TIER_VALUES } from "@/lib/courseVisibility";
import { resolveSubtopicId, topicIdFromQuestionId } from "@/lib/questionBankAdmin";

const MAX_IDS = 500;

/** Bulk tagging: sets coverage, tier and/or subtopic on many questions at once. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => null);
    const ids: string[] = Array.isArray(body?.ids) ? [...new Set<string>(body.ids.filter((id: unknown): id is string => typeof id === "string"))] : [];
    if (!ids.length) return NextResponse.json({ error: "Select at least one question." }, { status: 400 });
    if (ids.length > MAX_IDS) return NextResponse.json({ error: `Select at most ${MAX_IDS} questions at a time.` }, { status: 400 });

    const changes: Record<string, string | null> = {};
    if (body.qualification) {
      if (!(COVERAGE_VALUES as readonly string[]).includes(body.qualification)) return NextResponse.json({ error: "Choose a valid coverage." }, { status: 400 });
      changes.qualification = body.qualification;
    }
    if (body.tier) {
      if (!(TIER_VALUES as readonly string[]).includes(body.tier)) return NextResponse.json({ error: "Choose a valid tier." }, { status: 400 });
      changes.tier = body.tier;
    }
    if (typeof body.subtopic === "string" && body.subtopic.trim()) {
      const topics = new Set(ids.map(topicIdFromQuestionId));
      if (topics.size !== 1) return NextResponse.json({ error: "Subtopics belong to a unit, so every selected question must be in the same unit to move them." }, { status: 400 });
      changes.subtopic_id = await resolveSubtopicId(auth.admin, [...topics][0], body.subtopic.trim().replace(/\s+/g, " "));
    }
    if (!Object.keys(changes).length) return NextResponse.json({ error: "Choose at least one tag to apply." }, { status: 400 });

    const { data, error } = await auth.admin.from("question_catalog").update(changes).in("id", ids).select("id");
    if (error) throw error;
    return NextResponse.json({ updated: data?.length ?? 0 });
  } catch (error) {
    console.error("Bulk tagging failed:", error);
    return NextResponse.json({ error: "The tags could not be applied. Check the Supabase server configuration." }, { status: 500 });
  }
}
