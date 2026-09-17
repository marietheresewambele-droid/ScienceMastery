import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/adminAccess";
import { validateQuestionWorkbook, hasBlockingIssues, type WorkbookRelationship } from "@/lib/contentValidation";
import { getAdaptiveHints } from "@/lib/adaptive-engine";
import type { MasteryQuestion } from "@/types/questions";

const SUBJECT_PREFIX: Record<MasteryQuestion["subject"], string> = {
  biology: "BIO",
  chemistry: "CHE",
  physics: "PHY",
};

const RELATIONSHIP_TYPE_MAP: Record<string, "prerequisite" | "diagnostic" | "easier" | "parallel" | "harder"> = {
  Prerequisite: "prerequisite",
  Diagnostic: "diagnostic",
  Easier: "easier",
  Parallel: "parallel",
  Harder: "harder",
};

const HINT_SUPPORT_TYPE = ["structure", "guided"] as const;

type PublishRequestBody = {
  subject?: MasteryQuestion["subject"];
  version?: string;
  questions?: MasteryQuestion[];
  relationships?: WorkbookRelationship[];
};

export async function POST(request: Request) {
  try {
    return await handlePublish(request);
  } catch (error) {
    console.error("Content publish failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Content could not be published." }, { status: 500 });
  }
}

async function handlePublish(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });

  const admin = getSupabaseAdminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user || !isAdminEmail(userData.user.email)) {
    return NextResponse.json({ error: "You are not authorized to publish content." }, { status: 403 });
  }

  let body: PublishRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { subject, version, questions = [], relationships = [] } = body;
  if (!subject || !SUBJECT_PREFIX[subject]) return NextResponse.json({ error: "A valid subject is required." }, { status: 400 });
  if (!version?.trim()) return NextResponse.json({ error: "A content version label is required." }, { status: 400 });
  if (!questions.length) return NextResponse.json({ error: "At least one question is required." }, { status: 400 });

  const issues = validateQuestionWorkbook(questions, relationships);
  if (hasBlockingIssues(issues)) return NextResponse.json({ error: "Content failed validation.", issues }, { status: 422 });
  const warnings = issues.filter((issue) => issue.severity === "warning");

  const prefix = SUBJECT_PREFIX[subject];
  const contentVersionId = `${prefix}-${version.trim()}`;
  const idMap = new Map(questions.map((question) => [question.id, `${prefix}-${question.topicSlug}-${question.id}`]));

  const catalogRows = questions.map((question) => ({
    id: idMap.get(question.id)!,
    content_version_id: contentVersionId,
    subject,
    topic_slug: question.topicSlug,
    topic: question.topic ?? null,
    subtopic: question.subtopic,
    family_id: question.questionFamily || `${question.topicSlug}:${question.subtopic}:${question.commandWord || "question"}`,
    question: question.question,
    model_answer: question.modelAnswer || question.markingPoints.join(" "),
    marking_points: question.markingPoints,
    marks: question.marks,
    assessment_objective: question.assessmentObjective,
    command_word: question.commandWord ?? null,
    tier: question.tier ?? null,
    grade_demand: question.gradeDemand ?? null,
    specification_reference: question.specificationReference ?? null,
    active: true,
  }));

  // Every question gets two stored hints: author-provided ones when present, otherwise the
  // same keyword/calculation/generic scaffolding the client would compute on the fly. Storing
  // them means curated hintKeywords (e.g. from a workbook import) aren't silently dropped just
  // because question_catalog has nowhere to persist the raw keyword list.
  const hintRows = questions.flatMap((question) => {
    const questionId = idMap.get(question.id)!;
    return getAdaptiveHints(question).map((hint, index) => ({
      id: `${questionId}-hint-${index + 1}`,
      question_id: questionId,
      level: index + 1,
      hint,
      support_type: HINT_SUPPORT_TYPE[index],
    }));
  });

  const skippedRelationships: string[] = [];
  const relationshipRows = relationships.flatMap((relationship) => {
    const type = relationship.relationship ? RELATIONSHIP_TYPE_MAP[relationship.relationship] : undefined;
    const sourceId = relationship.sourceId ? idMap.get(relationship.sourceId) : undefined;
    const targetId = relationship.targetId ? idMap.get(relationship.targetId) : undefined;
    if (!type || !sourceId || !targetId) {
      if (relationship.relationship && !type) skippedRelationships.push(relationship.relationship);
      return [];
    }
    return [{ source_question_id: sourceId, relationship_type: type, target_question_id: targetId }];
  });

  const { error: versionError } = await admin.from("content_versions").upsert(
    { id: contentVersionId, subject, status: "published", published_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (versionError) return NextResponse.json({ error: versionError.message }, { status: 500 });

  const { error: catalogError } = await admin.from("question_catalog").upsert(catalogRows, { onConflict: "id" });
  if (catalogError) return NextResponse.json({ error: catalogError.message }, { status: 500 });

  if (hintRows.length) {
    const { error: hintsError } = await admin.from("question_hints").upsert(hintRows, { onConflict: "question_id,level" });
    if (hintsError) return NextResponse.json({ error: hintsError.message }, { status: 500 });
  }

  if (relationshipRows.length) {
    const { error: relationshipsError } = await admin
      .from("question_relationships")
      .upsert(relationshipRows, { onConflict: "source_question_id,relationship_type,target_question_id" });
    if (relationshipsError) return NextResponse.json({ error: relationshipsError.message }, { status: 500 });
  }

  return NextResponse.json({
    contentVersionId,
    publishedQuestions: catalogRows.length,
    publishedHints: hintRows.length,
    publishedRelationships: relationshipRows.length,
    skippedRelationships,
    warnings,
  });
}
