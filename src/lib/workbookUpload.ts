import "server-only";
import { NextResponse } from "next/server";
import { parseBrainsomaWorkbook, type WorkbookParseResult } from "@/lib/brainsomaWorkbook";

/** Reads the .xlsx from a multipart request; returns a NextResponse on bad input. */
export async function readWorkbookUpload(request: Request): Promise<{ result: WorkbookParseResult; formData: FormData } | { error: NextResponse }> {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: NextResponse.json({ error: "Attach a workbook to upload." }, { status: 400 }) };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { error: NextResponse.json({ error: "Only .xlsx files are accepted." }, { status: 400 }) };
  return { result: parseBrainsomaWorkbook(Buffer.from(await file.arrayBuffer())), formData };
}
