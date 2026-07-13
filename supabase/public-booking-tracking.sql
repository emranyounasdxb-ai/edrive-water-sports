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
language sql
stable
security definer
set search_path = public
as $$
  with input as (
    select
      lower(trim(coalesce(p_booking_code, ''))) as code,
      lower(trim(coalesce(p_contact, ''))) as contact,
      regexp_replace(coalesce(p_contact, ''), '[^0-9]', '', 'g') as contact_digits
  )
  select
    coalesce(br.booking_code::text, br.booking_number::text, br.id::text) as booking_code,
    br.booking_number::text as booking_number,
    case
      when lower(coalesce(br.status::text, '')) = 'no show'
        or lower(coalesce(br.manager_status::text, '')) = 'no show'
        or lower(coalesce(br.payment_status::text, '')) = 'no show'
        then 'No Show'
      when lower(coalesce(br.status::text, '')) = 'cancelled'
        or lower(coalesce(br.manager_status::text, '')) = 'cancelled'
        or lower(coalesce(br.payment_workflow_status::text, '')) like '%cancel%'
        then 'Cancelled'
      when lower(coalesce(br.status::text, '')) = 'completed'
        or lower(coalesce(br.manager_status::text, '')) = 'completed'
        then 'Completed'
      when lower(coalesce(br.status::text, '')) = 'in progress'
        or lower(coalesce(br.manager_status::text, '')) = 'in progress'
        or lower(coalesce(br.payment_workflow_status::text, '')) like '%ride in progress%'
        then 'In Progress'
      when lower(coalesce(br.status::text, '')) = 'confirmed'
        then 'Confirmed'
      else 'Pending'
    end as public_status,
    coalesce(
      nullif(trim(br.selected_package_name::text), ''),
      nullif(trim(br.selected_package_category::text), ''),
      nullif(trim(br.experience_type::text), ''),
      nullif(trim(br.service_type::text), ''),
      'Water Sports Booking'
    ) as package_name,
    nullif(trim(br.service_type::text), '') as service_type,
    br.preferred_date::text as preferred_date,
    br.preferred_time::text as preferred_time,
    coalesce(nullif(trim(br.customer_name::text), ''), 'Guest') as customer_name,
    coalesce(nullif(br.total_amount::text, '')::numeric, 0) as total_amount,
    coalesce(nullif(trim(br.payment_status::text), ''), 'Not Paid') as payment_status,
    coalesce(nullif(br.amount_received_aed::text, '')::numeric, 0) as amount_received,
    case
      when lower(coalesce(br.status::text, '')) in ('no show', 'cancelled') then 0
      when nullif(br.amount_pending_aed::text, '') is not null
        then greatest(br.amount_pending_aed::text::numeric, 0)
      else greatest(
        coalesce(nullif(br.total_amount::text, '')::numeric, 0)
        - coalesce(nullif(br.amount_received_aed::text, '')::numeric, 0),
        0
      )
    end as amount_pending,
    nullif(trim(br.assigned_vehicle_name::text), '') as assigned_vehicle,
    br.created_at::timestamptz as created_at
  from public.booking_requests br
  cross join input i
  where i.code <> ''
    and i.contact <> ''
    and (
      lower(trim(coalesce(br.booking_code::text, ''))) = i.code
      or lower(trim(coalesce(br.booking_number::text, ''))) = i.code
    )
    and (
      lower(trim(coalesce(br.customer_email::text, ''))) = i.contact
      or (
        length(i.contact_digits) >= 7
        and length(regexp_replace(coalesce(br.customer_phone::text, ''), '[^0-9]', '', 'g')) >= 7
        and (
          regexp_replace(coalesce(br.customer_phone::text, ''), '[^0-9]', '', 'g') = i.contact_digits
          or right(regexp_replace(coalesce(br.customer_phone::text, ''), '[^0-9]', '', 'g'), 9) = right(i.contact_digits, 9)
        )
      )
    )
  order by br.created_at desc
  limit 1;
$$;

revoke all on function public.track_booking(text, text) from public;
grant execute on function public.track_booking(text, text) to anon;
grant execute on function public.track_booking(text, text) to authenticated;

comment on function public.track_booking(text, text) is
  'Returns a restricted booking status record only when booking code and customer contact match.';
