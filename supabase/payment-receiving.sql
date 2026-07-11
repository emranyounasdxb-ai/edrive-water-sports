create extension if not exists pgcrypto;

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  source_type text not null check (source_type in ('manager', 'b2b_agent', 'direct_customer')),
  source_name text not null,
  received_amount numeric(12,2) not null default 0 check (received_amount >= 0),
  payment_method text not null,
  reference_no text,
  note text,
  received_by text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_receipt_allocations (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.payment_receipts(id) on delete cascade,
  booking_request_id text,
  booking_code text not null,
  allocated_amount numeric(12,2) not null default 0 check (allocated_amount >= 0),
  balance_before numeric(12,2) not null default 0,
  balance_after numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid references public.payment_receipts(id) on delete set null,
  allocation_id uuid references public.payment_receipt_allocations(id) on delete set null,
  booking_request_id text,
  booking_code text,
  account_type text not null check (account_type in ('manager', 'b2b_agent', 'direct_customer', 'company')),
  account_name text not null,
  entry_type text not null check (entry_type in ('source_out', 'company_in')),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  narration text,
  created_at timestamptz not null default now()
);

create index if not exists payment_receipts_source_idx on public.payment_receipts(source_type, source_name);
create index if not exists payment_receipts_date_idx on public.payment_receipts(received_at desc);
create index if not exists payment_allocations_receipt_idx on public.payment_receipt_allocations(receipt_id);
create index if not exists payment_allocations_booking_idx on public.payment_receipt_allocations(booking_code);
create index if not exists payment_ledger_receipt_idx on public.payment_ledger_entries(receipt_id);
create index if not exists payment_ledger_account_idx on public.payment_ledger_entries(account_type, account_name);

alter table public.payment_receipts enable row level security;
alter table public.payment_receipt_allocations enable row level security;
alter table public.payment_ledger_entries enable row level security;

drop policy if exists "payment_receipts_admin_access" on public.payment_receipts;
drop policy if exists "payment_allocations_admin_access" on public.payment_receipt_allocations;
drop policy if exists "payment_ledger_admin_access" on public.payment_ledger_entries;

create policy "payment_receipts_admin_access" on public.payment_receipts
  for all to authenticated
  using (true)
  with check (true);

create policy "payment_allocations_admin_access" on public.payment_receipt_allocations
  for all to authenticated
  using (true)
  with check (true);

create policy "payment_ledger_admin_access" on public.payment_ledger_entries
  for all to authenticated
  using (true)
  with check (true);
