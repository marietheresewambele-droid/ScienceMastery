import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { COVERAGE_VALUES, TIER_VALUES } from "@/lib/courseVisibility";
import { applyQuestionFilters } from "@/lib/questionFilters";
import { resolveSubtopicId, topicIdFromQuestionId } from "@/lib/questionBankAdmin";

const MAX_IDS = 500;
const MAX_MATCHING = 2000;

/** Bulk tagging: sets coverage, tier and/or subtopic on many questions at once. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => null);
    let ids: string[] = Array.isArray(body?.ids) ? [...new Set<string>(body.ids.filter((id: unknown): id is string => typeof id === "string"))] : [];
    // "Select all matching": the admin's current filters stand in for a list of ids.
    if (body?.filters && typeof body.filters === "object") {
      const params = new URLSearchParams(Object.entries(body.filters as Record<string, unknown>).filter(([, value]) => typeof value === "string" && value).map(([key, value]) => [key, value as string]));
      const found: string[] = [];
      for (let from = 0; found.length <= MAX_MATCHING; from += 1000) {
        const { data, error } = await applyQuestionFilters(auth.admin.from("question_bank").select("id"), params).order("id").range(from, from + 999);
        if (error) throw error;
        found.push(...(data ?? []).map((row) => row.id as string));
        if ((data?.length ?? 0) < 1000) break;
      }
      if (found.length > MAX_MATCHING) return NextResponse.json({ error: `That matches more than ${MAX_MATCHING} questions. Narrow the filters first.` }, { status: 400 });
      ids = found;
    } else if (ids.length > MAX_IDS) {
      return NextResponse.json({ error: `Select at most ${MAX_IDS} questions at a time.` }, { status: 400 });
    }
    if (!ids.length) return NextResponse.json({ error: "Select at least one question." }, { status: 400 });

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

    let updated = 0;
    for (let start = 0; start < ids.length; start += 200) {
      const { data, error } = await auth.admin.from("question_catalog").update(changes).in("id", ids.slice(start, start + 200)).select("id");
      if (error) throw error;
      updated += data?.length ?? 0;
    }
    return NextResponse.json({ updated });
  } catch (error) {
    console.error("Bulk tagging failed:", error);
    return NextResponse.json({ error: "The tags could not be applied. Check the Supabase server configuration." }, { status: 500 });
  }
}
