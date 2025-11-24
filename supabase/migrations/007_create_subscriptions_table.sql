-- Create subscription status enum
create type subscription_status as enum (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete'
);

-- Create plan type enum
create type plan_type as enum (
  'monthly',
  'weekly'
);

-- Create user_subscriptions table
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text,
  status subscription_status not null,
  plan_type plan_type not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists user_subscriptions_user_id_idx
  on public.user_subscriptions (user_id);

create index if not exists user_subscriptions_stripe_customer_id_idx
  on public.user_subscriptions (stripe_customer_id);

create index if not exists user_subscriptions_stripe_subscription_id_idx
  on public.user_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Unique constraint: one subscription per user
alter table public.user_subscriptions
  add constraint user_subscriptions_user_id_unique
  unique (user_id);

-- Trigger for updated_at
create trigger set_user_subscriptions_updated_at
before update on public.user_subscriptions
for each row
execute function public.set_updated_at();

-- Enable RLS
alter table public.user_subscriptions
  enable row level security;

-- RLS Policies
-- SELECT: Users can only see their own subscription
create policy "Users can view their own subscription"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

-- INSERT: Users can only create subscriptions for themselves
create policy "Users can create their own subscription"
  on public.user_subscriptions
  for insert
  with check (auth.uid() = user_id);

-- UPDATE: Users can only update their own subscription
create policy "Users can update their own subscription"
  on public.user_subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);





