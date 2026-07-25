begin;

create or replace function public.confirm_and_assign_booking(
  p_booking_request_id text,
  p_manager_id uuid,
  p_internal_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_caller_count integer;
  v_manager public.admin_users%rowtype;
  v_booking public.booking_requests%rowtype;
  v_before jsonb;
begin
  select count(*)
  into v_caller_count
  from public.admin_users
  where auth_user_id = auth.uid()
    and lower(coalesce(status::text, '')) = 'active'
    and lower(coalesce(role::text, '')) <> 'maintenance_staff';

  if v_caller_count <> 1 then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
  end if;

  select *
  into v_caller
  from public.admin_users
  where auth_user_id = auth.uid()
    and lower(coalesce(status::text, '')) = 'active'
    and lower(coalesce(role::text, '')) <> 'maintenance_staff';

  if not found then
    raise exception 'Active portal user was not found.';
  end if;

  if lower(coalesce(v_caller.role::text, '')) not in (
    'super_admin',
    'booking_staff',
    'booking_manager'
  ) then
    raise exception 'Only Booking Staff, Booking Manager, or Super Admin can confirm and assign a booking.';
  end if;

  select *
  into v_booking
  from public.booking_requests
  where id::text = p_booking_request_id
  for update;

  if not found then
    raise exception 'Booking request was not found.';
  end if;

  if lower(coalesce(v_booking.status::text, '')) in (
    'completed',
    'no show',
    'no_show',
    'cancelled',
    'canceled'
  ) then
    raise exception 'Completed, No Show, or Cancelled bookings cannot be confirmed and assigned.';
  end if;

  if v_booking.ride_started_at is not null then
    raise exception 'A ride that has already started cannot be confirmed and assigned.';
  end if;

  select *
  into v_manager
  from public.admin_users
  where id = p_manager_id
    and lower(coalesce(status::text, '')) = 'active'
    and lower(coalesce(role::text, '')) = 'manager';

  if not found then
    raise exception 'The selected Ride Manager is not active.';
  end if;

  v_before := to_jsonb(v_booking);

  perform set_config('edrive.assignment_rpc', 'on', true);

  update public.booking_requests
  set status = 'Confirmed',
      admin_status = 'Confirmed',
      manager_status = 'Pending',
      assigned_manager_id = v_manager.id,
      assigned_manager_name = coalesce(nullif(btrim(v_manager.full_name), ''), v_manager.email),
      confirmed_at = coalesce(v_booking.confirmed_at, now()),
      internal_note = coalesce(
        nullif(btrim(p_internal_note), ''),
        v_booking.internal_note
      ),
      assignment_updated_at = now(),
      assignment_updated_by = v_caller.id,
      updated_at = now()
  where id = v_booking.id
  returning * into v_booking;

  insert into public.booking_action_history (
    booking_request_id,
    action,
    actor_auth_user_id,
    actor_admin_user_id,
    actor_role,
    assigned_manager_id,
    before_data,
    after_data,
    metadata
  ) values (
    v_booking.id,
    'booking_confirmed_and_manager_assigned',
    auth.uid(),
    v_caller.id,
    v_caller.role::text,
    v_manager.id,
    v_before,
    to_jsonb(v_booking),
    jsonb_build_object('assigned_manager_id', v_manager.id)
  );

  return to_jsonb(v_booking);
end;
$$;

revoke all on function public.confirm_and_assign_booking(text, uuid, text) from public;
grant execute on function public.confirm_and_assign_booking(text, uuid, text) to authenticated;

commit;
