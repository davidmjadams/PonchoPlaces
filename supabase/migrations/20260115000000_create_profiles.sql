-- Create user profiles linked 1:1 to Supabase Auth users.
-- This keeps auth identity in `auth.users` and app profile data in `public.profiles`.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile.
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

-- Users can create their own profile row (usually created by trigger).
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

-- Users can update their own profile.
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Auto-create an empty profile row when a new auth user is created.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

