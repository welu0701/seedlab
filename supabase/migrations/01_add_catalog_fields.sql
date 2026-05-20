-- Add new optional fields to vegetable_catalog table
-- This migration checks if it's already been applied before running

do $$
begin
  if not exists (select 1 from public._migrations where name = '01_add_catalog_fields') then
    -- Add columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name='vegetable_catalog' and column_name='spacing_inches') then
      alter table public.vegetable_catalog add column spacing_inches integer;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='vegetable_catalog' and column_name='companion_plants') then
      alter table public.vegetable_catalog add column companion_plants text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='vegetable_catalog' and column_name='bolt_info') then
      alter table public.vegetable_catalog add column bolt_info text;
    end if;

    -- Record this migration as applied
    insert into public._migrations (name) values ('01_add_catalog_fields');

    raise notice 'Migration 01_add_catalog_fields applied successfully';
  else
    raise notice 'Migration 01_add_catalog_fields already applied, skipping';
  end if;
end $$;
