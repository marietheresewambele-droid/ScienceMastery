-- ScienceMastery deterministic adaptive learning engine.
-- Approved curriculum content is readable by everyone; student evidence is private.

create table if not exists public.content_versions (
  id text primary key,
  subject text not null check (subject in ('biology', 'chemistry', 'physics')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.question_catalog (
  id text primary key,
  content_version_id text not null references public.content_versions(id),
  subject text not null check (subject in ('biology', 'chemistry', 'physics')),
  topic_slug text not null,
  topic text,
  subtopic text not null,
  family_id text not null,
  question text not null,
  model_answer text not null,
  marking_points jsonb not null default '[]'::jsonb,
  marks smallint not null check (marks > 0),
  assessment_objective text not null,
  command_word text,
  tier text,
  grade_demand text,
  specification_reference text,
  initial_retrieval_days smallint not null default 7 check (initial_retrieval_days > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.question_hints (
  id text primary key,
  question_id text not null references public.question_catalog(id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  hint text not null,
  support_type text not null check (support_type in ('structure', 'guided', 'strong_scaffold')),
  unique (question_id, level)
);

create table if not exists public.question_relationships (
  source_question_id text not null references public.question_catalog(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('prerequisite', 'diagnostic', 'easier', 'parallel', 'harder')),
  target_question_id text not null references public.question_catalog(id) on delete cascade,
  rationale text,
  primary key (source_question_id, relationship_type, target_question_id),
  check (source_question_id <> target_question_id)
);

create table if not exists public.misconceptions (
  id text primary key,
  label text not null,
  description text not null,
  intervention text not null
);

create table if not exists public.question_misconceptions (
  question_id text not null references public.question_catalog(id) on delete cascade,
  misconception_id text not null references public.misconceptions(id) on delete cascade,
  primary key (question_id, misconception_id)
);

create table if not exists public.student_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.question_catalog(id),
  content_version_id text not null references public.content_versions(id),
  session_id uuid,
  mode text not null check (mode in ('adaptive', 'mixed', 'flashcards', 'exam', 'bookmarks', 'due')),
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  outcome text not null check (outcome in ('incorrect', 'supported_correct', 'independent_correct')),
  hints_used smallint not null default 0 check (hints_used between 0 and 3),
  answer_revealed boolean not null default false,
  response_time_ms integer check (response_time_ms is null or response_time_ms >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.student_question_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.question_catalog(id) on delete cascade,
  mastery_status text not null default 'unseen' check (mastery_status in ('unseen', 'developing', 'supported', 'secure')),
  independent_successes smallint not null default 0,
  supported_successes smallint not null default 0,
  incorrect_attempts smallint not null default 0,
  last_rating text check (last_rating is null or last_rating in ('again', 'hard', 'good', 'easy')),
  last_attempted_at timestamptz,
  due_at timestamptz,
  interval_days smallint not null default 0,
  consecutive_independent_successes smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.student_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.question_catalog(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists question_catalog_selection_idx on public.question_catalog(subject, topic_slug, subtopic, active);
create index if not exists question_catalog_family_idx on public.question_catalog(family_id);
create index if not exists attempts_user_created_idx on public.student_attempts(user_id, created_at desc);
create index if not exists attempts_user_question_idx on public.student_attempts(user_id, question_id);
create index if not exists state_user_due_idx on public.student_question_state(user_id, due_at);
create index if not exists bookmarks_user_idx on public.student_bookmarks(user_id);

alter table public.content_versions enable row level security;
alter table public.question_catalog enable row level security;
alter table public.question_hints enable row level security;
alter table public.question_relationships enable row level security;
alter table public.misconceptions enable row level security;
alter table public.question_misconceptions enable row level security;
alter table public.student_attempts enable row level security;
alter table public.student_question_state enable row level security;
alter table public.student_bookmarks enable row level security;

revoke all on table public.content_versions, public.question_catalog, public.question_hints,
  public.question_relationships, public.misconceptions, public.question_misconceptions,
  public.student_attempts, public.student_question_state, public.student_bookmarks
  from anon, authenticated;

grant select on table public.content_versions, public.question_catalog, public.question_hints,
  public.question_relationships, public.misconceptions, public.question_misconceptions to anon, authenticated;
grant select, insert on table public.student_attempts to authenticated;
grant select, insert, update on table public.student_question_state to authenticated;
grant select, insert, delete on table public.student_bookmarks to authenticated;
grant usage, select on sequence public.student_attempts_id_seq to authenticated;

create policy "published content versions are readable" on public.content_versions for select to anon, authenticated
  using (status = 'published');
create policy "active questions are readable" on public.question_catalog for select to anon, authenticated
  using (active and exists (select 1 from public.content_versions v where v.id = content_version_id and v.status = 'published'));
create policy "hints for active questions are readable" on public.question_hints for select to anon, authenticated
  using (exists (select 1 from public.question_catalog q where q.id = question_id and q.active));
create policy "relationships for active questions are readable" on public.question_relationships for select to anon, authenticated
  using (exists (select 1 from public.question_catalog q where q.id = source_question_id and q.active));
create policy "misconception definitions are readable" on public.misconceptions for select to anon, authenticated using (true);
create policy "question misconception links are readable" on public.question_misconceptions for select to anon, authenticated using (true);

create policy "students read own attempts" on public.student_attempts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "students create own attempts" on public.student_attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "students read own question state" on public.student_question_state for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "students create own question state" on public.student_question_state for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "students update own question state" on public.student_question_state for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "students read own bookmarks" on public.student_bookmarks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "students create own bookmarks" on public.student_bookmarks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "students delete own bookmarks" on public.student_bookmarks for delete to authenticated
  using ((select auth.uid()) = user_id);

