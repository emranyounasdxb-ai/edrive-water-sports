-- Fix package catalog saves when public.packages.category uses the rental_category enum.
-- Run once in Supabase SQL Editor. Safe to rerun.
-- Existing packages, prices, images, and booking records are not changed.

begin;

create or replace function public.save_package_catalog_entry(
  p_payload jsonb,
  p_package_id uuid default null
)
returns table (package_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text := left(btrim(coalesce(p_payload->>'title', '')), 120);
  v_slug text := left(lower(btrim(coalesce(p_payload->>'slug', ''))), 160);
  v_category text := lower(btrim(coalesce(p_payload->>'category', '')));
  v_duration integer;
  v_capacity integer;
  v_base_price numeric;
  v_b2b_price numeric;
  v_image_url text := left(btrim(coalesce(p_payload->>'image_url', '')), 500);
  v_description text := left(btrim(coalesce(p_payload->>'short_description', '')), 500);
  v_status text := lower(btrim(coalesce(p_payload->>'status', 'active')));
  v_featured boolean := coalesce((p_payload->>'is_featured')::boolean, false);
  v_display_order integer;
  v_id uuid;
begin
  if not public.has_edrive_role(array['super_admin']) then
    raise exception 'Only the Super Admin can create or edit packages.';
  end if;

  begin
    v_duration := (p_payload->>'duration_minutes')::integer;
    v_capacity := (p_payload->>'capacity')::integer;
    v_base_price := (p_payload->>'base_price')::numeric;
    v_b2b_price := (p_payload->>'b2b_price')::numeric;
    v_display_order := coalesce((p_payload->>'display_order')::integer, 100);
  exception when others then
    raise exception 'Package configuration contains an invalid number.';
  end;

  if length(v_title) < 5 then raise exception 'Package title must contain at least 5 characters.'; end if;
  if v_title !~* '^[a-z0-9][a-z0-9 ''&()+,./-]*$' then raise exception 'Package title contains unsupported characters.'; end if;
  if v_slug = '' or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Package slug is invalid.'; end if;
  if v_category not in ('jet_car_rental', 'jet_ski_rental', 'yacht_rental') then raise exception 'Package category is invalid.'; end if;
  if v_duration < 10 or v_duration > 480 then raise exception 'Duration must be between 10 and 480 minutes.'; end if;
  if v_capacity < 1 or v_capacity > 12 then raise exception 'Capacity must be between 1 and 12.'; end if;
  if v_base_price <= 0 then raise exception 'B2C price must be greater than zero.'; end if;
  if v_b2b_price < 0 then raise exception 'B2B price cannot be negative.'; end if;
  if v_b2b_price > v_base_price then raise exception 'B2B price cannot be higher than B2C price.'; end if;
  if v_status not in ('active', 'draft', 'inactive') then raise exception 'Package status is invalid.'; end if;
  if v_display_order < 0 or v_display_order > 9999 then raise exception 'Display order must be between 0 and 9999.'; end if;

  if p_package_id is null then
    insert into public.packages (
      title, slug, category, duration_minutes, base_price, b2b_price, capacity,
      image_url, short_description, status, is_featured, display_order
    ) values (
      v_title, v_slug, v_category::public.rental_category, v_duration, v_base_price, v_b2b_price, v_capacity,
      nullif(v_image_url, ''), nullif(v_description, ''), v_status, v_featured, v_display_order
    ) returning id into v_id;
  else
    update public.packages
    set title = v_title,
        slug = v_slug,
        category = v_category::public.rental_category,
        duration_minutes = v_duration,
        base_price = v_base_price,
        b2b_price = v_b2b_price,
        capacity = v_capacity,
        image_url = nullif(v_image_url, ''),
        short_description = nullif(v_description, ''),
        status = v_status,
        is_featured = v_featured,
        display_order = v_display_order
    where id = p_package_id
    returning id into v_id;

    if v_id is null then raise exception 'Package was not found.'; end if;
  end if;

  return query select v_id;
end;
$$;

revoke all on function public.save_package_catalog_entry(jsonb, uuid) from public;
grant execute on function public.save_package_catalog_entry(jsonb, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
