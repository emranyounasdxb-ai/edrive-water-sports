begin;

alter table public.packages add column if not exists offer_enabled boolean not null default false;
alter table public.packages add column if not exists offer_name text;
alter table public.packages add column if not exists b2c_offer_price numeric(12,2);
alter table public.packages add column if not exists b2b_offer_price numeric(12,2);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'packages_offer_valid_when_enabled' and conrelid = 'public.packages'::regclass) then
    alter table public.packages add constraint packages_offer_valid_when_enabled check (
      not offer_enabled or (
        length(btrim(coalesce(offer_name, ''))) between 2 and 40
        and coalesce(b2c_offer_price, 0) > 0 and coalesce(b2b_offer_price, 0) > 0
        and coalesce(b2c_offer_price, 0) < base_price and coalesce(b2b_offer_price, 0) < b2b_price
        and coalesce(b2b_offer_price, 0) <= coalesce(b2c_offer_price, 0)
      )
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'packages_offer_name_safe' and conrelid = 'public.packages'::regclass) then
    alter table public.packages add constraint packages_offer_name_safe check (
      offer_name is null or (offer_name = btrim(offer_name) and length(offer_name) between 1 and 40)
    );
  end if;
end $$;

drop function if exists public.get_public_packages(text[]);
create function public.get_public_packages(p_categories text[] default null)
returns table (
  id uuid, title text, slug text, category text, duration_minutes integer,
  base_price numeric, capacity integer, image_url text, short_description text,
  status text, is_featured boolean, display_order integer,
  offer_enabled boolean, offer_name text, b2c_offer_price numeric
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.title::text, p.slug::text, p.category::text,
    p.duration_minutes::integer, p.base_price::numeric, coalesce(p.capacity, 2)::integer,
    p.image_url::text, p.short_description::text, p.status::text,
    coalesce(p.is_featured, false)::boolean, coalesce(p.display_order, 100)::integer,
    offer_state.is_valid,
    case when offer_state.is_valid then btrim(p.offer_name) else null end,
    case when offer_state.is_valid then p.b2c_offer_price::numeric else null end
  from public.packages p
  cross join lateral (
    select (
      coalesce(p.offer_enabled, false)
      and length(btrim(coalesce(p.offer_name, ''))) between 2 and 40
      and coalesce(p.b2c_offer_price, 0) > 0 and p.b2c_offer_price < p.base_price
      and coalesce(p.b2b_offer_price, 0) > 0 and p.b2b_offer_price < p.b2b_price
      and p.b2b_offer_price <= p.b2c_offer_price
    ) as is_valid
  ) offer_state
  where lower(coalesce(p.status::text, '')) = 'active'
    and coalesce(p.base_price, 0) > 0 and coalesce(p.duration_minutes, 0) > 0
    and (p_categories is null or p.category::text = any(p_categories))
  order by coalesce(p.display_order, 100), p.category, p.capacity, p.duration_minutes;
$$;
revoke all on function public.get_public_packages(text[]) from public;
grant execute on function public.get_public_packages(text[]) to anon, authenticated;

create or replace function public.get_b2b_agent_packages()
returns table (
  id uuid, title text, category text, duration_minutes integer, b2b_price numeric,
  capacity integer, image_url text, short_description text,
  offer_enabled boolean, offer_name text, b2b_offer_price numeric
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_agent_count integer;
begin
  select count(*) into v_agent_count
  from public.b2b_agents ba
  where ba.auth_user_id = auth.uid()
    and lower(coalesce(ba.status::text, '')) = 'active';
  if v_agent_count <> 1 then
    raise exception 'Exactly one active B2B Agent profile must match the current authentication identity.';
  end if;
  return query
  select p.id, p.title::text, p.category::text, p.duration_minutes::integer,
    p.b2b_price::numeric, coalesce(p.capacity, 2)::integer,
    p.image_url::text, p.short_description::text,
    offer_state.is_valid,
    case when offer_state.is_valid then btrim(p.offer_name) else null end,
    case when offer_state.is_valid then p.b2b_offer_price::numeric else null end
  from public.packages p
  cross join lateral (
    select (
      coalesce(p.offer_enabled, false)
      and length(btrim(coalesce(p.offer_name, ''))) between 2 and 40
      and coalesce(p.b2c_offer_price, 0) > 0 and p.b2c_offer_price < p.base_price
      and coalesce(p.b2b_offer_price, 0) > 0 and p.b2b_offer_price < p.b2b_price
      and p.b2b_offer_price <= p.b2c_offer_price
    ) as is_valid
  ) offer_state
  where lower(coalesce(p.status::text, '')) = 'active'
    and coalesce(p.b2b_price, 0) > 0
    and coalesce(p.duration_minutes, 0) > 0
  order by coalesce(p.display_order, 100), p.category, p.capacity, p.duration_minutes;
end;
$$;
revoke all on function public.get_b2b_agent_packages() from public;
grant execute on function public.get_b2b_agent_packages() to authenticated;

create or replace function public.save_package_catalog_entry(p_payload jsonb, p_package_id uuid default null)
returns table (package_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  v_title text := left(btrim(coalesce(p_payload->>'title', '')), 120);
  v_slug text := left(lower(btrim(coalesce(p_payload->>'slug', ''))), 160);
  v_category text := lower(btrim(coalesce(p_payload->>'category', '')));
  v_duration integer; v_capacity integer; v_base_price numeric(12,2); v_b2b_price numeric(12,2);
  v_image_url text := left(btrim(coalesce(p_payload->>'image_url', '')), 500);
  v_description text := left(btrim(coalesce(p_payload->>'short_description', '')), 500);
  v_status text := lower(btrim(coalesce(p_payload->>'status', 'active')));
  v_featured boolean := coalesce((p_payload->>'is_featured')::boolean, false);
  v_display_order integer; v_id uuid;
  v_offer_enabled boolean := coalesce((p_payload->>'offer_enabled')::boolean, false);
  v_offer_name text := nullif(btrim(coalesce(p_payload->>'offer_name', '')), '');
  v_b2c_offer_price numeric(12,2); v_b2b_offer_price numeric(12,2);
begin
  if not public.has_edrive_role(array['super_admin']) then raise exception 'Only the Super Admin can create or edit packages.'; end if;
  begin
    v_duration := (p_payload->>'duration_minutes')::integer; v_capacity := (p_payload->>'capacity')::integer;
    v_base_price := (p_payload->>'base_price')::numeric; v_b2b_price := (p_payload->>'b2b_price')::numeric;
    v_display_order := coalesce((p_payload->>'display_order')::integer, 100);
    v_b2c_offer_price := nullif(p_payload->>'b2c_offer_price', '')::numeric;
    v_b2b_offer_price := nullif(p_payload->>'b2b_offer_price', '')::numeric;
  exception when others then raise exception 'Package configuration contains an invalid number.'; end;
  if length(v_title) < 5 then raise exception 'Package title must contain at least 5 characters.'; end if;
  if v_title !~* '^[a-z0-9][a-z0-9 ''&()+,./-]*$' then raise exception 'Package title contains unsupported characters.'; end if;
  if v_slug = '' or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Package slug is invalid.'; end if;
  if v_category not in ('jet_car_rental','jet_ski_rental','yacht_rental') then raise exception 'Package category is invalid.'; end if;
  if v_duration < 10 or v_duration > 480 then raise exception 'Duration must be between 10 and 480 minutes.'; end if;
  if v_capacity < 1 or v_capacity > 12 then raise exception 'Capacity must be between 1 and 12.'; end if;
  if v_base_price <= 0 then raise exception 'B2C price must be greater than zero.'; end if;
  if v_b2b_price < 0 then raise exception 'B2B price cannot be negative.'; end if;
  if v_b2b_price > v_base_price then raise exception 'B2B price cannot be higher than B2C price.'; end if;
  if v_status not in ('active','draft','inactive') then raise exception 'Package status is invalid.'; end if;
  if v_display_order < 0 or v_display_order > 9999 then raise exception 'Display order must be between 0 and 9999.'; end if;
  if v_offer_name is not null and length(v_offer_name) > 40 then raise exception 'Offer name cannot exceed 40 characters.'; end if;
  if v_offer_enabled then
    if length(coalesce(v_offer_name,'')) < 2 or length(v_offer_name) > 40 then raise exception 'Offer name must be between 2 and 40 characters.'; end if;
    if coalesce(v_b2c_offer_price,0) <= 0 then raise exception 'B2C offer price must be greater than zero.'; end if;
    if coalesce(v_b2b_offer_price,0) <= 0 then raise exception 'B2B offer price must be greater than zero.'; end if;
    if v_b2c_offer_price >= v_base_price then raise exception 'B2C offer price must be lower than the normal B2C price.'; end if;
    if v_b2b_offer_price >= v_b2b_price then raise exception 'B2B offer price must be lower than the normal B2B price.'; end if;
    if v_b2b_offer_price > v_b2c_offer_price then raise exception 'B2B offer price cannot be higher than the B2C offer price.'; end if;
  end if;
  if p_package_id is null then
    insert into public.packages (title,slug,category,duration_minutes,base_price,b2b_price,capacity,image_url,short_description,status,is_featured,display_order,offer_enabled,offer_name,b2c_offer_price,b2b_offer_price)
    values (v_title,v_slug,v_category::public.rental_category,v_duration,v_base_price,v_b2b_price,v_capacity,nullif(v_image_url,''),nullif(v_description,''),v_status::public.record_status,v_featured,v_display_order,v_offer_enabled,v_offer_name,v_b2c_offer_price,v_b2b_offer_price)
    returning id into v_id;
  else
    update public.packages set title=v_title,slug=v_slug,category=v_category::public.rental_category,duration_minutes=v_duration,base_price=v_base_price,b2b_price=v_b2b_price,capacity=v_capacity,image_url=nullif(v_image_url,''),short_description=nullif(v_description,''),status=v_status::public.record_status,is_featured=v_featured,display_order=v_display_order,offer_enabled=v_offer_enabled,offer_name=v_offer_name,b2c_offer_price=v_b2c_offer_price,b2b_offer_price=v_b2b_offer_price
    where id=p_package_id returning id into v_id;
    if v_id is null then raise exception 'Package was not found.'; end if;
  end if;
  return query select v_id;
end;
$$;
revoke all on function public.save_package_catalog_entry(jsonb,uuid) from public;
grant execute on function public.save_package_catalog_entry(jsonb,uuid) to authenticated;

create or replace function public.create_public_booking(p_payload jsonb)
returns table (booking_code text, subtotal numeric, vat_amount numeric, total_amount numeric)
language plpgsql security definer set search_path = public
as $$
declare
  v_package_id uuid; v_package record;
  v_vehicle_quantity integer := coalesce(nullif(p_payload->>'vehicle_quantity','')::integer,1);
  v_guest_count integer := coalesce(nullif(p_payload->>'guest_count','')::integer,1);
  v_preferred_date date; v_preferred_time_label text := left(btrim(coalesce(p_payload->>'preferred_time','')),20); v_preferred_time time;
  v_today date := (now() at time zone 'Asia/Dubai')::date; v_now_time time := (now() at time zone 'Asia/Dubai')::time;
  v_customer_name text := left(btrim(coalesce(p_payload->>'customer_name','')),100);
  v_customer_phone text := left(btrim(coalesce(p_payload->>'customer_phone','')),30);
  v_phone_digits text := regexp_replace(coalesce(p_payload->>'customer_phone',''),'[^0-9]','','g');
  v_customer_email text := nullif(left(lower(btrim(coalesce(p_payload->>'customer_email',''))),160),'');
  v_customer_area text := nullif(left(btrim(coalesce(p_payload->>'customer_hotel_or_area','')),160),'');
  v_customer_notes text := nullif(left(btrim(coalesce(p_payload->>'customer_notes','')),1000),'');
  v_honeypot text := btrim(coalesce(p_payload->>'honeypot','')); v_booking_code text;
  v_unit_price numeric; v_subtotal numeric; v_vat numeric; v_total numeric;
begin
  if v_honeypot <> '' then raise exception 'Unable to submit booking.'; end if;
  begin v_package_id := (p_payload->>'package_id')::uuid; exception when others then raise exception 'Please select a valid package.'; end;
  select p.* into v_package from public.packages p where p.id=v_package_id and lower(coalesce(p.status::text,''))='active' and coalesce(p.base_price,0)>0 and coalesce(p.duration_minutes,0)>0 limit 1;
  if not found then raise exception 'The selected package is no longer available.'; end if;
  if v_vehicle_quantity < 1 or v_vehicle_quantity > 6 then raise exception 'Vehicle quantity is invalid.'; end if;
  if v_guest_count < 1 or v_guest_count > 12 then raise exception 'Guest count is invalid.'; end if;
  if v_guest_count > v_vehicle_quantity * coalesce(v_package.capacity,2) then raise exception 'Guest count exceeds the selected vehicle capacity.'; end if;
  if length(v_customer_name)<2 then raise exception 'Please enter your full name.'; end if;
  if length(v_phone_digits)<7 or length(v_phone_digits)>15 then raise exception 'Please enter a valid phone number.'; end if;
  if v_customer_email is not null and v_customer_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Please enter a valid email address.'; end if;
  begin v_preferred_date := (p_payload->>'preferred_date')::date; exception when others then raise exception 'Please select a valid date.'; end;
  if v_preferred_date<v_today or v_preferred_date>v_today+365 then raise exception 'Preferred date is outside the allowed booking period.'; end if;
  if v_preferred_time_label !~* '^\d{1,2}:\d{2}\s*(AM|PM)$' then raise exception 'Please select a valid time.'; end if;
  begin v_preferred_time:=to_timestamp(upper(v_preferred_time_label),'HH12:MI AM')::time; exception when others then raise exception 'Please select a valid time.'; end;
  if v_preferred_date=v_today and v_preferred_time<=v_now_time then raise exception 'The selected Dubai time has already passed.'; end if;
  if public.public_request_rate_limited('public_booking',md5(v_phone_digits),5,interval '1 hour') then raise exception 'Too many booking requests were submitted for this contact. Please try again later or contact the team on WhatsApp.'; end if;
  v_unit_price := case when coalesce(v_package.offer_enabled,false) and length(btrim(coalesce(v_package.offer_name,''))) between 2 and 40 and coalesce(v_package.b2c_offer_price,0)>0 and v_package.b2c_offer_price<v_package.base_price and coalesce(v_package.b2b_offer_price,0)>0 and v_package.b2b_offer_price<v_package.b2b_price and v_package.b2b_offer_price<=v_package.b2c_offer_price then v_package.b2c_offer_price else v_package.base_price end;
  v_subtotal:=round(v_unit_price*v_vehicle_quantity,2); v_vat:=round(v_subtotal*0.05,2); v_total:=v_subtotal+v_vat;
  v_booking_code:='ED-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.booking_requests (booking_code,booking_number,source,booking_source,status,admin_status,manager_status,selected_package_name,selected_package_slug,selected_package_category,selected_package_price,selected_package_b2b_price,selected_package_capacity,experience_type,service_type,duration_minutes,inquiry_type,vehicle_quantity,guest_count,preferred_date,preferred_time,meeting_point_name,meeting_point_address,customer_name,customer_phone,customer_email,customer_hotel_or_area,customer_notes,subtotal,vat_amount,total_amount,payment_status,payment_method,payment_source,payment_workflow_status,collection_status,amount_received_aed,amount_pending_aed,customer_arrived,created_at,updated_at)
  values (v_booking_code,v_booking_code,'website','website','Pending','New','Pending',v_package.title,v_package.slug,v_package.category,v_unit_price,null,coalesce(v_package.capacity,2),case when v_package.category::text='jet_car_rental' then 'jet-car-rental' else 'jet-ski-rental' end,'rental',v_package.duration_minutes,null,v_vehicle_quantity,v_guest_count,v_preferred_date,v_preferred_time_label,'Dubai Islands','Dubai Islands, Dubai, United Arab Emirates',v_customer_name,v_customer_phone,v_customer_email,v_customer_area,v_customer_notes,v_subtotal,v_vat,v_total,'Not Paid',null,'direct','unpaid','pending_collection',0,v_total,false,now(),now());
  return query select v_booking_code,v_subtotal,v_vat,v_total;
end;
$$;
revoke all on function public.create_public_booking(jsonb) from public;
grant execute on function public.create_public_booking(jsonb) to anon, authenticated;

create or replace function public.create_b2b_booking(p_booking jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_agent public.b2b_agents%rowtype; v_package public.packages%rowtype; v_booking public.booking_requests%rowtype;
  v_quantity integer; v_guest_count integer; v_preferred_date date; v_preferred_time_label text; v_preferred_time time;
  v_today date:=(now() at time zone 'Asia/Dubai')::date; v_now_time time:=(now() at time zone 'Asia/Dubai')::time;
  v_vehicle_type text; v_booking_code text; v_unit_price numeric(12,2); v_base numeric(12,2); v_vat numeric(12,2); v_total numeric(12,2);
begin
  select ba.* into strict v_agent from public.b2b_agents ba where ba.auth_user_id=auth.uid() and lower(coalesce(ba.status::text,''))='active';
  begin select p.* into v_package from public.packages p where p.id=(p_booking->>'package_id')::uuid and lower(coalesce(p.status::text,''))='active'; exception when invalid_text_representation then raise exception 'Please select a valid B2B package.'; end;
  if not found then raise exception 'Active B2B package was not found.'; end if;
  if coalesce(v_package.b2b_price,0)<=0 then raise exception 'B2B price is not configured for this package.'; end if;
  v_vehicle_type:=public.normalize_edrive_vehicle_type(v_package.category::text);
  if v_vehicle_type not in ('jet_ski','jet_car') then raise exception 'The selected package category is not supported for B2B bookings.'; end if;
  begin v_quantity:=coalesce(nullif(p_booking->>'vehicle_quantity','')::integer,1); v_guest_count:=coalesce(nullif(p_booking->>'guest_count','')::integer,1); v_preferred_date:=(p_booking->>'preferred_date')::date; exception when others then raise exception 'Quantity, guest count, or preferred date is invalid.'; end;
  if v_quantity<1 or v_quantity>6 then raise exception 'Vehicle quantity is invalid.'; end if;
  if v_guest_count<1 or v_guest_count>12 then raise exception 'Guest count is invalid.'; end if;
  if v_guest_count>v_quantity*coalesce(v_package.capacity,2) then raise exception 'Guest count exceeds the selected vehicle capacity.'; end if;
  if v_preferred_date<v_today or v_preferred_date>v_today+365 then raise exception 'Preferred date is outside the allowed booking period.'; end if;
  v_preferred_time_label:=left(btrim(coalesce(p_booking->>'preferred_time','')),20);
  if v_preferred_time_label !~* '^\d{1,2}:\d{2}\s*(AM|PM)$' then raise exception 'Please select a valid booking time.'; end if;
  begin v_preferred_time:=to_timestamp(upper(v_preferred_time_label),'HH12:MI AM')::time; exception when others then raise exception 'Please select a valid booking time.'; end;
  if v_preferred_time<time '09:00' or v_preferred_time>time '17:00' or extract(minute from v_preferred_time)::integer not in (0,30) then raise exception 'Preferred time must use an available half-hour slot from 09:00 AM through 05:00 PM.'; end if;
  if v_preferred_date=v_today and v_preferred_time<=v_now_time then raise exception 'The selected Dubai time has already passed.'; end if;
  v_unit_price:=case when coalesce(v_package.offer_enabled,false) and length(btrim(coalesce(v_package.offer_name,''))) between 2 and 40 and coalesce(v_package.b2c_offer_price,0)>0 and v_package.b2c_offer_price<v_package.base_price and coalesce(v_package.b2b_offer_price,0)>0 and v_package.b2b_offer_price<v_package.b2b_price and v_package.b2b_offer_price<=v_package.b2c_offer_price then v_package.b2b_offer_price else v_package.b2b_price end;
  v_base:=round(v_unit_price*v_quantity,2); v_vat:=round(v_base*0.05,2); v_total:=v_base+v_vat;
  if nullif(btrim(p_booking->>'customer_name'),'') is null then raise exception 'Customer name is required.'; end if;
  if nullif(btrim(p_booking->>'customer_phone'),'') is null then raise exception 'Customer phone is required.'; end if;
  loop perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('edrive_b2b_booking_code')); v_booking_code:='ED-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)); exit when not exists(select 1 from public.booking_requests br where br.booking_code=v_booking_code or br.booking_number=v_booking_code); end loop;
  insert into public.booking_requests (booking_code,booking_number,source,booking_source,status,admin_status,manager_status,selected_package_name,selected_package_slug,selected_package_category,selected_package_price,selected_package_b2b_price,selected_package_capacity,experience_type,service_type,duration_minutes,vehicle_quantity,guest_count,preferred_date,preferred_time,meeting_point_name,meeting_point_address,customer_name,customer_phone,customer_email,customer_hotel_or_area,customer_notes,subtotal,base_amount_aed,vat_rate,vat_amount,total_amount,payment_status,payment_method,payment_source,payment_workflow_status,collection_status,amount_received_aed,amount_pending_aed,b2b_agent_id,b2b_agent_code,b2b_agent_name,b2b_agent_email,customer_arrived,created_at,updated_at)
  values (v_booking_code,v_booking_code,'b2b','b2b','Pending','New','Pending',v_package.title,v_package.slug,v_package.category,v_package.base_price,v_unit_price,v_package.capacity,case when v_vehicle_type='jet_ski' then 'jet-ski-rental' else 'jet-car-rental' end,'rental',v_package.duration_minutes,v_quantity,v_guest_count,v_preferred_date,v_preferred_time_label,'Dubai Islands Marina','Dubai Islands Marina',btrim(p_booking->>'customer_name'),btrim(p_booking->>'customer_phone'),nullif(btrim(p_booking->>'customer_email'),''),nullif(btrim(p_booking->>'customer_hotel_or_area'),''),nullif(btrim(p_booking->>'customer_notes'),''),v_base,v_base,0.05,v_vat,v_total,'Not Paid','B2B Wallet','b2b','pending_wallet_debit','with_b2b_agent',0,v_total,v_agent.id,v_agent.agent_code,v_agent.company_name,coalesce(v_agent.login_email,v_agent.email),false,now(),now()) returning * into v_booking;
  return to_jsonb(v_booking);
exception when no_data_found or too_many_rows then raise exception 'Exactly one active B2B Agent profile must match the current authentication identity.';
end;
$$;
revoke all on function public.create_b2b_booking(jsonb) from public;
grant execute on function public.create_b2b_booking(jsonb) to authenticated;

commit;

notify pgrst, 'reload schema';
