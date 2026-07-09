create extension if not exists btree_gist;

alter table public.bookings
  drop constraint if exists bookings_no_active_overlap;

alter table public.bookings
  add constraint bookings_no_active_overlap
  exclude using gist (
    vehicle_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('pending'::public.booking_status, 'confirmed'::public.booking_status));
