-- DEMO DATA for /admin/analytics. Run manually in the Supabase SQL editor; not a migration.
-- Creates 25 fake students (seed-student-N@seed.invalid) with attempts, question state and bookmarks
-- against up to 60 random active questions. Some questions are "harder" (deterministically, by id)
-- so hint use and incorrect answers cluster realistically.
--
-- REMOVE IT AGAIN with:
--   delete from auth.users where email like '%@seed.invalid';
-- (attempts, question state and bookmarks cascade-delete with the user.)

do $$
declare
  ids text[];
  uid uuid;
  created timestamptz;
  qid text;
  d numeric;
  hints int;
  v_rating text;
  v_outcome text;
  i int;
  j int;
begin
  if exists (select 1 from auth.users where email like '%@seed.invalid') then
    raise exception 'Demo data already exists. Remove it first: delete from auth.users where email like ''%%@seed.invalid'';';
  end if;

  select array_agg(id) into ids
  from (select id from public.question_catalog where active order by random() limit 60) s;
  if ids is null then raise exception 'No active questions in question_catalog - import questions first.'; end if;

  for i in 1..25 loop
    uid := gen_random_uuid();
    created := now() - (random() * interval '40 days');

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'seed-student-' || i || '@seed.invalid', '', created,
      '{"provider":"email","providers":["email"]}', '{}', created, created
    );

    -- Every 5th student signed up but never practised.
    if i % 5 = 0 then continue; end if;

    for j in 1..(15 + floor(random() * 70))::int loop
      -- Skewed pick: low indexes are chosen far more often.
      qid := ids[1 + floor(power(random(), 2) * cardinality(ids))::int];
      d := (abs(hashtext(qid)) % 100) / 100.0;

      if random() < 0.10 + 0.60 * d then
        v_rating := 'again'; v_outcome := 'incorrect';
        hints := case when random() < 0.5 then 1 + floor(random() * 3)::int else 0 end;
      else
        hints := case when random() < 0.15 + 0.50 * d then 1 + floor(random() * 3)::int else 0 end;
        if hints > 0 then v_rating := 'hard'; v_outcome := 'supported_correct';
        else v_rating := case when random() < 0.4 then 'easy' else 'good' end; v_outcome := 'independent_correct';
        end if;
      end if;

      insert into public.student_attempts (user_id, question_id, mode, rating, outcome, hints_used, answer_revealed, response_time_ms, created_at)
      values (
        uid, qid,
        (array['adaptive','mixed','flashcards','exam','bookmarks','due'])[1 + floor(random() * 6)::int],
        v_rating, v_outcome, hints, random() < 0.3,
        5000 + floor(random() * 85000)::int,
        created + random() * (now() - created)
      );
    end loop;

    -- Per-question state derived from the attempts just created.
    insert into public.student_question_state (user_id, question_id, mastery_status, independent_successes, supported_successes, incorrect_attempts, last_attempted_at)
    select user_id, question_id,
      case when count(*) filter (where outcome = 'independent_correct') >= 2 then 'secure'
           when count(*) filter (where outcome = 'supported_correct') > 0
                and count(*) filter (where outcome = 'independent_correct') = 0 then 'supported'
           else 'developing' end,
      count(*) filter (where outcome = 'independent_correct'),
      count(*) filter (where outcome = 'supported_correct'),
      count(*) filter (where outcome = 'incorrect'),
      max(created_at)
    from public.student_attempts where user_id = uid group by user_id, question_id;

    -- 3-8 bookmarks, biased towards the popular questions.
    for j in 1..(3 + floor(random() * 6))::int loop
      insert into public.student_bookmarks (user_id, question_id)
      values (uid, ids[1 + floor(power(random(), 2) * cardinality(ids))::int])
      on conflict do nothing;
    end loop;
  end loop;
end $$;
