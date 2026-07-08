create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  level_reached integer not null default 1,
  enemies_killed integer not null default 0,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.game_sessions enable row level security;

create index if not exists game_sessions_user_id_idx on public.game_sessions (user_id);
create index if not exists game_sessions_created_at_idx on public.game_sessions (created_at desc);

create policy "game_sessions_insert_own"
on public.game_sessions
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "game_sessions_select_own"
on public.game_sessions
for select
to authenticated
using (
  auth.uid() = user_id
);