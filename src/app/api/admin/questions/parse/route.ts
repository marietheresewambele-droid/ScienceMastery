import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { parseWebsiteUploadWorkbook } from "@/lib/websiteQuestionImport";

export async function POST(request: Request) {
  try {
    return await handleParse(request);
  } catch (error) {
    console.error("Question workbook parse failed:", error);
    return NextResponse.json({ error: "The workbook could not be read. Confirm it is a valid .xlsx file." }, { status: 500 });
  }
}

async function handleParse(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach a workbook to upload." }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Only .xlsx files are accepted." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = parseWebsiteUploadWorkbook(buffer);

  if (!result.sheetFound) {
    return NextResponse.json({ error: 'This workbook has no worksheet named exactly "Website Upload".' }, { status: 422 });
  }
  if (result.missingHeaders.length) {
    return NextResponse.json({ error: `The "Website Upload" worksheet is missing required column(s): ${result.missingHeaders.join(", ")}.` }, { status: 422 });
  }

  return NextResponse.json({
    totalRows: result.totalRows,
    validCount: result.rows.length,
    invalidCount: result.totalRows - result.rows.length,
    issues: result.issues,
    canPublish: result.issues.length === 0 && result.rows.length > 0,
    rows: result.rows,
  });
}
