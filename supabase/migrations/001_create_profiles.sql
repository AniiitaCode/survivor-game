create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create index if not exists profiles_username_idx on public.profiles (username);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
    auth.uid() = id
);

create policy "profiles_select_public"
on public.profiles
for select
to authenticated
using (
    true
);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
    auth.uid() = id
)
with check (
    auth.uid() = id
    and role = 'user'
);

create policy "admins_update_profiles"
on public.profiles
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
        and p.role = 'admin'
    )
);