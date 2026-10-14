-- =========================================================
-- DueDuo — key numbers (read-only). Paste into the Supabase SQL editor and Run.
-- "Buyers" = real paid buyers: a paid payment with amount_total > 0 and no refund.
-- Tasks count as ticked when roadmap_progress.completed_at or custom_tasks.completed_at is set.
-- =========================================================

with paid as (
  select user_id, min(created_at) as paid_at, min(source) as source
  from public.payments
  where status = 'paid' and amount_total > 0
  group by user_id
),
buyers as (
  select p.*
  from paid p
  where not exists (select 1 from public.payments r where r.user_id = p.user_id and r.status = 'refunded')
),
per_buyer as (
  select
    b.user_id,
    b.source,
    exists (
      select 1 from public.pregnancy_members m
      where m.owner_id = b.user_id and m.created_at <= b.paid_at + interval '7 days'
    ) as partner_7d,
    (pr.due_date is not null) as due_date_set,
    exists (
      select 1 from public.roadmap_progress t
      where t.user_id = b.user_id and t.completed_at is not null and t.completed_at <= b.paid_at + interval '3 days'
    ) or exists (
      select 1 from public.custom_tasks c
      where c.user_id = b.user_id and c.completed_at is not null and c.completed_at <= b.paid_at + interval '3 days'
    ) as task_3d
  from buyers b
  left join public.profiles pr on pr.id = b.user_id
)
select 1 as sort, 'Real paid buyers (not refunded)' as metric, count(*)::text as value from per_buyer
union all
select 2, 'Partner joined within 7 days', count(*) filter (where partner_7d) || ' of ' || count(*) from per_buyer
union all
select 3, 'Due date set', count(*) filter (where due_date_set) || ' of ' || count(*) from per_buyer
union all
select 4, 'First task ticked within 3 days', count(*) filter (where task_3d) || ' of ' || count(*) from per_buyer
union all
select 5, 'Refunded payments (amount > 0)', count(*)::text
  from public.payments where status = 'refunded' and amount_total > 0
union all
select 6, 'Sales from guide: ' || coalesce(source, '(not from a guide)'), count(*)::text
  from per_buyer group by source
order by 1, 2;
