begin;

alter table public.booking_requests
  drop constraint if exists booking_requests_manager_status_check;

alter table public.booking_requests
  add constraint booking_requests_manager_status_check
  check (
    manager_status is null
    or manager_status in (
      'Pending',
      'Confirmed',
      'In Progress',
      'Cancelled',
      'No Show',
      'Completed'
    )
  );

commit;
