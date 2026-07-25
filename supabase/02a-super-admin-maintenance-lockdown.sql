begin;

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
  if v_role <> 'super_admin' then
    raise exception 'Only Super Admin can change fleet lifecycle status.';
  end if;
  if v_status not in ('available', 'booked', 'reserved', 'assigned', 'in_use', 'maintenance', 'out_of_service', 'retired', 'for_sale') then
    raise exception 'Fleet lifecycle status is invalid.';
  end if;

  select lower(coalesce(v.status::text, '')), v.reg_no, v.registration_expiry, v.insurance_expiry
  into v_old_status, v_reg, v_registration_expiry, v_insurance_expiry
  from public.vehicles v
  where v.id = p_vehicle_id
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

drop policy if exists "fleet_asset_audit_staff_select" on public.fleet_asset_audit_logs;
create policy "fleet_asset_audit_staff_select"
on public.fleet_asset_audit_logs
for select to authenticated
using (public.has_edrive_role(array['super_admin', 'admin']));

drop policy if exists "fleet_maintenance_staff_select" on public.fleet_maintenance_logs;
drop policy if exists "fleet_maintenance_operational_select" on public.fleet_maintenance_logs;
create policy "fleet_maintenance_operational_select"
on public.fleet_maintenance_logs
for select to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'booking_staff', 'booking_manager']));

drop policy if exists "vehicles_fleet_staff_select" on public.vehicles;
create policy "vehicles_fleet_staff_select"
on public.vehicles
for select to authenticated
using (public.has_edrive_role(array[
  'super_admin', 'admin', 'booking_staff', 'booking_manager', 'finance', 'manager'
]));

do $$
declare
  v_policy record;
begin
  for v_policy in
    select p.tablename, p.policyname
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('vehicles', 'fleet_asset_audit_logs', 'fleet_maintenance_logs')
      and (
        coalesce(p.qual, '') ilike '%maintenance_staff%'
        or coalesce(p.with_check, '') ilike '%maintenance_staff%'
      )
  loop
    execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_policy.tablename);
  end loop;
end
$$;

do $$
declare
  v_remaining text;
begin
  select string_agg(p.tablename || '.' || p.policyname, ', ' order by p.tablename, p.policyname)
  into v_remaining
  from pg_catalog.pg_policies p
  where p.schemaname = 'public'
    and p.tablename in ('vehicles', 'fleet_asset_audit_logs', 'fleet_maintenance_logs')
    and (
      coalesce(p.qual, '') ilike '%maintenance_staff%'
      or coalesce(p.with_check, '') ilike '%maintenance_staff%'
    );
  if v_remaining is not null then
    raise exception 'Maintenance Staff authorization remains in active fleet policies: %', v_remaining;
  end if;
end
$$;

commit;
