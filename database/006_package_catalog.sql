create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null default 'jet_car_rental',
  duration_minutes integer not null default 30,
  base_price numeric(12,2) not null default 0,
  vat_percent numeric(5,2) not null default 5,
  capacity integer not null default 2,
  image_url text,
  short_description text,
  location text not null default 'Dubai Islands',
  status text not null default 'active',
  b2b_price numeric(12,2) not null default 0,
  is_featured boolean not null default false,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.packages add column if not exists location text not null default 'Dubai Islands';
alter table public.packages add column if not exists b2b_price numeric(12,2) not null default 0;
alter table public.packages add column if not exists is_featured boolean not null default false;
alter table public.packages add column if not exists display_order integer not null default 100;
alter table public.packages add column if not exists vat_percent numeric(5,2) not null default 5;
alter table public.packages add column if not exists capacity integer not null default 2;
alter table public.packages add column if not exists image_url text;
alter table public.packages add column if not exists short_description text;
alter table public.packages add column if not exists status text not null default 'active';

create index if not exists packages_location_idx on public.packages(location);
create index if not exists packages_status_idx on public.packages(status);
create index if not exists packages_public_idx on public.packages(status, location, category, capacity, duration_minutes);

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

alter table public.packages enable row level security;

drop policy if exists "packages public read" on public.packages;
drop policy if exists "packages staff manage" on public.packages;

create policy "packages public read" on public.packages
for select to anon, authenticated
using (status = 'active');

create policy "packages staff manage" on public.packages
for all to authenticated
using (public.current_admin_role() in ('super_admin', 'admin', 'manager', 'booking_staff'))
with check (public.current_admin_role() in ('super_admin', 'admin', 'manager', 'booking_staff'));

insert into public.packages (title, slug, category, location, duration_minutes, base_price, b2b_price, vat_percent, capacity, short_description, status, is_featured, display_order) values
('Jumeirah Jet Car 2 Seater - 20 Minutes', 'jumeirah-jet-car-2-seater-20-minutes', 'jet_car_rental', 'Jumeirah', 20, 500, 350, 5, 2, 'Premium 2 seater jet car ride from Jumeirah.', 'active', true, 10),
('Jumeirah Jet Car 2 Seater - 30 Minutes', 'jumeirah-jet-car-2-seater-30-minutes', 'jet_car_rental', 'Jumeirah', 30, 650, 450, 5, 2, 'Premium 2 seater jet car ride from Jumeirah.', 'active', true, 20),
('Jumeirah Jet Car 2 Seater - 60 Minutes', 'jumeirah-jet-car-2-seater-60-minutes', 'jet_car_rental', 'Jumeirah', 60, 1100, 800, 5, 2, 'Premium 2 seater jet car ride from Jumeirah.', 'active', true, 30),
('Jumeirah Jet Car 4 Seater - 20 Minutes', 'jumeirah-jet-car-4-seater-20-minutes', 'jet_car_rental', 'Jumeirah', 20, 650, 400, 5, 4, 'Premium 4 seater jet car ride from Jumeirah.', 'active', true, 40),
('Jumeirah Jet Car 4 Seater - 30 Minutes', 'jumeirah-jet-car-4-seater-30-minutes', 'jet_car_rental', 'Jumeirah', 30, 850, 500, 5, 4, 'Premium 4 seater jet car ride from Jumeirah.', 'active', true, 50),
('Jumeirah Jet Car 4 Seater - 60 Minutes', 'jumeirah-jet-car-4-seater-60-minutes', 'jet_car_rental', 'Jumeirah', 60, 1200, 900, 5, 4, 'Premium 4 seater jet car ride from Jumeirah.', 'active', true, 60),
('Dubai Marina Jet Car 2 Seater - 20 Minutes', 'dubai-marina-jet-car-2-seater-20-minutes', 'jet_car_rental', 'Dubai Marina', 20, 500, 350, 5, 2, 'Premium 2 seater jet car ride from Dubai Marina.', 'active', true, 110),
('Dubai Marina Jet Car 2 Seater - 30 Minutes', 'dubai-marina-jet-car-2-seater-30-minutes', 'jet_car_rental', 'Dubai Marina', 30, 650, 450, 5, 2, 'Premium 2 seater jet car ride from Dubai Marina.', 'active', true, 120),
('Dubai Marina Jet Car 4 Seater - 20 Minutes', 'dubai-marina-jet-car-4-seater-20-minutes', 'jet_car_rental', 'Dubai Marina', 20, 650, 400, 5, 4, 'Premium 4 seater jet car ride from Dubai Marina.', 'active', true, 130),
('Dubai Marina Jet Car 4 Seater - 30 Minutes', 'dubai-marina-jet-car-4-seater-30-minutes', 'jet_car_rental', 'Dubai Marina', 30, 850, 500, 5, 4, 'Premium 4 seater jet car ride from Dubai Marina.', 'active', true, 140),
('Dubai Harbour Jet Car 2 Seater - 20 Minutes', 'dubai-harbour-jet-car-2-seater-20-minutes', 'jet_car_rental', 'Dubai Harbour', 20, 500, 350, 5, 2, 'Premium 2 seater jet car ride from Dubai Harbour.', 'active', true, 210),
('Dubai Harbour Jet Car 2 Seater - 30 Minutes', 'dubai-harbour-jet-car-2-seater-30-minutes', 'jet_car_rental', 'Dubai Harbour', 30, 650, 450, 5, 2, 'Premium 2 seater jet car ride from Dubai Harbour.', 'active', true, 220),
('Dubai Harbour Jet Car 4 Seater - 20 Minutes', 'dubai-harbour-jet-car-4-seater-20-minutes', 'jet_car_rental', 'Dubai Harbour', 20, 650, 400, 5, 4, 'Premium 4 seater jet car ride from Dubai Harbour.', 'active', true, 230),
('Dubai Harbour Jet Car 4 Seater - 30 Minutes', 'dubai-harbour-jet-car-4-seater-30-minutes', 'jet_car_rental', 'Dubai Harbour', 30, 850, 500, 5, 4, 'Premium 4 seater jet car ride from Dubai Harbour.', 'active', true, 240),
('Dubai Islands Jet Car 2 Seater - 20 Minutes', 'dubai-islands-jet-car-2-seater-20-minutes', 'jet_car_rental', 'Dubai Islands', 20, 500, 350, 5, 2, 'Premium 2 seater jet car ride from Dubai Islands.', 'active', true, 310),
('Dubai Islands Jet Car 2 Seater - 30 Minutes', 'dubai-islands-jet-car-2-seater-30-minutes', 'jet_car_rental', 'Dubai Islands', 30, 650, 450, 5, 2, 'Premium 2 seater jet car ride from Dubai Islands.', 'active', true, 320),
('Dubai Islands Jet Car 4 Seater - 20 Minutes', 'dubai-islands-jet-car-4-seater-20-minutes', 'jet_car_rental', 'Dubai Islands', 20, 650, 400, 5, 4, 'Premium 4 seater jet car ride from Dubai Islands.', 'active', true, 330),
('Dubai Islands Jet Car 4 Seater - 30 Minutes', 'dubai-islands-jet-car-4-seater-30-minutes', 'jet_car_rental', 'Dubai Islands', 30, 850, 500, 5, 4, 'Premium 4 seater jet car ride from Dubai Islands.', 'active', true, 340),
('Fishing Harbour Jet Car 2 Seater - 20 Minutes', 'fishing-harbour-jet-car-2-seater-20-minutes', 'jet_car_rental', 'Fishing Harbour', 20, 500, 350, 5, 2, 'Premium 2 seater jet car ride from Fishing Harbour.', 'active', true, 410),
('Fishing Harbour Jet Car 2 Seater - 30 Minutes', 'fishing-harbour-jet-car-2-seater-30-minutes', 'jet_car_rental', 'Fishing Harbour', 30, 650, 450, 5, 2, 'Premium 2 seater jet car ride from Fishing Harbour.', 'active', true, 420),
('Fishing Harbour Jet Car 4 Seater - 20 Minutes', 'fishing-harbour-jet-car-4-seater-20-minutes', 'jet_car_rental', 'Fishing Harbour', 20, 650, 400, 5, 4, 'Premium 4 seater jet car ride from Fishing Harbour.', 'active', true, 430),
('Fishing Harbour Jet Car 4 Seater - 30 Minutes', 'fishing-harbour-jet-car-4-seater-30-minutes', 'jet_car_rental', 'Fishing Harbour', 30, 850, 500, 5, 4, 'Premium 4 seater jet car ride from Fishing Harbour.', 'active', true, 440)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  location = excluded.location,
  duration_minutes = excluded.duration_minutes,
  base_price = excluded.base_price,
  b2b_price = excluded.b2b_price,
  vat_percent = excluded.vat_percent,
  capacity = excluded.capacity,
  short_description = excluded.short_description,
  status = excluded.status,
  is_featured = excluded.is_featured,
  display_order = excluded.display_order,
  updated_at = now();
