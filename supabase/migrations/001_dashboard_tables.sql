-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- ── Invoices ──────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  client_name text not null,
  client_email text not null,
  amount numeric not null default 0,
  status text not null default 'Pending',
  invoice_date date not null default current_date,
  due_date date,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "Users manage own invoices"
  on public.invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Budgets ───────────────────────────────────────────────────────────────
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null,
  color text default '#6366f1',
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.budgets enable row level security;

create policy "Users manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Team members ──────────────────────────────────────────────────────────
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'Member',
  status text not null default 'Pending',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "Users manage own team"
  on public.team_members for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── ROI campaigns ─────────────────────────────────────────────────────────
create table if not exists public.roi_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_name text not null,
  invested numeric not null default 0,
  returned numeric not null default 0,
  status text not null default 'Active',
  category text not null default 'Paid Ads',
  start_date text,
  created_at timestamptz not null default now()
);

alter table public.roi_campaigns enable row level security;

create policy "Users manage own campaigns"
  on public.roi_campaigns for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Profile extensions for Settings ───────────────────────────────────────
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists language text default 'en';
alter table public.profiles add column if not exists dark_mode boolean default false;
alter table public.profiles add column if not exists notification_prefs jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
