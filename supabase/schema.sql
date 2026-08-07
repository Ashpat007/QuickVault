-- QuickVault Postgres Database Schema & RLS Policy Fix for Supabase

-- 1. Sets Table: Named groupings of entries
create table if not exists sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_public boolean default false,
  public_slug text unique,
  created_at timestamptz default now()
);

-- 2. Entries Table: Individual vault items
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  set_id uuid references sets(id) on delete cascade not null,
  label text not null,
  value text not null,
  note text,
  entry_type text not null,
  is_private boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Add note column if table already exists
alter table entries add column if not exists note text;

-- Enable RLS
alter table sets enable row level security;
alter table entries enable row level security;

-- Drop existing policies to prevent conflicts
drop policy if exists "users manage their own sets" on sets;
drop policy if exists "anyone can read public sets" on sets;
drop policy if exists "users manage their own entries" on entries;
drop policy if exists "users manage their own entries" on sets;
drop policy if exists "anyone can read non-private entries of public sets" on entries;

-- Sets RLS Policies
create policy "users manage their own sets"
  on sets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "anyone can read public sets"
  on sets for select
  using (is_public = true);

-- Entries RLS Policies (CORRECTED TARGET TO entries TABLE)
create policy "users manage their own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "anyone can read non-private entries of public sets"
  on entries for select
  using (
    (is_private = false or is_private is null)
    and exists (
      select 1 from sets
      where sets.id = entries.set_id
      and sets.is_public = true
    )
  );

-- Indexes for maximum query performance
create index if not exists idx_sets_user_id on sets(user_id);
create index if not exists idx_sets_public_slug on sets(public_slug) where is_public = true;
create index if not exists idx_entries_set_id on entries(set_id);
create index if not exists idx_entries_user_id on entries(user_id);
