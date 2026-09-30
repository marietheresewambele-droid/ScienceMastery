import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

export async function PATCH(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { questionId } = await params;
    const body = await request.json().catch(() => null);
    const question = body?.question;
    const validationError = validateQuestion(question);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    if (question.id !== questionId) return NextResponse.json({ error: "Question ID is stable and cannot be changed." }, { status: 400 });

    const markingPoints = question.markingPoints as string[];
    const { error } = await auth.admin
      .from("question_catalog")
      .update({
        subject: question.subject,
        topic_slug: question.topicSlug,
        topic: question.topic || question.topicSlug,
        subtopic: question.subtopic,
        family_id: question.questionFamily || `${question.topicSlug}:${question.subtopic}:question`,
        question: question.question,
        model_answer: question.modelAnswer || markingPoints.join("\n"),
        marking_points: markingPoints,
        marks: Number(question.marks),
        assessment_objective: question.assessmentObjective,
        command_word: question.commandWord || null,
        tier: question.tier || null,
        grade_demand: question.gradeDemand || null,
        specification_reference: question.specificationReference || null,
      })
      .eq("id", questionId);

    if (error) throw error;
    return NextResponse.json({ saved: true, id: questionId });
  } catch (error) {
    console.error("Question update failed:", error);
    return NextResponse.json({ error: "The question could not be saved. Check the Supabase server configuration and catalog schema." }, { status: 500 });
  }
}

function validateQuestion(question: Record<string, unknown> | null | undefined): string | null {
  if (!question || typeof question !== "object") return "Question data is required.";
  for (const field of ["id", "subject", "topicSlug", "subtopic", "question"]) {
    if (typeof question[field] !== "string" || !String(question[field]).trim()) return `${field} is required.`;
  }
  if (!["biology", "chemistry", "physics"].includes(String(question.subject))) return "Subject must be Biology, Chemistry or Physics.";
  if (!Number.isInteger(question.marks) || Number(question.marks) < 1 || Number(question.marks) > 6) return "Marks must be a whole number from 1 to 6.";
  if (!["AO1", "AO2", "AO3", "AO1/AO2", "AO1/AO3", "AO2/AO3", "AO1/AO2/AO3"].includes(String(question.assessmentObjective))) return "Choose a valid assessment objective.";
  if (question.tier != null && !["Foundation", "Higher", "Both"].includes(String(question.tier))) return "Choose a valid tier.";
  if (!Array.isArray(question.markingPoints) || question.markingPoints.some((point) => typeof point !== "string")) return "Marking points must be a list of text values.";
  return null;
}
