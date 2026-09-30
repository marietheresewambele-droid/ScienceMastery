import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { questionId } = await params;
    const body = await request.json().catch(() => null);
    if (typeof body?.active !== "boolean") return NextResponse.json({ error: "active must be true or false." }, { status: 400 });

    const { data: question, error: lookupError } = await auth.admin
      .from("question_catalog")
      .select("content_version_id")
      .eq("id", questionId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

    if (body.active) {
      const { error: versionError } = await auth.admin
        .from("content_versions")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", question.content_version_id);
      if (versionError) throw versionError;
    }

    const { error } = await auth.admin.from("question_catalog").update({ active: body.active }).eq("id", questionId);
    if (error) throw error;
    return NextResponse.json({ active: body.active });
  } catch (error) {
    console.error("Question active state update failed:", error);
    return NextResponse.json({ error: "The question's published state could not be changed. Check the Supabase server configuration and catalog schema." }, { status: 500 });
  }
}
