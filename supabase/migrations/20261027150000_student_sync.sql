-- Per-student copy of the progress the site keeps in the browser (courses, review schedules, bookmarks,
-- completed questions, exam calendar, daily activity) so it follows the student across devices.
create table if not exists public.student_sync (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (char_length(key) <= 200),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.student_sync enable row level security;

drop policy if exists "Students read their own sync data" on public.student_sync;
drop policy if exists "Students insert their own sync data" on public.student_sync;
drop policy if exists "Students update their own sync data" on public.student_sync;
drop policy if exists "Students delete their own sync data" on public.student_sync;

create policy "Students read their own sync data" on public.student_sync for select to authenticated using (auth.uid() = user_id);
create policy "Students insert their own sync data" on public.student_sync for insert to authenticated with check (auth.uid() = user_id);
create policy "Students update their own sync data" on public.student_sync for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Students delete their own sync data" on public.student_sync for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.student_sync to authenticated;
