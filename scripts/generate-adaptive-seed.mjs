import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "supabase", "seed-adaptive-content.sql");
const configs = [
  { subject: "biology", prefix: "BIO", version: "BIO-2026.1" },
  { subject: "chemistry", prefix: "CHE", version: "CHE-2026.1" },
  { subject: "physics", prefix: "PHY", version: "PHY-2026.1" },
];
const q = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${q(JSON.stringify(value ?? []))}::jsonb`;
const command = (question) => question.commandWord || String(question.question || "").trim().split(/\s+/)[0].replace(/[^A-Za-z]/g, "") || "Answer";
const rank = (question) => (String(question.assessmentObjective).includes("AO3") ? 30 : String(question.assessmentObjective).includes("AO2") ? 20 : 10) + Number(question.marks || 1);
const retrieval = (question) => String(question.assessmentObjective).includes("AO3") ? 2 : String(question.assessmentObjective).includes("AO2") ? 3 : 7;

const records = [];
for (const config of configs) {
  const dir = path.join(root, "src", "data", config.subject);
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith("-questions.json"))) {
    const topicSlug = file.replace(/-questions\.json$/, "");
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    for (const item of data.questions || []) records.push({ ...item, ...config, topicSlug, catalogId: `${config.prefix}-${topicSlug}-${item.id}` });
  }
}

const duplicateIds = records.filter((item, index) => records.findIndex((other) => other.catalogId === item.catalogId) !== index);
if (duplicateIds.length) throw new Error(`Duplicate catalog IDs: ${duplicateIds.map((item) => item.catalogId).join(", ")}`);

const families = new Map();
for (const item of records) {
  item.familyId = `${item.prefix}-F-${Buffer.from(`${item.topicSlug}:${item.questionFamily || item.subtopic}:${command(item)}`).toString("hex").slice(0, 28)}`;
  const list = families.get(item.familyId) || [];
  list.push(item);
  families.set(item.familyId, list);
}

const lines = [
  "begin;",
  "insert into public.content_versions (id, subject, status, published_at) values",
  ...configs.map((c, index) => `  (${q(c.version)}, ${q(c.subject)}, 'published', now())${index === configs.length - 1 ? "" : ","}`),
  "on conflict (id) do update set status = excluded.status, published_at = excluded.published_at;",
  "insert into public.misconceptions (id, label, description, intervention) values",
  "  ('ERR-COMMAND','Command word not followed','The response does not match the task set by the command word.','Show the answer structure hint, then retest.'),",
  "  ('ERR-AO1-TERM','Scientific term missing','Required scientific vocabulary is absent or inaccurate.','Retrieve the definition, then use it in context.'),",
  "  ('ERR-AO2-CONTEXT','Knowledge not applied','Relevant knowledge is recalled but not connected to the context.','Prompt the student to link each fact to the scenario.'),",
  "  ('ERR-AO3','Analysis or evaluation incomplete','Evidence, reasoning or judgement is incomplete.','Separate evidence, reasoning and conclusion before retesting.'),",
  "  ('ERR-INCOMPLETE','Insufficient marking points','The response contains fewer valid ideas than the mark demand.','Plan one distinct idea per available mark.')",
  "on conflict (id) do update set label=excluded.label, description=excluded.description, intervention=excluded.intervention;",
];

for (const item of records) {
  const model = item.modelAnswer || (item.markingPoints || []).join(" ");
  lines.push(`insert into public.question_catalog (id,content_version_id,subject,topic_slug,topic,subtopic,family_id,question,model_answer,marking_points,marks,assessment_objective,command_word,tier,grade_demand,specification_reference,initial_retrieval_days,active) values (${q(item.catalogId)},${q(item.version)},${q(item.subject)},${q(item.topicSlug)},${q(item.topic || item.topicSlug)},${q(item.subtopic || item.sourceSubtopic || "General")},${q(item.familyId)},${q(item.question)},${q(model)},${json(item.markingPoints)},${Number(item.marks || 1)},${q(item.assessmentObjective || "AO1")},${q(command(item))},${q(item.tier || "Both")},${q(item.gradeDemand)},${q(item.specificationReference)},${retrieval(item)},true) on conflict (id) do update set question=excluded.question, model_answer=excluded.model_answer, marking_points=excluded.marking_points, active=true;`);
  const hints = [
    [`${command(item)}: plan ${item.marks} distinct marking point${item.marks === 1 ? "" : "s"}. Use the scientific terms in the question.`, "structure"],
    [`Focus on ${item.subtopic || "the named concept"}. State the relevant scientific idea, then apply it directly to this situation.`, "guided"],
    [(item.markingPoints || []).length ? `Begin with this approved marking point, then complete the explanation yourself: ${item.markingPoints[0]}` : `Use the exact scientific term needed for this ${item.assessmentObjective || "AO1"} question.`, "strong_scaffold"],
  ];
  hints.forEach(([hint, type], i) => lines.push(`insert into public.question_hints (id,question_id,level,hint,support_type) values (${q(`${item.catalogId}-H${i + 1}`)},${q(item.catalogId)},${i + 1},${q(hint)},${q(type)}) on conflict (question_id,level) do update set hint=excluded.hint,support_type=excluded.support_type;`));
  const errors = ["ERR-COMMAND", "ERR-INCOMPLETE", String(item.assessmentObjective).includes("AO3") ? "ERR-AO3" : String(item.assessmentObjective).includes("AO2") ? "ERR-AO2-CONTEXT" : "ERR-AO1-TERM"];
  errors.forEach((id) => lines.push(`insert into public.question_misconceptions (question_id,misconception_id) values (${q(item.catalogId)},${q(id)}) on conflict do nothing;`));
}

for (const item of records) {
  const pool = (families.get(item.familyId) || []).filter((other) => other.catalogId !== item.catalogId);
  if (!pool.length) continue;
  const current = rank(item);
  const sorted = [...pool].sort((a, b) => rank(a) - rank(b));
  const choices = {
    diagnostic: sorted[0],
    prerequisite: sorted.find((candidate) => String(candidate.assessmentObjective).includes("AO1")) || sorted[0],
    easier: [...sorted].reverse().find((candidate) => rank(candidate) < current),
    parallel: [...pool].sort((a, b) => Math.abs(rank(a) - current) - Math.abs(rank(b) - current))[0],
    harder: sorted.find((candidate) => rank(candidate) > current),
  };
  for (const [type, target] of Object.entries(choices)) if (target) lines.push(`insert into public.question_relationships (source_question_id,relationship_type,target_question_id,rationale) values (${q(item.catalogId)},${q(type)},${q(target.catalogId)},'Auto-mapped within the approved question family; author review required before public routing.') on conflict do nothing;`);
}
lines.push("commit;");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${lines.join("\n")}\n`);
console.log(`Generated ${output} with ${records.length} questions.`);
