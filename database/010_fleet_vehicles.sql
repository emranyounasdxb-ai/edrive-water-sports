alter table public.vehicles
add column if not exists vehicle_code text;

alter table public.vehicles
add column if not exists brand text;

alter table public.vehicles
add column if not exists model text;

alter table public.vehicles
add column if not exists year integer;

alter table public.vehicles
add column if not exists reg_no text;

alter table public.vehicles
add column if not exists device_imei text;

alter table public.vehicles
add column if not exists color text;

alter table public.vehicles
add column if not exists date_of_installation date;

alter table public.vehicles
add column if not exists expiry_date date;

alter table public.vehicles
add column if not exists main_image_url text;

alter table public.vehicles
add column if not exists status text not null default 'available';

alter table public.vehicles
add column if not exists notes text;

create unique index if not exists vehicles_vehicle_code_unique
on public.vehicles (lower(vehicle_code))
where vehicle_code is not null;

create index if not exists vehicles_status_idx on public.vehicles(status);
create index if not exists vehicles_location_idx on public.vehicles(location);

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
using (is_visible_public = true and is_archived = false);

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
  notes
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
  'Seed fleet record. Full details and images can be updated from the fleet dashboard.'
from fleet_seed
on conflict (slug) do update set
  vehicle_code = excluded.vehicle_code,
  name = excluded.name,
  type = excluded.type,
  description = excluded.description,
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
