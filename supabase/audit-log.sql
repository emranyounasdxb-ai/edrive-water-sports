create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  entity_type text,
  entity_id text,
  entity_label text,
  actor_user_id uuid,
  actor_name text,
  actor_email text,
  actor_role text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_module_idx on public.audit_logs(module, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs(action, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_insert_own" on public.audit_logs;
drop policy if exists "audit_logs_admin_read" on public.audit_logs;

create policy "audit_logs_insert_own"
on public.audit_logs
for insert
to authenticated
with check (actor_user_id = auth.uid());

create policy "audit_logs_admin_read"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.auth_user_id::text = auth.uid()::text
      and lower(coalesce(au.status::text, '')) = 'active'
      and lower(coalesce(au.role::text, '')) in ('super_admin', 'admin', 'finance')
  )
);

create or replace function public.capture_booking_request_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_actor_email text;
  v_actor_role text;
  v_booking_label text;
  v_booking_id text;
  v_logged boolean := false;
begin
  if v_actor_id is not null then
    select
      coalesce(nullif(au.full_name, ''), nullif(au.email, ''), 'Portal User'),
      au.email,
      au.role::text
    into v_actor_name, v_actor_email, v_actor_role
    from public.admin_users au
    where au.auth_user_id::text = v_actor_id::text
       or lower(coalesce(au.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    order by case when au.auth_user_id::text = v_actor_id::text then 0 else 1 end
    limit 1;
  end if;

  if v_actor_id is null then
    v_actor_name := 'Public Website';
    v_actor_email := null;
    v_actor_role := 'customer';
  else
    v_actor_name := coalesce(v_actor_name, auth.jwt() ->> 'email', 'Portal User');
    v_actor_email := coalesce(v_actor_email, auth.jwt() ->> 'email');
    v_actor_role := coalesce(v_actor_role, 'authenticated');
  end if;

  v_booking_label := coalesce(nullif(new.booking_code::text, ''), nullif(new.booking_number::text, ''), new.id::text, 'Booking');
  v_booking_id := coalesce(new.id::text, v_booking_label);

  if tg_op = 'INSERT' then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'bookings', 'booking_created', 'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      format('Booking %s was created.', v_booking_label),
      jsonb_build_object(
        'status', new.status,
        'customer_name', new.customer_name,
        'package', coalesce(new.selected_package_name, new.selected_package_category, new.service_type),
        'preferred_date', new.preferred_date,
        'preferred_time', new.preferred_time,
        'total_amount', new.total_amount,
        'payment_source', new.payment_source
      )
    );
    return new;
  end if;

  if new.status is distinct from old.status
     and lower(coalesce(new.status::text, '')) = 'confirmed' then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'bookings', 'booking_confirmed', 'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      format('Booking %s was confirmed.', v_booking_label),
      jsonb_build_object('status_before', old.status, 'status_after', new.status)
    );
    v_logged := true;
  end if;

  if new.assigned_manager_name is distinct from old.assigned_manager_name then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'bookings',
      case when nullif(new.assigned_manager_name, '') is null then 'manager_unassigned' else 'manager_assigned' end,
      'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      case
        when nullif(new.assigned_manager_name, '') is null then format('Manager was removed from booking %s.', v_booking_label)
        else format('%s was assigned to booking %s.', new.assigned_manager_name, v_booking_label)
      end,
      jsonb_build_object('manager_before', old.assigned_manager_name, 'manager_after', new.assigned_manager_name)
    );
    v_logged := true;
  end if;

  if new.payment_workflow_status is distinct from old.payment_workflow_status
     and lower(coalesce(new.payment_workflow_status::text, '')) = 'ride in progress' then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'rides', 'ride_started', 'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      format('Ride %s was started with %s.', v_booking_label, coalesce(new.assigned_vehicle_name, 'assigned vehicle')),
      jsonb_build_object(
        'manager', new.assigned_manager_name,
        'vehicle', new.assigned_vehicle_name,
        'workflow_before', old.payment_workflow_status,
        'workflow_after', new.payment_workflow_status
      )
    );
    v_logged := true;
  end if;

  if new.status is distinct from old.status
     and lower(coalesce(new.status::text, '')) = 'completed' then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'rides', 'ride_completed', 'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      format('Ride %s was completed.', v_booking_label),
      jsonb_build_object(
        'manager', new.assigned_manager_name,
        'vehicle', new.assigned_vehicle_name,
        'payment_method', new.payment_method,
        'amount_received', new.amount_received_aed,
        'amount_pending', new.amount_pending_aed,
        'collection_status', new.collection_status
      )
    );
    v_logged := true;
  end if;

  if new.status is distinct from old.status
     and lower(coalesce(new.status::text, '')) = 'no show' then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'rides', 'no_show', 'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      format('Booking %s was marked as No Show.', v_booking_label),
      jsonb_build_object(
        'manager', new.assigned_manager_name,
        'vehicle', new.assigned_vehicle_name,
        'note', new.internal_note,
        'collection_status', new.collection_status
      )
    );
    v_logged := true;
  end if;

  if (
    new.collection_status is distinct from old.collection_status
    and lower(coalesce(new.collection_status::text, '')) = 'company_received'
  ) or (
    new.payment_workflow_status is distinct from old.payment_workflow_status
    and lower(coalesce(new.payment_workflow_status::text, '')) = 'received by admin'
  ) then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'payments', 'payment_received', 'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      format('Payment for booking %s was received into the company account.', v_booking_label),
      jsonb_build_object(
        'source', coalesce(new.b2b_agent_name, new.assigned_manager_name, new.customer_name),
        'payment_method', new.payment_method,
        'amount_received', new.amount_received_aed,
        'amount_pending', new.amount_pending_aed,
        'collection_before', old.collection_status,
        'collection_after', new.collection_status
      )
    );
    v_logged := true;
  end if;

  if not v_logged then
    insert into public.audit_logs (
      module, action, entity_type, entity_id, entity_label,
      actor_user_id, actor_name, actor_email, actor_role,
      summary, metadata
    ) values (
      'bookings', 'booking_updated', 'booking_request', v_booking_id, v_booking_label,
      v_actor_id, v_actor_name, v_actor_email, v_actor_role,
      format('Booking %s was updated.', v_booking_label),
      jsonb_build_object(
        'status_before', old.status,
        'status_after', new.status,
        'manager_before', old.assigned_manager_name,
        'manager_after', new.assigned_manager_name,
        'vehicle_before', old.assigned_vehicle_name,
        'vehicle_after', new.assigned_vehicle_name,
        'payment_status_before', old.payment_status,
        'payment_status_after', new.payment_status
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists booking_requests_audit_trigger on public.booking_requests;
create trigger booking_requests_audit_trigger
after insert or update on public.booking_requests
for each row execute function public.capture_booking_request_audit();

create or replace function public.capture_payment_receipt_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_actor_email text;
  v_actor_role text;
begin
  if v_actor_id is not null then
    select
      coalesce(nullif(au.full_name, ''), nullif(au.email, ''), 'Portal User'),
      au.email,
      au.role::text
    into v_actor_name, v_actor_email, v_actor_role
    from public.admin_users au
    where au.auth_user_id::text = v_actor_id::text
       or lower(coalesce(au.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    order by case when au.auth_user_id::text = v_actor_id::text then 0 else 1 end
    limit 1;
  end if;

  insert into public.audit_logs (
    module, action, entity_type, entity_id, entity_label,
    actor_user_id, actor_name, actor_email, actor_role,
    summary, metadata
  ) values (
    'payments', 'receipt_created', 'payment_receipt', new.id::text, new.receipt_number,
    v_actor_id,
    coalesce(v_actor_name, auth.jwt() ->> 'email', 'Portal User'),
    coalesce(v_actor_email, auth.jwt() ->> 'email'),
    coalesce(v_actor_role, 'authenticated'),
    format('Receipt %s was created for %s.', new.receipt_number, new.source_name),
    jsonb_build_object(
      'source_type', new.source_type,
      'source_name', new.source_name,
      'received_amount', new.received_amount,
      'payment_method', new.payment_method,
      'reference_no', new.reference_no,
      'received_by', new.received_by,
      'received_at', new.received_at
    )
  );

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.payment_receipts') is not null then
    execute 'drop trigger if exists payment_receipts_audit_trigger on public.payment_receipts';
    execute 'create trigger payment_receipts_audit_trigger after insert on public.payment_receipts for each row execute function public.capture_payment_receipt_audit()';
  end if;
end;
$$;

comment on table public.audit_logs is 'Immutable operational activity history for the eDrive admin and manager workflows.';
