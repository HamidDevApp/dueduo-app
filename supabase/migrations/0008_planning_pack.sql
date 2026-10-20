-- =========================================================
-- DueDuo — 0008: free planning pack email list
-- Visitors who ask for the printables pack (double opt-in).
-- Server-only: RLS on with NO policies, and no grants to anon/authenticated,
-- so nobody can read or write these rows from the browser.
-- =========================================================

create table if not exists public.pack_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token   text not null unique,
  source          text,
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz
);

create table if not exists public.pack_email_log (
  subscriber_id uuid not null references public.pack_subscribers (id) on delete cascade,
  email_key     text not null,
  sent_at       timestamptz not null default now(),
  primary key (subscriber_id, email_key)
);

alter table public.pack_subscribers enable row level security;
alter table public.pack_email_log enable row level security;
revoke all on public.pack_subscribers from anon, authenticated;
revoke all on public.pack_email_log from anon, authenticated;
