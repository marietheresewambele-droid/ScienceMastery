-- Aggregate student-learning analytics for the admin dashboard (/admin/analytics).
-- Returns one jsonb document of aggregates only - no emails or per-student rows - and is
-- callable solely by the server-only service-role client after requireAdmin() passes.
-- Active admins are excluded so their own testing does not skew student numbers.

create or replace function public.admin_student_analytics(p_top integer default 15)
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
with
top_n as (select greatest(1, least(coalesce(p_top, 15), 50)) as n),
students as (
  select u.id, u.created_at
  from auth.users u
  where not exists (select 1 from public.admin_users au where au.user_id = u.id and au.active)
),
att as (
  select a.* from public.student_attempts a join students s on s.id = a.user_id
),
bank as (
  select id, question, subject, topic, subtopic, assessment_objective, marks from public.question_bank
),
q_stats as (
  select
    question_id,
    count(*) as attempts,
    count(distinct user_id) as students,
    count(*) filter (where outcome = 'incorrect') as incorrect,
    count(*) filter (where hints_used > 0) as hinted,
    coalesce(sum(hints_used), 0) as hints_total,
    count(*) filter (where answer_revealed) as revealed
  from att
  group by question_id
),
bm as (
  select b.question_id, count(*) as bookmarks
  from public.student_bookmarks b join students s on s.id = b.user_id
  group by b.question_id
)
select jsonb_build_object(
  'generatedAt', now(),

  'accounts', (
    select jsonb_build_object(
      'total', count(*),
      'new7d', count(*) filter (where created_at > now() - interval '7 days'),
      'new30d', count(*) filter (where created_at > now() - interval '30 days'),
      'withAttempts', (select count(distinct user_id) from att),
      'active7d', (select count(distinct user_id) from att where created_at > now() - interval '7 days'),
      'active30d', (select count(distinct user_id) from att where created_at > now() - interval '30 days'),
      'withBookmarks', (select count(distinct b.user_id) from public.student_bookmarks b join students s on s.id = b.user_id)
    ) from students
  ),

  'attempts', (
    select jsonb_build_object(
      'total', count(*),
      'last7d', count(*) filter (where created_at > now() - interval '7 days'),
      'independentCorrect', count(*) filter (where outcome = 'independent_correct'),
      'supportedCorrect', count(*) filter (where outcome = 'supported_correct'),
      'incorrect', count(*) filter (where outcome = 'incorrect'),
      'withHints', count(*) filter (where hints_used > 0),
      'answerRevealed', count(*) filter (where answer_revealed),
      'avgResponseSeconds', round((avg(response_time_ms) filter (where response_time_ms < 600000) / 1000.0)::numeric, 1),
      'questionsAttempted', count(distinct question_id)
    ) from att
  ),

  'hintLevels', (
    select coalesce(jsonb_agg(jsonb_build_object('hints', h.hints, 'attempts', coalesce(c.n, 0)) order by h.hints), '[]'::jsonb)
    from generate_series(0, 3) as h(hints)
    left join (select hints_used, count(*) as n from att group by hints_used) c on c.hints_used = h.hints
  ),

  'ratings', (
    select coalesce(jsonb_agg(jsonb_build_object('rating', r.rating, 'attempts', coalesce(c.n, 0)) order by r.ord), '[]'::jsonb)
    from (values ('again', 1), ('hard', 2), ('good', 3), ('easy', 4)) as r(rating, ord)
    left join (select rating, count(*) as n from att group by rating) c on c.rating = r.rating
  ),

  'modes', (
    select coalesce(jsonb_agg(jsonb_build_object('mode', mode, 'attempts', n) order by n desc), '[]'::jsonb)
    from (select mode, count(*) as n from att group by mode) m
  ),

  'mastery', (
    select coalesce(jsonb_agg(jsonb_build_object('status', status, 'count', n) order by n desc), '[]'::jsonb)
    from (
      select s.mastery_status as status, count(*) as n
      from public.student_question_state s join students st on st.id = s.user_id
      group by s.mastery_status
    ) m
  ),

  'daily', (
    select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'attempts', coalesce(c.attempts, 0), 'students', coalesce(c.students, 0), 'signups', coalesce(su.n, 0)) order by d.day), '[]'::jsonb)
    from generate_series(current_date - 29, current_date, interval '1 day') as d(day)
    left join (
      select created_at::date as day, count(*) as attempts, count(distinct user_id) as students from att group by 1
    ) c on c.day = d.day::date
    left join (
      select created_at::date as day, count(*) as n from students group by 1
    ) su on su.day = d.day::date
  ),

  'byAssessmentObjective', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'ao', ao, 'attempts', attempts, 'incorrect', incorrect, 'hinted', hinted) order by ao), '[]'::jsonb)
    from (
      select b.assessment_objective as ao, sum(q.attempts) as attempts, sum(q.incorrect) as incorrect, sum(q.hinted) as hinted
      from q_stats q join bank b on b.id = q.question_id group by b.assessment_objective
    ) x
  ),

  'byTopic', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'subject', subject, 'topic', topic, 'attempts', attempts, 'students', students,
      'incorrect', incorrect, 'hinted', hinted, 'questionsAttempted', questions
    ) order by attempts desc), '[]'::jsonb)
    from (
      select b.subject, b.topic, sum(q.attempts) as attempts, sum(q.incorrect) as incorrect,
             sum(q.hinted) as hinted, count(*) as questions,
             (select count(distinct a.user_id) from att a join bank b2 on b2.id = a.question_id
               where b2.subject = b.subject and b2.topic = b.topic) as students
      from q_stats q join bank b on b.id = q.question_id
      group by b.subject, b.topic
    ) x
  ),

  'topHinted', (
    select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) from (
      select b.id, b.question, b.subject, b.topic, b.subtopic, q.attempts, q.students, q.hinted,
             q.hints_total as "hintsTotal", q.revealed
      from q_stats q join bank b on b.id = q.question_id
      where q.hinted > 0
      order by q.hinted desc, q.hinted::numeric / q.attempts desc, q.attempts desc
      limit (select n from top_n)
    ) x
  ),

  'topIncorrect', (
    select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) from (
      select b.id, b.question, b.subject, b.topic, b.subtopic, q.attempts, q.students, q.incorrect
      from q_stats q join bank b on b.id = q.question_id
      where q.incorrect > 0
      order by q.incorrect desc, q.incorrect::numeric / q.attempts desc, q.attempts desc
      limit (select n from top_n)
    ) x
  ),

  'topBookmarked', (
    select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) from (
      select b.id, b.question, b.subject, b.topic, b.subtopic, m.bookmarks
      from bm m join bank b on b.id = m.question_id
      order by m.bookmarks desc, b.id
      limit (select n from top_n)
    ) x
  )
);
$$;

revoke all on function public.admin_student_analytics(integer) from public, anon, authenticated;
grant execute on function public.admin_student_analytics(integer) to service_role;
