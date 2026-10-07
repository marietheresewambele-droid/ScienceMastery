-- Subject -> Topic -> Subtopic -> Question hierarchy for the BrainSoma standard workbooks
-- (one sheet per topic, columns: Question ID, Legacy ID, Subject, Unit, Topic, Subtopic,
-- Specification Reference, Question, Model Answer, Marks (1–6), Assessment Objective,
-- Qualification, Tier, Grade, Question Type, Key Terms, Source / Notes).
--
-- This migration REPLACES the flat question_catalog and RESETS all student progress:
-- question IDs change to the canonical BIO/CHEM/PHYS-Tnn-Qnnn form, so old attempts,
-- question state and bookmarks can no longer be matched to a question.
-- Hints are no longer stored: the client builds them from key_terms + model_answer.

begin;

-- 1. Reset student progress (explicitly agreed) and drop the old content model.
truncate table public.student_attempts, public.student_question_state, public.student_bookmarks;

drop table if exists public.question_misconceptions cascade;
drop table if exists public.misconceptions cascade;
drop table if exists public.question_relationships cascade;
drop table if exists public.question_hints cascade;
drop table if exists public.question_catalog cascade;
drop table if exists public.content_versions cascade;
-- The "Website Upload" table was never read by the site; the hierarchy below supersedes it.
drop function if exists public.upsert_website_questions(jsonb);
drop table if exists public.questions cascade;
drop function if exists public.set_questions_updated_at();

alter table public.student_attempts drop column if exists content_version_id;

-- 2. Hierarchy.
create table public.subjects (
  id text primary key check (id in ('biology', 'chemistry', 'physics')),
  code text not null unique check (code in ('BIO', 'CHEM', 'PHYS')),
  name text not null,
  sort_order smallint not null
);

create table public.topics (
  id text primary key,                         -- e.g. CHEM-T01
  subject_id text not null references public.subjects(id) on delete cascade,
  number smallint not null check (number > 0), -- the workbook "Unit" (T1 -> 1)
  name text not null,
  slug text not null,                          -- matches the site route /<subject>/<slug>
  sort_order smallint not null,
  unique (subject_id, number),
  unique (subject_id, slug)
);

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null references public.topics(id) on delete cascade,
  name text not null,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  unique (topic_id, name)
);

create table public.question_catalog (
  id text primary key check (id ~ '^(BIO|CHEM|PHYS)-T[0-9]{2}-Q[0-9]{3,}$'),
  legacy_id text,
  subtopic_id uuid not null references public.subtopics(id) on delete restrict,
  specification_reference text,
  question text not null,
  model_answer text not null,
  marks smallint not null check (marks between 1 and 6),
  assessment_objective text not null check (assessment_objective in ('AO1', 'AO2', 'AO3')),
  qualification text not null check (qualification in ('Combined and Separate Science', 'Separate Science only')),
  tier text not null check (tier in ('Foundation and Higher', 'Foundation only', 'Higher only')),
  grade text,
  question_type text,
  key_terms text[] not null default '{}',
  source_notes text,
  sort_order integer not null default 0,      -- row order within its topic sheet
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index question_catalog_subtopic_idx on public.question_catalog(subtopic_id, active);
create index topics_subject_idx on public.topics(subject_id, sort_order);
create index subtopics_topic_idx on public.subtopics(topic_id, sort_order);

create or replace function public.set_question_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger question_catalog_set_updated_at
  before update on public.question_catalog
  for each row
  execute function public.set_question_catalog_updated_at();

-- 3. Student tables point at the new catalog. Attempts deliberately do not cascade, so
-- retiring a question (active = false) never erases a student's history.
alter table public.student_attempts
  add constraint student_attempts_question_id_fkey foreign key (question_id) references public.question_catalog(id);
alter table public.student_question_state
  add constraint student_question_state_question_id_fkey foreign key (question_id) references public.question_catalog(id) on delete cascade;
alter table public.student_bookmarks
  add constraint student_bookmarks_question_id_fkey foreign key (question_id) references public.question_catalog(id) on delete cascade;

-- 4. One flat, ordered read model for the site and the admin list.
create view public.question_bank with (security_invoker = true) as
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
  q.updated_at
from public.question_catalog q
join public.subtopics st on st.id = q.subtopic_id
join public.topics t on t.id = st.topic_id
join public.subjects s on s.id = t.subject_id;

-- 5. Seed the fixed AQA subjects and topics. Slugs match the existing site routes.
insert into public.subjects (id, code, name, sort_order) values
  ('biology', 'BIO', 'Biology', 1),
  ('chemistry', 'CHEM', 'Chemistry', 2),
  ('physics', 'PHYS', 'Physics', 3);

insert into public.topics (id, subject_id, number, name, slug, sort_order) values
  ('BIO-T01', 'biology', 1, 'Cell Biology', 'cell-biology', 1),
  ('BIO-T02', 'biology', 2, 'Organisation', 'organisation', 2),
  ('BIO-T03', 'biology', 3, 'Infection and Response', 'infection-and-response', 3),
  ('BIO-T04', 'biology', 4, 'Bioenergetics', 'bioenergetics', 4),
  ('BIO-T05', 'biology', 5, 'Homeostasis and Response', 'homeostasis-and-response', 5),
  ('BIO-T06', 'biology', 6, 'Inheritance, Variation and Evolution', 'inheritance-variation-and-evolution', 6),
  ('BIO-T07', 'biology', 7, 'Ecology', 'ecology', 7),
  ('CHEM-T01', 'chemistry', 1, 'Atomic Structure and the Periodic Table', 'atomic-structure-and-the-periodic-table', 1),
  ('CHEM-T02', 'chemistry', 2, 'Bonding, Structure and Properties of Matter', 'bonding-structure-and-properties-of-matter', 2),
  ('CHEM-T03', 'chemistry', 3, 'Quantitative Chemistry', 'quantitative-chemistry', 3),
  ('CHEM-T04', 'chemistry', 4, 'Chemical Changes', 'chemical-changes', 4),
  ('CHEM-T05', 'chemistry', 5, 'Energy Changes', 'energy-changes', 5),
  ('CHEM-T06', 'chemistry', 6, 'Rate and Extent of Chemical Change', 'rate-and-extent-of-chemical-change', 6),
  ('CHEM-T07', 'chemistry', 7, 'Organic Chemistry', 'organic-chemistry', 7),
  ('CHEM-T08', 'chemistry', 8, 'Chemical Analysis', 'chemical-analysis', 8),
  ('CHEM-T09', 'chemistry', 9, 'Chemistry of the Atmosphere', 'chemistry-of-the-atmosphere', 9),
  ('CHEM-T10', 'chemistry', 10, 'Using Resources', 'using-resources', 10),
  ('PHYS-T01', 'physics', 1, 'Energy', 'energy', 1),
  ('PHYS-T02', 'physics', 2, 'Electricity', 'electricity', 2),
  ('PHYS-T03', 'physics', 3, 'Particle Model of Matter', 'particle-model-of-matter', 3),
  ('PHYS-T04', 'physics', 4, 'Atomic Structure', 'atomic-structure', 4),
  ('PHYS-T05', 'physics', 5, 'Forces', 'forces', 5),
  ('PHYS-T06', 'physics', 6, 'Waves', 'waves', 6),
  ('PHYS-T07', 'physics', 7, 'Magnetism and Electromagnetism', 'magnetism-and-electromagnetism', 7),
  ('PHYS-T08', 'physics', 8, 'Space Physics', 'space-physics', 8);

-- 6. Access. Everyone may read the hierarchy and active questions; only the service-role
-- admin API (src/lib/supabase-admin.ts) writes content.
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.question_catalog enable row level security;

revoke all on table public.subjects, public.topics, public.subtopics, public.question_catalog, public.question_bank
  from anon, authenticated;
grant select on table public.subjects, public.topics, public.subtopics, public.question_catalog, public.question_bank
  to anon, authenticated;
grant select, insert, update, delete on table public.subjects, public.topics, public.subtopics, public.question_catalog
  to service_role;
grant select on table public.question_bank to service_role;

create policy "subjects are readable" on public.subjects for select to anon, authenticated using (true);
create policy "topics are readable" on public.topics for select to anon, authenticated using (true);
create policy "subtopics are readable" on public.subtopics for select to anon, authenticated using (true);
create policy "active questions are readable" on public.question_catalog for select to anon, authenticated
  using (active);

commit;
