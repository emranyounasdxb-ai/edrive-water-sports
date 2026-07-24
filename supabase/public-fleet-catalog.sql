-- Public fleet catalog for the website.
-- Run once in Supabase SQL Editor. Safe to rerun.
-- This function exposes only public display fields and does not change existing fleet records.

begin;

create or replace function public.get_public_fleet_units()
returns table (
  id uuid,
  vehicle_code text,
  vehicle_name text,
  vehicle_type text,
  capacity integer,
  status text,
  brand text,
  model text,
  year integer,
  color text,
  location text,
  image_url text,
  description text,
  sort_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.id,
    coalesce(nullif(btrim(v.vehicle_code), ''), 'FLEET')::text as vehicle_code,
    coalesce(
      nullif(btrim(coalesce(v.vehicle_name, v.name)), ''),
      concat(
        case when lower(coalesce(v.vehicle_type::text, v.type::text, '')) like '%ski%' then 'Jet Ski ' else 'Jet Car ' end,
        coalesce(nullif(btrim(v.vehicle_code), ''), 'Unit')
      )
    )::text as vehicle_name,
    coalesce(nullif(lower(v.vehicle_type::text), ''), nullif(lower(v.type::text), ''), 'jet_car')::text as vehicle_type,
    greatest(coalesce(v.capacity, 2), 1)::integer as capacity,
    lower(coalesce(v.status::text, 'available'))::text as status,
    nullif(btrim(coalesce(v.brand, '')), '')::text as brand,
    nullif(btrim(coalesce(v.model, '')), '')::text as model,
    v.year::integer as year,
    nullif(btrim(coalesce(v.color, '')), '')::text as color,
    nullif(btrim(coalesce(v.location, 'Dubai Islands')), '')::text as location,
    coalesce(
      nullif(btrim(coalesce(v.primary_image_url, '')), ''),
      nullif(btrim(coalesce(v.main_image_url, '')), '')
    )::text as image_url,
    nullif(btrim(coalesce(v.description, '')), '')::text as description,
    coalesce(v.sort_order, 100)::integer as sort_order
  from public.vehicles v
  where lower(coalesce(v.status::text, '')) in ('available', 'booked', 'reserved', 'assigned', 'in_use')
  order by coalesce(v.sort_order, 100), lower(coalesce(v.vehicle_type::text, v.type::text, '')), lower(coalesce(v.vehicle_code, ''));
$$;

revoke all on function public.get_public_fleet_units() from public;
grant execute on function public.get_public_fleet_units() to anon, authenticated;

commit;

notify pgrst, 'reload schema';
