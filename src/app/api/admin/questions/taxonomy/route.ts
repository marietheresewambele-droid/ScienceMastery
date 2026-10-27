import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

/** Subjects -> topics -> subtopics for the add-question dropdowns, plus the next free question number per topic. */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const [topics, subtopics, ids] = await Promise.all([
      auth.admin.from("topics").select("id,subject_id,number,name,slug").order("subject_id").order("number"),
      auth.admin.from("subtopics").select("topic_id,name,sort_order").order("sort_order"),
      auth.admin.from("question_catalog").select("id").limit(10000),
    ]);
    if (topics.error || subtopics.error || ids.error) throw topics.error || subtopics.error || ids.error;

    const highest = new Map<string, number>();
    for (const { id } of ids.data ?? []) {
      const [code, topic, question] = String(id).split("-");
      const key = `${code}-${topic}`;
      highest.set(key, Math.max(highest.get(key) ?? 0, Number(question.slice(1)) || 0));
    }

    return NextResponse.json({
      topics: (topics.data ?? []).map((topic) => ({
        id: topic.id as string,
        subject: topic.subject_id as string,
        number: topic.number as number,
        name: topic.name as string,
        slug: topic.slug as string,
        subtopics: (subtopics.data ?? []).filter((subtopic) => subtopic.topic_id === topic.id).map((subtopic) => subtopic.name as string),
        nextNumber: (highest.get(topic.id as string) ?? 0) + 1,
      })),
    });
  } catch (error) {
    console.error("Taxonomy request failed:", error);
    return NextResponse.json({ error: "Subjects and topics could not be loaded." }, { status: 500 });
  }
}
