alter table public.bookings
  add column if not exists preferred_date date,
  add column if not exists preferred_time time,
  add column if not exists ride_date date,
  add column if not exists ride_time time;

alter table public.bookings
  alter column preferred_date set default current_date,
  alter column preferred_time set default '09:00',
  alter column ride_date set default current_date,
  alter column ride_time set default '09:00';

update public.bookings
set preferred_date = coalesce(preferred_date, start_at::date, created_at::date, current_date),
    preferred_time = coalesce(preferred_time, start_at::time, '09:00'::time),
    ride_date = coalesce(ride_date, start_at::date, created_at::date, current_date),
    ride_time = coalesce(ride_time, start_at::time, '09:00'::time),
    updated_at = now();
