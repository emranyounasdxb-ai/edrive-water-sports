do $$ begin
  create type public.vehicle_type as enum ('jet_ski', 'jet_car');
exception when duplicate_object then null; end $$;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid()
);

alter table public.vehicles add column if not exists name text;
alter table public.vehicles add column if not exists slug text;
alter table public.vehicles add column if not exists type public.vehicle_type default 'jet_ski'::public.vehicle_type;
alter table public.vehicles add column if not exists description text;
alter table public.vehicles add column if not exists rental_price_aed_per_hour numeric(12,2) default 0;
alter table public.vehicles add column if not exists sale_price_aed numeric(12,2);
alter table public.vehicles add column if not exists location text default 'Dubai';
alter table public.vehicles add column if not exists capacity integer default 2;
alter table public.vehicles add column if not exists is_available boolean default true;
alter table public.vehicles add column if not exists is_visible_public boolean default true;
alter table public.vehicles add column if not exists is_archived boolean default false;
alter table public.vehicles add column if not exists primary_image_url text;
alter table public.vehicles add column if not exists sort_order integer default 100;
alter table public.vehicles add column if not exists created_at timestamptz default now();
alter table public.vehicles add column if not exists updated_at timestamptz default now();

alter table public.vehicles add column if not exists vehicle_code text;
alter table public.vehicles add column if not exists brand text;
alter table public.vehicles add column if not exists model text;
alter table public.vehicles add column if not exists year integer;
alter table public.vehicles add column if not exists reg_no text;
alter table public.vehicles add column if not exists device_imei text;
alter table public.vehicles add column if not exists color text;
alter table public.vehicles add column if not exists date_of_installation date;
alter table public.vehicles add column if not exists expiry_date date;
alter table public.vehicles add column if not exists main_image_url text;
alter table public.vehicles add column if not exists status text default 'available';
alter table public.vehicles add column if not exists notes text;

update public.vehicles
set
  slug = coalesce(nullif(slug, ''), 'vehicle-' || left(id::text, 8)),
  name = coalesce(nullif(name, ''), vehicle_code, 'Vehicle ' || left(id::text, 8)),
  location = coalesce(nullif(location, ''), 'Dubai'),
  capacity = coalesce(capacity, 2),
  rental_price_aed_per_hour = coalesce(rental_price_aed_per_hour, 0),
  is_available = coalesce(is_available, true),
  is_visible_public = coalesce(is_visible_public, true),
  is_archived = coalesce(is_archived, false),
  status = coalesce(nullif(status, ''), case when coalesce(is_available, true) then 'available' else 'inactive' end),
  sort_order = coalesce(sort_order, 100),
  updated_at = now();

create unique index if not exists vehicles_slug_unique on public.vehicles(slug);
create unique index if not exists vehicles_vehicle_code_unique on public.vehicles (lower(vehicle_code)) where vehicle_code is not null;
create index if not exists vehicles_type_idx on public.vehicles(type);
create index if not exists vehicles_status_idx on public.vehicles(status);
create index if not exists vehicles_location_idx on public.vehicles(location);
create index if not exists vehicles_public_idx on public.vehicles(is_visible_public, is_available, is_archived);

create or replace function public.current_admin_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.admin_users
  where auth_user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

alter table public.vehicles enable row level security;

drop policy if exists "vehicles public read" on public.vehicles;
drop policy if exists "vehicles staff manage" on public.vehicles;
drop policy if exists "vehicles admin manage" on public.vehicles;

create policy "vehicles public read" on public.vehicles
for select to anon, authenticated
using (coalesce(is_visible_public, true) = true and coalesce(is_archived, false) = false);

create policy "vehicles admin manage" on public.vehicles
for all to authenticated
using (public.current_admin_role() in ('super_admin', 'admin', 'manager', 'booking_staff'))
with check (public.current_admin_role() in ('super_admin', 'admin', 'manager', 'booking_staff'));

with fleet_seed as (
  select
    'JC-' || lpad(series_no::text, 2, '0') as vehicle_code,
    'Jet Car ' || lpad(series_no::text, 2, '0') as vehicle_name,
    'jet-car-' || lpad(series_no::text, 2, '0') as slug,
    'jet_car'::public.vehicle_type as vehicle_type,
    4 as capacity,
    '/images/fleet/jet-car-4-seater.webp' as image_path,
    series_no as sort_order
  from generate_series(1, 12) as series_no

  union all

  select
    'JS-' || lpad(series_no::text, 2, '0') as vehicle_code,
    'Jet Ski ' || lpad(series_no::text, 2, '0') as vehicle_name,
    'jet-ski-' || lpad(series_no::text, 2, '0') as slug,
    'jet_ski'::public.vehicle_type as vehicle_type,
    2 as capacity,
    '/images/fleet/jet-ski-2-seater.webp' as image_path,
    100 + series_no as sort_order
  from generate_series(1, 4) as series_no
)
insert into public.vehicles (
  vehicle_code,
  name,
  slug,
  type,
  description,
  rental_price_aed_per_hour,
  location,
  capacity,
  is_available,
  is_visible_public,
  is_archived,
  primary_image_url,
  main_image_url,
  sort_order,
  status,
  notes,
  created_at,
  updated_at
)
select
  vehicle_code,
  vehicle_name,
  slug,
  vehicle_type,
  case when vehicle_type = 'jet_car' then '4 seater jet car fleet unit.' else '2 seater jet ski fleet unit.' end,
  0,
  'Dubai',
  capacity,
  true,
  true,
  false,
  image_path,
  image_path,
  sort_order,
  'available',
  'Seed fleet record. Full details and images can be updated from the fleet dashboard.',
  now(),
  now()
from fleet_seed
on conflict (slug) do update set
  vehicle_code = excluded.vehicle_code,
  name = excluded.name,
  type = excluded.type,
  description = excluded.description,
  rental_price_aed_per_hour = excluded.rental_price_aed_per_hour,
  location = excluded.location,
  capacity = excluded.capacity,
  is_available = excluded.is_available,
  is_visible_public = excluded.is_visible_public,
  is_archived = excluded.is_archived,
  primary_image_url = excluded.primary_image_url,
  main_image_url = excluded.main_image_url,
  sort_order = excluded.sort_order,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();