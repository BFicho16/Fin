-- Ensure the set_updated_at function exists
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  version integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes
create index if not exists user_routines_user_id_active_idx
  on public.user_routines (user_id, is_active)
  where is_active = true and deleted_at is null;

create index if not exists user_routines_user_id_version_idx
  on public.user_routines (user_id, version desc)
  where deleted_at is null;

-- Constraints
alter table public.user_routines
  add constraint user_routines_user_id_version_unique
  unique (user_id, version);

-- Partial unique constraint ensuring only one active routine per user
create unique index if not exists user_routines_user_id_active_unique
  on public.user_routines (user_id)
  where is_active = true and deleted_at is null;

-- Trigger for updated_at
create trigger set_user_routines_updated_at
before update on public.user_routines
for each row
execute function public.set_updated_at();

-- Enable RLS
alter table public.user_routines
  enable row level security;

-- RLS Policies
-- SELECT: Users can only see their own non-deleted routines
create policy "Users can view their own routines"
  on public.user_routines
  for select
  using (auth.uid() = user_id and deleted_at is null);

-- INSERT: Users can only create routines for themselves
create policy "Users can create their own routines"
  on public.user_routines
  for insert
  with check (auth.uid() = user_id);

-- UPDATE: Users can only update their own routines
create policy "Users can update their own routines"
  on public.user_routines
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

