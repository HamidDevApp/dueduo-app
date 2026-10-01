-- =========================================================
-- First Pregnancy Planner — 0003: payments
-- Written ONLY by the server (service role) from Stripe events.
-- profiles.has_access (from 0001) is the unlock flag.
-- =========================================================

create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  stripe_session_id text not null unique,
  payment_intent_id text,
  amount_total      integer,               -- in the smallest currency unit (e.g. cents)
  currency          text,
  status            text not null default 'paid' check (status in ('paid','refunded')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on public.payments (user_id);
create index on public.payments (payment_intent_id);

alter table public.payments enable row level security;

-- Users can see their own receipts; nobody but the server can write.
create policy "payments: read own" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.payments from anon, authenticated;
