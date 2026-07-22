-- Final eDrive Fleet edit enum correction.
-- Run once in Supabase SQL Editor. Safe to rerun.
-- This fixes the legacy `type` column when it also uses public.vehicle_type.

begin;

create or replace function public.save_fleet_asset_entry(
  p_payload jsonb,
  p_vehicle_id uuid default null
)
returns table (vehicle_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(btrim(coalesce(p_payload->>'vehicle_code', '')), '\s+', '-', 'g'));
  v_name text := left(btrim(coalesce(p_payload->>'vehicle_name', p_payload->>'name', '')), 120);
  v_type text := lower(btrim(coalesce(p_payload->>'vehicle_type', p_payload->>'type', '')));
  v_location text := left(btrim(coalesce(p_payload->>'location', 'Dubai')), 120);
  v_reg text := upper(regexp_replace(btrim(coalesce(p_payload->>'reg_no', '')), '\s+', ' ', 'g'));
  v_imei text := nullif(regexp_replace(coalesce(p_payload->>'device_imei', ''), '[^0-9]', '', 'g'), '');
  v_vin text := nullif(upper(btrim(coalesce(p_payload->>'chassis_vin', ''))), '');
  v_engine text := nullif(upper(btrim(coalesce(p_payload->>'engine_serial', ''))), '');
  v_status text := lower(btrim(coalesce(p_payload->>'status', 'available')));
  v_capacity integer;
  v_year integer;
  v_sort_order integer;
  v_registration_expiry date;
  v_insurance_expiry date;
  v_installation_date date;
  v_id uuid;
  v_existing_reg text;
  v_existing_status text := '';
  v_effective_reg text;
begin
  if not public.has_edrive_role(array['super_admin']) then
    raise exception 'Only the Super Admin can create or edit fleet master data.';
  end if;

  if p_vehicle_id is not null then
    select reg_no, lower(coalesce(status::text, ''))
    into v_existing_reg, v_existing_status
    from public.vehicles
    where id = p_vehicle_id
    for update;
    if not found then raise exception 'Fleet unit was not found.'; end if;
  end if;

  begin
    v_capacity := (p_payload->>'capacity')::integer;
    v_year := nullif(p_payload->>'year', '')::integer;
    v_sort_order := coalesce(nullif(p_payload->>'sort_order', '')::integer, 100);
    v_registration_expiry := nullif(p_payload->>'registration_expiry', '')::date;
    v_insurance_expiry := nullif(p_payload->>'insurance_expiry', '')::date;
    v_installation_date := nullif(p_payload->>'date_of_installation', '')::date;
  exception when others then
    raise exception 'Fleet configuration contains an invalid number or date.';
  end;

  if v_code !~ '^[A-Z0-9][A-Z0-9-]{2,39}$' then raise exception 'Fleet code must contain 3-40 letters, numbers, or hyphens.'; end if;
  if length(v_name) < 3 then raise exception 'Vehicle name must contain at least 3 characters.'; end if;
  if v_type not in ('jet_car', 'jet_ski') then raise exception 'Vehicle type is invalid.'; end if;
  if v_reg <> '' and (length(v_reg) < 3 or length(v_reg) > 40) then raise exception 'Registration number must contain 3-40 characters.'; end if;
  if p_vehicle_id is null and length(v_reg) < 3 then raise exception 'Registration number is required for every new fleet unit.'; end if;
  if v_capacity < 1 or v_capacity > 12 then raise exception 'Fleet capacity must be between 1 and 12.'; end if;
  if v_year is not null and (v_year < 1990 or v_year > extract(year from current_date)::integer + 1) then raise exception 'Vehicle year is outside the allowed range.'; end if;
  if v_imei is not null and (length(v_imei) < 10 or length(v_imei) > 20) then raise exception 'Tracker IMEI must contain 10-20 digits.'; end if;
  if v_sort_order < 0 or v_sort_order > 9999 then raise exception 'Display order must be between 0 and 9999.'; end if;
  if v_status not in ('available', 'booked', 'reserved', 'assigned', 'in_use', 'maintenance', 'out_of_service', 'retired', 'for_sale') then raise exception 'Fleet lifecycle status is invalid.'; end if;

  v_effective_reg := nullif(v_reg, '');
  if p_vehicle_id is not null and v_effective_reg is null then
    v_effective_reg := nullif(upper(regexp_replace(btrim(coalesce(v_existing_reg, '')), '\s+', ' ', 'g')), '');
  end if;

  if p_vehicle_id is not null and v_status = 'available' and v_existing_status <> 'available' and coalesce(length(v_effective_reg), 0) < 3 then
    raise exception 'Add the required unique registration number before making this unit Available.';
  end if;

  if v_status = 'available' and v_registration_expiry is not null and v_registration_expiry < current_date then raise exception 'Expired registration cannot be marked Available.'; end if;
  if v_status = 'available' and v_insurance_expiry is not null and v_insurance_expiry < current_date then raise exception 'Expired insurance cannot be marked Available.'; end if;

  if p_vehicle_id is null then
    insert into public.vehicles (
      vehicle_code, vehicle_name, vehicle_type, name, slug, type, description,
      rental_price_aed_per_hour, location, capacity, status, brand, model, year,
      reg_no, registration_expiry, insurance_number, insurance_expiry, device_imei,
      chassis_vin, engine_serial, color, date_of_installation, expiry_date,
      primary_image_url, main_image_url, notes, sort_order, is_available,
      is_visible_public, is_archived, retired_at, updated_at
    ) values (
      v_code, v_name, v_type::public.vehicle_type, v_name, lower(v_code), v_type::public.vehicle_type,
      left(coalesce(p_payload->>'description', ''), 1000),
      0, v_location, v_capacity, v_status::public.vehicle_status,
      left(coalesce(p_payload->>'brand', ''), 80), left(coalesce(p_payload->>'model', ''), 80), v_year,
      v_effective_reg, v_registration_expiry, nullif(left(btrim(coalesce(p_payload->>'insurance_number', '')), 80), ''), v_insurance_expiry, v_imei,
      v_vin, v_engine, left(coalesce(p_payload->>'color', ''), 60), v_installation_date, v_registration_expiry,
      nullif(left(btrim(coalesce(p_payload->>'primary_image_url', '')), 500), ''),
      nullif(left(btrim(coalesce(p_payload->>'main_image_url', '')), 500), ''),
      left(coalesce(p_payload->>'notes', ''), 2000), v_sort_order,
      v_status = 'available', v_status <> 'retired', v_status = 'retired',
      case when v_status = 'retired' then now() else null end, now()
    ) returning id into v_id;
  else
    update public.vehicles
    set vehicle_code = v_code,
        vehicle_name = v_name,
        vehicle_type = v_type::public.vehicle_type,
        name = v_name,
        slug = lower(v_code),
        type = v_type::public.vehicle_type,
        description = left(coalesce(p_payload->>'description', ''), 1000),
        location = v_location,
        capacity = v_capacity,
        status = v_status::public.vehicle_status,
        brand = left(coalesce(p_payload->>'brand', ''), 80),
        model = left(coalesce(p_payload->>'model', ''), 80),
        year = v_year,
        reg_no = v_effective_reg,
        registration_expiry = v_registration_expiry,
        insurance_number = nullif(left(btrim(coalesce(p_payload->>'insurance_number', '')), 80), ''),
        insurance_expiry = v_insurance_expiry,
        device_imei = v_imei,
        chassis_vin = v_vin,
        engine_serial = v_engine,
        color = left(coalesce(p_payload->>'color', ''), 60),
        date_of_installation = v_installation_date,
        expiry_date = v_registration_expiry,
        primary_image_url = nullif(left(btrim(coalesce(p_payload->>'primary_image_url', '')), 500), ''),
        main_image_url = nullif(left(btrim(coalesce(p_payload->>'main_image_url', '')), 500), ''),
        notes = left(coalesce(p_payload->>'notes', ''), 2000),
        sort_order = v_sort_order,
        is_available = v_status = 'available',
        is_visible_public = v_status <> 'retired',
        is_archived = v_status = 'retired',
        retired_at = case when v_status = 'retired' then coalesce(retired_at, now()) else null end,
        updated_at = now()
    where id = p_vehicle_id
    returning id into v_id;
  end if;

  return query select v_id;
end;
$$;


revoke all on function public.save_fleet_asset_entry(jsonb, uuid) from public;
grant execute on function public.save_fleet_asset_entry(jsonb, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
