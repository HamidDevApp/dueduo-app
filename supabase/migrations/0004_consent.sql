-- =========================================================
-- DueDuo — 0004: consent records
-- Pregnancy details are health data (special category under GDPR / Swiss revFADP),
-- so we record explicit consent and acceptance of the Terms.
-- =========================================================

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists health_consent_at timestamptz;

grant update (terms_accepted_at, health_consent_at) on public.profiles to authenticated;
