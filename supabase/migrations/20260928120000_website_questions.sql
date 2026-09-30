-- BrainSoma website question bank, imported via the admin Excel importer.
-- Students may only read published rows; all writes go through the service-role
-- admin API (src/lib/supabase-admin.ts), never through the anon/authenticated roles.

create table if not exists public.questions (
  question_id text primary key,
  subject text not null check (lower(subject) in ('biology', 'chemistry', 'physics')),
  unit text not null,
  topic text not null,
  subtopic text not null,
  specification_reference text not null,
  question text not null,
  model_answer text not null,
  marks smallint not null check (marks between 1 and 6),
  assessment_objective text not null check (assessment_objective in ('AO1', 'AO2', 'AO3')),
  tier text not null check (tier in ('Foundation', 'Higher', 'Both')),
  grade text not null,
  key_terms text not null default '',
  image_file text not null default '',
  question_type text not null check (question_type in ('Short answer', 'Multiple choice', 'Calculation', 'Extended response')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_subject_topic_idx on public.questions(subject, unit, topic, subtopic);
create index if not exists questions_published_idx on public.questions(is_published, subject, topic);

-- Keep updated_at accurate regardless of which columns an upsert touches.
create or replace function public.set_questions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
  before update on public.questions
  for each row
  execute function public.set_questions_updated_at();

alter table public.questions enable row level security;

-- No table-level grants for anon/authenticated beyond select: students can never
-- insert, update or delete rows even if a policy were misconfigured later.
revoke all on table public.questions from anon, authenticated;
grant select on table public.questions to anon, authenticated;
grant select, insert, update, delete on table public.questions to service_role;

create policy "published questions are readable" on public.questions for select to anon, authenticated
  using (is_published = true);

-- No insert/update/delete policies exist for anon/authenticated: only the
-- service-role key (used exclusively by server-only admin API routes) can write.

-- Update content columns only on conflict so an import cannot silently unpublish
-- an already-published question. New rows use the column default (unpublished).
create or replace function public.upsert_website_questions(p_rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  affected integer;
begin
  insert into public.questions (
    question_id, subject, unit, topic, subtopic, specification_reference,
    question, model_answer, marks, assessment_objective, tier, grade,
    key_terms, image_file, question_type
  )
  select
    row_data.question_id, row_data.subject, row_data.unit, row_data.topic,
    row_data.subtopic, row_data.specification_reference, row_data.question,
    row_data.model_answer, row_data.marks, row_data.assessment_objective,
    row_data.tier, row_data.grade, row_data.key_terms, row_data.image_file,
    row_data.question_type
  from jsonb_to_recordset(p_rows) as row_data(
    question_id text, subject text, unit text, topic text, subtopic text,
    specification_reference text, question text, model_answer text,
    marks smallint, assessment_objective text, tier text, grade text,
    key_terms text, image_file text, question_type text
  )
  on conflict (question_id) do update set
    subject = excluded.subject,
    unit = excluded.unit,
    topic = excluded.topic,
    subtopic = excluded.subtopic,
    specification_reference = excluded.specification_reference,
    question = excluded.question,
    model_answer = excluded.model_answer,
    marks = excluded.marks,
    assessment_objective = excluded.assessment_objective,
    tier = excluded.tier,
    grade = excluded.grade,
    key_terms = excluded.key_terms,
    image_file = excluded.image_file,
    question_type = excluded.question_type;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.upsert_website_questions(jsonb) from public, anon, authenticated;
grant execute on function public.upsert_website_questions(jsonb) to service_role;
