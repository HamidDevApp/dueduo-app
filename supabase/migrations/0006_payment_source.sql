-- =========================================================
-- DueDuo — 0006: which free guide a sale came from
-- Set by the server from the Polar checkout metadata ("source"),
-- e.g. 'hospital-bag-checklist'. Null = not from a guide.
-- =========================================================

alter table public.payments
  add column if not exists source text;
