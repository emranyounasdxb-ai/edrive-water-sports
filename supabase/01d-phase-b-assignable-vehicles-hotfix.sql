begin;

create or replace function public.get_assignable_vehicles(
  p_booking_request_id text
)
returns table (
  vehicle_id uuid,
  registration_number text,
  vehicle_code text,
  vehicle_name text,
  vehicle_type text,
  capacity integer,
  status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_caller_count integer;
  v_booking public.booking_requests%rowtype;
  v_booking_json jsonb;
  v_required_type text;
begin
  select count(*)
  into v_caller_count
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';

  if v_caller_count <> 1 then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
  end if;

  select au.*
  into v_caller
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';

  if not found then raise exception 'Active portal user was not found.'; end if;

  select br.*
  into v_booking
  from public.booking_requests br
  where br.id::text = p_booking_request_id;

  if not found then raise exception 'Booking request was not found.'; end if;
  if lower(coalesce(v_caller.role::text, '')) <> 'super_admin'
     and (
       lower(coalesce(v_caller.role::text, '')) <> 'manager'
       or v_booking.assigned_manager_id is distinct from v_caller.id
     ) then
    raise exception 'This booking is not assigned to the current Ride Manager.';
  end if;
  if v_booking.ride_started_at is not null then
    raise exception 'The ride has already started.';
  end if;
  if lower(coalesce(v_booking.status::text, '')) <> 'confirmed' then
    raise exception 'Assignable vehicles are available only for a confirmed booking.';
  end if;

  v_booking_json := to_jsonb(v_booking);
  v_required_type := coalesce(
    public.normalize_edrive_vehicle_type(v_booking_json->>'vehicle_type'),
    public.normalize_edrive_vehicle_type(v_booking_json->>'selected_package_category'),
    public.normalize_edrive_vehicle_type(v_booking_json->>'selected_package_name'),
    public.normalize_edrive_vehicle_type(v_booking_json->>'experience_type'),
    public.normalize_edrive_vehicle_type(v_booking_json->>'service_type')
  );

  if v_required_type is null then
    raise exception 'Booking vehicle type is missing or unsupported.';
  end if;

  return query
  select
    v.id,
    v.registration_number,
    coalesce(v.vehicle_code, ''),
    coalesce(v.vehicle_name, v.name, v.vehicle_code, v.registration_number),
    coalesce(v.vehicle_type::text, v.type::text),
    coalesce(v.capacity, 1),
    v.status::text
  from public.vehicles v
  where nullif(btrim(coalesce(v.registration_number, '')), '') is not null
    and coalesce(v.is_available, false)
    and not coalesce(v.is_archived, false)
    and lower(coalesce(v.status::text, '')) = 'available'
    and (
      public.normalize_edrive_vehicle_type(coalesce(v.vehicle_type::text, v.type::text)) = v_required_type
    )
    and not exists (
      select 1
      from public.booking_request_vehicle_assignments bva
      where bva.vehicle_id = v.id
        and bva.is_active
    )
  order by
    lower(v.registration_number),
    lower(coalesce(v.vehicle_code, '')),
    v.id;
end;
$$;

revoke all on function public.get_assignable_vehicles(text) from public;
grant execute on function public.get_assignable_vehicles(text) to authenticated;

commit;
