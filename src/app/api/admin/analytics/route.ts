import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const top = Math.min(50, Math.max(1, Number(new URL(request.url).searchParams.get("top") || "15") || 15));
    const { data, error } = await auth.admin.rpc("admin_student_analytics", { p_top: top });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Student analytics failed:", error);
    const detail = error instanceof Error ? error.message : (error as { message?: string })?.message || "unknown error";
    return NextResponse.json(
      { error: `Could not load student analytics: ${detail}. Make sure the admin_student_analytics migration has been applied.` },
      { status: 500 },
    );
  }
}
