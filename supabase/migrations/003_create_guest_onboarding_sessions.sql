create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.guest_onboarding_sessions (
  session_id uuid primary key default gen_random_uuid(),
  profile jsonb not null default '{}'::jsonb,
  health_metrics jsonb not null default '[]'::jsonb,
  dietary_preferences jsonb not null default '{}'::jsonb,
  sleep_routine jsonb not null default '{}'::jsonb,
  routines jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  migrated boolean not null default false,
  migrated_at timestamptz,
  migrated_to_user_id uuid references auth.users(id) on delete set null
);

create index if not exists guest_onboarding_sessions_last_accessed_idx
  on public.guest_onboarding_sessions (last_accessed desc);

alter table public.guest_onboarding_sessions
  replica identity full;

create trigger set_guest_onboarding_sessions_updated_at
before update on public.guest_onboarding_sessions
for each row
execute function public.set_updated_at();

alter table public.guest_onboarding_sessions
  disable row level security;




