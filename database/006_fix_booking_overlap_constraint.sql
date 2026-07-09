create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin
  create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

alter type public.booking_status add value if not exists 'pending';
alter type public.booking_status add value if not exists 'confirmed';

alter table public.bookings
  add column if not exists start_at timestamptz not null default now(),
  add column if not exists end_at timestamptz not null default (now() + interval '1 hour'),
  add column if not exists vehicle_id uuid,
  add column if not exists status public.booking_status not null default 'pending';

update public.bookings
set end_at = start_at + interval '1 hour'
where end_at <= start_at;

alter table public.bookings
  drop constraint if exists bookings_no_active_overlap;

alter table public.bookings
  add constraint bookings_no_active_overlap
  exclude using gist (
    vehicle_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('pending'::public.booking_status, 'confirmed'::public.booking_status));
