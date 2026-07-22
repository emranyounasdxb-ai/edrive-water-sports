-- eDrive Fleet partial edit, enum-cast, and image upload rollout.
-- Run once in Supabase SQL Editor after fleet-asset-hardening.sql.
-- Rerunnable and safe for existing fleet rows.

begin;

create or replace function public.validate_fleet_asset_identifiers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(btrim(coalesce(new.vehicle_code, '')), '\s+', '-', 'g'));
  v_reg text := upper(regexp_replace(btrim(coalesce(new.reg_no, '')), '\s+', ' ', 'g'));
  v_imei text := regexp_replace(coalesce(new.device_imei, ''), '[^0-9]', '', 'g');
  v_vin text := upper(btrim(coalesce(new.chassis_vin, '')));
  v_new_status text := lower(coalesce(new.status::text, 'available'));
  v_old_status text := '';
begin
  if tg_op = 'UPDATE' then
    v_old_status := lower(coalesce(old.status::text, ''));
    if v_reg = '' and nullif(btrim(coalesce(old.reg_no, '')), '') is not null then
      v_reg := upper(regexp_replace(btrim(old.reg_no), '\s+', ' ', 'g'));
    end if;
  end if;

  if v_code !~ '^[A-Z0-9][A-Z0-9-]{2,39}$' then
    raise exception 'Fleet code must contain 3-40 letters, numbers, or hyphens.';
  end if;

  if tg_op = 'INSERT' and length(v_reg) < 3 then
    raise exception 'Registration number is required for every new fleet unit.';
  end if;

  if tg_op = 'UPDATE' and v_new_status = 'available' and v_old_status <> 'available' and length(v_reg) < 3 then
    raise exception 'Add the required unique registration number before making this unit Available.';
  end if;

  if coalesce(new.capacity, 0) < 1 or coalesce(new.capacity, 0) > 12 then
    raise exception 'Fleet capacity must be between 1 and 12.';
  end if;

  if v_imei <> '' and (length(v_imei) < 10 or length(v_imei) > 20) then
    raise exception 'Tracker IMEI must contain 10-20 digits.';
  end if;

  if v_new_status not in (
    'available', 'booked', 'reserved', 'assigned', 'in_use', 'maintenance',
    'out_of_service', 'retired', 'inactive', 'for_sale'
  ) then
    raise exception 'Fleet lifecycle status is invalid.';
  end if;

  if v_new_status = 'available' and new.registration_expiry is not null and new.registration_expiry < current_date then
    raise exception 'A fleet unit with expired registration cannot be marked Available.';
  end if;

  if v_new_status = 'available' and new.insurance_expiry is not null and new.insurance_expiry < current_date then
    raise exception 'A fleet unit with expired insurance cannot be marked Available.';
  end if;

  new.vehicle_code := v_code;
  new.reg_no := nullif(v_reg, '');
  new.device_imei := nullif(v_imei, '');
  new.chassis_vin := nullif(v_vin, '');
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.validate_fleet_asset_identifiers() from public;
drop trigger if exists vehicles_validate_identifiers_trigger on public.vehicles;
create trigger vehicles_validate_identifiers_trigger
before insert or update on public.vehicles
for each row execute function public.validate_fleet_asset_identifiers();

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
      v_code, v_name, v_type::public.vehicle_type, v_name, lower(v_code), v_type,
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
        type = v_type,
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

-- Ensure lifecycle updates also cast text to the vehicle_status enum.
create or replace function public.set_fleet_asset_status(
  p_vehicle_id uuid,
  p_status text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_edrive_role();
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_old_status text;
  v_reg text;
  v_registration_expiry date;
  v_insurance_expiry date;
begin
  if v_role not in ('super_admin', 'maintenance_staff') then
    raise exception 'You do not have permission to change fleet lifecycle status.';
  end if;
  if v_role = 'maintenance_staff' and v_status not in ('maintenance', 'out_of_service', 'available') then
    raise exception 'Maintenance Staff can only set Maintenance, Out of Service, or Available.';
  end if;
  if v_status not in ('available', 'booked', 'reserved', 'assigned', 'in_use', 'maintenance', 'out_of_service', 'retired', 'for_sale') then
    raise exception 'Fleet lifecycle status is invalid.';
  end if;

  select lower(coalesce(status::text, '')), reg_no, registration_expiry, insurance_expiry
  into v_old_status, v_reg, v_registration_expiry, v_insurance_expiry
  from public.vehicles
  where id = p_vehicle_id
  for update;

  if not found then raise exception 'Fleet unit was not found.'; end if;
  if v_status = 'available' and length(btrim(coalesce(v_reg, ''))) < 3 then raise exception 'Add the required unique registration number before making this unit Available.'; end if;
  if v_status = 'available' and v_registration_expiry is not null and v_registration_expiry < current_date then raise exception 'Registration is expired. Renew it before making this unit Available.'; end if;
  if v_status = 'available' and v_insurance_expiry is not null and v_insurance_expiry < current_date then raise exception 'Insurance is expired. Renew it before making this unit Available.'; end if;

  update public.vehicles
  set status = v_status::public.vehicle_status,
      is_available = v_status = 'available',
      is_archived = v_status = 'retired',
      is_visible_public = v_status <> 'retired',
      retired_at = case when v_status = 'retired' then coalesce(retired_at, now()) else null end,
      notes = case when nullif(btrim(coalesce(p_note, '')), '') is null then notes else concat_ws(E'\n', nullif(btrim(coalesce(notes, '')), ''), left(btrim(p_note), 1000)) end,
      updated_at = now()
  where id = p_vehicle_id;

  insert into public.fleet_maintenance_logs (vehicle_id, status_from, status_to, note, actor_id)
  values (p_vehicle_id, v_old_status, v_status, nullif(left(btrim(coalesce(p_note, '')), 1000), ''), auth.uid());
  return true;
end;
$$;

revoke all on function public.set_fleet_asset_status(uuid, text, text) from public;
grant execute on function public.set_fleet_asset_status(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fleet-images',
  'fleet-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fleet_images_public_read" on storage.objects;
create policy "fleet_images_public_read"
on storage.objects
for select to public
using (bucket_id = 'fleet-images');

drop policy if exists "fleet_images_super_admin_insert" on storage.objects;
create policy "fleet_images_super_admin_insert"
on storage.objects
for insert to authenticated
with check (bucket_id = 'fleet-images' and public.has_edrive_role(array['super_admin']));

drop policy if exists "fleet_images_super_admin_update" on storage.objects;
create policy "fleet_images_super_admin_update"
on storage.objects
for update to authenticated
using (bucket_id = 'fleet-images' and public.has_edrive_role(array['super_admin']))
with check (bucket_id = 'fleet-images' and public.has_edrive_role(array['super_admin']));

drop policy if exists "fleet_images_super_admin_delete" on storage.objects;
create policy "fleet_images_super_admin_delete"
on storage.objects
for delete to authenticated
using (bucket_id = 'fleet-images' and public.has_edrive_role(array['super_admin']));

commit;

notify pgrst, 'reload schema';
