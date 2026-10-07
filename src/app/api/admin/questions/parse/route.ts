import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { hasBlockingIssues } from "@/lib/brainsomaWorkbook";
import { readWorkbookUpload } from "@/lib/workbookUpload";

/** Dry run: validates a BrainSoma workbook and returns a preview. Never writes to Supabase. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const upload = await readWorkbookUpload(request);
    if ("error" in upload) return upload.error;
    const { rows, issues, topics } = upload.result;

    return NextResponse.json({
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
