with package_locations(location_name, location_order) as (
  values
    ('Jumeirah', 1),
    ('Dubai Marina', 2),
    ('Dubai Harbour', 3),
    ('Dubai Islands', 4),
    ('Fishing Harbour', 5)
), package_templates(package_code, title_suffix, category, duration_minutes, base_price, b2b_price, capacity, description_prefix, template_order) as (
  values
    ('jet-car-2-seater-20-minutes', 'Jet Car 2 Seater - 20 Minutes', 'jet_car_rental', 20, 500, 350, 2, 'Premium 2 seater jet car ride from', 10),
    ('jet-car-2-seater-30-minutes', 'Jet Car 2 Seater - 30 Minutes', 'jet_car_rental', 30, 650, 450, 2, 'Premium 2 seater jet car ride from', 20),
    ('jet-car-2-seater-60-minutes', 'Jet Car 2 Seater - 60 Minutes', 'jet_car_rental', 60, 1100, 800, 2, 'Premium 2 seater jet car ride from', 30),
    ('jet-car-4-seater-20-minutes', 'Jet Car 4 Seater - 20 Minutes', 'jet_car_rental', 20, 650, 400, 4, 'Premium 4 seater jet car ride from', 40),
    ('jet-car-4-seater-30-minutes', 'Jet Car 4 Seater - 30 Minutes', 'jet_car_rental', 30, 850, 500, 4, 'Premium 4 seater jet car ride from', 50),
    ('jet-car-4-seater-60-minutes', 'Jet Car 4 Seater - 60 Minutes', 'jet_car_rental', 60, 1200, 900, 4, 'Premium 4 seater jet car ride from', 60),
    ('jet-ski-30-minutes', 'Jet Ski - 30 Minutes', 'jet_ski_rental', 30, 300, 200, 2, 'Premium jet ski ride from', 70),
    ('jet-ski-60-minutes', 'Jet Ski - 60 Minutes', 'jet_ski_rental', 60, 550, 350, 2, 'Premium jet ski ride from', 80)
)
insert into public.packages (
  title,
  slug,
  category,
  location,
  duration_minutes,
  base_price,
  b2b_price,
  vat_percent,
  capacity,
  short_description,
  status,
  is_featured,
  display_order
)
select
  package_locations.location_name || ' ' || package_templates.title_suffix,
  lower(regexp_replace(package_locations.location_name || '-' || package_templates.package_code, '[^a-z0-9]+', '-', 'g')),
  package_templates.category,
  package_locations.location_name,
  package_templates.duration_minutes,
  package_templates.base_price,
  package_templates.b2b_price,
  5,
  package_templates.capacity,
  package_templates.description_prefix || ' ' || package_locations.location_name || '. Price is per vehicle.',
  'active',
  true,
  (package_locations.location_order * 100) + package_templates.template_order
from package_locations
cross join package_templates
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
