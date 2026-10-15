-- =========================================================
-- DueDuo — 0007: which ad or post a sale came from
-- Set by the server from the Polar checkout metadata ("utm"):
-- utm_source/utm_campaign/utm_content of the landing link,
-- e.g. 'meta/launch/reel8' or 'pinterest/guides/pin6'. Null = untagged.
-- =========================================================

alter table public.payments
  add column if not exists utm text;
