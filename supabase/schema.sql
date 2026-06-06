-- ============================================
-- AJ CASE MANAGER — SUPABASE SCHEMA
-- Run this once in your Supabase SQL editor
-- ============================================

-- USERS (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  firm_name text,
  title text,
  plan text not null default 'trial' check (plan in ('trial','solo','chamber','admin')),
  trial_start timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- CASES
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  client_name text not null,
  client_contact text,
  matter_type text not null,
  status text not null default 'Active' check (status in ('Active','Urgent','Pending','Closed')),
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DOCUMENTS
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  file_name text not null,
  file_type text not null check (file_type in ('pdf','doc','docx','txt')),
  file_url text not null,
  file_size integer not null,
  summary text,
  summary_status text not null default 'pending' check (summary_status in ('pending','processing','done','failed','unreadable')),
  created_at timestamptz not null default now()
);

-- CHAT MESSAGES
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- TIMELINE EVENTS
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null check (event_type in ('case_created','status_changed','document_uploaded','deadline_added','note_updated','case_exported')),
  description text not null,
  created_at timestamptz not null default now()
);

-- DEADLINES
create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  label text not null,
  due_date date not null,
  is_critical boolean not null default false,
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null check (type in ('renewal','update','paystack','announcement')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.users enable row level security;
alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.chat_messages enable row level security;
alter table public.timeline_events enable row level security;
alter table public.deadlines enable row level security;
alter table public.notifications enable row level security;

-- USERS policies
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- CASES policies
create policy "Users can read own cases" on public.cases for select using (auth.uid() = user_id);
create policy "Users can insert own cases" on public.cases for insert with check (auth.uid() = user_id);
create policy "Users can update own cases" on public.cases for update using (auth.uid() = user_id);
create policy "Users can delete own cases" on public.cases for delete using (auth.uid() = user_id);

-- DOCUMENTS policies
create policy "Users can read own documents" on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);
create policy "Users can update own documents" on public.documents for update using (auth.uid() = user_id);

-- CHAT MESSAGES policies
create policy "Users can read own messages" on public.chat_messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.chat_messages for insert with check (auth.uid() = user_id);

-- TIMELINE policies
create policy "Users can read own timeline" on public.timeline_events for select using (auth.uid() = user_id);
create policy "Users can insert own timeline" on public.timeline_events for insert with check (auth.uid() = user_id);

-- DEADLINES policies
create policy "Users can read own deadlines" on public.deadlines for select using (auth.uid() = user_id);
create policy "Users can insert own deadlines" on public.deadlines for insert with check (auth.uid() = user_id);
create policy "Users can update own deadlines" on public.deadlines for update using (auth.uid() = user_id);
create policy "Users can delete own deadlines" on public.deadlines for delete using (auth.uid() = user_id);

-- NOTIFICATIONS policies
create policy "Users can read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, plan, trial_start)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.email in (
        'ajcasemanager46@gmail.com',
        'Ifechukwudarlington.dev@gmail.com',
        'Ahia4.agent@gmail.com'
      ) then 'admin'
      else 'trial'
    end,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- AUTO-UPDATE updated_at ON CASES
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cases_updated_at
  before update on public.cases
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- STORAGE BUCKET FOR DOCUMENTS
-- ============================================

insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "Users can upload own documents" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own documents" on storage.objects
  for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own documents" on storage.objects
  for delete using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
