import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ authorized: true });
}
