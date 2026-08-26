import { getSupabaseBrowserClient } from "@/lib/supabase";
import { catalogQuestionId, classifyOutcome, retrievalDays, type AdaptiveEvidence } from "@/lib/adaptive-engine";
import type { MasteryQuestion } from "@/types/questions";

const CONTENT_VERSION: Record<MasteryQuestion["subject"], string> = {
  biology: "BIO-2026.1",
  chemistry: "CHE-2026.1",
  physics: "PHY-2026.1",
};

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
  const supabase = getSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { synced: false as const, reason: "signed_out" as const };

  const outcome = classifyOutcome(evidence);
  const questionId = catalogQuestionId(question);
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
    content_version_id: CONTENT_VERSION[question.subject],
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
