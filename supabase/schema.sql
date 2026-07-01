-- Run this in your Supabase project's SQL editor (free tier is enough).

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,        -- e.g. a5309058-2350-4efb-a138-c0140422ba21
  display_name text,
  added_at timestamptz default now()
);

create table if not exists snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  total_points int not null default 0,
  total_badges int not null default 0,
  badges jsonb not null default '[]',
  fetched_at timestamptz default now()
);

create index if not exists idx_snapshots_profile_time
  on snapshots (profile_id, fetched_at desc);

-- Row Level Security: allow public read (this is a public leaderboard),
-- writes only via the service role key (used server-side in API routes).
alter table profiles enable row level security;
alter table snapshots enable row level security;

create policy "Public read profiles" on profiles
  for select using (true);

create policy "Public read snapshots" on snapshots
  for select using (true);

-- No insert/update/delete policies for the anon key on purpose —
-- all writes go through the API routes using SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS.

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text,
  official_link text,
  image_url text,
  published_at timestamptz default now(),
  source text default 'manual'  -- 'manual' (curated by you) vs 'auto' (fetched)
);

create index if not exists idx_announcements_published
  on announcements (published_at desc);

alter table announcements enable row level security;

create policy "Public read announcements" on announcements
  for select using (true);

-- Writes go through the service role key in app/api/announcements/route.ts.

