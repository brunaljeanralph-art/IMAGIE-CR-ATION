-- IMAGIE CRÉATION: subscriptions for browser push notifications.
-- Email OTP is configured in Supabase Dashboard (Auth email template), not by SQL.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null unique check (length(endpoint) between 20 and 2048 and endpoint like 'https://%'),
  p256dh text not null check (length(p256dh) between 20 and 256),
  auth text not null check (length(auth) between 8 and 128),
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public;
grant insert on public.push_subscriptions to anon, authenticated;

-- Visitors may subscribe with consent without creating an account. Signed-in users
-- can attach a subscription only to their own profile. No client SELECT policy exists.
drop policy if exists push_subscriptions_insert_owner_or_visitor on public.push_subscriptions;
create policy push_subscriptions_insert_owner_or_visitor on public.push_subscriptions
for insert to anon, authenticated
with check (
  (auth.uid() is null and user_id is null)
  or (auth.uid() is not null and user_id = auth.uid())
);

-- Subscription removal is handled by the browser permission controls; clients cannot bulk-delete rows.
