import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

type SetActiveRequestBody = {
  questionIds?: string[];
  active?: boolean;
};

export async function POST(request: Request) {
  try {
    return await handleSetActive(request);
  } catch (error) {
    console.error("Setting question active state failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Content could not be updated." }, { status: 500 });
  }
}

async function handleSetActive(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { admin } = auth;

  let body: SetActiveRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { questionIds, active } = body;
  if (!Array.isArray(questionIds) || !questionIds.length) return NextResponse.json({ error: "At least one question id is required." }, { status: 400 });
  if (typeof active !== "boolean") return NextResponse.json({ error: "active must be true or false." }, { status: 400 });

  // A retired question just stops being served (question_catalog.active) - student_attempts has
  // no cascade delete from question_catalog by design, so history for anyone who already
  // answered it stays intact. Nothing here ever hard-deletes a catalog row.
  const { error } = await admin.from("question_catalog").update({ active }).in("id", questionIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ updated: questionIds.length, active });
}
