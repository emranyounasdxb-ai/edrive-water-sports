alter table public.customers
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists country text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.customers
  alter column full_name set default 'Customer',
  alter column phone set default '0000000000';

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'normalized_email'
  ) then
    alter table public.customers
      add column normalized_email text generated always as (lower(nullif(email, ''))) stored;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'normalized_phone'
  ) then
    alter table public.customers
      add column normalized_phone text generated always as (regexp_replace(phone, '[^0-9+]', '', 'g')) stored;
  end if;
end $$;

update public.customers
set full_name = coalesce(nullif(trim(full_name), ''), 'Customer'),
    phone = coalesce(nullif(trim(phone), ''), '0000000000'),
    whatsapp = nullif(trim(coalesce(whatsapp, '')), ''),
    country = nullif(trim(coalesce(country, '')), ''),
    updated_at = now();

create unique index if not exists customers_normalized_email_unique
on public.customers(normalized_email)
where normalized_email is not null;

create index if not exists customers_normalized_phone_idx
on public.customers(normalized_phone);
