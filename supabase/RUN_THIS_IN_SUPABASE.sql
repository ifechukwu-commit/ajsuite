-- ============================================================
-- AJ SUITE — RUN THIS ENTIRE FILE ONCE IN SUPABASE SQL EDITOR
-- (Settings -> SQL Editor -> paste this whole file -> Run)
--
-- Do NOT run schema.sql — that is the original historical setup
-- file from when the project first started and has already been
-- applied. Running it again causes "relation already exists"
-- errors. This file only contains what is NEW and not yet run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fix team invite permission denied (re-run, was never
--    applied successfully on production before).
-- ------------------------------------------------------------
drop policy if exists "Owners manage their own invites" on public.team_invites;
create policy "Owners manage their own invites" on public.team_invites
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- 2. New columns: case fields, team invite name/role, claim
--    onboarding fields, review popup tracking.
-- ------------------------------------------------------------
alter table public.cases
  add column if not exists case_number text,
  add column if not exists opposing_party text,
  add column if not exists court text,
  add column if not exists judge text;

alter table public.team_invites
  add column if not exists name text,
  add column if not exists role text not null default 'member' check (role in ('owner', 'member'));

alter table public.users
  add column if not exists workspace_type text check (workspace_type in ('solo', 'chamber')),
  add column if not exists last_review_prompt_at timestamptz;

-- ------------------------------------------------------------
-- 3. App reviews table (star rating popup).
-- ------------------------------------------------------------
create table if not exists public.app_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

alter table public.app_reviews enable row level security;

drop policy if exists "Users submit their own reviews" on public.app_reviews;
create policy "Users submit their own reviews" on public.app_reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users see only their own reviews" on public.app_reviews;
create policy "Users see only their own reviews" on public.app_reviews
  for select using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. Signup trigger — final version. Handles: admin emails,
--    free-forever emails, invited members/co-owners with name
--    and role from the invite.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  invite record;
begin
  select * into invite from public.team_invites where email = new.email order by created_at desc limit 1;

  if invite.owner_id is not null then
    insert into public.users (id, email, full_name, plan, role, owner_id, trial_start)
    values (
      new.id,
      new.email,
      coalesce(invite.name, new.raw_user_meta_data->>'full_name', ''),
      'trial', -- irrelevant for members/co-owners; workspace status always reads from owner_id
      coalesce(invite.role, 'member'),
      invite.owner_id,
      now()
    );
    delete from public.team_invites where owner_id = invite.owner_id and email = new.email;
  else
    insert into public.users (id, email, full_name, plan, role, trial_start, paid_until)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      case
        when new.email in ('ajsuitesupport@gmail.com', 'ahia4.agent@gmail.com') then 'admin'
        when new.email in (
          'ajcasemanager46@gmail.com',
          'ifechukwudarlington.dev@gmail.com',
          'chiwetaluifechukwu@gmail.com'
        ) then 'solo'
        else 'trial'
      end,
      'owner',
      now(),
      null -- null paid_until = active forever for the free-forever emails; harmless null for everyone else
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 5. Backfill: fix the admin/free-forever split for accounts
--    that already exist from before this change.
-- ------------------------------------------------------------
update public.users
  set plan = 'admin'
  where email in ('ajsuitesupport@gmail.com', 'ahia4.agent@gmail.com');

update public.users
  set plan = 'solo', paid_until = null
  where email in (
    'ajcasemanager46@gmail.com',
    'ifechukwudarlington.dev@gmail.com',
    'chiwetaluifechukwu@gmail.com'
  );

-- ------------------------------------------------------------
-- 6. Backfill: the 3 emails gifted earlier through the old
--    "Workspace & Free Access" button were saved with the now
--    -deleted plan value 'paid'. Fix them to 'solo' so they show
--    up correctly everywhere (Overview, Manage Users, etc).
-- ------------------------------------------------------------
update public.users
  set plan = 'solo'
  where plan = 'paid';

-- ------------------------------------------------------------
-- 7. Login Logs + Activity Logs (super_admin sections).
-- ------------------------------------------------------------
create table if not exists public.login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email text not null,
  logged_in_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- Both tables are read only by the service role (admin pages) — never
-- directly by the browser. Activity logs can be written by the signed-in
-- user themselves (their own actions); login logs are written server-side
-- only, from the auth callback.
alter table public.login_logs enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "Users log their own activity" on public.activity_logs;
create policy "Users log their own activity" on public.activity_logs
  for insert with check (auth.uid() = user_id);
