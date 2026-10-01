-- =========================================================
-- First Pregnancy Planner — initial schema
-- =========================================================

-- 1. PROFILES (1 row per user, created by trigger on signup)
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  due_date      date,
  partner_name  text,
  hospital_name text,
  has_access    boolean not null default false,  -- flipped by payment webhook
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- 2. APPOINTMENTS
create table public.appointments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  kind         text not null default 'prenatal'
               check (kind in ('prenatal','ultrasound','lab','specialist','class','other')),
  scheduled_at timestamptz not null,
  location     text,
  notes        text,
  is_done      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- 3. DOCTOR QUESTIONS (optionally attached to an appointment)
create table public.doctor_questions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  question       text not null,
  answer         text,
  is_asked       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- 4. BUDGET
create table public.budget_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category   text not null default 'other'
             check (category in ('medical','baby_gear','nursery','clothing','feeding','leave_income','other')),
  label      text not null,
  estimated  numeric(10,2) not null default 0 check (estimated >= 0),
  actual     numeric(10,2) not null default 0 check (actual >= 0),
  is_paid    boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. REGISTRY
create table public.registry_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  category   text,
  priority   text not null default 'must' check (priority in ('must','nice','later')),
  url        text,
  price      numeric(10,2) check (price >= 0),
  status     text not null default 'wanted' check (status in ('wanted','purchased','received')),
  created_at timestamptz not null default now()
);

-- 6. HOSPITAL BAG
create table public.hospital_bag_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bag        text not null check (bag in ('mom','baby','partner')),
  label      text not null,
  is_packed  boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 7. ROADMAP PROGRESS (roadmap content lives in code; we only store what's ticked)
create table public.roadmap_progress (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_key     text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, task_key)
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Users must never be able to set has_access themselves
revoke update on public.profiles from authenticated;
grant update (full_name, due_date, partner_name, hospital_name, onboarded_at)
  on public.profiles to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'appointments','doctor_questions','budget_items',
    'registry_items','hospital_bag_items','roadmap_progress'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
    execute format('create index on public.%I (user_id)', t);
  end loop;
end $$;

create index on public.appointments (user_id, scheduled_at);

-- =========================================================
-- SIGNUP TRIGGER: create profile + seed a default hospital bag
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.hospital_bag_items (user_id, bag, label, sort_order)
  select new.id, b.bag, b.label, b.ord
  from (values
    ('mom','Photo ID, insurance card & hospital papers',1),
    ('mom','Birth plan (2 copies)',2),
    ('mom','Phone + long charging cable',3),
    ('mom','Comfortable robe & slippers',4),
    ('mom','Nursing bras & breast pads',5),
    ('mom','Maternity pads & high-waist underwear',6),
    ('mom','Toiletries, lip balm, hair ties',7),
    ('mom','Loose going-home outfit',8),
    ('baby','Installed car seat',1),
    ('baby','2–3 bodysuits & sleepsuits',2),
    ('baby','Hat, socks & mittens',3),
    ('baby','Swaddle / receiving blanket',4),
    ('baby','Newborn diapers & wipes',5),
    ('baby','Going-home outfit',6),
    ('partner','Snacks & water bottle',1),
    ('partner','Change of clothes',2),
    ('partner','Phone charger / power bank',3),
    ('partner','Pillow & blanket',4)
  ) as b(bag, label, ord);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
