-- Difficulty is a separate field from tier: Core / Standard / Stretch (nullable until an admin sets it).
alter table public.question_catalog
  add column if not exists difficulty text check (difficulty in ('Core', 'Standard', 'Stretch'));

-- Append the new column to the read model (new columns must come last in a replaced view).
create or replace view public.question_bank with (security_invoker = true) as
select
  q.id,
  q.legacy_id,
  s.id as subject,
  t.id as topic_id,
  t.number as topic_number,
  t.name as topic,
  t.slug as topic_slug,
  st.id as subtopic_id,
  st.name as subtopic,
  st.sort_order as subtopic_order,
  q.specification_reference,
  q.question,
  q.model_answer,
  q.marks,
  q.assessment_objective,
  q.qualification,
  q.tier,
  q.grade,
  q.question_type,
  q.key_terms,
  q.source_notes,
  q.sort_order,
  q.active,
  q.created_at,
  q.updated_at,
  q.difficulty
from public.question_catalog q
join public.subtopics st on st.id = q.subtopic_id
join public.topics t on t.id = st.topic_id
join public.subjects s on s.id = t.subject_id;
