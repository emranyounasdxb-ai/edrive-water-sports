-- eDrive guarded purge of the currently verified test operational dataset.
-- DESTRUCTIVE: permanently deletes test bookings, customer PII, payment records,
-- receipts, allocations, ledger entries, and booking/vehicle assignment records.
-- It does NOT delete vehicles, packages, admin users, roles, or configuration.
--
-- Safety: this script runs only while the database still matches the preview taken
-- on 22 July 2026. If any protected count has changed, the transaction aborts.

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';

lock table
  public.booking_requests,
  public.bookings,
  public.customers,
  public.payment_receipts,
  public.payment_receipt_allocations,
  public.payment_ledger_entries,
  public.booking_payments,
  public.booking_status_history,
  public.booking_vehicle_assignments,
  public.booking_vehicle_progress,
  public.manager_cash_ledger,
  public.payments,
  public.contact_inquiries
in share row exclusive mode;

-- Refuse to purge when anything changed after the approved preview.
do $$
declare
  v_min_booking timestamptz;
  v_max_booking timestamptz;
begin
  if (select count(*) from public.booking_requests) <> 3 then
    raise exception 'Cleanup stopped: booking_requests count changed. Run the preview again.';
  end if;
  if (select count(*) from public.bookings) <> 1 then
    raise exception 'Cleanup stopped: bookings count changed. Run the preview again.';
  end if;
  if (select count(*) from public.customers) <> 1 then
    raise exception 'Cleanup stopped: customers count changed. Run the preview again.';
  end if;
  if (select count(*) from public.payment_receipts) <> 2 then
    raise exception 'Cleanup stopped: payment_receipts count changed. Run the preview again.';
  end if;
  if (select count(*) from public.payment_receipt_allocations) <> 2 then
    raise exception 'Cleanup stopped: payment_receipt_allocations count changed. Run the preview again.';
  end if;
  if (select count(*) from public.payment_ledger_entries) <> 4 then
    raise exception 'Cleanup stopped: payment_ledger_entries count changed. Run the preview again.';
  end if;

  if (select count(*) from public.booking_payments) <> 0
     or (select count(*) from public.booking_status_history) <> 0
     or (select count(*) from public.booking_vehicle_assignments) <> 0
     or (select count(*) from public.booking_vehicle_progress) <> 0
     or (select count(*) from public.manager_cash_ledger) <> 0
     or (select count(*) from public.payments) <> 0
     or (select count(*) from public.contact_inquiries) <> 0 then
    raise exception 'Cleanup stopped: a previously empty operational table now contains data. Run the preview again.';
  end if;

  select min(created_at), max(created_at)
  into v_min_booking, v_max_booking
  from public.booking_requests;

  if v_min_booking is null
     or v_min_booking < timestamptz '2026-07-13 00:00:00+00'
     or v_max_booking >= timestamptz '2026-07-21 00:00:00+00' then
    raise exception 'Cleanup stopped: booking date window no longer matches the approved July 2026 test dataset.';
  end if;
end
$$;

create temp table _edrive_purge_result (
  delete_order integer not null,
  table_name text not null,
  deleted_rows bigint not null
) on commit preserve rows;

-- Delete child and financial records before parent booking/customer records.
with deleted as (delete from public.manager_cash_ledger returning 1)
insert into _edrive_purge_result select 10, 'manager_cash_ledger', count(*) from deleted;

with deleted as (delete from public.payment_ledger_entries returning 1)
insert into _edrive_purge_result select 20, 'payment_ledger_entries', count(*) from deleted;

with deleted as (delete from public.payment_receipt_allocations returning 1)
insert into _edrive_purge_result select 30, 'payment_receipt_allocations', count(*) from deleted;

with deleted as (delete from public.payment_receipts returning 1)
insert into _edrive_purge_result select 40, 'payment_receipts', count(*) from deleted;

with deleted as (delete from public.booking_payments returning 1)
insert into _edrive_purge_result select 50, 'booking_payments', count(*) from deleted;

with deleted as (delete from public.payments returning 1)
insert into _edrive_purge_result select 60, 'payments', count(*) from deleted;

with deleted as (delete from public.booking_status_history returning 1)
insert into _edrive_purge_result select 70, 'booking_status_history', count(*) from deleted;

with deleted as (delete from public.booking_vehicle_progress returning 1)
insert into _edrive_purge_result select 80, 'booking_vehicle_progress', count(*) from deleted;

with deleted as (delete from public.booking_vehicle_assignments returning 1)
insert into _edrive_purge_result select 90, 'booking_vehicle_assignments', count(*) from deleted;

with deleted as (delete from public.bookings returning 1)
insert into _edrive_purge_result select 100, 'bookings', count(*) from deleted;

with deleted as (delete from public.booking_requests returning 1)
insert into _edrive_purge_result select 110, 'booking_requests', count(*) from deleted;

with deleted as (delete from public.customers returning 1)
insert into _edrive_purge_result select 120, 'customers', count(*) from deleted;

with deleted as (delete from public.contact_inquiries returning 1)
insert into _edrive_purge_result select 130, 'contact_inquiries', count(*) from deleted;

-- Final assertion: no operational records or vehicle links from the approved test set remain.
do $$
begin
  if exists (select 1 from public.booking_requests)
     or exists (select 1 from public.bookings)
     or exists (select 1 from public.customers)
     or exists (select 1 from public.payment_receipts)
     or exists (select 1 from public.payment_receipt_allocations)
     or exists (select 1 from public.payment_ledger_entries)
     or exists (select 1 from public.booking_payments)
     or exists (select 1 from public.booking_status_history)
     or exists (select 1 from public.booking_vehicle_assignments)
     or exists (select 1 from public.booking_vehicle_progress)
     or exists (select 1 from public.manager_cash_ledger)
     or exists (select 1 from public.payments)
     or exists (select 1 from public.contact_inquiries) then
    raise exception 'Cleanup verification failed. The transaction has been rolled back.';
  end if;
end
$$;

commit;

select table_name, deleted_rows
from _edrive_purge_result
order by delete_order;
