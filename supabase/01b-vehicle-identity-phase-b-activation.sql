-- eDrive Phase B activation.
-- Run only after the matching Phase B frontend is deployed and
-- 01-vehicle-identity-phase-b.sql has completed successfully.

begin;

do $$
declare
  v_active_maintenance_staff_count bigint;
begin
  select count(*)
  into v_active_maintenance_staff_count
  from public.admin_users
  where lower(coalesce(role::text, '')) = 'maintenance_staff'
    and lower(coalesce(status::text, '')) = 'active';

  if v_active_maintenance_staff_count > 0 then
    raise exception
      'Phase B activation stopped: % active Maintenance Staff account(s) require manual deactivation.',
      v_active_maintenance_staff_count;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.booking_request_vehicle_assignments') is null then
    raise exception 'Run 01-vehicle-identity-phase-b.sql before activation.';
  end if;
  if to_regclass('public.booking_action_history') is null then
    raise exception 'Run 01-vehicle-identity-phase-b.sql before activation.';
  end if;
end
$$;

create or replace function public.protect_booking_assignment_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    new.assigned_manager_id is distinct from old.assigned_manager_id
    or new.assigned_manager_name is distinct from old.assigned_manager_name
    or new.assigned_vehicle_id is distinct from old.assigned_vehicle_id
    or new.assigned_vehicle_name is distinct from old.assigned_vehicle_name
    or new.assignment_updated_at is distinct from old.assignment_updated_at
    or new.assignment_updated_by is distinct from old.assignment_updated_by
    or new.ride_started_at is distinct from old.ride_started_at
  ) and coalesce(current_setting('edrive.assignment_rpc', true), '') <> 'on' then
    raise exception 'Booking assignment fields can be changed only through secured Phase B RPCs.';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_booking_assignment_fields() from public;

drop trigger if exists booking_requests_protect_assignment_fields_trigger
  on public.booking_requests;
create trigger booking_requests_protect_assignment_fields_trigger
before update on public.booking_requests
for each row execute function public.protect_booking_assignment_fields();

create or replace function public.current_edrive_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when lower(coalesce(au.role::text, '')) = 'maintenance_staff' then ''
    else lower(coalesce(au.role::text, ''))
  end
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
  limit 1;
$$;

revoke all on function public.current_edrive_role() from public;
grant execute on function public.current_edrive_role() to authenticated;

-- Stable Ride Manager ownership replaces legacy name/email policy matching.
drop policy if exists "booking_requests_manager_assigned_select"
  on public.booking_requests;
create policy "booking_requests_manager_assigned_select"
on public.booking_requests
for select
to authenticated
using (public.is_current_ride_manager_assignment(assigned_manager_id));

-- Ride Manager booking actions are RPC-only after activation.
drop policy if exists "booking_requests_manager_assigned_update"
  on public.booking_requests;

-- Booking Manager keeps normal booking workflow writes; Finance becomes read-only.
drop policy if exists "booking_requests_operations_update"
  on public.booking_requests;
create policy "booking_requests_operations_update"
on public.booking_requests
for update
to authenticated
using (
  public.has_edrive_role(array[
    'super_admin',
    'booking_staff',
    'booking_manager'
  ])
)
with check (
  public.has_edrive_role(array[
    'super_admin',
    'booking_staff',
    'booking_manager'
  ])
);

-- Remove legacy broad payment write policies if an older payment migration left them active.
drop policy if exists "payment_receipts_admin_access"
  on public.payment_receipts;
drop policy if exists "payment_allocations_admin_access"
  on public.payment_receipt_allocations;
drop policy if exists "payment_ledger_admin_access"
  on public.payment_ledger_entries;

-- Finance retains SELECT only. Super Admin remains the only direct payment writer.
drop policy if exists "payment_receipts_authorized_select"
  on public.payment_receipts;
create policy "payment_receipts_authorized_select"
on public.payment_receipts
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'finance']));

drop policy if exists "payment_receipts_finance_insert"
  on public.payment_receipts;
drop policy if exists "payment_receipts_super_admin_insert_activation"
  on public.payment_receipts;
create policy "payment_receipts_super_admin_insert_activation"
on public.payment_receipts
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin']));

drop policy if exists "payment_receipts_finance_update"
  on public.payment_receipts;
drop policy if exists "payment_receipts_super_admin_update_activation"
  on public.payment_receipts;
create policy "payment_receipts_super_admin_update_activation"
on public.payment_receipts
for update
to authenticated
using (public.has_edrive_role(array['super_admin']))
with check (public.has_edrive_role(array['super_admin']));

drop policy if exists "payment_allocations_authorized_select"
  on public.payment_receipt_allocations;
create policy "payment_allocations_authorized_select"
on public.payment_receipt_allocations
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'finance']));

drop policy if exists "payment_allocations_finance_insert"
  on public.payment_receipt_allocations;
drop policy if exists "payment_allocations_super_admin_insert_activation"
  on public.payment_receipt_allocations;
create policy "payment_allocations_super_admin_insert_activation"
on public.payment_receipt_allocations
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin']));

drop policy if exists "payment_allocations_finance_update"
  on public.payment_receipt_allocations;
drop policy if exists "payment_allocations_super_admin_update_activation"
  on public.payment_receipt_allocations;
create policy "payment_allocations_super_admin_update_activation"
on public.payment_receipt_allocations
for update
to authenticated
using (public.has_edrive_role(array['super_admin']))
with check (public.has_edrive_role(array['super_admin']));

drop policy if exists "payment_ledger_authorized_select"
  on public.payment_ledger_entries;
create policy "payment_ledger_authorized_select"
on public.payment_ledger_entries
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'finance']));

drop policy if exists "payment_ledger_finance_insert"
  on public.payment_ledger_entries;
drop policy if exists "payment_ledger_super_admin_insert_activation"
  on public.payment_ledger_entries;
create policy "payment_ledger_super_admin_insert_activation"
on public.payment_ledger_entries
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin']));

-- New Phase B assignments and history remain RPC-only and immutable.
revoke insert, update, delete
  on public.booking_request_vehicle_assignments
  from anon, authenticated;
revoke insert, update, delete
  on public.booking_action_history
  from anon, authenticated;

-- Maintenance Staff is removed from active fleet authorization.
drop policy if exists "vehicles_fleet_staff_select" on public.vehicles;
create policy "vehicles_fleet_staff_select"
on public.vehicles
for select
to authenticated
using (public.has_edrive_role(array[
  'super_admin', 'admin', 'booking_staff', 'booking_manager', 'finance'
]));

drop policy if exists "fleet_maintenance_staff_select"
  on public.fleet_maintenance_logs;
create policy "fleet_maintenance_staff_select"
on public.fleet_maintenance_logs
for select
to authenticated
using (public.has_edrive_role(array[
  'super_admin', 'admin', 'booking_staff', 'booking_manager'
]));

-- Fleet lifecycle and Maintenance status are controlled only by Super Admin.
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
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_old_status text;
  v_registration text;
  v_registration_expiry date;
  v_insurance_expiry date;
begin
  if not public.has_edrive_role(array['super_admin']) then
    raise exception 'Only Super Admin can change fleet lifecycle status.';
  end if;

  if v_status not in (
    'available', 'booked', 'reserved', 'assigned', 'in_use',
    'maintenance', 'out_of_service', 'retired', 'for_sale', 'inactive'
  ) then
    raise exception 'Fleet lifecycle status is invalid.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_enum e
    join pg_catalog.pg_type t on t.oid = e.enumtypid
    join pg_catalog.pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'vehicle_status'
      and e.enumlabel = v_status
  ) then
    raise exception 'Fleet lifecycle status % is not supported by the live vehicle_status enum.', v_status;
  end if;

  select
    lower(coalesce(status::text, '')),
    registration_number,
    registration_expiry,
    insurance_expiry
  into
    v_old_status,
    v_registration,
    v_registration_expiry,
    v_insurance_expiry
  from public.vehicles
  where id = p_vehicle_id
  for update;

  if not found then raise exception 'Fleet unit was not found.'; end if;
  if v_status = 'available' and length(btrim(coalesce(v_registration, ''))) < 3 then
    raise exception 'Add the required unique registration number before making this unit Available.';
  end if;
  if v_status = 'available'
     and v_registration_expiry is not null
     and v_registration_expiry < current_date then
    raise exception 'Registration is expired.';
  end if;
  if v_status = 'available'
     and v_insurance_expiry is not null
     and v_insurance_expiry < current_date then
    raise exception 'Insurance is expired.';
  end if;

  update public.vehicles
  set status = v_status::public.vehicle_status,
      is_available = v_status = 'available',
      is_archived = v_status = 'retired',
      is_visible_public = v_status <> 'retired',
      retired_at = case
        when v_status = 'retired' then coalesce(retired_at, now())
        else null
      end,
      notes = case
        when nullif(btrim(coalesce(p_note, '')), '') is null then notes
        else concat_ws(
          E'\n',
          nullif(btrim(coalesce(notes, '')), ''),
          left(btrim(p_note), 1000)
        )
      end,
      updated_at = now()
  where id = p_vehicle_id;

  insert into public.fleet_maintenance_logs (
    vehicle_id,
    status_from,
    status_to,
    note,
    actor_id
  ) values (
    p_vehicle_id,
    v_old_status,
    v_status,
    nullif(left(btrim(coalesce(p_note, '')), 1000), ''),
    auth.uid()
  );

  return true;
end;
$$;

revoke all on function public.set_fleet_asset_status(uuid, text, text) from public;
grant execute on function public.set_fleet_asset_status(uuid, text, text) to authenticated;

commit;

-- Manual review after activation: historical records remain; these accounts are no longer authorized.
select
  id,
  auth_user_id,
  full_name,
  email,
  role,
  status
from public.admin_users
where lower(coalesce(role::text, '')) = 'maintenance_staff'
  and lower(coalesce(status::text, '')) = 'active'
order by email, id;
