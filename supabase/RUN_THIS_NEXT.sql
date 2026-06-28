-- ============================================================
-- MATTER COLLABORATION WORKFLOW (Legal team approved, v1)
-- Run once in Supabase SQL Editor.
-- ============================================================

-- A "work session" is a temporary collaboration window on one matter.
-- The secure link is the token. Ending a session instantly revokes
-- every member's access without deleting any of the work they did.
create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  token uuid not null default gen_random_uuid(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index if not exists work_sessions_token_idx on public.work_sessions(token);

create table if not exists public.session_members (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.work_sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  email text not null,
  name text,
  joined_at timestamptz,
  revoked_at timestamptz
);

-- Group chat, text-only. Files are attached by reference to an existing
-- matter document, never uploaded raw into the chat itself.
create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  body text not null,
  attached_document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Tasks move to a review workflow: Pending -> In Progress -> Submitted
-- -> Approved or Needs Revision (back to In Progress if revision needed).
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('Pending', 'In Progress', 'Submitted', 'Approved', 'Needs Revision'));
update public.tasks set status = 'Pending' where status = 'Done' is false and status not in ('Pending', 'In Progress', 'Submitted', 'Approved', 'Needs Revision');
update public.tasks set status = 'Approved' where status = 'Done';

alter table public.tasks
  add column if not exists submission_note text,
  add column if not exists submission_document_id uuid references public.documents(id) on delete set null,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- ------------------------------------------------------------
-- Access helper: true if the signed-in user has a currently
-- active (non-revoked) session on this case, in addition to
-- the existing permanent firm-membership check.
-- ------------------------------------------------------------
create or replace function public.has_active_session(p_case_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.session_members sm
    join public.work_sessions ws on ws.id = sm.session_id
    where ws.case_id = p_case_id
      and sm.user_id = p_user_id
      and sm.revoked_at is null
      and ws.status = 'active'
  );
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.work_sessions enable row level security;
alter table public.session_members enable row level security;
alter table public.case_messages enable row level security;

grant select, insert, update, delete on public.work_sessions to authenticated;
grant select, insert, update, delete on public.session_members to authenticated;
grant select, insert, update, delete on public.case_messages to authenticated;

drop policy if exists "Firm members manage sessions on their cases" on public.work_sessions;
create policy "Firm members manage sessions on their cases" on public.work_sessions
  for all using (
    case_id in (select id from public.cases where user_id = (
      select coalesce(owner_id, id) from public.users where id = auth.uid()
    ))
  );

drop policy if exists "Session members visible to firm and session itself" on public.session_members;
create policy "Session members visible to firm and session itself" on public.session_members
  for select using (
    session_id in (select id from public.work_sessions where case_id in (
      select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid())
    ))
    or user_id = auth.uid()
  );

drop policy if exists "Firm manages session members" on public.session_members;
create policy "Firm manages session members" on public.session_members
  for insert with check (
    session_id in (select id from public.work_sessions where case_id in (
      select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid())
    ))
  );

drop policy if exists "Case messages visible to firm and active session members" on public.case_messages;
create policy "Case messages visible to firm and active session members" on public.case_messages
  for select using (
    case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
    or public.has_active_session(case_id, auth.uid())
  );

drop policy if exists "Firm and active session members can post" on public.case_messages
;
create policy "Firm and active session members can post" on public.case_messages
  for insert with check (
    user_id = auth.uid() and (
      case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
      or public.has_active_session(case_id, auth.uid())
    )
  );

-- Tasks and documents now also need to be visible/editable by active
-- session members, not just permanent firm members.
drop policy if exists "Firm or active session can view tasks" on public.tasks;
create policy "Firm or active session can view tasks" on public.tasks
  for select using (
    case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
    or public.has_active_session(case_id, auth.uid())
  );

drop policy if exists "Firm or active session can manage tasks" on public.tasks;
create policy "Firm or active session can manage tasks" on public.tasks
  for insert with check (
    case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
    or public.has_active_session(case_id, auth.uid())
  );

drop policy if exists "Firm or active session can update tasks" on public.tasks;
create policy "Firm or active session can update tasks" on public.tasks
  for update using (
    case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
    or public.has_active_session(case_id, auth.uid())
  );

drop policy if exists "Firm or active session can delete tasks" on public.tasks;
create policy "Firm or active session can delete tasks" on public.tasks
  for delete using (
    case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
  );

grant select, insert, update, delete on public.tasks to authenticated;

-- A session member also needs to see the matter itself and its
-- documents, not just tasks/chat — otherwise the page never loads
-- for them at all.
drop policy if exists "Firm or active session can view case" on public.cases;
create policy "Firm or active session can view case" on public.cases
  for select using (
    user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid())
    or public.has_active_session(id, auth.uid())
  );

drop policy if exists "Firm or active session can view documents" on public.documents;
create policy "Firm or active session can view documents" on public.documents
  for select using (
    case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
    or public.has_active_session(case_id, auth.uid())
  );

drop policy if exists "Firm or active session can upload documents" on public.documents;
create policy "Firm or active session can upload documents" on public.documents
  for insert with check (
    case_id in (select id from public.cases where user_id = (select coalesce(owner_id, id) from public.users where id = auth.uid()))
    or public.has_active_session(case_id, auth.uid())
  );

grant select, insert on public.documents to authenticated;

-- Onboarding tour, shown once ever per user.
alter table public.users
  add column if not exists onboarding_completed boolean not null default false;

-- Anyone who already has a case, or already claimed their trial, has
-- obviously already used the app — the tour should never interrupt them.
update public.users set onboarding_completed = true
where id in (select distinct user_id from public.cases)
   or trial_claimed = true
   or plan in ('admin', 'solo', 'chamber');

-- The users table previously only let someone see their own row
-- (auth.uid() = id). That silently breaks name resolution anywhere one
-- firm member needs to see another's name — chat, task attribution,
-- the team list. This adds visibility across the same firm only.
--
-- Uses a security-definer helper rather than a raw subquery on users,
-- because a policy on `users` that queries `users` directly inside the
-- same statement triggers "infinite recursion detected in policy".
create or replace function public.my_workspace_id()
returns uuid as $$
  select coalesce(owner_id, id) from public.users where id = auth.uid();
$$ language sql security definer stable;

drop policy if exists "Firm members can see each other" on public.users;
create policy "Firm members can see each other" on public.users
  for select using (
    owner_id = public.my_workspace_id()
    or id = public.my_workspace_id()
  );
-- ============================================================
-- TOKEN-BASED TEAM INVITES — run once in Supabase SQL Editor
-- ============================================================

alter table public.team_invites
  add column if not exists token uuid not null default gen_random_uuid();

create unique index if not exists team_invites_token_idx on public.team_invites(token);

-- Also re-running these, harmless if already applied — confirms the
-- table-level grants are in place (separate from row-level policies).
grant select, insert, update, delete on public.team_invites to authenticated;
grant select, insert, update, delete on public.app_reviews to authenticated;
