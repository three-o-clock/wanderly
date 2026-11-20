-- Run AFTER schema.sql, once, in Supabase → SQL Editor
alter table trips
  add column if not exists cover_url text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists itinerary jsonb default '[]',
  add column if not exists category text default 'City',
  add column if not exists is_public boolean default false,
  add column if not exists max_people int default 4;

create table if not exists profiles (id uuid primary key references auth.users on delete cascade, name text);
create table if not exists trip_members (
  trip_id uuid references trips on delete cascade,
  user_id uuid default auth.uid() references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (trip_id, user_id));
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  description text not null,
  amount numeric not null,
  paid_by uuid not null default auth.uid() references auth.users,
  created_at timestamptz default now());

insert into profiles select id, split_part(email,'@',1) from auth.users on conflict do nothing;
insert into trip_members(trip_id, user_id) select id, user_id from trips on conflict do nothing;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles values (new.id, split_part(new.email,'@',1)) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function add_owner_member() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into trip_members(trip_id, user_id) values (new.id, new.user_id) on conflict do nothing; return new; end $$;
drop trigger if exists on_trip_created on trips;
create trigger on_trip_created after insert on trips for each row execute function add_owner_member();

create or replace function is_member(t uuid) returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from trip_members where trip_id = t and user_id = auth.uid()) $$;
create or replace function is_open(t uuid) returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from trips where id = t and is_public) $$;

alter table profiles enable row level security;
alter table trip_members enable row level security;
alter table expenses enable row level security;

drop policy if exists "own trips" on trips;
create policy "view trips" on trips for select using (user_id = auth.uid() or is_public or is_member(id));
create policy "add trips" on trips for insert with check (user_id = auth.uid());
create policy "edit trips" on trips for update using (user_id = auth.uid());
create policy "delete trips" on trips for delete using (user_id = auth.uid());
create policy "read profiles" on profiles for select to authenticated using (true);
create policy "read members" on trip_members for select to authenticated using (true);
create policy "join open trips" on trip_members for insert to authenticated with check (user_id = auth.uid() and is_open(trip_id));
create policy "leave trips" on trip_members for delete using (user_id = auth.uid());
create policy "read expenses" on expenses for select using (is_member(trip_id));
create policy "add expenses" on expenses for insert with check (is_member(trip_id) and paid_by = auth.uid());
create policy "delete own expenses" on expenses for delete using (paid_by = auth.uid());

insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;
create policy "cover read" on storage.objects for select using (bucket_id = 'covers');
create policy "cover upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
