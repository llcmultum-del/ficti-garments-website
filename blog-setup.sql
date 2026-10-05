-- ============================================================
-- Ficti Garments — Blog Posts Table Setup
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. BLOG POSTS TABLE
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text,
  body text,
  category text default 'Journal',
  author text default 'Ficti Garments',
  featured boolean default false,
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ROW LEVEL SECURITY
alter table posts enable row level security;

-- Anyone can read published posts
create policy "posts_select_published" on posts
  for select using (published = true);

-- Only authenticated users with admin email can insert/update/delete
-- (We'll use a simple approach: check against a known admin email)
create policy "posts_insert_admin" on posts
  for insert with check (
    auth.jwt() ->> 'email' = 'llc.multum@gmail.com'
  );

create policy "posts_update_admin" on posts
  for update using (
    auth.jwt() ->> 'email' = 'llc.multum@gmail.com'
  );

create policy "posts_delete_admin" on posts
  for delete using (
    auth.jwt() ->> 'email' = 'llc.multum@gmail.com'
  );

-- 3. AUTO-UPDATE updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_updated_at on posts;
create trigger posts_updated_at
  before update on posts
  for each row execute procedure update_updated_at();

-- 4. SEED WITH EXISTING BLOG POSTS (optional — gives you a starting point)
insert into posts (slug, title, excerpt, category, author, featured, published, published_at) values
(
  'why-the-best-rounds-are-played-in-silence',
  'Why the Best Rounds Are Played in Silence',
  'There''s a rhythm to a round played without music, without phones, without the constant pull of notification. We spoke with four scratch golfers about what they''ve found in the quiet.',
  'Course Culture',
  'Marcus Webb',
  true,
  true,
  now() - interval '21 days'
),
(
  'the-fabric-that-started-everything',
  'The Fabric That Started Everything',
  'How a chance encounter with a Portuguese mill led to the performance twill at the heart of our Tournament collection.',
  'Design & Craft',
  'Ficti Garments',
  false,
  true,
  now() - interval '35 days'
),
(
  'four-holes-one-bag-desmond-cole',
  'Four Holes, One Bag: A Round with Desmond Cole',
  'The architect and amateur champion on course design, movement, and what he reaches for when precision matters.',
  'Players & Perspective',
  'Ficti Garments',
  false,
  true,
  now() - interval '49 days'
),
(
  'fall-2026-what-we-are-building',
  'Fall 2026: What We''re Building and Why It Matters',
  'A first look at the silhouettes, palette, and intentions behind our most considered collection to date.',
  'Season Preview',
  'Ficti Garments',
  false,
  true,
  now() - interval '63 days'
),
(
  'on-dress-codes-golfs-last-frontier',
  'On Dress Codes: Golf''s Last Frontier of Taste',
  'Clubs are relaxing their rules. That doesn''t mean standards should follow. A case for intentional dressing.',
  'The Game',
  'Ficti Garments',
  false,
  true,
  now() - interval '77 days'
),
(
  'how-to-keep-your-whites-white',
  'How to Keep Your Whites White: A Practical Guide',
  'Bone, ivory, and chalk are unforgiving. Here''s what our production team actually does to keep light pieces looking right.',
  'Care & Longevity',
  'Ficti Garments',
  false,
  true,
  now() - interval '91 days'
),
(
  'why-we-called-it-ficti',
  'Why We Called It Ficti',
  'The name raised eyebrows. We knew it would. Here''s what we meant — and what we still mean — by clothing crafted for the life you''re constructing.',
  'Founders',
  'Ficti Garments',
  false,
  true,
  now() - interval '105 days'
)
on conflict (slug) do nothing;
