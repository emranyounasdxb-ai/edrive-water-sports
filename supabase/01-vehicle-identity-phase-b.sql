-- eDrive Phase B vehicle identity and ride-start foundation.
-- Run manually in Supabase after reviewing 00-reporting-b2b-preflight.sql.
-- public.booking_requests remains the live booking source of truth.

begin;

do $$
declare
  v_booking_id_type text;
  v_admin_id_type text;
  v_vehicle_id_type text;
  v_missing_columns text[];
begin
  if to_regclass('public.booking_requests') is null then
    raise exception 'public.booking_requests is required.';
  end if;
  if to_regclass('public.admin_users') is null then
    raise exception 'public.admin_users is required.';
  end if;
  if to_regclass('public.vehicles') is null then
    raise exception 'public.vehicles is required.';
  end if;

  select array_agg(required_column.table_name || '.' || required_column.column_name order by required_column.table_name, required_column.column_name)
  into v_missing_columns
  from (
    values
      ('booking_requests', 'id'),
      ('booking_requests', 'source'),
      ('booking_requests', 'status'),
      ('booking_requests', 'admin_status'),
      ('booking_requests', 'assigned_manager_name'),
      ('booking_requests', 'assigned_vehicle_id'),
      ('booking_requests', 'assigned_vehicle_name'),
      ('booking_requests', 'payment_source'),
      ('booking_requests', 'payment_status'),
      ('booking_requests', 'payment_workflow_status'),
      ('booking_requests', 'collection_status'),
      ('booking_requests', 'amount_received_aed'),
      ('booking_requests', 'amount_pending_aed'),
      ('booking_requests', 'b2b_agent_id'),
      ('booking_requests', 'b2b_agent_email'),
      ('booking_requests', 'vehicle_quantity'),
      ('booking_requests', 'customer_arrived'),
      ('booking_requests', 'manager_status'),
      ('booking_requests', 'preferred_date'),
      ('booking_requests', 'preferred_time'),
      ('booking_requests', 'payment_method'),
      ('booking_requests', 'internal_note'),
      ('booking_requests', 'total_amount'),
      ('booking_requests', 'updated_at'),
      ('vehicles', 'id'),
      ('vehicles', 'reg_no'),
      ('vehicles', 'vehicle_code'),
      ('vehicles', 'vehicle_name'),
      ('vehicles', 'name'),
      ('vehicles', 'vehicle_type'),
      ('vehicles', 'type'),
      ('vehicles', 'capacity'),
      ('vehicles', 'status'),
      ('vehicles', 'is_available'),
      ('vehicles', 'is_archived'),
      ('vehicles', 'updated_at')
  ) as required_column(table_name, column_name)
  where not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = required_column.table_name
      and c.column_name = required_column.column_name
  );

  if coalesce(array_length(v_missing_columns, 1), 0) > 0 then
    raise exception
      'Phase B foundation stopped. Missing required live columns: %.',
      array_to_string(v_missing_columns, ', ');
  end if;

  select format_type(a.atttypid, a.atttypmod)
  into v_booking_id_type
  from pg_attribute a
  where a.attrelid = 'public.booking_requests'::regclass
    and a.attname = 'id'
    and a.attnum > 0
    and not a.attisdropped;

  select format_type(a.atttypid, a.atttypmod)
  into v_admin_id_type
  from pg_attribute a
  where a.attrelid = 'public.admin_users'::regclass
    and a.attname = 'id'
    and a.attnum > 0
    and not a.attisdropped;

  select format_type(a.atttypid, a.atttypmod)
  into v_vehicle_id_type
  from pg_attribute a
  where a.attrelid = 'public.vehicles'::regclass
    and a.attname = 'id'
    and a.attnum > 0
    and not a.attisdropped;

  if v_booking_id_type is null then
    raise exception 'public.booking_requests.id is required.';
  end if;
  if v_admin_id_type <> 'uuid' then
    raise exception 'public.admin_users.id must be uuid; found %.', coalesce(v_admin_id_type, '<missing>');
  end if;
  if v_vehicle_id_type <> 'uuid' then
    raise exception 'public.vehicles.id must be uuid; found %.', coalesce(v_vehicle_id_type, '<missing>');
  end if;
end
$$;

alter table public.booking_requests
  add column if not exists assigned_manager_id uuid,
  add column if not exists assignment_updated_at timestamptz,
  add column if not exists assignment_updated_by uuid,
  add column if not exists ride_started_at timestamptz,
  add column if not exists ride_completed_at timestamptz;

drop policy if exists "booking_requests_website_insert"
  on public.booking_requests;
create policy "booking_requests_website_insert"
on public.booking_requests
for insert
to anon, authenticated
with check (
  lower(coalesce(source::text, '')) = 'website'
  and lower(coalesce(status::text, 'pending')) = 'pending'
  and lower(coalesce(admin_status::text, 'new')) = 'new'
  and lower(coalesce(payment_source::text, 'direct')) = 'direct'
  and lower(coalesce(payment_status::text, 'not paid')) in ('not paid', 'unpaid')
  and lower(coalesce(payment_workflow_status::text, 'unpaid')) = 'unpaid'
  and lower(coalesce(collection_status::text, 'pending_collection')) = 'pending_collection'
  and coalesce(amount_received_aed, 0) = 0
  and assigned_manager_id is null
  and assigned_manager_name is null
  and assigned_vehicle_id is null
  and assigned_vehicle_name is null
  and assignment_updated_at is null
  and assignment_updated_by is null
  and ride_started_at is null
  and ride_completed_at is null
  and b2b_agent_id is null
);

drop policy if exists "booking_requests_b2b_own_insert"
  on public.booking_requests;
create policy "booking_requests_b2b_own_insert"
on public.booking_requests
for insert
to authenticated
with check (
  lower(coalesce(source::text, '')) = 'b2b'
  and lower(coalesce(payment_source::text, '')) = 'b2b'
  and lower(coalesce(status::text, 'pending')) = 'pending'
  and lower(coalesce(admin_status::text, 'new')) = 'new'
  and lower(coalesce(payment_status::text, 'not paid')) in ('not paid', 'unpaid')
  and coalesce(amount_received_aed, 0) = 0
  and assigned_manager_id is null
  and assigned_manager_name is null
  and assigned_vehicle_id is null
  and assigned_vehicle_name is null
  and assignment_updated_at is null
  and assignment_updated_by is null
  and ride_started_at is null
  and ride_completed_at is null
  and public.is_current_b2b_agent_booking(b2b_agent_id, b2b_agent_email)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.booking_requests'::regclass
      and conname = 'booking_requests_assigned_manager_id_fkey'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_assigned_manager_id_fkey
      foreign key (assigned_manager_id) references public.admin_users(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.booking_requests'::regclass
      and conname = 'booking_requests_assignment_updated_by_fkey'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_assignment_updated_by_fkey
      foreign key (assignment_updated_by) references public.admin_users(id);
  end if;
end
$$;

create index if not exists booking_requests_assigned_manager_id_idx
  on public.booking_requests(assigned_manager_id);

alter table public.vehicles
  add column if not exists registration_number text;

update public.vehicles
set registration_number = nullif(upper(regexp_replace(btrim(reg_no), '\s+', ' ', 'g')), '')
where nullif(btrim(coalesce(registration_number, '')), '') is null
  and nullif(btrim(coalesce(reg_no, '')), '') is not null;

update public.vehicles
set registration_number = nullif(upper(regexp_replace(btrim(registration_number), '\s+', ' ', 'g')), '')
where nullif(btrim(coalesce(registration_number, '')), '') is not null
  and registration_number is distinct from nullif(upper(regexp_replace(btrim(registration_number), '\s+', ' ', 'g')), '');

do $$
declare
  v_duplicate_count integer;
begin
  select count(*)
  into v_duplicate_count
  from (
    select lower(regexp_replace(btrim(registration_number), '[^[:alnum:]]', '', 'g'))
    from public.vehicles
    where nullif(btrim(coalesce(registration_number, '')), '') is not null
    group by lower(regexp_replace(btrim(registration_number), '[^[:alnum:]]', '', 'g'))
    having count(*) > 1
  ) duplicates;

  if v_duplicate_count > 0 then
    raise exception 'Duplicate normalized vehicle registration numbers found. Resolve them before Phase B.';
  end if;
end
$$;

create unique index if not exists vehicles_registration_number_unique_normalized
  on public.vehicles (
    lower(regexp_replace(btrim(registration_number), '[^[:alnum:]]', '', 'g'))
  )
  where nullif(btrim(coalesce(registration_number, '')), '') is not null;

create or replace function public.sync_vehicle_registration_compatibility()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_registration text;
begin
  v_registration := nullif(
    upper(regexp_replace(btrim(coalesce(
      case
        when tg_op = 'UPDATE'
          and new.reg_no is distinct from old.reg_no
          and new.registration_number is not distinct from old.registration_number
          then new.reg_no
        else new.registration_number
      end,
      new.reg_no,
      ''
    )), '\s+', ' ', 'g')),
    ''
  );
  new.registration_number := v_registration;
  new.reg_no := v_registration;
  return new;
end;
$$;

revoke all on function public.sync_vehicle_registration_compatibility() from public;

drop trigger if exists vehicles_registration_compatibility_trigger on public.vehicles;
create trigger vehicles_registration_compatibility_trigger
before insert or update of registration_number, reg_no on public.vehicles
for each row execute function public.sync_vehicle_registration_compatibility();

do $$
declare
  v_booking_id_type text;
  v_missing_columns text[];
  v_incompatible_columns text[];
begin
  select format_type(a.atttypid, a.atttypmod)
  into v_booking_id_type
  from pg_attribute a
  where a.attrelid = 'public.booking_requests'::regclass
    and a.attname = 'id'
    and a.attnum > 0
    and not a.attisdropped;

  if to_regclass('public.booking_request_vehicle_assignments') is null then
    execute format(
      'create table public.booking_request_vehicle_assignments (
         id uuid primary key default gen_random_uuid(),
         booking_request_id %s not null,
         vehicle_id uuid not null,
         assignment_position integer not null,
         assigned_by uuid not null,
         assigned_at timestamptz not null default now(),
         released_at timestamptz,
         released_by uuid,
         release_reason text,
         is_active boolean not null default true
       )',
      v_booking_id_type
    );
  else
    select array_agg(required_column order by required_column)
    into v_missing_columns
    from unnest(array[
      'id', 'booking_request_id', 'vehicle_id', 'assignment_position',
      'assigned_by', 'assigned_at', 'released_at', 'released_by',
      'release_reason', 'is_active'
    ]) required_column
    where not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'booking_request_vehicle_assignments'
        and c.column_name = required_column
    );

    if coalesce(array_length(v_missing_columns, 1), 0) > 0 then
      raise exception
        'Existing booking_request_vehicle_assignments is missing required columns: %.',
        array_to_string(v_missing_columns, ', ');
    end if;

    select array_agg(a.attname || ' is ' || format_type(a.atttypid, a.atttypmod) order by a.attname)
    into v_incompatible_columns
    from pg_attribute a
    where a.attrelid = 'public.booking_request_vehicle_assignments'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and (
        (a.attname in ('id', 'vehicle_id', 'assigned_by', 'released_by')
          and format_type(a.atttypid, a.atttypmod) <> 'uuid')
        or
        (a.attname = 'booking_request_id'
          and format_type(a.atttypid, a.atttypmod) <> v_booking_id_type)
      );

    if coalesce(array_length(v_incompatible_columns, 1), 0) > 0 then
      raise exception
        'Existing booking_request_vehicle_assignments has incompatible foreign-key or ID columns: %.',
        array_to_string(v_incompatible_columns, ', ');
    end if;
  end if;

  if to_regclass('public.booking_action_history') is null then
    execute format(
      'create table public.booking_action_history (
         id uuid primary key default gen_random_uuid(),
         booking_request_id %s not null,
         action text not null,
         actor_auth_user_id uuid,
         actor_admin_user_id uuid,
         actor_role text,
         assigned_manager_id uuid,
         vehicle_id uuid,
         before_data jsonb,
         after_data jsonb,
         metadata jsonb not null default ''{}''::jsonb,
         occurred_at timestamptz not null default now()
       )',
      v_booking_id_type
    );
  else
    select array_agg(required_column order by required_column)
    into v_missing_columns
    from unnest(array[
      'id', 'booking_request_id', 'action', 'actor_auth_user_id',
      'actor_admin_user_id', 'actor_role', 'assigned_manager_id',
      'vehicle_id', 'before_data', 'after_data', 'metadata', 'occurred_at'
    ]) required_column
    where not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'booking_action_history'
        and c.column_name = required_column
    );

    if coalesce(array_length(v_missing_columns, 1), 0) > 0 then
      raise exception
        'Existing booking_action_history is missing required columns: %.',
        array_to_string(v_missing_columns, ', ');
    end if;

    select array_agg(a.attname || ' is ' || format_type(a.atttypid, a.atttypmod) order by a.attname)
    into v_incompatible_columns
    from pg_attribute a
    where a.attrelid = 'public.booking_action_history'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and (
        (a.attname in ('id', 'actor_auth_user_id', 'actor_admin_user_id', 'assigned_manager_id', 'vehicle_id')
          and format_type(a.atttypid, a.atttypmod) <> 'uuid')
        or
        (a.attname = 'booking_request_id'
          and format_type(a.atttypid, a.atttypmod) <> v_booking_id_type)
      );

    if coalesce(array_length(v_incompatible_columns, 1), 0) > 0 then
      raise exception
        'Existing booking_action_history has incompatible foreign-key or ID columns: %.',
        array_to_string(v_incompatible_columns, ', ');
    end if;
  end if;
end
$$;

do $$
declare
  v_assignment_invalid_count bigint;
  v_history_invalid_count bigint;
  v_assignment_null_id_count bigint;
  v_assignment_duplicate_id_count bigint;
  v_history_null_id_count bigint;
  v_history_duplicate_id_count bigint;
begin
  select count(*)
  into v_assignment_null_id_count
  from public.booking_request_vehicle_assignments
  where id is null;

  select coalesce(sum(duplicate_group.row_count), 0)
  into v_assignment_duplicate_id_count
  from (
    select count(*) as row_count
    from public.booking_request_vehicle_assignments
    where id is not null
    group by id
    having count(*) > 1
  ) duplicate_group;

  if v_assignment_null_id_count > 0 or v_assignment_duplicate_id_count > 0 then
    raise exception
      'booking_request_vehicle_assignments has % null ID row(s) and % row(s) participating in duplicate IDs. Manual review is required.',
      v_assignment_null_id_count,
      v_assignment_duplicate_id_count;
  end if;

  if not exists (
    select 1
    from pg_constraint con
    join pg_attribute a
      on a.attrelid = con.conrelid
     and a.attname = 'id'
     and a.attnum = any(con.conkey)
    where con.conrelid = 'public.booking_request_vehicle_assignments'::regclass
      and con.contype in ('p', 'u')
      and cardinality(con.conkey) = 1
  ) then
    alter table public.booking_request_vehicle_assignments
      add constraint booking_request_vehicle_assignments_id_key unique (id);
  end if;

  select count(*)
  into v_history_null_id_count
  from public.booking_action_history
  where id is null;

  select coalesce(sum(duplicate_group.row_count), 0)
  into v_history_duplicate_id_count
  from (
    select count(*) as row_count
    from public.booking_action_history
    where id is not null
    group by id
    having count(*) > 1
  ) duplicate_group;

  if v_history_null_id_count > 0 or v_history_duplicate_id_count > 0 then
    raise exception
      'booking_action_history has % null ID row(s) and % row(s) participating in duplicate IDs. Manual review is required.',
      v_history_null_id_count,
      v_history_duplicate_id_count;
  end if;

  if not exists (
    select 1
    from pg_constraint con
    join pg_attribute a
      on a.attrelid = con.conrelid
     and a.attname = 'id'
     and a.attnum = any(con.conkey)
    where con.conrelid = 'public.booking_action_history'::regclass
      and con.contype in ('p', 'u')
      and cardinality(con.conkey) = 1
  ) then
    alter table public.booking_action_history
      add constraint booking_action_history_id_key unique (id);
  end if;

  select count(*)
  into v_assignment_invalid_count
  from public.booking_request_vehicle_assignments
  where booking_request_id is null
     or vehicle_id is null
     or assignment_position is null
     or assigned_by is null
     or assigned_at is null
     or is_active is null;

  if v_assignment_invalid_count > 0 then
    raise exception
      'booking_request_vehicle_assignments contains % row(s) with null required fields. Manual review is required.',
      v_assignment_invalid_count;
  end if;

  select count(*)
  into v_history_invalid_count
  from public.booking_action_history
  where booking_request_id is null
     or action is null
     or metadata is null
     or occurred_at is null;

  if v_history_invalid_count > 0 then
    raise exception
      'booking_action_history contains % row(s) with null required fields. Manual review is required.',
      v_history_invalid_count;
  end if;

  alter table public.booking_request_vehicle_assignments
    alter column id set default gen_random_uuid(),
    alter column id set not null,
    alter column booking_request_id set not null,
    alter column vehicle_id set not null,
    alter column assignment_position set not null,
    alter column assigned_by set not null,
    alter column assigned_at set not null,
    alter column is_active set not null;

  alter table public.booking_action_history
    alter column id set default gen_random_uuid(),
    alter column id set not null,
    alter column booking_request_id set not null,
    alter column action set not null,
    alter column metadata set not null,
    alter column occurred_at set not null;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_request_vehicle_assignments'::regclass
      and conname = 'booking_request_vehicle_assignments_booking_request_id_fkey'
  ) then
    alter table public.booking_request_vehicle_assignments
      add constraint booking_request_vehicle_assignments_booking_request_id_fkey
      foreign key (booking_request_id) references public.booking_requests(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_request_vehicle_assignments'::regclass
      and conname = 'booking_request_vehicle_assignments_vehicle_id_fkey'
  ) then
    alter table public.booking_request_vehicle_assignments
      add constraint booking_request_vehicle_assignments_vehicle_id_fkey
      foreign key (vehicle_id) references public.vehicles(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_request_vehicle_assignments'::regclass
      and conname = 'booking_request_vehicle_assignments_assigned_by_fkey'
  ) then
    alter table public.booking_request_vehicle_assignments
      add constraint booking_request_vehicle_assignments_assigned_by_fkey
      foreign key (assigned_by) references public.admin_users(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_request_vehicle_assignments'::regclass
      and conname = 'booking_request_vehicle_assignments_released_by_fkey'
  ) then
    alter table public.booking_request_vehicle_assignments
      add constraint booking_request_vehicle_assignments_released_by_fkey
      foreign key (released_by) references public.admin_users(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_request_vehicle_assignments'::regclass
      and conname = 'booking_request_vehicle_assignments_position_check'
  ) then
    alter table public.booking_request_vehicle_assignments
      add constraint booking_request_vehicle_assignments_position_check
      check (assignment_position > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_action_history'::regclass
      and conname = 'booking_action_history_booking_request_id_fkey'
  ) then
    alter table public.booking_action_history
      add constraint booking_action_history_booking_request_id_fkey
      foreign key (booking_request_id) references public.booking_requests(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_action_history'::regclass
      and conname = 'booking_action_history_actor_admin_user_id_fkey'
  ) then
    alter table public.booking_action_history
      add constraint booking_action_history_actor_admin_user_id_fkey
      foreign key (actor_admin_user_id) references public.admin_users(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_action_history'::regclass
      and conname = 'booking_action_history_assigned_manager_id_fkey'
  ) then
    alter table public.booking_action_history
      add constraint booking_action_history_assigned_manager_id_fkey
      foreign key (assigned_manager_id) references public.admin_users(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_action_history'::regclass
      and conname = 'booking_action_history_vehicle_id_fkey'
  ) then
    alter table public.booking_action_history
      add constraint booking_action_history_vehicle_id_fkey
      foreign key (vehicle_id) references public.vehicles(id);
  end if;
end
$$;

create index if not exists booking_request_vehicle_assignments_booking_active_idx
  on public.booking_request_vehicle_assignments(booking_request_id, is_active);
create index if not exists booking_request_vehicle_assignments_vehicle_active_idx
  on public.booking_request_vehicle_assignments(vehicle_id, is_active);
create unique index if not exists booking_request_vehicle_assignments_active_booking_vehicle_uidx
  on public.booking_request_vehicle_assignments(booking_request_id, vehicle_id)
  where is_active;
create unique index if not exists booking_request_vehicle_assignments_active_booking_position_uidx
  on public.booking_request_vehicle_assignments(booking_request_id, assignment_position)
  where is_active;
create unique index if not exists booking_request_vehicle_assignments_active_vehicle_uidx
  on public.booking_request_vehicle_assignments(vehicle_id)
  where is_active;

create index if not exists booking_action_history_booking_time_idx
  on public.booking_action_history(booking_request_id, occurred_at desc);
create index if not exists booking_action_history_actor_time_idx
  on public.booking_action_history(actor_admin_user_id, occurred_at desc);

-- Backfill only unambiguous active Ride Manager identities. Ambiguous rows remain for manual review.
select set_config('edrive.assignment_rpc', 'on', true);

with unique_manager_matches as (
  select
    br.id as booking_request_id,
    min(au.id::text)::uuid as manager_id
  from public.booking_requests br
  join public.admin_users au
    on lower(btrim(coalesce(br.assigned_manager_name, ''))) <> ''
   and lower(btrim(br.assigned_manager_name)) in (
     lower(btrim(coalesce(au.full_name, ''))),
     lower(btrim(coalesce(au.email, '')))
   )
   and lower(coalesce(au.role::text, '')) = 'manager'
   and lower(coalesce(au.status::text, '')) = 'active'
  where br.assigned_manager_id is null
  group by br.id
  having count(*) = 1
)
update public.booking_requests br
set assigned_manager_id = matches.manager_id
from unique_manager_matches matches
where br.id = matches.booking_request_id
  and br.assigned_manager_id is null;

create or replace function public.current_edrive_admin_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select au.id
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff'
  limit 1;
$$;

create or replace function public.is_current_ride_manager_assignment(p_assigned_manager_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = p_assigned_manager_id
      and au.auth_user_id = auth.uid()
      and lower(coalesce(au.status::text, '')) = 'active'
      and lower(coalesce(au.role::text, '')) = 'manager'
  );
$$;

revoke all on function public.current_edrive_admin_user_id() from public;
revoke all on function public.is_current_ride_manager_assignment(uuid) from public;
grant execute on function public.current_edrive_admin_user_id() to authenticated;
grant execute on function public.is_current_ride_manager_assignment(uuid) to authenticated;

create or replace function public.normalize_edrive_vehicle_type(p_value text)
returns text
language sql
immutable
strict
set search_path = public
as $$
  select case
    when regexp_replace(lower(btrim(p_value)), '[^a-z0-9]+', '', 'g') like '%jetski%'
      then 'jet_ski'
    when regexp_replace(lower(btrim(p_value)), '[^a-z0-9]+', '', 'g') like '%jetcar%'
      then 'jet_car'
    else null
  end;
$$;

revoke all on function public.normalize_edrive_vehicle_type(text) from public;
grant execute on function public.normalize_edrive_vehicle_type(text) to authenticated;

create or replace function public.set_booking_manager(
  p_booking_request_id text,
  p_manager_id uuid
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
  v_override boolean := false;
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

  if not found then raise exception 'Active portal user was not found.'; end if;
  if lower(coalesce(v_caller.role::text, '')) not in ('super_admin', 'booking_staff', 'booking_manager') then
    raise exception 'Only Booking Manager or Super Admin can assign a Ride Manager.';
  end if;

  select *
  into v_booking
  from public.booking_requests
  where id::text = p_booking_request_id
  for update;

  if not found then raise exception 'Booking request was not found.'; end if;
  if lower(coalesce(v_booking.status::text, '')) <> 'confirmed' then
    raise exception 'A Ride Manager can be assigned only to a confirmed booking.';
  end if;

  select *
  into v_manager
  from public.admin_users
  where id = p_manager_id
    and lower(coalesce(status::text, '')) = 'active'
    and lower(coalesce(role::text, '')) = 'manager';

  if not found then raise exception 'The selected Ride Manager is not active.'; end if;

  if v_booking.ride_started_at is not null then
    if lower(coalesce(v_caller.role::text, '')) <> 'super_admin' then
      raise exception 'Ride Manager cannot be reassigned after ride start.';
    end if;
    v_override := true;
  end if;

  v_before := to_jsonb(v_booking);

  perform set_config('edrive.assignment_rpc', 'on', true);

  update public.booking_requests
  set assigned_manager_id = v_manager.id,
      assigned_manager_name = coalesce(nullif(v_manager.full_name, ''), v_manager.email),
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
    case when v_before->>'assigned_manager_id' is null then 'manager_assigned' else 'manager_reassigned' end,
    auth.uid(),
    v_caller.id,
    v_caller.role::text,
    v_manager.id,
    v_before,
    to_jsonb(v_booking),
    jsonb_build_object('super_admin_override', v_override)
  );

  return to_jsonb(v_booking);
end;
$$;

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

  if not found then raise exception 'Active portal user was not found.'; end if;

  select *
  into v_booking
  from public.booking_requests
  where id::text = p_booking_request_id;

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

create or replace function public.start_booking_ride(
  p_booking_request_id text,
  p_vehicle_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_caller_count integer;
  v_booking public.booking_requests%rowtype;
  v_booking_json jsonb;
  v_before jsonb;
  v_required_type text;
  v_required_quantity integer;
  v_supplied_count integer;
  v_distinct_count integer;
  v_valid_count integer;
  v_registration_summary text;
  v_first_vehicle_id uuid;
  v_override boolean := false;
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

  if not found then raise exception 'Active portal user was not found.'; end if;

  select *
  into v_booking
  from public.booking_requests
  where id::text = p_booking_request_id
  for update;

  if not found then raise exception 'Booking request was not found.'; end if;
  if v_booking.ride_started_at is not null then raise exception 'The ride has already started.'; end if;
  if lower(coalesce(v_booking.status::text, '')) <> 'confirmed' then
    raise exception 'Only a confirmed booking can start a ride.';
  end if;

  if lower(coalesce(v_caller.role::text, '')) = 'super_admin' then
    v_override := true;
  elsif lower(coalesce(v_caller.role::text, '')) <> 'manager'
        or v_booking.assigned_manager_id is distinct from v_caller.id then
    raise exception 'This booking is not assigned to the current Ride Manager.';
  end if;

  if p_vehicle_ids is null or array_position(p_vehicle_ids, null) is not null then
    raise exception 'Vehicle IDs are required and cannot contain null values.';
  end if;

  select count(*), count(distinct id)
  into v_supplied_count, v_distinct_count
  from unnest(p_vehicle_ids) ids(id);

  if v_supplied_count <> v_distinct_count then
    raise exception 'Duplicate vehicle IDs are not allowed.';
  end if;

  v_booking_json := to_jsonb(v_booking);
  v_required_quantity := greatest(coalesce(nullif(v_booking_json->>'vehicle_quantity', '')::integer, 1), 1);
  if v_distinct_count <> v_required_quantity then
    raise exception 'Exactly % distinct vehicle(s) are required.', v_required_quantity;
  end if;

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

  perform v.id
  from public.vehicles v
  join unnest(p_vehicle_ids) ids(id) on ids.id = v.id
  order by v.id
  for update of v;

  select count(*)
  into v_valid_count
  from public.vehicles v
  join unnest(p_vehicle_ids) ids(id) on ids.id = v.id
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
    );

  if v_valid_count <> v_required_quantity then
    raise exception 'One or more vehicles are missing, unavailable, incompatible, or already assigned.';
  end if;

  v_before := to_jsonb(v_booking);

  perform set_config('edrive.assignment_rpc', 'on', true);

  insert into public.booking_request_vehicle_assignments (
    booking_request_id,
    vehicle_id,
    assignment_position,
    assigned_by,
    assigned_at,
    is_active
  )
  select
    v_booking.id,
    ids.id,
    ids.ordinality::integer,
    v_caller.id,
    now(),
    true
  from unnest(p_vehicle_ids) with ordinality ids(id, ordinality);

  update public.vehicles v
  set status = 'in_use',
      is_available = false,
      updated_at = now()
  where v.id = any(p_vehicle_ids);

  select
    (array_agg(ids.id order by ids.ordinality))[1],
    string_agg(v.registration_number, ', ' order by ids.ordinality)
  into v_first_vehicle_id, v_registration_summary
  from unnest(p_vehicle_ids) with ordinality ids(id, ordinality)
  join public.vehicles v on v.id = ids.id;

  update public.booking_requests
  set customer_arrived = true,
      manager_status = 'In Progress',
      payment_workflow_status = 'Ride In Progress',
      ride_started_at = now(),
      assigned_vehicle_id = v_first_vehicle_id,
      assigned_vehicle_name = v_registration_summary,
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
    'ride_started',
    auth.uid(),
    v_caller.id,
    v_caller.role::text,
    v_booking.assigned_manager_id,
    v_before,
    to_jsonb(v_booking),
    jsonb_build_object(
      'vehicle_ids', to_jsonb(p_vehicle_ids),
      'registration_numbers', v_registration_summary,
      'vehicle_quantity', v_required_quantity,
      'super_admin_override', v_override
    )
  );

  return to_jsonb(v_booking);
exception
  when unique_violation then
    raise exception 'A selected vehicle was assigned concurrently. Refresh and choose available vehicles.';
end;
$$;

create or replace function public.mark_booking_no_show(
  p_booking_request_id text,
  p_reason text default 'Guest did not arrive',
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_caller_count integer;
  v_booking public.booking_requests%rowtype;
  v_before jsonb;
  v_booking_json jsonb;
  v_scheduled_at timestamptz;
  v_note_line text;
  v_override boolean := false;
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

  if not found then raise exception 'Active portal user was not found.'; end if;

  select *
  into v_booking
  from public.booking_requests
  where id::text = p_booking_request_id
  for update;

  if not found then raise exception 'Booking request was not found.'; end if;
  if v_booking.ride_started_at is not null then raise exception 'A started ride cannot be marked No Show.'; end if;
  if lower(coalesce(v_booking.status::text, '')) <> 'confirmed' then
    raise exception 'Only a confirmed booking can be marked No Show.';
  end if;

  v_booking_json := to_jsonb(v_booking);
  begin
    v_scheduled_at := (
      (v_booking_json->>'preferred_date')::date
      + (v_booking_json->>'preferred_time')::time
    ) at time zone 'Asia/Dubai';
  exception when others then
    raise exception 'Booking schedule is missing or invalid; No Show requires the scheduled Dubai ride time.';
  end;

  if now() < v_scheduled_at then
    raise exception 'No Show cannot be marked before the scheduled Dubai ride time.';
  end if;

  if lower(coalesce(v_caller.role::text, '')) = 'super_admin' then
    v_override := true;
  elsif lower(coalesce(v_caller.role::text, '')) <> 'manager'
        or v_booking.assigned_manager_id is distinct from v_caller.id then
    raise exception 'This booking is not assigned to the current Ride Manager.';
  end if;

  if exists (
    select 1
    from public.booking_request_vehicle_assignments bva
    where bva.booking_request_id = v_booking.id
      and bva.is_active
  ) then
    raise exception 'A booking with active vehicle assignments cannot be marked No Show.';
  end if;

  v_before := to_jsonb(v_booking);
  v_note_line := concat(
    'No Show: ',
    left(btrim(coalesce(p_reason, 'Guest did not arrive')), 200),
    case
      when nullif(btrim(coalesce(p_note, '')), '') is null then ''
      else ' - ' || left(btrim(p_note), 1000)
    end
  );

  update public.booking_requests
  set status = 'No Show',
      manager_status = 'No Show',
      customer_arrived = false,
      internal_note = concat_ws(E'\n', nullif(btrim(coalesce(internal_note, '')), ''), v_note_line),
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
    'booking_no_show',
    auth.uid(),
    v_caller.id,
    v_caller.role::text,
    v_booking.assigned_manager_id,
    v_before,
    to_jsonb(v_booking),
    jsonb_build_object(
      'super_admin_override', v_override,
      'scheduled_at', v_scheduled_at,
      'reason', left(btrim(coalesce(p_reason, 'Guest did not arrive')), 200),
      'note', nullif(left(btrim(coalesce(p_note, '')), 1000), '')
    )
  );

  return to_jsonb(v_booking);
end;
$$;

create or replace function public.complete_booking_ride(
  p_booking_request_id text,
  p_payment_method text,
  p_amount_received_aed numeric default 0,
  p_card_reference text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_caller_count integer;
  v_booking public.booking_requests%rowtype;
  v_booking_json jsonb;
  v_before jsonb;
  v_total numeric;
  v_received numeric;
  v_pending numeric;
  v_method text;
  v_is_b2b boolean;
  v_required_quantity integer;
  v_assignment_count integer;
  v_valid_vehicle_count integer;
  v_distinct_vehicle_count integer;
  v_distinct_position_count integer;
  v_min_position integer;
  v_max_position integer;
  v_vehicle_ids uuid[];
  v_registration_numbers text[];
  v_override boolean := false;
  v_note_text text;
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

  select *
  into v_booking
  from public.booking_requests
  where id::text = p_booking_request_id
  for update;

  if not found then raise exception 'Booking request was not found.'; end if;
  if lower(coalesce(v_booking.status::text, '')) = 'completed' then
    raise exception 'The ride has already been completed.';
  end if;
  if v_booking.ride_started_at is null
     or lower(coalesce(v_booking.manager_status::text, '')) <> 'in progress'
     or lower(coalesce(v_booking.payment_workflow_status::text, '')) <> 'ride in progress' then
    raise exception 'Only a ride currently in progress can be completed.';
  end if;

  if lower(coalesce(v_caller.role::text, '')) = 'super_admin' then
    v_override := true;
  elsif lower(coalesce(v_caller.role::text, '')) <> 'manager'
        or v_booking.assigned_manager_id is distinct from v_caller.id then
    raise exception 'This booking is not assigned to the current Ride Manager.';
  end if;

  perform bva.id
  from public.booking_request_vehicle_assignments bva
  where bva.booking_request_id = v_booking.id
    and bva.is_active
  order by bva.assignment_position, bva.id
  for update;

  v_booking_json := to_jsonb(v_booking);
  v_required_quantity := greatest(
    coalesce(nullif(v_booking_json->>'vehicle_quantity', '')::integer, 1),
    1
  );

  select
    count(*),
    count(v.id),
    count(distinct bva.vehicle_id),
    count(distinct bva.assignment_position),
    min(bva.assignment_position),
    max(bva.assignment_position),
    array_agg(bva.vehicle_id order by bva.assignment_position),
    array_agg(v.registration_number order by bva.assignment_position)
  into
    v_assignment_count,
    v_valid_vehicle_count,
    v_distinct_vehicle_count,
    v_distinct_position_count,
    v_min_position,
    v_max_position,
    v_vehicle_ids,
    v_registration_numbers
  from public.booking_request_vehicle_assignments bva
  left join public.vehicles v on v.id = bva.vehicle_id
  where bva.booking_request_id = v_booking.id
    and bva.is_active;

  if v_assignment_count <> v_required_quantity
     or v_valid_vehicle_count <> v_required_quantity
     or v_distinct_vehicle_count <> v_required_quantity
     or v_distinct_position_count <> v_required_quantity
     or v_min_position <> 1
     or v_max_position <> v_required_quantity then
    raise exception
      'Ride completion requires exactly % valid, distinct vehicle assignment(s) in complete positions 1 through %.',
      v_required_quantity,
      v_required_quantity;
  end if;

  perform v.id
  from public.vehicles v
  where v.id = any(v_vehicle_ids)
  order by v.id
  for update;

  v_total := greatest(coalesce(
    nullif(nullif(v_booking_json->>'total_amount', '')::numeric, 0),
    nullif(nullif(v_booking_json->>'selected_package_price', '')::numeric, 0),
    nullif(nullif(v_booking_json->>'selected_package_b2b_price', '')::numeric, 0),
    0
  ), 0);
  v_is_b2b :=
    lower(coalesce(v_booking_json->>'payment_source', '')) = 'b2b'
    or nullif(v_booking_json->>'b2b_agent_id', '') is not null
    or nullif(v_booking_json->>'b2b_agent_name', '') is not null;

  if v_is_b2b then
    v_method := 'B2B Invoice';
    v_received := 0;
    v_pending := v_total;
  else
    if v_total <= 0 then
      raise exception 'A positive booking total is required for direct Cash or Card completion.';
    end if;
    v_method := initcap(lower(btrim(coalesce(p_payment_method, ''))));
    if v_method not in ('Cash', 'Card') then
      raise exception 'Direct bookings can be completed only with Cash or Card.';
    end if;
    if v_method = 'Card' and nullif(btrim(coalesce(p_card_reference, '')), '') is null then
      raise exception 'Card reference is required.';
    end if;
    v_received := least(greatest(coalesce(p_amount_received_aed, 0), 0), v_total);
    if v_received <= 0 then raise exception 'Received amount must be greater than zero.'; end if;
    v_pending := greatest(v_total - v_received, 0);
  end if;

  v_note_text := concat_ws(
    E'\n',
    nullif(btrim(coalesce(v_booking.internal_note, '')), ''),
    case
      when v_method = 'Card'
        then 'Card ref: ' || left(btrim(p_card_reference), 200)
      else null
    end,
    nullif(left(btrim(coalesce(p_note, '')), 1000), '')
  );
  v_before := to_jsonb(v_booking);

  perform set_config('edrive.assignment_rpc', 'on', true);

  update public.booking_request_vehicle_assignments
  set is_active = false,
      released_at = now(),
      released_by = v_caller.id,
      release_reason = 'completed'
  where booking_request_id = v_booking.id
    and is_active;

  update public.vehicles
  set status = 'available',
      is_available = true,
      updated_at = now()
  where id = any(v_vehicle_ids)
    and lower(coalesce(status::text, '')) = 'in_use';

  update public.booking_requests
  set status = 'Completed',
      manager_status = 'Completed',
      payment_method = v_method,
      payment_source = case when v_is_b2b then 'b2b' else 'direct' end,
      amount_received_aed = v_received,
      amount_pending_aed = v_pending,
      payment_status = case
        when v_is_b2b then 'Not Paid'
        when v_pending <= 0 then 'Paid'
        else 'Partial Paid'
      end,
      collection_status = case
        when v_is_b2b then 'pending_collection'
        when v_pending <= 0 then 'collected'
        else 'partial_collection'
      end,
      payment_workflow_status = case
        when v_is_b2b then 'B2B Invoice Generated'
        else 'Collected By Manager'
      end,
      internal_note = v_note_text,
      ride_completed_at = now(),
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
    'ride_completed',
    auth.uid(),
    v_caller.id,
    v_caller.role::text,
    v_booking.assigned_manager_id,
    v_before,
    to_jsonb(v_booking),
    jsonb_build_object(
      'vehicle_ids', to_jsonb(v_vehicle_ids),
      'registration_numbers', to_jsonb(v_registration_numbers),
      'payment_method', v_method,
      'amount_received_aed', v_received,
      'amount_pending_aed', v_pending,
      'super_admin_override', v_override
    )
  );

  return to_jsonb(v_booking);
end;
$$;

revoke all on function public.set_booking_manager(text, uuid) from public;
revoke all on function public.get_assignable_vehicles(text) from public;
revoke all on function public.start_booking_ride(text, uuid[]) from public;
revoke all on function public.mark_booking_no_show(text, text, text) from public;
revoke all on function public.complete_booking_ride(text, text, numeric, text, text) from public;
grant execute on function public.set_booking_manager(text, uuid) to authenticated;
grant execute on function public.get_assignable_vehicles(text) to authenticated;
grant execute on function public.start_booking_ride(text, uuid[]) to authenticated;
grant execute on function public.mark_booking_no_show(text, text, text) to authenticated;
grant execute on function public.complete_booking_ride(text, text, numeric, text, text) to authenticated;

alter table public.booking_request_vehicle_assignments enable row level security;
alter table public.booking_action_history enable row level security;

revoke all on table public.booking_request_vehicle_assignments from anon, authenticated;
revoke all on table public.booking_action_history from anon, authenticated;
grant select on table public.booking_request_vehicle_assignments to authenticated;
grant select on table public.booking_action_history to authenticated;

drop policy if exists "booking_request_vehicle_assignments_authorized_select"
  on public.booking_request_vehicle_assignments;
create policy "booking_request_vehicle_assignments_authorized_select"
on public.booking_request_vehicle_assignments
for select
to authenticated
using (
  public.has_edrive_role(array['super_admin', 'admin', 'booking_staff', 'booking_manager', 'finance'])
  or exists (
    select 1
    from public.booking_requests br
    where br.id = booking_request_id
      and public.is_current_ride_manager_assignment(br.assigned_manager_id)
  )
);

drop policy if exists "booking_action_history_authorized_select"
  on public.booking_action_history;
create policy "booking_action_history_authorized_select"
on public.booking_action_history
for select
to authenticated
using (
  public.has_edrive_role(array['super_admin', 'admin', 'booking_staff', 'booking_manager', 'finance'])
  or exists (
    select 1
    from public.booking_requests br
    where br.id = booking_request_id
      and public.is_current_ride_manager_assignment(br.assigned_manager_id)
  )
);

commit;

-- Combined manual review output for the Supabase SQL Editor.
select
  'active_maintenance_staff'::text as review_type,
  au.id::text as record_id,
  coalesce(nullif(au.email, ''), nullif(au.full_name, ''), au.id::text) as record_label,
  jsonb_build_object(
    'auth_user_id', au.auth_user_id,
    'full_name', au.full_name,
    'email', au.email,
    'role', au.role,
    'status', au.status
  ) as review_details
from public.admin_users au
where lower(coalesce(au.role::text, '')) = 'maintenance_staff'
  and lower(coalesce(au.status::text, '')) = 'active'

union all

select
  'legacy_manager_assignment'::text as review_type,
  br.id::text as record_id,
  coalesce(
    nullif(to_jsonb(br)->>'booking_code', ''),
    nullif(to_jsonb(br)->>'booking_number', ''),
    br.id::text
  ) as record_label,
  jsonb_build_object(
    'assigned_manager_name', br.assigned_manager_name,
    'assigned_manager_id', br.assigned_manager_id,
    'reason', 'No unique active Ride Manager match was backfilled'
  ) as review_details
from public.booking_requests br
where br.assigned_manager_id is null
  and nullif(btrim(coalesce(br.assigned_manager_name, '')), '') is not null

union all

select
  'legacy_vehicle_snapshot'::text as review_type,
  br.id::text as record_id,
  coalesce(
    nullif(to_jsonb(br)->>'booking_code', ''),
    nullif(to_jsonb(br)->>'booking_number', ''),
    br.id::text
  ) as record_label,
  jsonb_build_object(
    'vehicle_quantity', br.vehicle_quantity,
    'assigned_vehicle_id', br.assigned_vehicle_id,
    'assigned_vehicle_name', br.assigned_vehicle_name,
    'ride_started_at', br.ride_started_at,
    'reason', 'Legacy snapshot requires normalized assignment reconciliation'
  ) as review_details
from public.booking_requests br
where br.assigned_vehicle_id is not null
   or nullif(btrim(coalesce(br.assigned_vehicle_name, '')), '') is not null
order by review_type, record_label, record_id;
