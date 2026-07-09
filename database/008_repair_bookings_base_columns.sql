alter table public.bookings
  add column if not exists booking_number text default ('EDW-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  add column if not exists customer_id uuid references public.customers(id),
  add column if not exists vehicle_id uuid references public.vehicles(id),
  add column if not exists coupon_id uuid references public.coupons(id),
  add column if not exists start_at timestamptz not null default now(),
  add column if not exists end_at timestamptz not null default (now() + interval '1 hour'),
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists status public.booking_status not null default 'pending',
  add column if not exists gross_amount_aed numeric(12,2) not null default 0,
  add column if not exists discount_amount_aed numeric(12,2) not null default 0,
  add column if not exists net_amount_aed numeric(12,2) not null default 0,
  add column if not exists special_notes text,
  add column if not exists assigned_staff_id uuid references public.users(id),
  add column if not exists created_by uuid references public.users(id),
  add column if not exists updated_by uuid references public.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.bookings
set end_at = start_at + interval '1 hour'
where end_at <= start_at;

create index if not exists bookings_vehicle_time_idx
on public.bookings(vehicle_id, start_at, end_at);

create index if not exists bookings_status_idx
on public.bookings(status);

create index if not exists bookings_created_at_idx
on public.bookings(created_at desc);
