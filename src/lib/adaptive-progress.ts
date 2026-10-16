import { getSupabaseBrowserClient } from "@/lib/supabase";
import { catalogQuestionId, classifyOutcome, retrievalDays, type AdaptiveEvidence } from "@/lib/adaptive-engine";
import type { MasteryQuestion } from "@/types/questions";

// Only question bank questions have a public.question_catalog row to attach evidence to.
const BANK_QUESTION_ID = /^(BIO|CHEM|PHYS)-T\d{2}-Q\d{3,}$/;

/**
 * Mirrors a bookmark into public.student_bookmarks so admins can see which questions students
 * save. localStorage stays the source of truth for the UI; failures are silent and non-blocking.
 */
export async function syncBookmarks(questionIds: string[], bookmarked: boolean) {
  const ids = [...new Set(questionIds)].filter((id) => BANK_QUESTION_ID.test(id));
  if (!ids.length || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    if (bookmarked) {
      await supabase.from("student_bookmarks").upsert(
        ids.map((question_id) => ({ user_id: auth.user.id, question_id })),
        { onConflict: "user_id,question_id", ignoreDuplicates: true },
      );
    } else {
      await supabase.from("student_bookmarks").delete().eq("user_id", auth.user.id).in("question_id", ids);
    }
  } catch {
    // Analytics only - never interrupt revision.
  }
}

export async function recordAdaptiveAttempt({
  question,
  evidence,
  mode,
  responseTimeMs,
}: {
  question: MasteryQuestion;
  evidence: AdaptiveEvidence;
  mode: "adaptive" | "mixed" | "flashcards" | "exam" | "bookmarks" | "due";
  responseTimeMs?: number;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { synced: false as const, reason: "supabase_not_configured" as const };
  }

  const supabase = getSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { synced: false as const, reason: "signed_out" as const };

  const outcome = classifyOutcome(evidence);
  const questionId = catalogQuestionId(question);
  if (!BANK_QUESTION_ID.test(questionId)) return { synced: false as const, reason: "not_a_bank_question" as const };
  const { data: previous } = await supabase
    .from("student_question_state")
    .select("independent_successes,supported_successes,incorrect_attempts,interval_days,consecutive_independent_successes")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  const days = retrievalDays(question, evidence, previous?.interval_days || 0);
  const dueAt = new Date(Date.now() + (days ? days * 86_400_000 : 10 * 60_000)).toISOString();
  const independent = (previous?.independent_successes || 0) + (outcome === "independent_correct" ? 1 : 0);
  const supported = (previous?.supported_successes || 0) + (outcome === "supported_correct" ? 1 : 0);
  const incorrect = (previous?.incorrect_attempts || 0) + (outcome === "incorrect" ? 1 : 0);
  const streak = outcome === "independent_correct" ? (previous?.consecutive_independent_successes || 0) + 1 : 0;
  const masteryStatus = streak >= 2 ? "secure" : outcome === "independent_correct" ? "developing" : outcome === "supported_correct" ? "supported" : "developing";

  const attempt = await supabase.from("student_attempts").insert({
    user_id: user.id,
    question_id: questionId,
    mode,
    rating: evidence.rating,
    outcome,
    hints_used: evidence.hintsUsed,
    answer_revealed: evidence.answerRevealed,
    response_time_ms: responseTimeMs,
  });
  if (attempt.error) return { synced: false as const, reason: attempt.error.message };

  const state = await supabase.from("student_question_state").upsert({
    user_id: user.id,
    question_id: questionId,
    mastery_status: masteryStatus,
    independent_successes: independent,
    supported_successes: supported,
    incorrect_attempts: incorrect,
    last_rating: evidence.rating,
    last_attempted_at: new Date().toISOString(),
    due_at: dueAt,
    interval_days: days,
    consecutive_independent_successes: streak,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,question_id" });

  return state.error ? { synced: false as const, reason: state.error.message } : { synced: true as const, masteryStatus, dueAt };
}
