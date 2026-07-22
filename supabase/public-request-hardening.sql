-- eDrive public website request hardening.
-- Apply this migration after supabase/security-hardening.sql.
-- It is designed to be backward-compatible with the deployed frontend.

begin;

create table if not exists public.public_request_attempts (
  id bigint generated always as identity primary key,
  request_type text not null,
  lookup_key text not null,
  created_at timestamptz not null default now()
);

alter table public.public_request_attempts enable row level security;
revoke all on table public.public_request_attempts from anon, authenticated;

create index if not exists public_request_attempts_lookup_idx
  on public.public_request_attempts (request_type, lookup_key, created_at desc);

create or replace function public.public_request_rate_limited(
  p_request_type text,
  p_lookup_key text,
  p_limit integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(coalesce(p_request_type, '') || ':' || coalesce(p_lookup_key, '')));

  delete from public.public_request_attempts
  where created_at < now() - interval '24 hours';

  select count(*)
  into v_count
  from public.public_request_attempts
  where request_type = p_request_type
    and lookup_key = p_lookup_key
    and created_at >= now() - p_window;

  if v_count >= greatest(p_limit, 1) then
    return true;
  end if;

  insert into public.public_request_attempts (request_type, lookup_key)
  values (p_request_type, p_lookup_key);

  return false;
end;
$$;

revoke all on function public.public_request_rate_limited(text, text, integer, interval) from public;

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null,
  phone text not null,
  email text,
  preferred_date date,
  inquiry_type text not null,
  message text not null,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'reviewed', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_inquiries enable row level security;
revoke all on table public.contact_inquiries from anon;
grant select, update on table public.contact_inquiries to authenticated;

drop policy if exists "contact_inquiries_staff_select" on public.contact_inquiries;
create policy "contact_inquiries_staff_select"
on public.contact_inquiries
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'booking_staff', 'booking_manager']));

drop policy if exists "contact_inquiries_operations_update" on public.contact_inquiries;
create policy "contact_inquiries_operations_update"
on public.contact_inquiries
for update
to authenticated
using (public.has_edrive_role(array['super_admin', 'booking_staff', 'booking_manager']))
with check (public.has_edrive_role(array['super_admin', 'booking_staff', 'booking_manager']));

create or replace function public.submit_public_inquiry(p_payload jsonb)
returns table (reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := left(btrim(coalesce(p_payload->>'name', '')), 100);
  v_phone text := left(btrim(coalesce(p_payload->>'phone', '')), 30);
  v_phone_digits text := regexp_replace(coalesce(p_payload->>'phone', ''), '[^0-9]', '', 'g');
  v_email text := nullif(left(lower(btrim(coalesce(p_payload->>'email', ''))), 160), '');
  v_inquiry_type text := left(btrim(coalesce(p_payload->>'inquiryType', 'General Question')), 80);
  v_message text := left(btrim(coalesce(p_payload->>'message', '')), 2000);
  v_honeypot text := btrim(coalesce(p_payload->>'website', p_payload->>'honeypot', ''));
  v_preferred_date date;
  v_reference text;
begin
  if v_honeypot <> '' then
    raise exception 'Unable to submit inquiry.';
  end if;
  if length(v_name) < 2 then raise exception 'Please enter your full name.'; end if;
  if length(v_phone_digits) < 7 or length(v_phone_digits) > 15 then raise exception 'Please enter a valid phone number.'; end if;
  if v_email is not null and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Please enter a valid email address.'; end if;
  if length(v_message) < 10 then raise exception 'Please add more detail to your message.'; end if;

  if nullif(p_payload->>'preferredDate', '') is not null then
    begin
      v_preferred_date := (p_payload->>'preferredDate')::date;
    exception when others then
      raise exception 'Preferred date is invalid.';
    end;
  end if;

  if public.public_request_rate_limited('contact_inquiry', md5(v_phone_digits), 5, interval '1 hour') then
    raise exception 'Too many inquiries were submitted for this contact. Please try again later or use WhatsApp.';
  end if;

  v_reference := 'INQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.contact_inquiries (
    reference, name, phone, email, preferred_date, inquiry_type, message
  ) values (
    v_reference, v_name, v_phone, v_email, v_preferred_date, v_inquiry_type, v_message
  );

  return query select v_reference;
end;
$$;

revoke all on function public.submit_public_inquiry(jsonb) from public;
grant execute on function public.submit_public_inquiry(jsonb) to anon, authenticated;

create or replace function public.get_public_packages(p_categories text[] default null)
returns table (
  id uuid,
  title text,
  slug text,
  category text,
  duration_minutes integer,
  base_price numeric,
  capacity integer,
  image_url text,
  short_description text,
  status text,
  is_featured boolean,
  display_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.title::text,
    p.slug::text,
    p.category::text,
    p.duration_minutes::integer,
    p.base_price::numeric,
    coalesce(p.capacity, 2)::integer,
    p.image_url::text,
    p.short_description::text,
    p.status::text,
    coalesce(p.is_featured, false)::boolean,
    coalesce(p.display_order, 100)::integer
  from public.packages p
  where lower(coalesce(p.status::text, '')) = 'active'
    and coalesce(p.base_price, 0) > 0
    and coalesce(p.duration_minutes, 0) > 0
    and (p_categories is null or p.category::text = any(p_categories))
  order by coalesce(p.display_order, 100), p.category, p.capacity, p.duration_minutes;
$$;

revoke all on function public.get_public_packages(text[]) from public;
grant execute on function public.get_public_packages(text[]) to anon, authenticated;

-- Anonymous visitors receive package data only through the safe RPC above.
revoke select on table public.packages from anon;
grant select on table public.packages to authenticated;

create or replace function public.create_public_booking(p_payload jsonb)
returns table (
  booking_code text,
  subtotal numeric,
  vat_amount numeric,
  total_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package_id uuid;
  v_package record;
  v_vehicle_quantity integer := coalesce(nullif(p_payload->>'vehicle_quantity', '')::integer, 1);
  v_guest_count integer := coalesce(nullif(p_payload->>'guest_count', '')::integer, 1);
  v_preferred_date date;
  v_preferred_time_label text := left(btrim(coalesce(p_payload->>'preferred_time', '')), 20);
  v_preferred_time time;
  v_today date := (now() at time zone 'Asia/Dubai')::date;
  v_now_time time := (now() at time zone 'Asia/Dubai')::time;
  v_customer_name text := left(btrim(coalesce(p_payload->>'customer_name', '')), 100);
  v_customer_phone text := left(btrim(coalesce(p_payload->>'customer_phone', '')), 30);
  v_phone_digits text := regexp_replace(coalesce(p_payload->>'customer_phone', ''), '[^0-9]', '', 'g');
  v_customer_email text := nullif(left(lower(btrim(coalesce(p_payload->>'customer_email', ''))), 160), '');
  v_customer_area text := nullif(left(btrim(coalesce(p_payload->>'customer_hotel_or_area', '')), 160), '');
  v_customer_notes text := nullif(left(btrim(coalesce(p_payload->>'customer_notes', '')), 1000), '');
  v_honeypot text := btrim(coalesce(p_payload->>'honeypot', ''));
  v_booking_code text;
  v_subtotal numeric;
  v_vat numeric;
  v_total numeric;
begin
  if v_honeypot <> '' then raise exception 'Unable to submit booking.'; end if;

  begin
    v_package_id := (p_payload->>'package_id')::uuid;
  exception when others then
    raise exception 'Please select a valid package.';
  end;

  select p.* into v_package
  from public.packages p
  where p.id = v_package_id
    and lower(coalesce(p.status::text, '')) = 'active'
    and coalesce(p.base_price, 0) > 0
    and coalesce(p.duration_minutes, 0) > 0
  limit 1;

  if not found then raise exception 'The selected package is no longer available.'; end if;
  if v_vehicle_quantity < 1 or v_vehicle_quantity > 6 then raise exception 'Vehicle quantity is invalid.'; end if;
  if v_guest_count < 1 or v_guest_count > 12 then raise exception 'Guest count is invalid.'; end if;
  if v_guest_count > v_vehicle_quantity * coalesce(v_package.capacity, 2) then raise exception 'Guest count exceeds the selected vehicle capacity.'; end if;
  if length(v_customer_name) < 2 then raise exception 'Please enter your full name.'; end if;
  if length(v_phone_digits) < 7 or length(v_phone_digits) > 15 then raise exception 'Please enter a valid phone number.'; end if;
  if v_customer_email is not null and v_customer_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Please enter a valid email address.'; end if;

  begin
    v_preferred_date := (p_payload->>'preferred_date')::date;
  exception when others then
    raise exception 'Please select a valid date.';
  end;

  if v_preferred_date < v_today or v_preferred_date > v_today + 365 then raise exception 'Preferred date is outside the allowed booking period.'; end if;
  if v_preferred_time_label !~* '^\d{1,2}:\d{2}\s*(AM|PM)$' then raise exception 'Please select a valid time.'; end if;

  begin
    v_preferred_time := to_timestamp(upper(v_preferred_time_label), 'HH12:MI AM')::time;
  exception when others then
    raise exception 'Please select a valid time.';
  end;

  if v_preferred_date = v_today and v_preferred_time <= v_now_time then raise exception 'The selected Dubai time has already passed.'; end if;

  if public.public_request_rate_limited('public_booking', md5(v_phone_digits), 5, interval '1 hour') then
    raise exception 'Too many booking requests were submitted for this contact. Please try again later or contact the team on WhatsApp.';
  end if;

  v_subtotal := round((coalesce(v_package.base_price, 0)::numeric * v_vehicle_quantity)::numeric, 2);
  v_vat := round((v_subtotal * 0.05)::numeric, 2);
  v_total := v_subtotal + v_vat;
  v_booking_code := 'ED-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.booking_requests (
    booking_code,
    booking_number,
    source,
    booking_source,
    status,
    admin_status,
    manager_status,
    selected_package_name,
    selected_package_slug,
    selected_package_category,
    selected_package_price,
    selected_package_b2b_price,
    selected_package_capacity,
    experience_type,
    service_type,
    duration_minutes,
    inquiry_type,
    vehicle_quantity,
    guest_count,
    preferred_date,
    preferred_time,
    meeting_point_name,
    meeting_point_address,
    customer_name,
    customer_phone,
    customer_email,
    customer_hotel_or_area,
    customer_notes,
    subtotal,
    vat_amount,
    total_amount,
    payment_status,
    payment_method,
    payment_source,
    payment_workflow_status,
    collection_status,
    amount_received_aed,
    amount_pending_aed,
    customer_arrived,
    created_at,
    updated_at
  ) values (
    v_booking_code,
    v_booking_code,
    'website',
    'website',
    'Pending',
    'New',
    'Pending',
    v_package.title,
    v_package.slug,
    v_package.category,
    v_package.base_price,
    null,
    coalesce(v_package.capacity, 2),
    case when v_package.category::text = 'jet_car_rental' then 'jet-car-rental' else 'jet-ski-rental' end,
    'rental',
    v_package.duration_minutes,
    null,
    v_vehicle_quantity,
    v_guest_count,
    v_preferred_date,
    v_preferred_time_label,
    'Dubai Islands',
    'Dubai Islands, Dubai, United Arab Emirates',
    v_customer_name,
    v_customer_phone,
    v_customer_email,
    v_customer_area,
    v_customer_notes,
    v_subtotal,
    v_vat,
    v_total,
    'Not Paid',
    null,
    'direct',
    'unpaid',
    'pending_collection',
    0,
    v_total,
    false,
    now(),
    now()
  );

  return query select v_booking_code, v_subtotal, v_vat, v_total;
end;
$$;

revoke all on function public.create_public_booking(jsonb) from public;
grant execute on function public.create_public_booking(jsonb) to anon, authenticated;

-- After the RPC is available, anonymous visitors can no longer insert arbitrary totals.
revoke insert on table public.booking_requests from anon;
drop policy if exists "booking_requests_website_insert" on public.booking_requests;

create or replace function public.track_booking(
  p_booking_code text,
  p_contact text
)
returns table (
  booking_code text,
  booking_number text,
  public_status text,
  package_name text,
  service_type text,
  preferred_date text,
  preferred_time text,
  customer_name text,
  total_amount numeric,
  payment_status text,
  amount_received numeric,
  amount_pending numeric,
  assigned_vehicle text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := lower(btrim(coalesce(p_booking_code, '')));
  v_contact text := lower(btrim(coalesce(p_contact, '')));
  v_contact_digits text := regexp_replace(coalesce(p_contact, ''), '[^0-9]', '', 'g');
begin
  if length(v_code) < 3 or length(v_code) > 80 or length(v_contact) < 5 or length(v_contact) > 160 then return; end if;

  if public.public_request_rate_limited('booking_lookup_code', md5(v_code), 20, interval '15 minutes')
    or public.public_request_rate_limited('booking_lookup_contact', md5(coalesce(nullif(v_contact_digits, ''), v_contact)), 20, interval '15 minutes') then
    return;
  end if;

  return query
  select
    coalesce(br.booking_code::text, br.booking_number::text, br.id::text) as booking_code,
    br.booking_number::text as booking_number,
    case
      when lower(coalesce(br.status::text, '')) = 'no show' or lower(coalesce(br.manager_status::text, '')) = 'no show' or lower(coalesce(br.payment_status::text, '')) = 'no show' then 'No Show'
      when lower(coalesce(br.status::text, '')) = 'cancelled' or lower(coalesce(br.manager_status::text, '')) = 'cancelled' or lower(coalesce(br.payment_workflow_status::text, '')) like '%cancel%' then 'Cancelled'
      when lower(coalesce(br.status::text, '')) = 'completed' or lower(coalesce(br.manager_status::text, '')) = 'completed' then 'Completed'
      when lower(coalesce(br.status::text, '')) = 'in progress' or lower(coalesce(br.manager_status::text, '')) = 'in progress' or lower(coalesce(br.payment_workflow_status::text, '')) like '%ride in progress%' then 'In Progress'
      when lower(coalesce(br.status::text, '')) = 'confirmed' then 'Confirmed'
      else 'Pending'
    end as public_status,
    coalesce(nullif(trim(br.selected_package_name::text), ''), nullif(trim(br.selected_package_category::text), ''), nullif(trim(br.experience_type::text), ''), nullif(trim(br.service_type::text), ''), 'Water Sports Booking') as package_name,
    nullif(trim(br.service_type::text), '') as service_type,
    br.preferred_date::text as preferred_date,
    br.preferred_time::text as preferred_time,
    coalesce(nullif(trim(br.customer_name::text), ''), 'Guest') as customer_name,
    coalesce(nullif(br.total_amount::text, '')::numeric, 0) as total_amount,
    coalesce(nullif(trim(br.payment_status::text), ''), 'Not Paid') as payment_status,
    coalesce(nullif(br.amount_received_aed::text, '')::numeric, 0) as amount_received,
    case
      when lower(coalesce(br.status::text, '')) in ('no show', 'cancelled') then 0
      when nullif(br.amount_pending_aed::text, '') is not null then greatest(br.amount_pending_aed::text::numeric, 0)
      else greatest(coalesce(nullif(br.total_amount::text, '')::numeric, 0) - coalesce(nullif(br.amount_received_aed::text, '')::numeric, 0), 0)
    end as amount_pending,
    nullif(trim(br.assigned_vehicle_name::text), '') as assigned_vehicle,
    br.created_at::timestamptz as created_at
  from public.booking_requests br
  where (
      lower(trim(coalesce(br.booking_code::text, ''))) = v_code
      or lower(trim(coalesce(br.booking_number::text, ''))) = v_code
    )
    and (
      lower(trim(coalesce(br.customer_email::text, ''))) = v_contact
      or (
        length(v_contact_digits) >= 7
        and length(regexp_replace(coalesce(br.customer_phone::text, ''), '[^0-9]', '', 'g')) >= 7
        and (
          regexp_replace(coalesce(br.customer_phone::text, ''), '[^0-9]', '', 'g') = v_contact_digits
          or right(regexp_replace(coalesce(br.customer_phone::text, ''), '[^0-9]', '', 'g'), 9) = right(v_contact_digits, 9)
        )
      )
    )
  order by br.created_at desc
  limit 1;
end;
$$;

revoke all on function public.track_booking(text, text) from public;
grant execute on function public.track_booking(text, text) to anon, authenticated;

commit;
