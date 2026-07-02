-- Booking operations workflow. Additive migration: existing public booking RPC remains compatible.

alter type public.booking_status add value if not exists 'contacted';
alter type public.booking_status add value if not exists 'ready';
alter type public.booking_status add value if not exists 'in_progress';
alter type public.booking_status add value if not exists 'no_show';
alter type public.booking_status add value if not exists 'rescheduled';
alter type public.booking_status add value if not exists 'refund_pending';
alter type public.booking_status add value if not exists 'refunded';

do $$ begin
  create type public.payment_workflow_status as enum ('unpaid', 'partial_paid', 'paid', 'refund_pending', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.collection_status as enum ('pending_collection', 'with_admin', 'with_manager', 'with_captain', 'with_driver', 'deposited', 'verified_by_finance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fleet_status as enum ('available', 'assigned', 'in_ride', 'maintenance', 'damaged', 'out_of_service');
exception when duplicate_object then null; end $$;

alter table public.roles drop constraint if exists roles_slug_check;
alter table public.roles add constraint roles_slug_check check (slug in ('super_admin', 'admin', 'booking_manager', 'finance', 'captain', 'driver', 'manager', 'booking_agent'));

insert into public.roles (slug, name, description) values
  ('super_admin', 'Super Admin', 'Full platform access'),
  ('booking_manager', 'Booking Manager', 'Confirmed booking operations access'),
  ('finance', 'Finance', 'Payment, collection, and report access'),
  ('captain', 'Captain', 'Prepared for future assigned ride access'),
  ('driver', 'Driver', 'Prepared for future assigned ride access')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

alter table public.bookings
  add column if not exists admin_status public.booking_status not null default 'pending',
  add column if not exists manager_status public.booking_status,
  add column if not exists assigned_manager_id uuid references public.users(id),
  add column if not exists assigned_vehicle_name text,
  add column if not exists service_type text,
  add column if not exists vehicle_type text,
  add column if not exists guest_count integer not null default 1 check (guest_count > 0),
  add column if not exists meeting_location text,
  add column if not exists captain_name text,
  add column if not exists driver_required boolean not null default false,
  add column if not exists driver_name text,
  add column if not exists ride_start_time timestamptz,
  add column if not exists ride_end_time timestamptz,
  add column if not exists extra_time_minutes integer not null default 0 check (extra_time_minutes >= 0),
  add column if not exists customer_arrived boolean not null default false,
  add column if not exists damage_reported boolean not null default false,
  add column if not exists damage_note text,
  add column if not exists manager_note text,
  add column if not exists internal_note text,
  add column if not exists customer_note text,
  add column if not exists amount_received_aed numeric(12,2) not null default 0 check (amount_received_aed >= 0),
  add column if not exists amount_pending_aed numeric(12,2) not null default 0 check (amount_pending_aed >= 0),
  add column if not exists payment_workflow_status public.payment_workflow_status not null default 'unpaid',
  add column if not exists payment_method text,
  add column if not exists payment_received_by text,
  add column if not exists payment_collected_by text,
  add column if not exists collection_status public.collection_status not null default 'pending_collection',
  add column if not exists payment_notes text,
  add column if not exists source text not null default 'website' check (source in ('website', 'admin', 'walk_in'));

update public.bookings
set
  admin_status = status,
  assigned_manager_id = coalesce(assigned_manager_id, assigned_staff_id),
  amount_pending_aed = greatest(net_amount_aed - amount_received_aed, 0),
  customer_note = coalesce(customer_note, special_notes)
where true;

alter table public.vehicles
  add column if not exists operations_status public.fleet_status not null default 'available',
  add column if not exists registration_number text,
  add column if not exists last_maintenance_date date,
  add column if not exists next_maintenance_date date,
  add column if not exists notes text;

alter table public.payments
  add column if not exists received_by text,
  add column if not exists collected_by text,
  add column if not exists collection_status public.collection_status not null default 'pending_collection',
  add column if not exists note text,
  add column if not exists created_by uuid references public.users(id);

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  previous_status public.booking_status,
  new_status public.booking_status not null,
  changed_by uuid references public.users(id),
  changed_by_role text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_admin_status_idx on public.bookings(admin_status, created_at desc);
create index if not exists bookings_manager_status_idx on public.bookings(manager_status, start_at);
create index if not exists bookings_collection_status_idx on public.bookings(collection_status);
create index if not exists bookings_payment_workflow_status_idx on public.bookings(payment_workflow_status);
create index if not exists bookings_assigned_manager_idx on public.bookings(assigned_manager_id);
create index if not exists booking_status_history_booking_idx on public.booking_status_history(booking_id, created_at desc);
create index if not exists vehicles_operations_status_idx on public.vehicles(operations_status);

create or replace function public.record_booking_status_history()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.booking_status_history (
      booking_id, previous_status, new_status, changed_by, changed_by_role, note
    ) values (
      new.id,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      coalesce(new.updated_by, new.created_by),
      public.current_staff_role(),
      case when tg_op = 'INSERT' then 'Booking created' else null end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists record_booking_status_history on public.bookings;
create trigger record_booking_status_history
after insert or update of status on public.bookings
for each row execute function public.record_booking_status_history();

create or replace function public.sync_booking_fleet_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.vehicles
  set operations_status = case
    when new.damage_reported then 'damaged'::public.fleet_status
    when new.status = 'in_progress' then 'in_ride'::public.fleet_status
    when new.status in ('confirmed', 'ready') then 'assigned'::public.fleet_status
    when new.status in ('completed', 'cancelled', 'no_show', 'refunded') then 'available'::public.fleet_status
    else operations_status
  end,
  is_available = case
    when new.damage_reported then false
    when new.status in ('confirmed', 'ready', 'in_progress') then false
    when new.status in ('completed', 'cancelled', 'no_show', 'refunded') then true
    else is_available
  end,
  updated_at = now(),
  updated_by = new.updated_by
  where id = new.vehicle_id;
  return new;
end;
$$;

drop trigger if exists sync_booking_fleet_status on public.bookings;
create trigger sync_booking_fleet_status
after insert or update of status, vehicle_id, damage_reported on public.bookings
for each row execute function public.sync_booking_fleet_status();

alter table public.booking_status_history enable row level security;

drop policy if exists "bookings staff read" on public.bookings;
create policy "bookings role read" on public.bookings for select to authenticated using (
  public.has_staff_role(array['super_admin','admin','finance','booking_agent'])
  or (
    public.has_staff_role(array['booking_manager','manager'])
    and status in ('confirmed','ready','in_progress','completed','cancelled','no_show','rescheduled')
  )
);

drop policy if exists "bookings staff update" on public.bookings;
create policy "bookings role update" on public.bookings for update to authenticated
using (public.has_staff_role(array['super_admin','admin','booking_manager','manager','booking_agent']))
with check (public.has_staff_role(array['super_admin','admin','booking_manager','manager','booking_agent']));

drop policy if exists "bookings staff insert" on public.bookings;
create policy "bookings role insert" on public.bookings for insert to authenticated
with check (public.has_staff_role(array['super_admin','admin','booking_manager','manager','booking_agent']));

drop policy if exists "payments staff read" on public.payments;
create policy "payments role read" on public.payments for select to authenticated
using (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager']));

drop policy if exists "payments admin manager manage" on public.payments;
create policy "payments role manage" on public.payments for all to authenticated
using (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager']))
with check (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager']));

create policy "booking history staff read" on public.booking_status_history for select to authenticated
using (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager','booking_agent']));

revoke insert, update, delete on public.booking_status_history from anon, authenticated;
grant select on public.booking_status_history to authenticated;
grant select, insert, update, delete on public.bookings, public.payments, public.vehicles to authenticated;

revoke all on function public.current_staff_role() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.has_staff_role(text[]) from public;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.has_staff_role(text[]) to authenticated;
