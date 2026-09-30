-- Supabase-managed administrator allowlist. Add approved auth.users IDs here
-- from the Supabase SQL editor; never grant table access to browser roles.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;
grant select, insert, update, delete on table public.admin_users to service_role;

-- No anon/authenticated policies are intentionally defined. The server-only
-- service-role client checks membership after validating the caller's JWT.
