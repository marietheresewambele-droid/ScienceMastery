import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { hasBlockingIssues } from "@/lib/brainsomaWorkbook";
import { publishWorkbookRows } from "@/lib/questionBankAdmin";
import { readWorkbookUpload } from "@/lib/workbookUpload";

/** Re-parses the uploaded workbook server-side (the client's preview is never trusted) and saves it. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const upload = await readWorkbookUpload(request);
    if ("error" in upload) return upload.error;
    const { rows, issues } = upload.result;
    if (!rows.length || hasBlockingIssues(issues)) {
      return NextResponse.json({ error: "The workbook failed validation and nothing was saved.", issues }, { status: 422 });
    }

    const summary = await publishWorkbookRows(auth.admin, rows, upload.formData.get("activateNew") === "true");
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Question import failed:", error);
    const detail = error instanceof Error ? error.message : (error as { message?: string })?.message;
    return NextResponse.json({ error: `The questions could not be saved${detail ? `: ${detail}` : "."}` }, { status: 500 });
  }
}
