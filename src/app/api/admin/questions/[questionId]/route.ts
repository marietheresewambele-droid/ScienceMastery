import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { catalogColumns, parseQuestionInput, resolveSubtopicId, topicIdFromQuestionId } from "@/lib/questionBankAdmin";

export async function PATCH(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { questionId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = parseQuestionInput(body?.question);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { input } = parsed;
    if (input.id !== questionId) return NextResponse.json({ error: "Question ID is stable and cannot be changed." }, { status: 400 });

    // The topic is fixed by the ID; the subtopic may move within that topic.
    const subtopicId = await resolveSubtopicId(auth.admin, topicIdFromQuestionId(questionId), input.subtopic);
    const { data, error } = await auth.admin
      .from("question_catalog")
      .update({ subtopic_id: subtopicId, ...catalogColumns(input) })
      .eq("id", questionId)
      .select("id");
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    return NextResponse.json({ saved: true, id: questionId });
  } catch (error) {
    console.error("Question update failed:", error);
    return NextResponse.json({ error: "The question could not be saved. Check the Supabase server configuration and catalog schema." }, { status: 500 });
  }
}
