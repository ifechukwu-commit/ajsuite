-- ============================================
-- AJ CASE MANAGER — MIGRATION 002
-- Access control, team workspaces, subscriptions,
-- tasks, notes. Run AFTER schema.sql, in the
-- Supabase SQL editor, on the LIVE project.
-- Additive only — does not touch existing rows
-- except the two data-normalization steps marked below.
-- ============================================

-- ============================================
-- 1. WORKSPACE FIELDS ON USERS
-- ============================================

alter table public.users
  add column if not exists role text not null default 'owner' check (role in ('owner','member')),
  add column if not exists owner_id uuid references public.users(id) on delete cascade,
  add column if not exists trial_claimed boolean not null default false,
  add column if not exists country text,
  add column if not exists state text,
  add column if not exists paid_until timestamptz,
  add column if not exists storage_used_bytes bigint not null default 0;

-- Anyone who already has a trial_start in the past (pre-existing users)
-- is treated as already claimed, so they aren't sent back to /claim.
update public.users set trial_claimed = true where trial_claimed = false and trial_start < now();

-- Collapse old solo/chamber split into a single flat-rate plan.
update public.users set plan = 'paid' where plan in ('solo','chamber');
alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check check (plan in ('trial','paid','admin'));

-- ============================================
-- 2. TEAM INVITES
-- Owner adds an email (Google-Drive style). The email
-- doesn't need to exist as a user yet. When that email
-- signs in for the first time, the trigger below attaches
-- them to this owner's workspace instead of giving them
-- their own trial.
-- ============================================

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade not null,
  email text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);

alter table public.team_invites enable row level security;

create policy "Owners manage their own invites" on public.team_invites
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================
-- 3. SUBSCRIPTIONS (Paystack records)
-- One active row per workspace. paid_until on users
-- is the field everything else reads from — this table
-- is the audit trail behind it.
-- ============================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade not null,
  paystack_reference text unique,
  amount integer not null default 850000, -- kobo. ₦8,500/month.
  status text not null default 'pending' check (status in ('pending','success','failed')),
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Owners read own subscriptions" on public.subscriptions
  for select using (auth.uid() = owner_id);

-- ============================================
-- 4. TASKS (new table — not in original schema)
-- ============================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null, -- workspace owner id
  title text not null,
  due_date date,
  priority text not null default 'Medium' check (priority in ('High','Medium','Low')),
  status text not null default 'Pending' check (status in ('Pending','Done')),
  assigned_to uuid references public.users(id),
  created_by uuid references public.users(id) not null,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- ============================================
-- 5. CASE NOTES (new table — replaces the single
-- cases.notes text column for the real Notes tab.
-- The old column stays for backward compatibility,
-- unused going forward.)
-- ============================================

create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null, -- workspace owner id
  body text not null,
  created_by uuid references public.users(id) not null,
  created_at timestamptz not null default now()
);

alter table public.case_notes enable row level security;

-- ============================================
-- 6. AUDIT COLUMN ON EXISTING TABLES
-- Who actually performed the action inside a shared
-- workspace, separate from whose workspace it lives in.
-- ============================================

alter table public.cases add column if not exists created_by uuid references public.users(id);
alter table public.documents add column if not exists created_by uuid references public.users(id);
alter table public.deadlines add column if not exists created_by uuid references public.users(id);
update public.cases set created_by = user_id where created_by is null;
update public.documents set created_by = user_id where created_by is null;
update public.deadlines set created_by = user_id where created_by is null;

-- ============================================
-- 7. WORKSPACE ACTIVITY FUNCTION
-- True if this workspace (identified by its owner's id)
-- currently has full access: active trial, paid, or admin.
-- False = trial ended and unpaid. Used to gate writes.
-- ============================================

create or replace function public.is_workspace_active(p_owner_id uuid)
returns boolean as $$
declare
  u record;
begin
  select plan, trial_claimed, trial_start, paid_until into u
  from public.users where id = p_owner_id;

  if u.plan = 'admin' then
    return true;
  elsif u.plan = 'paid' then
    return u.paid_until is null or u.paid_until > now();
  elsif u.plan = 'trial' then
    return u.trial_claimed and (u.trial_start + interval '30 days' > now());
  end if;

  return false;
end;
$$ language plpgsql security definer stable;

-- ============================================
-- 8. REPLACE RLS POLICIES FOR SHARED WORKSPACES
-- Rule shape, applied per table below:
--   READ            — owner always; member only if workspace active
--   INSERT / UPDATE — owner only if workspace active; member only if active
--   DOCUMENTS INSERT is the one exception: owner can keep
--   uploading even when expired (read-only-archive still
--   accepts inbound files). Members never get that exception.
-- ============================================

-- CASES
drop policy if exists "Users can read own cases" on public.cases;
drop policy if exists "Users can insert own cases" on public.cases;
drop policy if exists "Users can update own cases" on public.cases;
drop policy if exists "Users can delete own cases" on public.cases;

create policy "Workspace read cases" on public.cases for select using (
  auth.uid() = user_id
  or (auth.uid() in (select id from public.users where owner_id = cases.user_id) and is_workspace_active(cases.user_id))
);
create policy "Workspace insert cases" on public.cases for insert with check (
  is_workspace_active(cases.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = cases.user_id))
);
create policy "Workspace update cases" on public.cases for update using (
  is_workspace_active(cases.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = cases.user_id))
);
create policy "Workspace delete cases" on public.cases for delete using (
  is_workspace_active(cases.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = cases.user_id))
);

-- DOCUMENTS
drop policy if exists "Users can read own documents" on public.documents;
drop policy if exists "Users can insert own documents" on public.documents;
drop policy if exists "Users can delete own documents" on public.documents;
drop policy if exists "Users can update own documents" on public.documents;

create policy "Workspace read documents" on public.documents for select using (
  auth.uid() = user_id
  or (auth.uid() in (select id from public.users where owner_id = documents.user_id) and is_workspace_active(documents.user_id))
);
create policy "Workspace insert documents" on public.documents for insert with check (
  auth.uid() = user_id -- owner: always allowed, even expired
  or (auth.uid() in (select id from public.users where owner_id = documents.user_id) and is_workspace_active(documents.user_id))
);
create policy "Workspace delete documents" on public.documents for delete using (
  is_workspace_active(documents.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = documents.user_id))
);

-- DEADLINES
drop policy if exists "Users can read own deadlines" on public.deadlines;
drop policy if exists "Users can insert own deadlines" on public.deadlines;
drop policy if exists "Users can update own deadlines" on public.deadlines;
drop policy if exists "Users can delete own deadlines" on public.deadlines;

create policy "Workspace read deadlines" on public.deadlines for select using (
  auth.uid() = user_id
  or (auth.uid() in (select id from public.users where owner_id = deadlines.user_id) and is_workspace_active(deadlines.user_id))
);
create policy "Workspace insert deadlines" on public.deadlines for insert with check (
  is_workspace_active(deadlines.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = deadlines.user_id))
);
create policy "Workspace update deadlines" on public.deadlines for update using (
  is_workspace_active(deadlines.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = deadlines.user_id))
);
create policy "Workspace delete deadlines" on public.deadlines for delete using (
  is_workspace_active(deadlines.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = deadlines.user_id))
);

-- TASKS
create policy "Workspace read tasks" on public.tasks for select using (
  auth.uid() = user_id
  or (auth.uid() in (select id from public.users where owner_id = tasks.user_id) and is_workspace_active(tasks.user_id))
);
create policy "Workspace insert tasks" on public.tasks for insert with check (
  is_workspace_active(tasks.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = tasks.user_id))
);
create policy "Workspace update tasks" on public.tasks for update using (
  is_workspace_active(tasks.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = tasks.user_id))
);
create policy "Workspace delete tasks" on public.tasks for delete using (
  is_workspace_active(tasks.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = tasks.user_id))
);

-- CASE NOTES
create policy "Workspace read case_notes" on public.case_notes for select using (
  auth.uid() = user_id
  or (auth.uid() in (select id from public.users where owner_id = case_notes.user_id) and is_workspace_active(case_notes.user_id))
);
create policy "Workspace insert case_notes" on public.case_notes for insert with check (
  is_workspace_active(case_notes.user_id)
  and (auth.uid() = user_id or auth.uid() in (select id from public.users where owner_id = case_notes.user_id))
);

-- TIMELINE EVENTS — read follows the same shape; events are never edited/deleted by users.
drop policy if exists "Users can read own timeline" on public.timeline_events;
create policy "Workspace read timeline" on public.timeline_events for select using (
  auth.uid() = user_id
  or (auth.uid() in (select id from public.users where owner_id = timeline_events.user_id) and is_workspace_active(timeline_events.user_id))
);

-- ============================================
-- 9. STORAGE CAP TRACKING
-- Keeps users.storage_used_bytes in sync so the app
-- can block uploads at 150MB for unpaid workspaces
-- without recomputing a sum on every request.
-- ============================================

create or replace function public.adjust_storage_used()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.users set storage_used_bytes = storage_used_bytes + new.file_size where id = new.user_id;
  elsif (tg_op = 'DELETE') then
    update public.users set storage_used_bytes = greatest(0, storage_used_bytes - old.file_size) where id = old.user_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists documents_storage_tracking on public.documents;
create trigger documents_storage_tracking
  after insert or delete on public.documents
  for each row execute procedure public.adjust_storage_used();

-- Backfill existing totals once, for workspaces that already have documents.
update public.users u set storage_used_bytes = coalesce((
  select sum(d.file_size) from public.documents d where d.user_id = u.id
), 0);

-- ============================================
-- 10. SIGNUP TRIGGER — REWRITTEN FOR TEAM INVITES
-- If this email was invited by an owner, attach them as
-- a member of that workspace instead of starting a trial.
-- Otherwise, unchanged: solo signup, own workspace, own trial.
-- ============================================

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
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      'trial', -- irrelevant for members; workspace status always reads from owner_id
      'member',
      invite.owner_id,
      now()
    );
    delete from public.team_invites where owner_id = invite.owner_id and email = new.email;
  else
    insert into public.users (id, email, full_name, plan, role, trial_start)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      case
        when new.email in (
          'ajcasemanager46@gmail.com',
          'ifechukwudarlington.dev@gmail.com',
          'ahia4.agent@gmail.com'
        ) then 'admin'
        else 'trial'
      end,
      'owner',
      now()
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- 11. DROP CHAT — AI chat is out of scope. Table dropped,
-- not just hidden, since nothing should read or write to it.
-- ============================================

drop table if exists public.chat_messages cascade;
