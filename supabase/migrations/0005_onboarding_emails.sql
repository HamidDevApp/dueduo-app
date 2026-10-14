-- =========================================================
-- DueDuo — 0005: onboarding emails
--   1. email_log: one row per (user, email) actually sent, so nobody
--      gets the same email twice. Written ONLY by the server (service role).
--   2. profiles.marketing_emails_opt_out: set from the unsubscribe link.
-- =========================================================

create table public.email_log (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  email_key text not null,
  sent_at   timestamptz not null default now(),
  unique (user_id, email_key)
);

-- RLS on with no policies: no client access at all, only the service role.
alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;

alter table public.profiles
  add column if not exists marketing_emails_opt_out boolean not null default false;
