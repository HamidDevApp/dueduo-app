-- =========================================================
-- DueDuo — 0008: consent clicks tracking
-- Tracks when users click consent, saved with their email as proof
-- =========================================================

create table if not exists public.consent_clicks (
  id uuid not null default gen_random_uuid() primary key,
  email text not null,
  clicked_at timestamp with time zone not null default timezone('utc', now()),
  source text not null default 'onboarding',
  constraint uq_consent_clicks_email_source unique (email, source)
);

grant all on public.consent_clicks to authenticated;
grant select on public.consent_clicks to anon;

-- Row-level security
alter table public.consent_clicks enable row level security;

create policy "Users can insert their own consent clicks"
  on public.consent_clicks
  for insert
  to authenticated
  with check (true);

create policy "Allow read for analytics"
  on public.consent_clicks
  for select
  to authenticated
  using (true);

-- Comment: Tracks consent click events from the onboarding flow. 
-- Used to prove consent was given at a specific point in time.
