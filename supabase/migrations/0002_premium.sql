-- =========================================================
-- First Pregnancy Planner — 0002: premium features
--   1. Partner Co-Pilot (shared "pregnancy space" + invites)
--   2. Task ownership (mom / partner / together) + custom tasks
--   3. Doctor Visit Printout (provider, priority questions, symptom log)
--   4. Boundary Scripts personalization (profile preferences)
--   5. Smart Budgeting (need level, source, leave income plan)
--
-- Convention from here on: every table's `user_id` = the OWNER of the
-- pregnancy space (the mother's account). Partners get access through
-- public.pregnancy_members. New rows default to the caller's space, so
-- the app never has to send user_id.
-- =========================================================

-- ---------------------------------------------------------
-- 1. SPACE MEMBERSHIP + INVITES
-- ---------------------------------------------------------
create table public.pregnancy_members (
  owner_id   uuid not null references auth.users (id) on delete cascade,
  member_id  uuid not null unique references auth.users (id) on delete cascade,
  role       text not null default 'partner' check (role in ('partner')),
  created_at timestamptz not null default now(),
  primary key (owner_id, member_id),
  check (owner_id <> member_id)
);

create table public.partner_invites (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token       text not null unique
              default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  email       text,
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.partner_invites (owner_id);

-- The space the current user works in: their owner's, or their own.
create or replace function public.current_space_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select m.owner_id from public.pregnancy_members m where m.member_id = (select auth.uid())),
    (select auth.uid())
  );
$$;

-- Can the current user read/write rows belonging to this space owner?
create or replace function public.has_space_access(p_owner uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_owner = (select auth.uid())
      or exists (
        select 1 from public.pregnancy_members m
        where m.owner_id = p_owner and m.member_id = (select auth.uid())
      );
$$;

-- Accept an invite. Returns the owner's id.
create or replace function public.accept_partner_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_invite public.partner_invites;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_invite
  from public.partner_invites
  where token = p_token and accepted_at is null and expires_at > now()
  for update;

  if not found then
    raise exception 'invalid_invite';
  end if;
  if v_invite.owner_id = v_uid then
    raise exception 'own_invite';
  end if;

  insert into public.pregnancy_members (owner_id, member_id)
  values (v_invite.owner_id, v_uid)
  on conflict (member_id) do update set owner_id = excluded.owner_id;

  update public.partner_invites
  set accepted_by = v_uid, accepted_at = now()
  where id = v_invite.id;

  -- The partner's own signup seeded a starter hospital bag; they now share the owner's.
  delete from public.hospital_bag_items where user_id = v_uid;

  return v_invite.owner_id;
end;
$$;

revoke execute on function public.accept_partner_invite(text) from public, anon;
grant execute on function public.accept_partner_invite(text) to authenticated;

alter table public.pregnancy_members enable row level security;
create policy "members: see own space" on public.pregnancy_members
  for select to authenticated
  using ((select auth.uid()) in (owner_id, member_id));
create policy "members: owner removes / partner leaves" on public.pregnancy_members
  for delete to authenticated
  using ((select auth.uid()) in (owner_id, member_id));

alter table public.partner_invites enable row level security;
create policy "invites: owner manages" on public.partner_invites
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------
-- 2. PROFILE: preferences for scripts + leave/income plan
-- ---------------------------------------------------------
alter table public.profiles
  add column currency               text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  add column mom_monthly_income     numeric(12,2) check (mom_monthly_income >= 0),
  add column partner_monthly_income numeric(12,2) check (partner_monthly_income >= 0),
  add column mom_leave_weeks        smallint check (mom_leave_weeks between 0 and 104),
  add column mom_paid_weeks         smallint check (mom_paid_weeks between 0 and 104),
  add column mom_leave_pay_percent  smallint check (mom_leave_pay_percent between 0 and 100),
  add column partner_leave_weeks    smallint check (partner_leave_weeks between 0 and 104),
  add column work_status            text not null default 'not_yet'
                                    check (work_status in ('not_yet','told','not_applicable')),
  add column visitor_policy         text not null default 'limited'
                                    check (visitor_policy in ('welcome','limited','none_first_weeks'));

-- Partners may read the owner's profile
drop policy "profiles: read own" on public.profiles;
create policy "profiles: read own space" on public.profiles
  for select to authenticated using (public.has_space_access(id));

grant update (
  currency, mom_monthly_income, partner_monthly_income,
  mom_leave_weeks, mom_paid_weeks, mom_leave_pay_percent, partner_leave_weeks,
  work_status, visitor_policy
) on public.profiles to authenticated;

-- ---------------------------------------------------------
-- 3. TASK OWNERSHIP
-- roadmap_progress now stores per-task state: an optional reassignment
-- (assignee) and/or completion. completed_at IS NULL = not done.
-- ---------------------------------------------------------
alter table public.roadmap_progress
  alter column completed_at drop not null,
  alter column completed_at drop default,
  add column assignee     text check (assignee in ('mom','partner','together')),
  add column completed_by uuid references auth.users (id) on delete set null,
  add column updated_at   timestamptz not null default now();

-- Anything the mom wants off her plate, assigned to anyone.
create table public.custom_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default public.current_space_id() references auth.users (id) on delete cascade,
  title        text not null check (length(title) between 1 and 200),
  notes        text,
  assignee     text not null default 'partner' check (assignee in ('mom','partner','together')),
  due_date     date,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4. DOCTOR VISIT PRINTOUT
-- ---------------------------------------------------------
alter table public.appointments
  add column provider_name text;

alter table public.doctor_questions
  add column is_priority boolean not null default false,
  add column created_by  uuid default auth.uid() references auth.users (id) on delete set null;

create table public.symptom_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default public.current_space_id() references auth.users (id) on delete cascade,
  logged_on  date not null default current_date,
  symptom    text not null check (length(symptom) between 1 and 200),
  severity   smallint not null default 1 check (severity between 1 and 3), -- 1 mild, 2 moderate, 3 severe
  notes      text,
  created_at timestamptz not null default now()
);
create index on public.symptom_logs (user_id, logged_on desc);

-- ---------------------------------------------------------
-- 5. SMART BUDGETING
-- ---------------------------------------------------------
alter table public.budget_items
  add column need_level  text not null default 'essential' check (need_level in ('essential','nice','skip')),
  add column source      text not null default 'buy_new'  check (source in ('buy_new','second_hand','borrow','gift')),
  add column buy_by_week smallint check (buy_by_week between 0 and 42);

-- ---------------------------------------------------------
-- 6. SHARED-SPACE RLS for every planner table
-- ---------------------------------------------------------
do $$
declare t text;
begin
  -- replace the old "own rows" policies from 0001
  foreach t in array array[
    'appointments','doctor_questions','budget_items',
    'registry_items','hospital_bag_items','roadmap_progress'
  ] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
  end loop;

  foreach t in array array[
    'appointments','doctor_questions','budget_items','registry_items',
    'hospital_bag_items','roadmap_progress','custom_tasks','symptom_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I alter column user_id set default public.current_space_id()', t);
    execute format(
      'create policy "space members" on public.%I for all to authenticated
         using (public.has_space_access(user_id))
         with check (public.has_space_access(user_id))', t);
  end loop;
end $$;

create index on public.custom_tasks (user_id);
