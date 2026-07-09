do $$
begin
  if to_regclass('public.booking_requests') is null then
    raise exception 'booking_requests table does not exist';
  end if;
end $$;

alter table public.booking_requests
  add column if not exists booking_number text,
  add column if not exists booking_source text default 'website',
  add column if not exists manager_status text default 'Pending',
  add column if not exists assigned_manager_name text,
  add column if not exists assigned_vehicle_id uuid,
  add column if not exists assigned_vehicle_name text,
  add column if not exists payment_source text default 'direct',
  add column if not exists payment_workflow_status text default 'unpaid',
  add column if not exists collection_status text default 'pending_collection',
  add column if not exists amount_received_aed numeric(12,2) not null default 0,
  add column if not exists amount_pending_aed numeric(12,2) not null default 0,
  add column if not exists b2b_agent_id uuid,
  add column if not exists b2b_agent_name text,
  add column if not exists customer_arrived boolean not null default false,
  add column if not exists confirmed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists admin_payment_received_at timestamptz,
  add column if not exists manager_note text,
  add column if not exists internal_note text;

alter table public.booking_requests
  alter column booking_source set default 'website',
  alter column manager_status set default 'Pending',
  alter column payment_source set default 'direct',
  alter column payment_workflow_status set default 'unpaid',
  alter column collection_status set default 'pending_collection',
  alter column amount_received_aed set default 0,
  alter column amount_pending_aed set default 0,
  alter column customer_arrived set default false;

update public.booking_requests
set booking_number = coalesce(nullif(trim(booking_number), ''), booking_code),
    booking_source = coalesce(nullif(trim(booking_source), ''), 'website'),
    manager_status = coalesce(nullif(trim(manager_status), ''), 'Pending'),
    payment_source = coalesce(nullif(trim(payment_source), ''), 'direct'),
    payment_workflow_status = coalesce(nullif(trim(payment_workflow_status), ''), 'unpaid'),
    collection_status = coalesce(nullif(trim(collection_status), ''), 'pending_collection'),
    amount_received_aed = greatest(coalesce(amount_received_aed, 0), 0),
    amount_pending_aed = case
      when coalesce(amount_pending_aed, 0) = 0 and coalesce(amount_received_aed, 0) = 0 then greatest(coalesce(total_amount, 0), 0)
      else greatest(coalesce(amount_pending_aed, 0), 0)
    end,
    customer_arrived = coalesce(customer_arrived, false),
    updated_at = now();

create index if not exists booking_requests_workflow_status_idx
on public.booking_requests(payment_workflow_status, collection_status);

create index if not exists booking_requests_manager_status_idx
on public.booking_requests(manager_status);

create index if not exists booking_requests_created_at_idx
on public.booking_requests(created_at desc);
