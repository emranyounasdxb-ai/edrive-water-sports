alter table public.bookings
  add column if not exists booking_code text,
  add column if not exists booking_number text;

alter table public.bookings
  alter column booking_code set default ('EDW-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  alter column booking_number set default ('EDW-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)));

update public.bookings
set booking_number = coalesce(nullif(trim(booking_number), ''), nullif(trim(booking_code), ''), 'EDW-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(replace(id::text, '-', ''), 1, 6)))
where booking_number is null or trim(booking_number) = '';

update public.bookings
set booking_code = coalesce(nullif(trim(booking_code), ''), booking_number, 'EDW-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(replace(id::text, '-', ''), 1, 6)))
where booking_code is null or trim(booking_code) = '';

create unique index if not exists bookings_booking_code_unique
on public.bookings(booking_code);

create unique index if not exists bookings_booking_number_unique
on public.bookings(booking_number);
