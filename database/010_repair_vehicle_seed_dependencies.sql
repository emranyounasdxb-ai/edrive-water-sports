alter table public.vehicles
  add column if not exists vehicle_code text,
  add column if not exists vehicle_name text,
  add column if not exists vehicle_type text,
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists type public.vehicle_type,
  add column if not exists description text,
  add column if not exists rental_price_aed_per_hour numeric(12,2) not null default 0,
  add column if not exists sale_price_aed numeric(12,2),
  add column if not exists location text not null default 'Dubai',
  add column if not exists capacity integer not null default 1,
  add column if not exists is_available boolean not null default true,
  add column if not exists is_visible_public boolean not null default true,
  add column if not exists is_archived boolean not null default false,
  add column if not exists primary_image_url text,
  add column if not exists sort_order integer not null default 100,
  add column if not exists updated_at timestamptz not null default now();

alter table public.vehicles
  alter column vehicle_code set default ('VH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  alter column vehicle_name set default 'Vehicle',
  alter column vehicle_type set default 'jet_ski';

update public.vehicles
set slug = 'vehicle-' || substr(id::text, 1, 8)
where slug is null or trim(slug) = '';

update public.vehicles
set vehicle_code = coalesce(nullif(trim(vehicle_code), ''), 'VH-' || upper(substr(replace(id::text, '-', ''), 1, 8))),
    vehicle_name = coalesce(nullif(trim(vehicle_name), ''), nullif(trim(name), ''), slug, 'Vehicle'),
    vehicle_type = coalesce(nullif(trim(vehicle_type), ''), type::text, 'jet_ski'),
    name = coalesce(nullif(trim(name), ''), nullif(trim(vehicle_name), ''), slug, 'Vehicle'),
    type = coalesce(type, case when vehicle_type = 'jet_car' then 'jet_car'::public.vehicle_type else 'jet_ski'::public.vehicle_type end),
    rental_price_aed_per_hour = coalesce(rental_price_aed_per_hour, 0),
    location = coalesce(nullif(trim(location), ''), 'Dubai'),
    capacity = greatest(coalesce(capacity, 1), 1),
    is_available = coalesce(is_available, true),
    is_visible_public = coalesce(is_visible_public, true),
    is_archived = coalesce(is_archived, false),
    updated_at = now();

create unique index if not exists vehicles_slug_unique
on public.vehicles(slug);

create unique index if not exists vehicles_vehicle_code_unique
on public.vehicles(vehicle_code);

insert into public.vehicles (
  vehicle_code,
  vehicle_name,
  vehicle_type,
  name,
  slug,
  type,
  description,
  rental_price_aed_per_hour,
  sale_price_aed,
  location,
  capacity,
  is_available,
  is_visible_public,
  is_archived,
  sort_order
) values
(
  'JS-1100-001',
  'Premium Jet Ski 1100CC',
  'jet_ski',
  'Premium Jet Ski 1100CC',
  'premium-jet-ski-1100cc',
  'jet_ski',
  'Premium Dubai jet ski rental for single or couple ride.',
  350,
  null,
  'Dubai Marina',
  2,
  true,
  true,
  false,
  10
),
(
  'JC-LUX-001',
  'Luxury Jet Car',
  'jet_car',
  'Luxury Jet Car',
  'luxury-jet-car',
  'jet_car',
  'Luxury jet car experience for Dubai water sports booking.',
  700,
  null,
  'Dubai Marina',
  2,
  true,
  true,
  false,
  20
)
on conflict (slug) do update set
  vehicle_code = excluded.vehicle_code,
  vehicle_name = excluded.vehicle_name,
  vehicle_type = excluded.vehicle_type,
  name = excluded.name,
  type = excluded.type,
  description = excluded.description,
  rental_price_aed_per_hour = excluded.rental_price_aed_per_hour,
  sale_price_aed = excluded.sale_price_aed,
  location = excluded.location,
  capacity = excluded.capacity,
  is_available = true,
  is_visible_public = true,
  is_archived = false,
  sort_order = excluded.sort_order,
  updated_at = now();
