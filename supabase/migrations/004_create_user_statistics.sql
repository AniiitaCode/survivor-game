create table public.user_statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  games_played integer not null default 0,
  total_score integer not null default 0,
  best_score integer not null default 0,
  highest_level integer not null default 1,
  total_enemies_killed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_statistics enable row level security;

create index if not exists user_statistics_user_id_idx
    on public.user_statistics(user_id);

create policy "users can view own statistics"
on public.user_statistics
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "users can insert own statistics"
on public.user_statistics
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "users can update own statistics"
on public.user_statistics
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);