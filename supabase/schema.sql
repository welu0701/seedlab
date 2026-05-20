-- ============================================================
-- SeedLab Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Migrations tracker
create table if not exists public._migrations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  applied_at timestamptz default now()
);

-- Profiles (one per auth user)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text not null,
  created_at timestamptz default now()
);

-- Households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substring(md5(random()::text), 1, 6)),
  created_at timestamptz default now()
);

-- Household membership
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  unique(household_id, user_id)
);

-- Vegetable catalog
create table public.vegetable_catalog (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  days_to_germinate integer not null default 7,
  days_to_harvest integer not null default 60,
  spacing_inches integer,
  companion_plants text,
  bolt_info text,
  notes text,
  created_at timestamptz default now()
);

-- Raised beds
create table public.raised_beds (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  rows integer not null default 4 check (rows > 0 and rows <= 20),
  cols integer not null default 4 check (cols > 0 and cols <= 20),
  created_at timestamptz default now()
);

-- Bed cells (auto-populated when a bed is created via trigger)
create table public.bed_plants (
  id uuid primary key default gen_random_uuid(),
  bed_id uuid references public.raised_beds(id) on delete cascade not null,
  row integer not null,
  col integer not null,
  plant_id uuid,  -- FK added after plants table
  unique(bed_id, row, col)
);

-- Hydroponic systems
create table public.hydro_systems (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  slot_count integer not null default 8 check (slot_count > 0 and slot_count <= 100),
  nutrient_last_refilled timestamptz,
  nutrient_refill_days integer not null default 14,
  created_at timestamptz default now()
);

-- Hydroponic slots (auto-populated via trigger)
create table public.hydro_slots (
  id uuid primary key default gen_random_uuid(),
  system_id uuid references public.hydro_systems(id) on delete cascade not null,
  slot_number integer not null,
  plant_id uuid,
  unique(system_id, slot_number)
);

-- Seed trays
create table public.seed_trays (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  cell_count integer not null default 72 check (cell_count > 0 and cell_count <= 288),
  created_at timestamptz default now()
);

-- Tray cells (auto-populated via trigger)
create table public.tray_cells (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid references public.seed_trays(id) on delete cascade not null,
  cell_number integer not null,
  vegetable_id uuid references public.vegetable_catalog(id) on delete set null,
  planted_at timestamptz,
  status text not null default 'germinating' check (status in ('germinating', 'ready_to_move', 'moved')),
  unique(tray_id, cell_number)
);

-- Plants (canonical record for any living plant)
create table public.plants (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  vegetable_id uuid references public.vegetable_catalog(id) on delete set null,
  planted_at timestamptz not null default now(),
  status text not null default 'growing' check (status in ('growing', 'ready_to_harvest', 'harvested', 'needs_trim', 'died')),
  notes text,
  created_at timestamptz default now()
);

-- Add deferred FK from bed_plants and hydro_slots to plants
alter table public.bed_plants add constraint bed_plants_plant_id_fkey
  foreign key (plant_id) references public.plants(id) on delete set null;

alter table public.hydro_slots add constraint hydro_slots_plant_id_fkey
  foreign key (plant_id) references public.plants(id) on delete set null;

-- Plant events log
create table public.plant_events (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references public.plants(id) on delete cascade not null,
  event_type text not null check (event_type in ('planted', 'harvested', 'trimmed', 'died', 'transplanted')),
  occurred_at timestamptz not null default now(),
  notes text
);

-- ============================================================
-- Triggers: auto-populate bed cells
-- ============================================================
create or replace function populate_bed_cells()
returns trigger language plpgsql as $$
declare
  r integer;
  c integer;
begin
  for r in 1..new.rows loop
    for c in 1..new.cols loop
      insert into public.bed_plants (bed_id, row, col)
      values (new.id, r, c);
    end loop;
  end loop;
  return new;
end;
$$;

create trigger after_bed_insert
  after insert on public.raised_beds
  for each row execute function populate_bed_cells();

-- Trigger: auto-populate hydro slots
create or replace function populate_hydro_slots()
returns trigger language plpgsql as $$
declare
  i integer;
begin
  for i in 1..new.slot_count loop
    insert into public.hydro_slots (system_id, slot_number)
    values (new.id, i);
  end loop;
  return new;
end;
$$;

create trigger after_hydro_insert
  after insert on public.hydro_systems
  for each row execute function populate_hydro_slots();

-- Trigger: auto-populate tray cells
create or replace function populate_tray_cells()
returns trigger language plpgsql as $$
declare
  i integer;
begin
  for i in 1..new.cell_count loop
    insert into public.tray_cells (tray_id, cell_number)
    values (new.id, i);
  end loop;
  return new;
end;
$$;

create trigger after_tray_insert
  after insert on public.seed_trays
  for each row execute function populate_tray_cells();

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.vegetable_catalog enable row level security;
alter table public.raised_beds enable row level security;
alter table public.bed_plants enable row level security;
alter table public.hydro_systems enable row level security;
alter table public.hydro_slots enable row level security;
alter table public.seed_trays enable row level security;
alter table public.tray_cells enable row level security;
alter table public.plants enable row level security;
alter table public.plant_events enable row level security;

-- Helper: check household membership
create or replace function is_household_member(hid uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- Profiles
create policy "users can read own profile" on public.profiles for select using (user_id = auth.uid());
create policy "users can update own profile" on public.profiles for update using (user_id = auth.uid());

-- Households
create policy "authenticated can read households" on public.households for select using (auth.uid() is not null);
create policy "members can update household" on public.households for update using (is_household_member(id));
create policy "authenticated users can create household" on public.households for insert with check (auth.uid() is not null);

-- Household members
create policy "members can read membership" on public.household_members for select using (is_household_member(household_id));
create policy "authenticated can insert membership" on public.household_members for insert with check (auth.uid() is not null);
create policy "owners can delete members" on public.household_members for delete using (
  user_id = auth.uid() or
  exists (select 1 from public.household_members where household_id = household_members.household_id and user_id = auth.uid() and role = 'owner')
);

-- All household-scoped tables: members can do everything
create policy "members can manage vegetable_catalog" on public.vegetable_catalog for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "members can manage raised_beds" on public.raised_beds for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "members can manage bed_plants" on public.bed_plants for all using (exists (select 1 from public.raised_beds rb where rb.id = bed_id and is_household_member(rb.household_id)));
create policy "members can manage hydro_systems" on public.hydro_systems for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "members can manage hydro_slots" on public.hydro_slots for all using (exists (select 1 from public.hydro_systems hs where hs.id = system_id and is_household_member(hs.household_id)));
create policy "members can manage seed_trays" on public.seed_trays for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "members can manage tray_cells" on public.tray_cells for all using (exists (select 1 from public.seed_trays st where st.id = tray_id and is_household_member(st.household_id)));
create policy "members can manage plants" on public.plants for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "members can manage plant_events" on public.plant_events for all using (exists (select 1 from public.plants p where p.id = plant_id and is_household_member(p.household_id)));
