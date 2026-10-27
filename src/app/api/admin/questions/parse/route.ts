import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { hasBlockingIssues } from "@/lib/brainsomaWorkbook";
import { readWorkbookUpload } from "@/lib/workbookUpload";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkbookQuestionRow } from "@/lib/brainsomaWorkbook";

const CHUNK = 500;
const FIELDS = "id,question,model_answer,marks,assessment_objective,qualification,tier,difficulty,grade,question_type,specification_reference,subtopic_id";

/** Compares the workbook with what is saved, so the admin sees new / updated / unchanged questions before importing. */
async function diffAgainstCatalog(admin: SupabaseClient, rows: WorkbookQuestionRow[]) {
  const saved = new Map<string, Record<string, unknown>>();
  for (let start = 0; start < rows.length; start += CHUNK) {
    const { data, error } = await admin.from("question_catalog").select(FIELDS).in("id", rows.slice(start, start + CHUNK).map((row) => row.questionId));
    if (error) throw error;
    for (const row of data ?? []) saved.set(row.id as string, row);
  }
  const created: { id: string; question: string }[] = [];
  const updated: { id: string; question: string; changes: string[] }[] = [];
  let unchanged = 0;
  for (const row of rows) {
    const existing = saved.get(row.questionId);
    if (!existing) { created.push({ id: row.questionId, question: row.question }); continue; }
    const changes = ([
      ["question", row.question, existing.question],
      ["model answer", row.modelAnswer, existing.model_answer],
      ["marks", row.marks, existing.marks],
      ["assessment objective", row.assessmentObjective, existing.assessment_objective],
      ["coverage", row.qualification, existing.qualification],
      ["tier", row.tier, existing.tier],
      // A workbook with no Difficulty value leaves the saved one alone.
      ["difficulty", row.difficulty || (existing.difficulty ?? ""), existing.difficulty ?? ""],
      ["grade", row.grade || "", existing.grade ?? ""],
      ["question type", row.questionType || "", existing.question_type ?? ""],
    ] as const).filter(([, next, current]) => String(next) !== String(current)).map(([label]) => label);
    if (changes.length) updated.push({ id: row.questionId, question: row.question, changes }); else unchanged += 1;
  }
  return { new: created.length, updated: updated.length, unchanged, newRows: created.slice(0, 50), updatedRows: updated.slice(0, 50) };
}

/** Dry run: validates a BrainSoma workbook and returns a preview. Never writes to Supabase. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const upload = await readWorkbookUpload(request);
    if ("error" in upload) return upload.error;
    const { rows, issues, topics } = upload.result;

    const diff = await diffAgainstCatalog(auth.admin, rows);
    const tagIssues = issues.filter((issue) => /^(Qualification|Tier|Difficulty) must be|no longer a valid tag/.test(issue.message));

    return NextResponse.json({
      diff,
      invalidTags: tagIssues,
      questionCount: rows.length,
      errorCount: issues.filter((issue) => issue.severity === "error").length,
      warningCount: issues.filter((issue) => issue.severity === "warning").length,
      issues,
      topics,
      canPublish: rows.length > 0 && !hasBlockingIssues(issues),
      preview: rows.slice(0, 20),
    });
  } catch (error) {
    console.error("Question workbook parse failed:", error);
    return NextResponse.json({ error: "The workbook could not be read. Confirm it is a valid .xlsx file." }, { status: 500 });
  }
}
