create table public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null,
  level integer,
  mode text,
  created_at timestamptz not null default now()
);

alter table public.leaderboards enable row level security;

create index if not exists leaderboards_score_idx
  on public.leaderboards (score desc);

create index if not exists leaderboards_mode_idx
  on public.leaderboards (mode);

create index if not exists leaderboards_user_id_idx
  on public.leaderboards (user_id);

create policy "leaderboards_select_public"
on public.leaderboards
for select
to authenticated
using (true);

create policy "update own leaderboard row"
on public.leaderboards
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "users can insert scores"
on "public"."leaderboards"
for insert
to authenticated
with check (
    (auth.uid() = user_id)
);