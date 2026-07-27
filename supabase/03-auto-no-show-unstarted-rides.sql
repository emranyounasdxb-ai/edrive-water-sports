-- Automatically mark only the previous Dubai calendar day's eligible,
-- confirmed and unstarted rides as No Show.

begin;

do $preflight$
declare
  v_missing text[];
begin
  if not exists (
    select 1
    from pg_catalog.pg_extension extension_row
    where extension_row.extname = 'pg_cron'
  ) or to_regnamespace('cron') is null
     or to_regclass('cron.job') is null then
    raise exception
      'Supabase Cron (pg_cron) is not enabled. Enable Supabase Cron in the Supabase Dashboard, then run this migration again.';
  end if;

  if to_regprocedure('cron.schedule(text,text,text)') is null
     or to_regprocedure('cron.unschedule(bigint)') is null then
    raise exception
      'Supabase Cron is missing the required cron.schedule or cron.unschedule function. Verify Supabase Cron in the Supabase Dashboard.';
  end if;

  if to_regclass('public.booking_requests') is null
     or to_regclass('public.booking_request_vehicle_assignments') is null
     or to_regclass('public.booking_action_history') is null
     or to_regclass('public.vehicles') is null then
    raise exception
      'Automatic No Show requires booking_requests, booking_request_vehicle_assignments, booking_action_history, and vehicles.';
  end if;

  select array_agg(required_column order by required_column)
  into v_missing
  from unnest(array[
    'id', 'status', 'manager_status', 'preferred_date',
    'assigned_manager_id', 'assigned_manager_name', 'ride_started_at',
    'ride_completed_at', 'customer_arrived', 'internal_note', 'updated_at'
  ]) required_column
  where not exists (
    select 1
    from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = 'booking_requests'
      and column_row.column_name = required_column
  );

  if coalesce(array_length(v_missing, 1), 0) > 0 then
    raise exception
      'Automatic No Show is missing required booking_requests column(s): %.',
      array_to_string(v_missing, ', ');
  end if;

  select array_agg(required_column order by required_column)
  into v_missing
  from unnest(array[
    'booking_request_id', 'vehicle_id', 'is_active',
    'released_at', 'released_by', 'release_reason'
  ]) required_column
  where not exists (
    select 1
    from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = 'booking_request_vehicle_assignments'
      and column_row.column_name = required_column
  );

  if coalesce(array_length(v_missing, 1), 0) > 0 then
    raise exception
      'Automatic No Show is missing required assignment column(s): %.',
      array_to_string(v_missing, ', ');
  end if;

  select array_agg(required_column order by required_column)
  into v_missing
  from unnest(array['id', 'status', 'is_available', 'updated_at']) required_column
  where not exists (
    select 1
    from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = 'vehicles'
      and column_row.column_name = required_column
  );

  if coalesce(array_length(v_missing, 1), 0) > 0 then
    raise exception
      'Automatic No Show is missing required vehicles column(s): %.',
      array_to_string(v_missing, ', ');
  end if;

  select array_agg(required_column order by required_column)
  into v_missing
  from unnest(array[
    'booking_request_id', 'action', 'actor_role', 'assigned_manager_id',
    'before_data', 'after_data', 'metadata'
  ]) required_column
  where not exists (
    select 1
    from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = 'booking_action_history'
      and column_row.column_name = required_column
  );

  if coalesce(array_length(v_missing, 1), 0) > 0 then
    raise exception
      'Automatic No Show is missing required booking_action_history column(s): %.',
      array_to_string(v_missing, ', ');
  end if;
end
$preflight$;

create or replace function public.auto_mark_previous_day_no_shows()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_booking public.booking_requests%rowtype;
  v_before jsonb;
  v_processed integer := 0;
  v_dubai_yesterday date := (pg_catalog.now() at time zone 'Asia/Dubai')::date - 1;
  v_reason constant text := 'Booking date passed without ride start';
  v_note constant text := 'Automatically marked No Show after the scheduled Dubai booking date ended.';
  v_note_line text;
begin
  v_note_line := 'No Show: ' || v_reason || ' - ' || v_note;

  for v_booking in
    select br.*
    from public.booking_requests br
    where br.preferred_date = v_dubai_yesterday
      and lower(coalesce(br.status::text, '')) = 'confirmed'
      and br.ride_started_at is null
      and br.ride_completed_at is null
      and lower(coalesce(br.manager_status::text, '')) <> 'in progress'
      and (
        br.assigned_manager_id is not null
        or nullif(btrim(coalesce(br.assigned_manager_name, '')), '') is not null
      )
      and not exists (
        select 1
        from public.booking_request_vehicle_assignments bva
        where bva.booking_request_id = br.id
          and bva.is_active
      )
    order by br.id
    for update of br
  loop
    if v_booking.preferred_date <> v_dubai_yesterday
       or lower(coalesce(v_booking.status::text, '')) <> 'confirmed'
       or v_booking.ride_started_at is not null
       or v_booking.ride_completed_at is not null
       or lower(coalesce(v_booking.status::text, '')) in ('cancelled', 'completed', 'no show', 'no_show')
       or lower(coalesce(v_booking.manager_status::text, '')) = 'in progress'
       or (
         v_booking.assigned_manager_id is null
         and nullif(btrim(coalesce(v_booking.assigned_manager_name, '')), '') is null
       ) then
      continue;
    end if;

    v_before := to_jsonb(v_booking);

    update public.booking_requests br
    set status = 'No Show',
        manager_status = 'No Show',
        customer_arrived = false,
        internal_note = concat_ws(
          E'\n',
          nullif(btrim(coalesce(br.internal_note, '')), ''),
          v_note_line
        ),
        updated_at = pg_catalog.now()
    where br.id = v_booking.id
      and br.preferred_date = v_dubai_yesterday
      and lower(coalesce(br.status::text, '')) = 'confirmed'
      and br.ride_started_at is null
      and br.ride_completed_at is null
      and lower(coalesce(br.manager_status::text, '')) <> 'in progress'
      and (
        br.assigned_manager_id is not null
        or nullif(btrim(coalesce(br.assigned_manager_name, '')), '') is not null
      )
      and not exists (
        select 1
        from public.booking_request_vehicle_assignments bva
        where bva.booking_request_id = br.id
          and bva.is_active
      )
    returning br.* into v_booking;

    if not found then
      raise exception
        'Booking % changed eligibility while automatic No Show processing held its row lock.',
        v_booking.id;
    end if;

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
      'booking_no_show_automatic',
      null,
      null,
      'system',
      v_booking.assigned_manager_id,
      v_before,
      to_jsonb(v_booking),
      jsonb_build_object(
        'automatic', true,
        'source', 'pg_cron',
        'dubai_booking_date', v_dubai_yesterday,
        'reason', v_reason,
        'note', v_note
      )
    );

    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end
$function$;

revoke all on function public.auto_mark_previous_day_no_shows() from public;
revoke all on function public.auto_mark_previous_day_no_shows() from anon;
revoke all on function public.auto_mark_previous_day_no_shows() from authenticated;
grant execute on function public.auto_mark_previous_day_no_shows() to postgres;

do $schedule$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select job.jobid
    from cron.job job
    where job.jobname = 'edrive-auto-no-show-previous-day'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'edrive-auto-no-show-previous-day',
    '5 20 * * *',
    'select public.auto_mark_previous_day_no_shows();'
  );
end
$schedule$;

commit;
