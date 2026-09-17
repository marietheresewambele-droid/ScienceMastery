import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";
import { parseChemistryWorkbook } from "@/lib/chemistryWorkbookImport";
import { parseAdaptiveWorkbook, type AdaptiveWorkbookSubject } from "@/lib/adaptiveWorkbookImport";

export async function POST(request: Request) {
  try {
    return await handleParse(request);
  } catch (error) {
    console.error("Workbook parse failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The workbook could not be parsed." }, { status: 500 });
  }
}

async function handleParse(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach a workbook (.xlsx) file." }, { status: 400 });
  const subject = formData.get("subject");
  if (typeof subject !== "string" || !["biology", "chemistry", "physics"].includes(subject)) {
    return NextResponse.json({ error: "A valid subject is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (subject === "chemistry") {
    const result = parseChemistryWorkbook(buffer);
    if (!result.questions.length) {
      return NextResponse.json({ error: "No usable questions were found in this workbook. Check it matches the Chemistry Mastery Audit (Website Ready) format." }, { status: 422 });
    }
    return NextResponse.json({
      questions: result.questions,
      relationships: result.relationships,
      topicsFound: result.topics.map((topic) => ({ sheet: topic.sheet, topicSlug: topic.topicSlug, count: topic.questions.length, incomplete: topic.incomplete.length })),
      missingSheets: result.missingSheets,
    });
  }

  const result = parseAdaptiveWorkbook(buffer, subject as AdaptiveWorkbookSubject);
  if (!result.questions.length) {
    return NextResponse.json({ error: `No usable questions were found in this workbook. Check it matches the ${subject === "biology" ? "Biology" : "Physics"} Mastery Audit format (one sheet per topic, an "ID" and question columns).` }, { status: 422 });
  }
  return NextResponse.json({
    questions: result.questions,
    relationships: result.relationships,
    topicsFound: result.topics.map((topic) => ({ sheet: topic.sheet, topicSlug: topic.topicSlug, count: topic.questions.length, incomplete: 0 })),
    missingSheets: result.missingSheets,
  });
}
