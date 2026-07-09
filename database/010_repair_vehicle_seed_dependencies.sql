alter table public.vehicles
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

update public.vehicles
set slug = 'vehicle-' || substr(id::text, 1, 8)
where slug is null or trim(slug) = '';

update public.vehicles
set name = coalesce(nullif(trim(name), ''), slug),
    type = coalesce(type, 'jet_ski'::public.vehicle_type),
    rental_price_aed_per_hour = coalesce(rental_price_aed_per_hour, 0),
    location = coalesce(nullif(trim(location), ''), 'Dubai'),
    capacity = greatest(coalesce(capacity, 1), 1),
    is_available = coalesce(is_available, true),
    is_visible_public = coalesce(is_visible_public, true),
    is_archived = coalesce(is_archived, false),
    updated_at = now();

create unique index if not exists vehicles_slug_unique
on public.vehicles(slug);

insert into public.vehicles (
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
