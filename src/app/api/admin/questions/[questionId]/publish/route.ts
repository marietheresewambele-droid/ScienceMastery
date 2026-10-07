import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { questionId } = await params;
    const body = await request.json().catch(() => null);
    if (typeof body?.active !== "boolean") return NextResponse.json({ error: "active must be true or false." }, { status: 400 });

    // Retiring only stops a question being served; student history is kept (no cascade).
    const { data, error } = await auth.admin.from("question_catalog").update({ active: body.active }).eq("id", questionId).select("id");
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    return NextResponse.json({ active: body.active });
  } catch (error) {
    console.error("Question active state update failed:", error);
    return NextResponse.json({ error: "The question's published state could not be changed. Check the Supabase server configuration and catalog schema." }, { status: 500 });
  }
}
