do $$ begin
  create type public.vehicle_type as enum ('jet_ski', 'jet_car');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

alter type public.booking_status add value if not exists 'pending';
alter type public.booking_status add value if not exists 'confirmed';
alter type public.booking_status add value if not exists 'cancelled';
alter type public.booking_status add value if not exists 'completed';

do $$ begin
  create type public.discount_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('admin', 'manager', 'booking_agent')),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.roles (slug, name, description) values
  ('admin', 'Admin', 'Full system access'),
  ('manager', 'Manager', 'Operations management access'),
  ('booking_agent', 'Booking Agent', 'Booking workflow access')
on conflict (slug) do nothing;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  full_name text not null,
  email text not null unique,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.vehicle_type not null,
  description text,
  rental_price_aed_per_hour numeric(12,2) not null check (rental_price_aed_per_hour >= 0),
  sale_price_aed numeric(12,2) check (sale_price_aed is null or sale_price_aed >= 0),
  location text not null default 'Dubai',
  capacity integer not null default 1 check (capacity > 0),
  is_available boolean not null default true,
  is_visible_public boolean not null default true,
  is_archived boolean not null default false,
  primary_image_url text,
  sort_order integer not null default 100,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  whatsapp text,
  email text,
  country text,
  normalized_email text generated always as (lower(nullif(email, ''))) stored,
  normalized_phone text generated always as (regexp_replace(phone, '[^0-9+]', '', 'g')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists normalized_email text generated always as (lower(nullif(email, ''))) stored,
  add column if not exists normalized_phone text generated always as (regexp_replace(phone, '[^0-9+]', '', 'g')) stored;

create unique index if not exists customers_normalized_email_unique on public.customers (normalized_email) where normalized_email is not null;
create index if not exists customers_normalized_phone_idx on public.customers (normalized_phone);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.discount_type not null,
  discount_value numeric(12,2) not null check (discount_value > 0),
  expires_at timestamptz,
  max_usage integer check (max_usage is null or max_usage >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint percentage_coupon_limit check (discount_type <> 'percentage' or discount_value <= 100)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default ('EDW-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_id uuid not null references public.customers(id),
  vehicle_id uuid not null references public.vehicles(id),
  coupon_id uuid references public.coupons(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes in (30, 60, 90, 120, 180)),
  status public.booking_status not null default 'pending',
  gross_amount_aed numeric(12,2) not null default 0 check (gross_amount_aed >= 0),
  discount_amount_aed numeric(12,2) not null default 0 check (discount_amount_aed >= 0),
  net_amount_aed numeric(12,2) not null default 0 check (net_amount_aed >= 0),
  special_notes text,
  assigned_staff_id uuid references public.users(id),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_time_order check (end_at > start_at)
);

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

update public.bookings set end_at = start_at + interval '1 hour' where end_at <= start_at;

alter table public.bookings
  drop constraint if exists bookings_no_active_overlap;

alter table public.bookings
  add constraint bookings_no_active_overlap
  exclude using gist (
    vehicle_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status::text in ('pending', 'confirmed'));

create unique index if not exists bookings_booking_number_unique on public.bookings(booking_number);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount_aed numeric(12,2) not null check (amount_aed >= 0),
  payment_method text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'authorized', 'paid', 'failed', 'refunded')),
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists booking_id uuid references public.bookings(id) on delete cascade,
  add column if not exists amount_aed numeric(12,2) not null default 0,
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists provider_reference text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_type_idx on public.vehicles(type);
create index if not exists vehicles_public_idx on public.vehicles(is_visible_public, is_available, is_archived);
create index if not exists bookings_vehicle_time_idx on public.bookings(vehicle_id, start_at, end_at);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
create index if not exists coupons_code_idx on public.coupons(lower(code));
create index if not exists logs_entity_idx on public.logs(entity_table, entity_id);
