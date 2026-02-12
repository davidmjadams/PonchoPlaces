-- Drop legacy application users table (replaced by `public.profiles`).
-- NOTE: This is NOT `auth.users` (Supabase Auth). This removes `public.users` only.

drop table if exists public.users cascade;

