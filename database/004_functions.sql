create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

alter table public.customers
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists country text,
  add column if not exists normalized_email text generated always as (lower(nullif(email, ''))) stored,
  add column if not exists normalized_phone text generated always as (regexp_replace(phone, '[^0-9+]', '', 'g')) stored,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.vehicles
  add column if not exists rental_price_aed_per_hour numeric(12,2) not null default 0,
  add column if not exists is_available boolean not null default true,
  add column if not exists is_visible_public boolean not null default true,
  add column if not exists is_archived boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.coupons
  add column if not exists code text,
  add column if not exists discount_type public.discount_type,
  add column if not exists discount_value numeric(12,2) not null default 0,
  add column if not exists expires_at timestamptz,
  add column if not exists max_usage integer,
  add column if not exists used_count integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.users
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at before update on public.users for each row execute function public.touch_updated_at();

drop trigger if exists touch_vehicles_updated_at on public.vehicles;
create trigger touch_vehicles_updated_at before update on public.vehicles for each row execute function public.touch_updated_at();

drop trigger if exists touch_customers_updated_at on public.customers;
create trigger touch_customers_updated_at before update on public.customers for each row execute function public.touch_updated_at();

drop trigger if exists touch_coupons_updated_at on public.coupons;
create trigger touch_coupons_updated_at before update on public.coupons for each row execute function public.touch_updated_at();

drop trigger if exists touch_bookings_updated_at on public.bookings;
create trigger touch_bookings_updated_at before update on public.bookings for each row execute function public.touch_updated_at();

create or replace function public.create_public_booking(
  p_full_name text,
  p_phone text,
  p_whatsapp text,
  p_email text,
  p_country text,
  p_vehicle_id uuid,
  p_start_at timestamptz,
  p_duration_minutes integer,
  p_special_notes text,
  p_coupon_code text default null
)
returns table (
  booking_id uuid,
  booking_number text,
  status public.booking_status,
  gross_amount_aed numeric,
  discount_amount_aed numeric,
  net_amount_aed numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle public.vehicles%rowtype;
  v_customer_id uuid;
  v_coupon public.coupons%rowtype;
  v_start timestamptz := p_start_at;
  v_end timestamptz;
  v_gross numeric(12,2);
  v_discount numeric(12,2) := 0;
  v_net numeric(12,2);
  v_booking public.bookings%rowtype;
  v_email text := lower(nullif(trim(p_email), ''));
begin
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Full name is required';
  end if;

  if p_phone is null or length(trim(p_phone)) < 7 then
    raise exception 'Phone number is required';
  end if;

  if p_duration_minutes not in (30, 60, 90, 120, 180) then
    raise exception 'Invalid booking duration';
  end if;

  v_end := v_start + make_interval(mins => p_duration_minutes);

  select * into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and is_available = true
    and is_visible_public = true
    and is_archived = false
  for update;

  if not found then
    raise exception 'Selected vehicle is not available';
  end if;

  v_gross := round((v_vehicle.rental_price_aed_per_hour * p_duration_minutes::numeric / 60), 2);

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon
    from public.coupons
    where lower(code) = lower(trim(p_coupon_code))
      and is_active = true
      and (expires_at is null or expires_at > now())
      and (max_usage is null or used_count < max_usage)
    for update;

    if not found then
      raise exception 'Coupon is invalid or expired';
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_gross * (v_coupon.discount_value / 100), 2);
    else
      v_discount := least(v_coupon.discount_value, v_gross);
    end if;
  end if;

  v_net := greatest(v_gross - v_discount, 0);

  if v_email is not null then
    insert into public.customers (full_name, phone, whatsapp, email, country)
    values (trim(p_full_name), trim(p_phone), nullif(trim(coalesce(p_whatsapp, '')), ''), v_email, nullif(trim(coalesce(p_country, '')), ''))
    on conflict (normalized_email) where normalized_email is not null
    do update set
      full_name = excluded.full_name,
      phone = excluded.phone,
      whatsapp = excluded.whatsapp,
      country = excluded.country,
      updated_at = now()
    returning id into v_customer_id;
  else
    insert into public.customers (full_name, phone, whatsapp, email, country)
    values (trim(p_full_name), trim(p_phone), nullif(trim(coalesce(p_whatsapp, '')), ''), null, nullif(trim(coalesce(p_country, '')), ''))
    returning id into v_customer_id;
  end if;

  insert into public.bookings (
    customer_id,
    vehicle_id,
    coupon_id,
    start_at,
    end_at,
    duration_minutes,
    status,
    gross_amount_aed,
    discount_amount_aed,
    net_amount_aed,
    special_notes
  ) values (
    v_customer_id,
    p_vehicle_id,
    case when v_coupon.id is null then null else v_coupon.id end,
    v_start,
    v_end,
    p_duration_minutes,
    'pending',
    v_gross,
    v_discount,
    v_net,
    nullif(trim(coalesce(p_special_notes, '')), '')
  ) returning * into v_booking;

  if v_coupon.id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  insert into public.logs (action, entity_table, entity_id, after_data)
  values ('public_booking_created', 'bookings', v_booking.id, to_jsonb(v_booking));

  booking_id := v_booking.id;
  booking_number := v_booking.booking_number;
  status := v_booking.status;
  gross_amount_aed := v_booking.gross_amount_aed;
  discount_amount_aed := v_booking.discount_amount_aed;
  net_amount_aed := v_booking.net_amount_aed;
  return next;
exception
  when exclusion_violation then
    raise exception 'This vehicle is already booked for the selected date and time';
  when unique_violation then
    raise exception 'This booking conflicts with an existing record';
end;
$$;

revoke all on function public.create_public_booking(text,text,text,text,text,uuid,timestamptz,integer,text,text) from public;
grant execute on function public.create_public_booking(text,text,text,text,text,uuid,timestamptz,integer,text,text) to anon, authenticated;

create or replace view public.report_booking_summary with (security_invoker = true) as
select
  date_trunc('day', start_at) as booking_day,
  count(*) as total_bookings,
  count(*) filter (where status = 'cancelled') as cancelled_bookings,
  count(*) filter (where status = 'completed') as completed_bookings,
  coalesce(sum(net_amount_aed), 0) as estimated_revenue_aed
from public.bookings
group by 1;

revoke all on public.report_booking_summary from anon;
grant select on public.report_booking_summary to authenticated;
