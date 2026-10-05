-- ============================================================
-- Ficti Garments — Supabase Database Setup
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (one per auth user)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  membership_tier text default null,  -- 'I', 'II', 'III', or null
  newsletter boolean default false,
  created_at timestamptz default now()
);

-- 2. ORDERS
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  order_number text unique,
  status text default 'processing',  -- 'processing', 'shipped', 'delivered'
  items jsonb default '[]',
  total_cents integer default 0,
  created_at timestamptz default now()
);

-- 3. NEWSLETTER SUBSCRIBERS (for non-account email captures)
create table if not exists newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  subscribed_at timestamptz default now()
);

-- 4. ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table orders enable row level security;

-- Profiles: users can only see and update their own row
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Orders: users can only see their own orders
create policy "orders_select_own" on orders
  for select using (auth.uid() = user_id);

-- Newsletter: anyone can insert (public signup)
alter table newsletter_subscribers enable row level security;
create policy "newsletter_insert_public" on newsletter_subscribers
  for insert with check (true);

-- 5. AUTO-CREATE PROFILE ON SIGNUP
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, first_name, last_name, newsletter)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'newsletter')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
