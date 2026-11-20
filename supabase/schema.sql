-- Run this once in Supabase → SQL Editor
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  destination text not null,
  start_date date not null,
  end_date date not null,
  budget numeric default 0,
  spent numeric default 0,
  created_at timestamptz default now()
);
create table packing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  label text not null,
  done boolean default false,
  created_at timestamptz default now()
);
alter table trips enable row level security;
alter table packing_items enable row level security;
create policy "own trips" on trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own items" on packing_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
