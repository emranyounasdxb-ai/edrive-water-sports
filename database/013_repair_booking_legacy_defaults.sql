alter table public.bookings
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists customer_whatsapp text,
  add column if not exists customer_country text,
  add column if not exists booking_source text,
  add column if not exists payment_status text;

alter table public.bookings
  alter column customer_name set default 'Customer',
  alter column customer_phone set default '0000000000',
  alter column customer_email set default '',
  alter column customer_whatsapp set default '',
  alter column customer_country set default '',
  alter column booking_source set default 'website',
  alter column payment_status set default 'not_paid';

update public.bookings b
set customer_name = coalesce(nullif(trim(b.customer_name), ''), c.full_name, 'Customer'),
    customer_phone = coalesce(nullif(trim(b.customer_phone), ''), c.phone, '0000000000'),
    customer_email = coalesce(nullif(trim(b.customer_email), ''), c.email, ''),
    customer_whatsapp = coalesce(nullif(trim(b.customer_whatsapp), ''), c.whatsapp, ''),
    customer_country = coalesce(nullif(trim(b.customer_country), ''), c.country, ''),
    booking_source = coalesce(nullif(trim(b.booking_source), ''), 'website'),
    payment_status = coalesce(nullif(trim(b.payment_status), ''), 'not_paid'),
    updated_at = now()
from public.customers c
where c.id = b.customer_id;

update public.bookings
set customer_name = coalesce(nullif(trim(customer_name), ''), 'Customer'),
    customer_phone = coalesce(nullif(trim(customer_phone), ''), '0000000000'),
    customer_email = coalesce(customer_email, ''),
    customer_whatsapp = coalesce(customer_whatsapp, ''),
    customer_country = coalesce(customer_country, ''),
    booking_source = coalesce(nullif(trim(booking_source), ''), 'website'),
    payment_status = coalesce(nullif(trim(payment_status), ''), 'not_paid'),
    updated_at = now();
