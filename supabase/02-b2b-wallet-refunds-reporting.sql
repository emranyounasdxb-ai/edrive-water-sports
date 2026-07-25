begin;

create extension if not exists pgcrypto;

do $$
declare
  v_cross_links bigint;
  v_missing_columns text;
begin
  if to_regclass('public.booking_requests') is null
    or to_regclass('public.b2b_agents') is null
    or to_regclass('public.admin_users') is null
    or to_regclass('public.packages') is null
    or to_regclass('public.booking_request_vehicle_assignments') is null
    or to_regclass('public.payment_ledger_entries') is null
    or to_regclass('public.payment_receipts') is null
    or to_regclass('public.payment_receipt_allocations') is null
    or to_regclass('public.vehicles') is null then
    raise exception 'Required B2B foundation tables are missing. Run the read-only preflight before this migration.';
  end if;
  if to_regclass('public.audit_logs') is null then
    raise exception 'Required table public.audit_logs is missing. Apply supabase/audit-log.sql before this migration.';
  end if;
  with required(table_name, column_name) as (
    values
      ('booking_requests', 'id'), ('booking_requests', 'booking_code'), ('booking_requests', 'booking_number'),
      ('booking_requests', 'source'), ('booking_requests', 'booking_source'),
      ('booking_requests', 'status'), ('booking_requests', 'admin_status'), ('booking_requests', 'manager_status'),
      ('booking_requests', 'payment_status'), ('booking_requests', 'payment_method'), ('booking_requests', 'payment_source'),
      ('booking_requests', 'payment_workflow_status'), ('booking_requests', 'collection_status'),
      ('booking_requests', 'amount_received_aed'), ('booking_requests', 'amount_pending_aed'),
      ('booking_requests', 'b2b_agent_id'), ('booking_requests', 'ride_started_at'), ('booking_requests', 'ride_completed_at'),
      ('booking_requests', 'selected_package_name'), ('booking_requests', 'selected_package_category'),
      ('booking_requests', 'preferred_date'), ('booking_requests', 'preferred_time'),
      ('booking_requests', 'vehicle_quantity'), ('booking_requests', 'assigned_manager_id'),
      ('booking_requests', 'assigned_manager_name'), ('booking_requests', 'assigned_vehicle_id'),
      ('booking_requests', 'assigned_vehicle_name'), ('booking_requests', 'subtotal'),
      ('booking_requests', 'vat_amount'), ('booking_requests', 'total_amount'), ('booking_requests', 'created_at'),
      ('b2b_agents', 'id'), ('b2b_agents', 'auth_user_id'), ('b2b_agents', 'status'),
      ('b2b_agents', 'login_email'), ('b2b_agents', 'company_name'), ('b2b_agents', 'agent_code'),
      ('admin_users', 'id'), ('admin_users', 'auth_user_id'), ('admin_users', 'role'), ('admin_users', 'status'),
      ('admin_users', 'full_name'), ('admin_users', 'email'),
      ('packages', 'id'), ('packages', 'status'), ('packages', 'category'), ('packages', 'b2b_price'),
      ('booking_request_vehicle_assignments', 'booking_request_id'),
      ('booking_request_vehicle_assignments', 'vehicle_id'), ('booking_request_vehicle_assignments', 'is_active'),
      ('payment_ledger_entries', 'id'), ('payment_ledger_entries', 'receipt_id'),
      ('payment_ledger_entries', 'booking_code'), ('payment_ledger_entries', 'account_type'),
      ('payment_ledger_entries', 'account_name'), ('payment_ledger_entries', 'entry_type'),
      ('payment_ledger_entries', 'amount'), ('payment_ledger_entries', 'narration'),
      ('payment_ledger_entries', 'created_at'), ('payment_receipts', 'id'),
      ('payment_receipts', 'received_amount'), ('payment_receipts', 'received_at'),
      ('payment_receipt_allocations', 'receipt_id'), ('payment_receipt_allocations', 'booking_code'),
      ('vehicles', 'id'), ('vehicles', 'vehicle_code'), ('vehicles', 'vehicle_name'),
      ('vehicles', 'registration_number'), ('vehicles', 'status')
  )
  select string_agg(r.table_name || '.' || r.column_name, ', ' order by r.table_name, r.column_name)
  into v_missing_columns
  from required r
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = r.table_name and c.column_name = r.column_name
  );
  if v_missing_columns is not null then
    raise exception 'Migration blocked. Missing required live columns: %', v_missing_columns;
  end if;
  select count(*) into v_cross_links
  from public.admin_users au
  join public.b2b_agents ba on ba.auth_user_id = au.auth_user_id
  where au.auth_user_id is not null;
  if v_cross_links > 0 then
    raise exception 'Migration blocked: % Auth UUID link(s) are shared by admin_users and b2b_agents. Resolve them manually.', v_cross_links;
  end if;
  if exists (
    select 1 from public.b2b_agents ba
    where ba.auth_user_id is not null
    group by ba.auth_user_id having count(*) > 1
  ) then
    raise exception 'Migration blocked: duplicate B2B Agent Auth UUID links exist. Resolve them manually.';
  end if;
end
$$;

do $$
declare
  v_incompatible text;
begin
  with required_value(column_name, required_value) as (
    values
      ('status', 'Pending'), ('status', 'Confirmed'), ('status', 'Cancelled'),
      ('admin_status', 'New'), ('admin_status', 'Confirmed'), ('admin_status', 'Cancelled'),
      ('manager_status', 'Pending'), ('manager_status', 'Cancelled'),
      ('payment_status', 'Not Paid'), ('payment_status', 'Paid'), ('payment_status', 'Refunded'),
      ('payment_workflow_status', 'wallet_paid'), ('payment_workflow_status', 'pending_wallet_debit'),
      ('payment_method', 'B2B Wallet'),
      ('source', 'b2b'), ('booking_source', 'b2b'), ('payment_source', 'b2b'),
      ('collection_status', 'with_b2b_agent')
  ),
  incompatible as (
    select 'public.booking_requests.' || rv.column_name || '=' || rv.required_value AS item
    from required_value rv
    join pg_catalog.pg_attribute a
      on a.attrelid = 'public.booking_requests'::regclass
     and a.attname = rv.column_name
     and not a.attisdropped
    where exists (
      select 1
      from pg_catalog.pg_constraint c
      where c.conrelid = 'public.booking_requests'::regclass
        and c.contype = 'c'
        and a.attnum = any(c.conkey)
        and pg_catalog.cardinality(c.conkey) = 1
    )
    and not exists (
      select 1
      from pg_catalog.pg_constraint c
      where c.conrelid = 'public.booking_requests'::regclass
        and c.contype = 'c'
        and a.attnum = any(c.conkey)
        and pg_catalog.cardinality(c.conkey) = 1
        and pg_catalog.pg_get_constraintdef(c.oid, true) like '%''' || rv.required_value || '''%'
    )
    union all
    select 'public.booking_requests.' || rv.column_name || '=' || rv.required_value
    from required_value rv
    join information_schema.columns col
      on col.table_schema = 'public'
     and col.table_name = 'booking_requests'
     and col.column_name = rv.column_name
     and col.data_type = 'USER-DEFINED'
    where not exists (
      select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_enum e on e.enumtypid = t.oid
      where t.typname = col.udt_name
        and e.enumlabel = rv.required_value
    )
  )
  select string_agg(i.item, ', ' order by i.item) into v_incompatible from incompatible i;
  if v_incompatible is not null then
    raise exception 'Migration blocked. Live booking constraints do not explicitly allow required values: %', v_incompatible;
  end if;
end
$$;

do $$
declare
  v_incompatible text;
begin
  with required_value(required_value) as (
    values ('Active'), ('Suspended'), ('Inactive')
  ),
  incompatible as (
    select 'public.b2b_agents.status=' || rv.required_value AS item
    from required_value rv
    join pg_catalog.pg_attribute a
      on a.attrelid = 'public.b2b_agents'::regclass
     and a.attname = 'status'
     and not a.attisdropped
    where exists (
      select 1 from pg_catalog.pg_constraint c
      where c.conrelid = 'public.b2b_agents'::regclass
        and c.contype = 'c'
        and a.attnum = any(c.conkey)
        and pg_catalog.cardinality(c.conkey) = 1
    )
    and not exists (
      select 1 from pg_catalog.pg_constraint c
      where c.conrelid = 'public.b2b_agents'::regclass
        and c.contype = 'c'
        and a.attnum = any(c.conkey)
        and pg_catalog.cardinality(c.conkey) = 1
        and pg_catalog.pg_get_constraintdef(c.oid, true) like '%''' || rv.required_value || '''%'
    )
    union all
    select 'public.b2b_agents.status=' || rv.required_value
    from required_value rv
    join information_schema.columns col
      on col.table_schema = 'public' and col.table_name = 'b2b_agents'
     and col.column_name = 'status' and col.data_type = 'USER-DEFINED'
    where not exists (
      select 1 from pg_catalog.pg_type t
      join pg_catalog.pg_enum e on e.enumtypid = t.oid
      where t.typname = col.udt_name and e.enumlabel = rv.required_value
    )
  )
  select string_agg(i.item, ', ' order by i.item) into v_incompatible from incompatible i;
  if v_incompatible is not null then
    raise exception 'Migration blocked. Live B2B Agent status constraints do not allow: %', v_incompatible;
  end if;
end
$$;

alter table public.booking_requests
  add column if not exists base_amount_aed numeric(12,2),
  add column if not exists vat_rate numeric(5,4),
  add column if not exists total_refunded_aed numeric(12,2) not null default 0,
  add column if not exists wallet_payment_status text;

create unique index if not exists b2b_agents_auth_user_id_unique_idx
  on public.b2b_agents(auth_user_id)
  where auth_user_id is not null;

do $$
begin
  if exists (
    select 1 from public.booking_requests br
    where nullif(btrim(br.booking_code::text), '') is not null
    group by br.booking_code having count(*) > 1
  ) then
    raise exception 'Migration blocked: duplicate non-empty booking codes exist.';
  end if;
end
$$;

create unique index if not exists booking_requests_booking_code_unique_idx
  on public.booking_requests(booking_code)
  where nullif(btrim(booking_code::text), '') is not null;

create table if not exists public.b2b_wallets (
  id uuid primary key default gen_random_uuid(),
  b2b_agent_id uuid not null unique references public.b2b_agents(id),
  balance_aed numeric(14,2) not null default 0 check (balance_aed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.b2b_wallets (b2b_agent_id)
select ba.id
from public.b2b_agents ba
where lower(coalesce(ba.status::text, '')) = 'active'
on conflict (b2b_agent_id) do nothing;

create table if not exists public.b2b_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.b2b_wallets(id),
  b2b_agent_id uuid not null references public.b2b_agents(id),
  direction text not null check (direction in ('credit', 'debit')),
  transaction_type text not null check (transaction_type in (
    'wallet_top_up', 'booking_debit', 'refund_credit',
    'adjustment_credit', 'adjustment_debit', 'reversal'
  )),
  amount_aed numeric(14,2) not null check (amount_aed > 0),
  balance_after_aed numeric(14,2) not null check (balance_after_aed >= 0),
  booking_request_id uuid references public.booking_requests(id),
  refund_request_id uuid,
  description text not null,
  idempotency_key text not null unique,
  actor_auth_user_id uuid,
  actor_admin_user_id uuid references public.admin_users(id),
  created_at timestamptz not null default now()
);

alter table public.b2b_wallet_ledger
  add column if not exists reversal_of_entry_id uuid;

create table if not exists public.b2b_refund_requests (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id),
  b2b_agent_id uuid not null references public.b2b_agents(id),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  request_type text not null default 'cancellation' check (request_type in ('cancellation', 'no_show_refund')),
  reason text not null,
  requested_amount_aed numeric(12,2) not null check (requested_amount_aed > 0),
  approved_amount_aed numeric(12,2),
  agent_note text,
  operational_note text,
  decision_note text,
  requested_by uuid not null,
  decided_by uuid references public.admin_users(id),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.b2b_refund_requests
  add column if not exists request_type text not null default 'cancellation';
alter table public.b2b_refund_requests
  drop constraint if exists b2b_refund_requests_requested_amount_aed_check;
alter table public.b2b_refund_requests
  add constraint b2b_refund_requests_requested_amount_aed_check
  check (requested_amount_aed >= 0);
alter table public.b2b_refund_requests
  drop constraint if exists b2b_refund_requests_request_type_check;
alter table public.b2b_refund_requests
  add constraint b2b_refund_requests_request_type_check
  check (request_type in ('cancellation', 'no_show_refund'));

create unique index if not exists b2b_wallets_id_agent_unique_idx
  on public.b2b_wallets(id, b2b_agent_id);

do $$
declare
  v_mismatch_count bigint;
begin
  select count(*) into v_mismatch_count
  from public.b2b_wallet_ledger l
  left join public.b2b_wallets w
    on w.id = l.wallet_id and w.b2b_agent_id = l.b2b_agent_id
  where w.id is null;
  if v_mismatch_count > 0 then
    raise exception 'Migration blocked: % wallet ledger row(s) have mismatched wallet and B2B Agent identities.', v_mismatch_count;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.b2b_wallet_ledger'::regclass
      and conname = 'b2b_wallet_ledger_wallet_agent_fkey'
  ) then
    alter table public.b2b_wallet_ledger
      add constraint b2b_wallet_ledger_wallet_agent_fkey
      foreign key (wallet_id, b2b_agent_id)
      references public.b2b_wallets(id, b2b_agent_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.b2b_wallet_ledger'::regclass
      and conname = 'b2b_wallet_ledger_refund_request_id_fkey'
  ) then
    alter table public.b2b_wallet_ledger
      add constraint b2b_wallet_ledger_refund_request_id_fkey
      foreign key (refund_request_id) references public.b2b_refund_requests(id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.b2b_wallet_ledger'::regclass
      and conname = 'b2b_wallet_ledger_reversal_of_entry_id_fkey'
  ) then
    alter table public.b2b_wallet_ledger
      add constraint b2b_wallet_ledger_reversal_of_entry_id_fkey
      foreign key (reversal_of_entry_id) references public.b2b_wallet_ledger(id);
  end if;
end
$$;

create unique index if not exists b2b_refund_requests_one_pending_idx
  on public.b2b_refund_requests(booking_request_id)
  where status = 'Pending';
create index if not exists b2b_wallet_ledger_agent_time_idx
  on public.b2b_wallet_ledger(b2b_agent_id, created_at desc);
create index if not exists b2b_wallet_ledger_booking_idx
  on public.b2b_wallet_ledger(booking_request_id);
create unique index if not exists b2b_wallet_ledger_one_reversal_per_entry_idx
  on public.b2b_wallet_ledger(reversal_of_entry_id)
  where reversal_of_entry_id is not null;
create index if not exists b2b_refund_requests_agent_time_idx
  on public.b2b_refund_requests(b2b_agent_id, requested_at desc);
create index if not exists booking_requests_b2b_finance_idx
  on public.booking_requests(b2b_agent_id, payment_source, created_at desc);

create or replace function public.prevent_b2b_financial_record_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'B2B financial ledger entries are immutable. Use a reversing entry.';
end;
$$;

revoke all on function public.prevent_b2b_financial_record_mutation() from public;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.b2b_wallet_ledger'::regclass
      and tgname = 'b2b_wallet_ledger_immutable_trigger'
      and not tgisinternal
  ) then
    create trigger b2b_wallet_ledger_immutable_trigger
    before update or delete on public.b2b_wallet_ledger
    for each row execute function public.prevent_b2b_financial_record_mutation();
  end if;
end
$$;

create or replace function public.manage_b2b_agent_profile(
  p_agent_id uuid,
  p_auth_user_id uuid,
  p_profile jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller public.admin_users%rowtype;
  v_caller_count integer;
  v_agent public.b2b_agents%rowtype;
  v_auth_email text;
  v_login_email text;
  v_requested_status text;
  v_created_by uuid;
  v_updated_by uuid;
  v_creator_target text;
  v_updater_target text;
begin
  select count(*) into v_caller_count
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if v_caller_count <> 1 then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
  end if;
  select au.* into v_caller
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if lower(coalesce(v_caller.role::text, '')) <> 'super_admin' then
    raise exception 'Only Super Admin can manage B2B Agent profiles.';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_auth_user_id) then
    raise exception 'The supplied Supabase Auth user UUID does not exist.';
  end if;
  select lower(u.email) into v_auth_email from auth.users u where u.id = p_auth_user_id;
  if nullif(v_auth_email, '') is null then
    raise exception 'The supplied Supabase Auth user has no email address.';
  end if;
  v_login_email := lower(coalesce(nullif(btrim(p_profile->>'login_email'), ''), v_auth_email));
  if v_login_email <> v_auth_email then
    raise exception 'Login email must match the supplied Supabase Auth user email.';
  end if;
  v_requested_status := initcap(lower(coalesce(nullif(btrim(p_profile->>'status'), ''), 'Active')));
  if v_requested_status not in ('Active', 'Suspended', 'Inactive') then
    raise exception 'B2B Agent status must be Active, Suspended, or Inactive.';
  end if;
  select ccu.table_name into v_creator_target
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_schema = tc.constraint_schema and kcu.constraint_name = tc.constraint_name
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_schema = tc.constraint_schema and ccu.constraint_name = tc.constraint_name
  where tc.table_schema = 'public' and tc.table_name = 'b2b_agents'
    and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'created_by'
  limit 1;
  select ccu.table_name into v_updater_target
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_schema = tc.constraint_schema and kcu.constraint_name = tc.constraint_name
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_schema = tc.constraint_schema and ccu.constraint_name = tc.constraint_name
  where tc.table_schema = 'public' and tc.table_name = 'b2b_agents'
    and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'updated_by'
  limit 1;
  if (v_creator_target is not null and v_creator_target not in ('admin_users', 'users'))
    or (v_updater_target is not null and v_updater_target not in ('admin_users', 'users')) then
    raise exception 'Unsupported b2b_agents created_by or updated_by foreign-key target. Review the preflight output.';
  end if;
  v_created_by := case when v_creator_target = 'admin_users' then v_caller.id else auth.uid() end;
  v_updated_by := case when v_updater_target = 'admin_users' then v_caller.id else auth.uid() end;
  if exists (
    select 1 from public.admin_users au
    where au.auth_user_id = p_auth_user_id
  ) then
    raise exception 'The supplied Auth user is already linked to a portal staff profile.';
  end if;
  if exists (
    select 1 from public.b2b_agents ba
    where ba.auth_user_id = p_auth_user_id
      and (p_agent_id is null or ba.id <> p_agent_id)
  ) then
    raise exception 'The supplied Auth user is already linked to another B2B Agent.';
  end if;

  if p_agent_id is null then
    insert into public.b2b_agents (
      auth_user_id, agent_code, company_name, agent_type, contact_person,
      phone, login_email, email, billing_email, payment_terms,
      credit_limit_aed, status, rate_profile, special_pricing, notes,
      is_test_record, created_by, updated_by
    ) values (
      p_auth_user_id,
      nullif(btrim(p_profile->>'agent_code'), ''),
      nullif(btrim(p_profile->>'company_name'), ''),
      coalesce(nullif(btrim(p_profile->>'agent_type'), ''), 'B2B Agent'),
      nullif(btrim(p_profile->>'contact_person'), ''),
      nullif(btrim(p_profile->>'phone'), ''),
      v_login_email,
      v_login_email,
      lower(coalesce(nullif(btrim(p_profile->>'billing_email'), ''), v_login_email)),
      coalesce(nullif(btrim(p_profile->>'payment_terms'), ''), 'Instant'),
      0,
      v_requested_status,
      coalesce(nullif(btrim(p_profile->>'rate_profile'), ''), 'Default B2B Package Rates'),
      coalesce((p_profile->>'special_pricing')::boolean, false),
      nullif(btrim(p_profile->>'notes'), ''),
      false, v_created_by, v_updated_by
    )
    returning * into v_agent;
  else
    update public.b2b_agents ba
    set auth_user_id = p_auth_user_id,
        agent_code = coalesce(nullif(btrim(p_profile->>'agent_code'), ''), ba.agent_code),
        company_name = coalesce(nullif(btrim(p_profile->>'company_name'), ''), ba.company_name),
        agent_type = coalesce(nullif(btrim(p_profile->>'agent_type'), ''), ba.agent_type),
        contact_person = coalesce(nullif(btrim(p_profile->>'contact_person'), ''), ba.contact_person),
        phone = coalesce(nullif(btrim(p_profile->>'phone'), ''), ba.phone),
        login_email = v_login_email,
        email = v_login_email,
        billing_email = coalesce(lower(nullif(btrim(p_profile->>'billing_email'), '')), ba.billing_email),
        payment_terms = coalesce(nullif(btrim(p_profile->>'payment_terms'), ''), ba.payment_terms),
        rate_profile = coalesce(nullif(btrim(p_profile->>'rate_profile'), ''), ba.rate_profile),
        special_pricing = coalesce((p_profile->>'special_pricing')::boolean, ba.special_pricing),
        status = v_requested_status,
        notes = case when p_profile ? 'notes' then nullif(btrim(p_profile->>'notes'), '') else ba.notes end,
        updated_by = v_updated_by,
        updated_at = now()
    where ba.id = p_agent_id
    returning * into v_agent;
    if not found then raise exception 'B2B Agent profile was not found.'; end if;
  end if;

  insert into public.b2b_wallets (b2b_agent_id)
  values (v_agent.id)
  on conflict (b2b_agent_id) do nothing;

  if exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'b2b_agents' and c.column_name = 'is_active'
  ) then
    execute 'update public.b2b_agents set is_active = $1 where id = $2'
      using (v_requested_status = 'Active'), v_agent.id;
  end if;

  insert into public.audit_logs (
    module, action, entity_type, entity_id, entity_label,
    actor_user_id, actor_name, actor_email, actor_role, summary, metadata
  ) values (
    'B2B Agents',
    case when p_agent_id is null then 'create' else 'update' end,
    'b2b_agent',
    v_agent.id::text,
    coalesce(v_agent.company_name, v_agent.agent_code, v_agent.id::text),
    auth.uid(),
    v_caller.full_name,
    v_caller.email,
    v_caller.role::text,
    case when p_agent_id is null
      then 'Created and linked a B2B Agent profile.'
      else 'Updated or relinked a B2B Agent profile.'
    end,
    jsonb_build_object(
      'b2b_agent_id', v_agent.id,
      'auth_user_id', v_agent.auth_user_id,
      'status', v_agent.status
    )
  );

  return to_jsonb(v_agent);
end;
$$;

create or replace function public.set_b2b_agent_status(
  p_agent_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_agent public.b2b_agents%rowtype;
  v_updated_by uuid;
  v_updater_target text;
begin
  select au.* into strict v_caller
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if lower(coalesce(v_caller.role::text, '')) <> 'super_admin' then
    raise exception 'Only Super Admin can change B2B Agent status.';
  end if;
  if lower(btrim(p_status)) not in ('active', 'suspended', 'inactive') then
    raise exception 'B2B Agent status must be Active, Suspended, or Inactive.';
  end if;
  select ccu.table_name into v_updater_target
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_schema = tc.constraint_schema and kcu.constraint_name = tc.constraint_name
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_schema = tc.constraint_schema and ccu.constraint_name = tc.constraint_name
  where tc.table_schema = 'public' and tc.table_name = 'b2b_agents'
    and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'updated_by'
  limit 1;
  if v_updater_target is not null and v_updater_target not in ('admin_users', 'users') then
    raise exception 'Unsupported b2b_agents updated_by foreign-key target. Review the preflight output.';
  end if;
  v_updated_by := case when v_updater_target = 'admin_users' then v_caller.id else auth.uid() end;
  update public.b2b_agents ba
  set status = initcap(lower(btrim(p_status))),
      updated_by = v_updated_by,
      updated_at = now()
  where ba.id = p_agent_id
  returning * into v_agent;
  if not found then raise exception 'B2B Agent profile was not found.'; end if;
  if exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'b2b_agents' and c.column_name = 'is_active'
  ) then
    execute 'update public.b2b_agents set is_active = $1 where id = $2'
      using (v_agent.status = 'Active'), v_agent.id;
  end if;
  insert into public.audit_logs (
    module, action, entity_type, entity_id, entity_label,
    actor_user_id, actor_name, actor_email, actor_role, summary, metadata
  ) values (
    'B2B Agents',
    'status_change',
    'b2b_agent',
    v_agent.id::text,
    coalesce(v_agent.company_name, v_agent.agent_code, v_agent.id::text),
    auth.uid(),
    v_caller.full_name,
    v_caller.email,
    v_caller.role::text,
    'Changed a B2B Agent profile status.',
    jsonb_build_object('b2b_agent_id', v_agent.id, 'status', v_agent.status)
  );
  return to_jsonb(v_agent);
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
end;
$$;

create or replace function public.adjust_b2b_wallet(
  p_agent_id uuid,
  p_direction text,
  p_amount_aed numeric,
  p_description text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_wallet public.b2b_wallets%rowtype;
  v_amount numeric(14,2);
  v_balance numeric(14,2);
  v_entry public.b2b_wallet_ledger%rowtype;
begin
  select au.* into strict v_caller
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if lower(coalesce(v_caller.role::text, '')) <> 'super_admin' then
    raise exception 'Only Super Admin can adjust a B2B wallet.';
  end if;
  v_amount := round(p_amount_aed, 2);
  if v_amount <= 0 then raise exception 'Wallet adjustment amount must be greater than zero.'; end if;
  if lower(btrim(p_direction)) not in ('credit', 'debit') then raise exception 'Wallet direction must be credit or debit.'; end if;
  if nullif(btrim(p_description), '') is null then raise exception 'Wallet adjustment description is required.'; end if;
  if nullif(btrim(p_idempotency_key), '') is null then raise exception 'Wallet idempotency key is required.'; end if;
  if lower(btrim(p_idempotency_key)) like 'booking:%'
    or lower(btrim(p_idempotency_key)) like 'refund:%'
    or lower(btrim(p_idempotency_key)) like 'reversal:%' then
    raise exception 'The supplied idempotency key uses a reserved namespace.';
  end if;
  if lower(btrim(p_idempotency_key)) not like 'adjustment:%' then
    raise exception 'Manual wallet adjustment keys must use the adjustment: namespace.';
  end if;

  insert into public.b2b_wallets (b2b_agent_id)
  values (p_agent_id)
  on conflict (b2b_agent_id) do nothing;
  select w.* into v_wallet
  from public.b2b_wallets w
  where w.b2b_agent_id = p_agent_id
  for update;
  if exists (select 1 from public.b2b_wallet_ledger l where l.idempotency_key = p_idempotency_key) then
    raise exception 'This wallet adjustment has already been processed.';
  end if;
  v_balance := v_wallet.balance_aed + case when lower(btrim(p_direction)) = 'credit' then v_amount else -v_amount end;
  if v_balance < 0 then raise exception 'Wallet debit would create a negative balance.'; end if;
  update public.b2b_wallets set balance_aed = v_balance, updated_at = now() where id = v_wallet.id;
  insert into public.b2b_wallet_ledger (
    wallet_id, b2b_agent_id, direction, transaction_type, amount_aed,
    balance_after_aed, description, idempotency_key,
    actor_auth_user_id, actor_admin_user_id
  ) values (
    v_wallet.id, p_agent_id, lower(btrim(p_direction)),
    case when lower(btrim(p_direction)) = 'credit' then 'adjustment_credit' else 'adjustment_debit' end,
    v_amount, v_balance, btrim(p_description), btrim(p_idempotency_key),
    auth.uid(), v_caller.id
  ) returning * into v_entry;
  insert into public.audit_logs (
    module, action, entity_type, entity_id, entity_label,
    actor_user_id, actor_name, actor_email, actor_role, summary, metadata
  ) values (
    'B2B Wallet',
    'wallet_adjustment',
    'b2b_wallet_ledger',
    v_entry.id::text,
    p_agent_id::text,
    auth.uid(),
    v_caller.full_name,
    v_caller.email,
    v_caller.role::text,
    'Applied a manual B2B wallet adjustment.',
    jsonb_build_object(
      'b2b_agent_id', p_agent_id,
      'direction', v_entry.direction,
      'amount_aed', v_entry.amount_aed,
      'balance_after_aed', v_entry.balance_after_aed,
      'idempotency_key', v_entry.idempotency_key
    )
  );
  return to_jsonb(v_entry);
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
end;
$$;

create or replace function public.reverse_b2b_wallet_entry(
  p_ledger_entry_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_source public.b2b_wallet_ledger%rowtype;
  v_wallet public.b2b_wallets%rowtype;
  v_entry public.b2b_wallet_ledger%rowtype;
  v_balance numeric(14,2);
  v_direction text;
begin
  select au.* into strict v_caller
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if lower(coalesce(v_caller.role::text, '')) <> 'super_admin' then
    raise exception 'Only Super Admin can reverse a B2B wallet entry.';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'A wallet reversal reason is required.';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null
    or lower(btrim(p_idempotency_key)) not like 'reversal:%' then
    raise exception 'Wallet reversal keys must use the reversal: namespace.';
  end if;

  select l.* into v_source
  from public.b2b_wallet_ledger l
  where l.id = p_ledger_entry_id
  for update;
  if not found then raise exception 'The wallet ledger entry was not found.'; end if;
  if v_source.transaction_type = 'reversal' or v_source.reversal_of_entry_id is not null then
    raise exception 'A wallet reversal cannot itself be reversed.';
  end if;
  if v_source.transaction_type not in ('wallet_top_up', 'adjustment_credit', 'adjustment_debit') then
    raise exception 'Booking debits and refund credits must be corrected through their business workflow.';
  end if;
  if exists (
    select 1 from public.b2b_wallet_ledger l
    where l.reversal_of_entry_id = v_source.id
  ) then
    raise exception 'This wallet ledger entry has already been reversed.';
  end if;
  if exists (
    select 1 from public.b2b_wallet_ledger l
    where l.idempotency_key = btrim(p_idempotency_key)
  ) then
    raise exception 'This wallet reversal operation has already been processed.';
  end if;

  select w.* into v_wallet
  from public.b2b_wallets w
  where w.id = v_source.wallet_id
    and w.b2b_agent_id = v_source.b2b_agent_id
  for update;
  if not found then raise exception 'The linked B2B wallet was not found.'; end if;

  v_direction := case when v_source.direction = 'credit' then 'debit' else 'credit' end;
  v_balance := v_wallet.balance_aed
    + case when v_direction = 'credit' then v_source.amount_aed else -v_source.amount_aed end;
  if v_balance < 0 then
    raise exception 'Wallet reversal would create a negative balance.';
  end if;

  update public.b2b_wallets
  set balance_aed = v_balance, updated_at = now()
  where id = v_wallet.id;

  insert into public.b2b_wallet_ledger (
    wallet_id, b2b_agent_id, direction, transaction_type, amount_aed,
    balance_after_aed, booking_request_id, refund_request_id,
    reversal_of_entry_id, description, idempotency_key,
    actor_auth_user_id, actor_admin_user_id
  ) values (
    v_source.wallet_id, v_source.b2b_agent_id, v_direction, 'reversal',
    v_source.amount_aed, v_balance, v_source.booking_request_id, v_source.refund_request_id,
    v_source.id, btrim(p_reason), btrim(p_idempotency_key),
    auth.uid(), v_caller.id
  ) returning * into v_entry;

  insert into public.audit_logs (
    module, action, entity_type, entity_id, entity_label,
    actor_user_id, actor_name, actor_email, actor_role, summary, metadata
  ) values (
    'B2B Wallet', 'wallet_reversal', 'b2b_wallet_ledger', v_entry.id::text,
    v_source.id::text, auth.uid(), v_caller.full_name, v_caller.email,
    v_caller.role::text, 'Reversed an eligible B2B wallet ledger entry.',
    jsonb_build_object(
      'source_entry_id', v_source.id,
      'reversal_entry_id', v_entry.id,
      'direction', v_entry.direction,
      'amount_aed', v_entry.amount_aed,
      'balance_after_aed', v_entry.balance_after_aed,
      'idempotency_key', v_entry.idempotency_key,
      'reason', btrim(p_reason)
    )
  );
  return to_jsonb(v_entry);
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
end;
$$;

create or replace function public.request_b2b_refund(
  p_booking_request_id text,
  p_reason text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agent public.b2b_agents%rowtype;
  v_booking public.booking_requests%rowtype;
  v_request public.b2b_refund_requests%rowtype;
  v_eligible numeric(12,2);
  v_request_type text;
begin
  select ba.* into strict v_agent
  from public.b2b_agents ba
  where ba.auth_user_id = auth.uid()
    and lower(coalesce(ba.status::text, '')) = 'active';
  select br.* into v_booking
  from public.booking_requests br
  where br.id::text = p_booking_request_id
    and br.b2b_agent_id = v_agent.id
  for update;
  if not found then raise exception 'Eligible B2B booking was not found.'; end if;
  if nullif(btrim(p_reason), '') is null then raise exception 'Cancellation or refund reason is required.'; end if;
  if v_booking.ride_started_at is not null
    or lower(coalesce(v_booking.status::text, '')) in ('completed', 'ride in progress', 'ride_in_progress') then
    raise exception 'A cancellation request cannot be submitted after the ride has started.';
  end if;
  v_request_type := case
    when lower(coalesce(v_booking.status::text, '')) in ('no show', 'no_show') then 'no_show_refund'
    else 'cancellation'
  end;
  v_eligible := round(greatest(coalesce(v_booking.amount_received_aed, 0) - coalesce(v_booking.total_refunded_aed, 0), 0), 2);
  insert into public.b2b_refund_requests (
    booking_request_id, b2b_agent_id, request_type, reason, requested_amount_aed,
    agent_note, requested_by
  ) values (
    v_booking.id, v_agent.id, v_request_type, btrim(p_reason), v_eligible,
    nullif(btrim(p_note), ''), auth.uid()
  ) returning * into v_request;
  insert into public.booking_action_history (
    booking_request_id, action, actor_auth_user_id, actor_role,
    before_data, after_data, metadata
  ) values (
    v_booking.id, 'cancellation_or_refund_requested', auth.uid(), 'b2b_agent',
    to_jsonb(v_booking), to_jsonb(v_booking),
    jsonb_build_object('refund_request_id', v_request.id, 'request_type', v_request_type, 'amount_aed', v_eligible)
  );
  return to_jsonb(v_request);
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active B2B Agent profile must match the current authentication identity.';
end;
$$;

create or replace function public.decide_b2b_refund(
  p_refund_request_id uuid,
  p_decision text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_request public.b2b_refund_requests%rowtype;
  v_booking public.booking_requests%rowtype;
  v_wallet public.b2b_wallets%rowtype;
  v_original_debit public.b2b_wallet_ledger%rowtype;
  v_balance numeric(14,2);
  v_credit_amount numeric(12,2) := 0;
begin
  select au.* into strict v_caller
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active';
  if lower(coalesce(v_caller.role::text, '')) <> 'super_admin' then
    raise exception 'Only Super Admin can approve or reject B2B refunds.';
  end if;
  if lower(btrim(p_decision)) not in ('approved', 'rejected') then
    raise exception 'Refund decision must be Approved or Rejected.';
  end if;
  if nullif(btrim(p_note), '') is null then raise exception 'A decision note is required.'; end if;
  select rr.* into v_request
  from public.b2b_refund_requests rr
  where rr.id = p_refund_request_id
  for update;
  if not found then raise exception 'Refund request was not found.'; end if;
  if v_request.status <> 'Pending' then raise exception 'This refund request has already been decided.'; end if;
  select br.* into v_booking
  from public.booking_requests br
  where br.id = v_request.booking_request_id;
  if not found then raise exception 'The linked booking request was not found.'; end if;
  if lower(btrim(p_decision)) = 'approved' then
    select br.* into v_booking
    from public.booking_requests br
    where br.id = v_request.booking_request_id
    for update;
    if not found then raise exception 'The linked booking request was not found.'; end if;
    if v_booking.ride_started_at is not null
      or v_booking.ride_completed_at is not null
      or lower(coalesce(v_booking.status::text, '')) in ('ride in progress', 'ride_in_progress', 'completed') then
      raise exception 'A started or completed ride cannot be cancelled or refunded.';
    end if;
    if v_request.request_type = 'no_show_refund'
      and lower(coalesce(v_booking.status::text, '')) not in ('no show', 'no_show') then
      raise exception 'A No Show refund can be approved only while the booking is still No Show.';
    end if;
    if v_request.request_type = 'cancellation'
      and lower(coalesce(v_booking.status::text, '')) in ('completed', 'ride in progress', 'ride_in_progress') then
      raise exception 'Cancellation approval is unavailable after ride start or completion.';
    end if;
    if exists (
      select 1
      from public.booking_request_vehicle_assignments a
      where a.booking_request_id = v_booking.id
        and a.is_active = true
    ) then
      raise exception 'The booking has active vehicle assignments and cannot be cancelled or refunded.';
    end if;
    if coalesce(v_booking.total_refunded_aed, 0) + v_request.requested_amount_aed > coalesce(v_booking.amount_received_aed, 0) then
      raise exception 'Refund would exceed the eligible paid amount.';
    end if;
    if v_request.requested_amount_aed > 0 then
      select w.* into v_wallet
      from public.b2b_wallets w
      where w.b2b_agent_id = v_request.b2b_agent_id
      for update;
      if found then
        select l.* into v_original_debit
        from public.b2b_wallet_ledger l
        where l.booking_request_id = v_booking.id
          and l.transaction_type = 'booking_debit'
        order by l.created_at
        limit 1;
        if found then
          if v_original_debit.direction <> 'debit'
            or v_original_debit.b2b_agent_id is distinct from v_request.b2b_agent_id
            or v_original_debit.wallet_id is distinct from v_wallet.id
            or v_original_debit.booking_request_id is distinct from v_booking.id
            or v_original_debit.amount_aed < v_request.requested_amount_aed then
            raise exception 'Original booking wallet debit does not match the requested refund.';
          end if;
          if exists (select 1 from public.b2b_wallet_ledger l where l.idempotency_key = 'refund:' || v_request.id::text) then
            raise exception 'This refund credit has already been processed.';
          end if;
          v_credit_amount := v_request.requested_amount_aed;
          v_balance := v_wallet.balance_aed + v_credit_amount;
          update public.b2b_wallets set balance_aed = v_balance, updated_at = now() where id = v_wallet.id;
          insert into public.b2b_wallet_ledger (
            wallet_id, b2b_agent_id, direction, transaction_type, amount_aed,
            balance_after_aed, booking_request_id, refund_request_id,
            description, idempotency_key, actor_auth_user_id, actor_admin_user_id
          ) values (
            v_wallet.id, v_request.b2b_agent_id, 'credit', 'refund_credit',
            v_credit_amount, v_balance, v_booking.id, v_request.id,
            'Approved booking refund', 'refund:' || v_request.id::text,
            auth.uid(), v_caller.id
          );
        end if;
      end if;
    end if;
    update public.booking_requests
    set status = case when v_request.request_type = 'cancellation' then 'Cancelled' else status end,
        admin_status = case when v_request.request_type = 'cancellation' then 'Cancelled' else admin_status end,
        manager_status = case when v_request.request_type = 'cancellation' then 'Cancelled' else manager_status end,
        total_refunded_aed = coalesce(total_refunded_aed, 0) + v_credit_amount,
        payment_status = case
          when v_credit_amount > 0
            and coalesce(total_refunded_aed, 0) + v_credit_amount >= coalesce(amount_received_aed, 0)
            then 'Refunded'
          else payment_status
        end,
        updated_at = now()
    where id = v_booking.id;
  end if;

  update public.b2b_refund_requests
  set status = initcap(lower(btrim(p_decision))),
      approved_amount_aed = case when lower(btrim(p_decision)) = 'approved' then v_credit_amount else null end,
      decision_note = btrim(p_note),
      decided_by = v_caller.id,
      decided_at = now(),
      updated_at = now()
  where id = v_request.id
  returning * into v_request;

  insert into public.booking_action_history (
    booking_request_id, action, actor_auth_user_id, actor_admin_user_id,
    actor_role, before_data, after_data, metadata
  ) values (
    v_booking.id,
    case when v_request.status = 'Approved' then 'refund_approved' else 'refund_rejected' end,
    auth.uid(), v_caller.id, v_caller.role::text,
    to_jsonb(v_booking), (select to_jsonb(br) from public.booking_requests br where br.id = v_booking.id),
    jsonb_build_object(
      'refund_request_id', v_request.id,
      'requested_amount_aed', v_request.requested_amount_aed,
      'credited_amount_aed', v_credit_amount,
      'original_wallet_debit_found', v_original_debit.id is not null
    )
  );
  return to_jsonb(v_request);
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
end;
$$;

create or replace function public.get_b2b_finance_summary(p_agent_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_agent_id uuid;
  v_admin_count integer;
begin
  select count(*) into v_admin_count
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active';
  if v_admin_count > 1 then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
  end if;
  select lower(coalesce(au.role::text, '')) into v_role
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active';
  if v_role is null then
    select ba.id into strict v_agent_id
    from public.b2b_agents ba
    where ba.auth_user_id = auth.uid()
      and lower(coalesce(ba.status::text, '')) = 'active';
  elsif v_role in ('super_admin', 'admin', 'finance') then
    v_agent_id := p_agent_id;
  else
    raise exception 'Current role cannot view B2B financial reporting.';
  end if;
  return jsonb_build_object(
    'wallet_balance_aed', coalesce((select sum(w.balance_aed) from public.b2b_wallets w where v_agent_id is null or w.b2b_agent_id = v_agent_id), 0),
    'wallet_credits_aed', coalesce((select sum(l.amount_aed) from public.b2b_wallet_ledger l where l.direction = 'credit' and (v_agent_id is null or l.b2b_agent_id = v_agent_id)), 0),
    'wallet_debits_aed', coalesce((select sum(l.amount_aed) from public.b2b_wallet_ledger l where l.direction = 'debit' and (v_agent_id is null or l.b2b_agent_id = v_agent_id)), 0),
    'pending_refunds', (select count(*) from public.b2b_refund_requests r where r.status = 'Pending' and (v_agent_id is null or r.b2b_agent_id = v_agent_id)),
    'approved_refunds_aed', coalesce((select sum(r.approved_amount_aed) from public.b2b_refund_requests r where r.status = 'Approved' and (v_agent_id is null or r.b2b_agent_id = v_agent_id)), 0),
    'rejected_refunds', (select count(*) from public.b2b_refund_requests r where r.status = 'Rejected' and (v_agent_id is null or r.b2b_agent_id = v_agent_id))
  );
end;
$$;

create or replace function public.get_b2b_agent_directory()
returns table (
  id uuid,
  agent_code text,
  company_name text,
  status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select lower(coalesce(au.role::text, '')) into strict v_role
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if v_role not in ('super_admin', 'admin', 'finance', 'booking_staff', 'booking_manager') then
    raise exception 'Current role cannot view the B2B Agent directory.';
  end if;
  return query
  select ba.id, ba.agent_code::text, ba.company_name::text, ba.status::text
  from public.b2b_agents ba
  order by coalesce(ba.company_name, ba.agent_code, ba.id::text);
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
end;
$$;

create or replace function public.edrive_booking_matches_report_filters(
  p_booking_request_id uuid,
  p_filters jsonb
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.booking_requests br
    where br.id = p_booking_request_id
      and (nullif(p_filters->>'date_from', '') is null or br.preferred_date >= (p_filters->>'date_from')::date)
      and (nullif(p_filters->>'date_to', '') is null or br.preferred_date <= (p_filters->>'date_to')::date)
      and (
        nullif(p_filters->>'booking_source', '') is null
        or (lower(p_filters->>'booking_source') = 'b2b'
          and lower(coalesce(br.booking_source::text, br.source::text, '')) = 'b2b')
        or (lower(p_filters->>'booking_source') = 'direct'
          and lower(coalesce(br.booking_source::text, br.source::text, '')) <> 'b2b')
        or lower(coalesce(br.booking_source::text, br.source::text, '')) = lower(p_filters->>'booking_source')
      )
      and (nullif(p_filters->>'booking_status', '') is null or lower(br.status::text) = lower(p_filters->>'booking_status'))
      and (nullif(p_filters->>'payment_status', '') is null or lower(br.payment_status::text) = lower(p_filters->>'payment_status'))
      and (nullif(p_filters->>'agent_id', '') is null or br.b2b_agent_id::text = p_filters->>'agent_id')
      and (nullif(p_filters->>'manager_id', '') is null or br.assigned_manager_id::text = p_filters->>'manager_id')
      and (nullif(p_filters->>'package', '') is null or lower(br.selected_package_name::text) = lower(p_filters->>'package'))
      and (
        nullif(p_filters->>'vehicle_type', '') is null
        or public.normalize_edrive_vehicle_type(br.selected_package_category::text) =
           public.normalize_edrive_vehicle_type(p_filters->>'vehicle_type')
      )
      and (
        nullif(p_filters->>'vehicle_id', '') is null
        or exists (
          select 1 from public.booking_request_vehicle_assignments a
          where a.booking_request_id = br.id and a.vehicle_id::text = p_filters->>'vehicle_id'
        )
      )
  );
$$;

revoke all on function public.edrive_booking_matches_report_filters(uuid, jsonb) from public;

create or replace function public.get_edrive_report_data(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_from date := nullif(p_filters->>'date_from', '')::date;
  v_to date := nullif(p_filters->>'date_to', '')::date;
  v_has_booking_scope boolean :=
    nullif(p_filters->>'booking_source', '') is not null
    or nullif(p_filters->>'booking_status', '') is not null
    or nullif(p_filters->>'payment_status', '') is not null
    or nullif(p_filters->>'manager_id', '') is not null
    or nullif(p_filters->>'vehicle_id', '') is not null
    or nullif(p_filters->>'package', '') is not null
    or nullif(p_filters->>'vehicle_type', '') is not null;
begin
  select lower(coalesce(au.role::text, '')) into strict v_role
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if v_role not in ('super_admin', 'admin', 'finance') then
    raise exception 'Current role cannot view financial reporting.';
  end if;

  return jsonb_build_object(
    'bookings', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.preferred_date desc, x.created_at desc)
      from (
        select br.id, br.booking_code, br.booking_number, br.booking_source, br.source,
          br.status, br.admin_status, br.payment_status, br.payment_method, br.payment_source,
          br.selected_package_name, br.selected_package_category, br.preferred_date,
          br.preferred_time, br.vehicle_quantity, br.assigned_manager_id, br.assigned_manager_name,
          br.assigned_vehicle_id, br.assigned_vehicle_name, br.b2b_agent_id,
          br.base_amount_aed, br.subtotal, br.vat_amount, br.total_amount,
          br.amount_received_aed, br.amount_pending_aed, br.total_refunded_aed,
          br.created_at
        from public.booking_requests br
        where public.edrive_booking_matches_report_filters(br.id, p_filters)
        limit 5000
      ) x
    ), '[]'::jsonb),
    'wallet_credits_aed', coalesce((
      select sum(l.amount_aed) from public.b2b_wallet_ledger l
      where l.direction = 'credit'
        and (v_from is null or l.created_at >= v_from::timestamp)
        and (v_to is null or l.created_at < (v_to + 1)::timestamp)
        and (nullif(p_filters->>'agent_id', '') is null or l.b2b_agent_id::text = p_filters->>'agent_id')
        and (
          not v_has_booking_scope
          or (l.booking_request_id is not null and public.edrive_booking_matches_report_filters(l.booking_request_id, p_filters))
        )
    ), 0),
    'wallet_debits_aed', coalesce((
      select sum(l.amount_aed) from public.b2b_wallet_ledger l
      where l.direction = 'debit'
        and (v_from is null or l.created_at >= v_from::timestamp)
        and (v_to is null or l.created_at < (v_to + 1)::timestamp)
        and (nullif(p_filters->>'agent_id', '') is null or l.b2b_agent_id::text = p_filters->>'agent_id')
        and (
          not v_has_booking_scope
          or (l.booking_request_id is not null and public.edrive_booking_matches_report_filters(l.booking_request_id, p_filters))
        )
    ), 0),
    'approved_refunds_aed', coalesce((
      select sum(r.approved_amount_aed) from public.b2b_refund_requests r
      where r.status = 'Approved'
        and (v_from is null or r.requested_at >= v_from::timestamp)
        and (v_to is null or r.requested_at < (v_to + 1)::timestamp)
        and public.edrive_booking_matches_report_filters(r.booking_request_id, p_filters)
    ), 0),
    'rejected_refunds', (
      select count(*) from public.b2b_refund_requests r
      where r.status = 'Rejected'
        and (v_from is null or r.requested_at >= v_from::timestamp)
        and (v_to is null or r.requested_at < (v_to + 1)::timestamp)
        and public.edrive_booking_matches_report_filters(r.booking_request_id, p_filters)
    ),
    'filter_options', jsonb_build_object(
      'booking_statuses', coalesce((
        select jsonb_agg(s.status order by s.status)
        from (
          select distinct br.status::text AS status
          from public.booking_requests br
          where nullif(btrim(br.status::text), '') is not null
        ) s
      ), '[]'::jsonb),
      'payment_statuses', coalesce((
        select jsonb_agg(s.status order by s.status)
        from (
          select distinct br.payment_status::text AS status
          from public.booking_requests br
          where nullif(btrim(br.payment_status::text), '') is not null
        ) s
      ), '[]'::jsonb),
      'agents', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', ba.id, 'label', coalesce(nullif(btrim(ba.company_name), ''), nullif(btrim(ba.agent_code), ''), ba.id::text)
        ) order by coalesce(ba.company_name, ba.agent_code, ba.id::text))
        from public.b2b_agents ba
      ), '[]'::jsonb),
      'managers', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', au.id, 'label', coalesce(nullif(btrim(au.full_name), ''), nullif(btrim(au.email), ''), au.id::text)
        ) order by coalesce(au.full_name, au.email, au.id::text))
        from public.admin_users au
        where lower(coalesce(au.status::text, '')) = 'active'
          and lower(coalesce(au.role::text, '')) = 'manager'
      ), '[]'::jsonb),
      'vehicles', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', v.id,
          'label', coalesce(nullif(btrim(v.registration_number), ''), nullif(btrim(v.vehicle_code), ''), v.id::text)
        ) order by coalesce(v.registration_number, v.vehicle_code, v.id::text))
        from public.vehicles v
        where nullif(btrim(v.registration_number), '') is not null
      ), '[]'::jsonb),
      'packages', coalesce((
        select jsonb_agg(p.name order by p.name)
        from (
          select distinct br.selected_package_name::text AS name
          from public.booking_requests br
          where nullif(btrim(br.selected_package_name::text), '') is not null
        ) p
      ), '[]'::jsonb)
    ),
    'ledger', coalesce((
      select jsonb_agg(to_jsonb(lr) order by lr.created_at desc)
      from (
        select l.id, l.receipt_id, l.booking_code, l.account_type, l.account_name,
          l.entry_type, l.amount, l.narration, l.created_at
        from public.payment_ledger_entries l
        where l.account_type = 'company' and l.entry_type = 'company_in'
          and (v_from is null or l.created_at >= v_from::timestamp)
          and (v_to is null or l.created_at < (v_to + 1)::timestamp)
          and (
            not v_has_booking_scope
            and nullif(p_filters->>'agent_id', '') is null
            or exists (
              select 1
              from public.booking_requests br
              where (br.booking_code = l.booking_code or br.booking_number = l.booking_code)
                and public.edrive_booking_matches_report_filters(br.id, p_filters)
            )
          )
        limit 10000
      ) lr
    ), '[]'::jsonb),
    'receipts', coalesce((
      select jsonb_agg(to_jsonb(pr) order by pr.received_at desc)
      from (
        select r.id, r.received_amount, r.received_at
        from public.payment_receipts r
        where (v_from is null or r.received_at >= v_from::timestamp)
          and (v_to is null or r.received_at < (v_to + 1)::timestamp)
          and (
            not v_has_booking_scope
            and nullif(p_filters->>'agent_id', '') is null
            or exists (
              select 1
              from public.payment_receipt_allocations pra
              join public.booking_requests br
                on br.booking_code = pra.booking_code or br.booking_number = pra.booking_code
              where pra.receipt_id = r.id
                and public.edrive_booking_matches_report_filters(br.id, p_filters)
            )
          )
        limit 10000
      ) pr
    ), '[]'::jsonb),
    'vehicles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'vehicle_code', v.vehicle_code, 'vehicle_name', v.vehicle_name,
        'registration_number', v.registration_number, 'status', v.status
      ) order by v.vehicle_code)
      from public.vehicles v
    ), '[]'::jsonb),
    'vehicle_usage', coalesce((
      select jsonb_agg(to_jsonb(u) order by u.rides desc, u.registration_number)
      from (
        select v.id, v.registration_number, count(*) AS rides
        from public.booking_request_vehicle_assignments a
        join public.vehicles v on v.id = a.vehicle_id
        join public.booking_requests br on br.id = a.booking_request_id
        where (v_from is null or br.preferred_date >= v_from)
          and (v_to is null or br.preferred_date <= v_to)
          and public.edrive_booking_matches_report_filters(br.id, p_filters)
        group by v.id, v.registration_number
      ) u
    ), '[]'::jsonb)
  );
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal user must match the current authentication identity.';
end;
$$;

create or replace function public.create_b2b_booking(p_booking jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agent public.b2b_agents%rowtype;
  v_package public.packages%rowtype;
  v_booking public.booking_requests%rowtype;
  v_quantity integer;
  v_guest_count integer;
  v_preferred_date date;
  v_preferred_time_label text;
  v_preferred_time time;
  v_today date := (now() at time zone 'Asia/Dubai')::date;
  v_now_time time := (now() at time zone 'Asia/Dubai')::time;
  v_vehicle_type text;
  v_booking_code text;
  v_base numeric(12,2);
  v_vat numeric(12,2);
  v_total numeric(12,2);
begin
  select ba.* into strict v_agent
  from public.b2b_agents ba
  where ba.auth_user_id = auth.uid()
    and lower(coalesce(ba.status::text, '')) = 'active';
  begin
    select p.* into v_package
  from public.packages p
    where p.id = (p_booking->>'package_id')::uuid
    and lower(coalesce(p.status::text, '')) = 'active';
  exception when invalid_text_representation then
    raise exception 'Please select a valid B2B package.';
  end;
  if not found then raise exception 'Active B2B package was not found.'; end if;
  if coalesce(v_package.b2b_price, 0) <= 0 then raise exception 'B2B price is not configured for this package.'; end if;
  v_vehicle_type := public.normalize_edrive_vehicle_type(v_package.category::text);
  if v_vehicle_type not in ('jet_ski', 'jet_car') then
    raise exception 'The selected package category is not supported for B2B bookings.';
  end if;
  begin
    v_quantity := coalesce(nullif(p_booking->>'vehicle_quantity', '')::integer, 1);
    v_guest_count := coalesce(nullif(p_booking->>'guest_count', '')::integer, 1);
    v_preferred_date := (p_booking->>'preferred_date')::date;
  exception when others then
    raise exception 'Quantity, guest count, or preferred date is invalid.';
  end;
  if v_quantity < 1 or v_quantity > 6 then raise exception 'Vehicle quantity is invalid.'; end if;
  if v_guest_count < 1 or v_guest_count > 12 then raise exception 'Guest count is invalid.'; end if;
  if v_guest_count > v_quantity * coalesce(v_package.capacity, 2) then
    raise exception 'Guest count exceeds the selected vehicle capacity.';
  end if;
  if v_preferred_date < v_today or v_preferred_date > v_today + 365 then
    raise exception 'Preferred date is outside the allowed booking period.';
  end if;
  v_preferred_time_label := left(btrim(coalesce(p_booking->>'preferred_time', '')), 20);
  if v_preferred_time_label !~* '^\d{1,2}:\d{2}\s*(AM|PM)$' then
    raise exception 'Please select a valid booking time.';
  end if;
  begin
    v_preferred_time := to_timestamp(upper(v_preferred_time_label), 'HH12:MI AM')::time;
  exception when others then
    raise exception 'Please select a valid booking time.';
  end;
  if v_preferred_time < time '09:00' or v_preferred_time > time '17:00'
    or extract(minute from v_preferred_time)::integer not in (0, 30) then
    raise exception 'Preferred time must use an available half-hour slot from 09:00 AM through 05:00 PM.';
  end if;
  if v_preferred_date = v_today and v_preferred_time <= v_now_time then
    raise exception 'The selected Dubai time has already passed.';
  end if;
  v_base := round(v_package.b2b_price * v_quantity, 2);
  v_vat := round(v_base * 0.05, 2);
  v_total := v_base + v_vat;
  if nullif(btrim(p_booking->>'customer_name'), '') is null then raise exception 'Customer name is required.'; end if;
  if nullif(btrim(p_booking->>'customer_phone'), '') is null then raise exception 'Customer phone is required.'; end if;
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('edrive_b2b_booking_code'));
    v_booking_code := 'ED-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    exit when not exists (
      select 1 from public.booking_requests br
      where br.booking_code = v_booking_code or br.booking_number = v_booking_code
    );
  end loop;

  insert into public.booking_requests (
    booking_code, booking_number, source, booking_source, status, admin_status, manager_status,
    selected_package_name, selected_package_slug, selected_package_category,
    selected_package_price, selected_package_b2b_price, selected_package_capacity,
    experience_type, service_type, duration_minutes, vehicle_quantity, guest_count,
    preferred_date, preferred_time, meeting_point_name, meeting_point_address,
    customer_name, customer_phone, customer_email, customer_hotel_or_area, customer_notes,
    subtotal, base_amount_aed, vat_rate, vat_amount, total_amount,
    payment_status, payment_method, payment_source, payment_workflow_status,
    collection_status, amount_received_aed, amount_pending_aed,
    b2b_agent_id, b2b_agent_code, b2b_agent_name, b2b_agent_email,
    customer_arrived, created_at, updated_at
  ) values (
    v_booking_code,
    v_booking_code,
    'b2b', 'b2b', 'Pending', 'New', 'Pending',
    v_package.title, v_package.slug, v_package.category,
    v_package.base_price, v_package.b2b_price, v_package.capacity,
    case when v_vehicle_type = 'jet_ski' then 'jet-ski-rental' else 'jet-car-rental' end,
    'rental', v_package.duration_minutes, v_quantity,
    v_guest_count,
    v_preferred_date, v_preferred_time_label,
    'Dubai Islands Marina', 'Dubai Islands Marina',
    btrim(p_booking->>'customer_name'), btrim(p_booking->>'customer_phone'),
    nullif(btrim(p_booking->>'customer_email'), ''),
    nullif(btrim(p_booking->>'customer_hotel_or_area'), ''),
    nullif(btrim(p_booking->>'customer_notes'), ''),
    v_base, v_base, 0.05, v_vat, v_total,
    'Not Paid', 'B2B Wallet', 'b2b', 'pending_wallet_debit',
    'with_b2b_agent', 0, v_total,
    v_agent.id, v_agent.agent_code, v_agent.company_name,
    coalesce(v_agent.login_email, v_agent.email),
    false, now(), now()
  ) returning * into v_booking;
  return to_jsonb(v_booking);
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active B2B Agent profile must match the current authentication identity.';
end;
$$;

create or replace function public.confirm_and_assign_booking(
  p_booking_request_id text,
  p_manager_id uuid,
  p_internal_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller public.admin_users%rowtype;
  v_caller_count integer;
  v_manager public.admin_users%rowtype;
  v_booking public.booking_requests%rowtype;
  v_before jsonb;
  v_wallet public.b2b_wallets%rowtype;
  v_existing_debit public.b2b_wallet_ledger%rowtype;
  v_balance numeric(14,2);
  v_wallet_debit boolean := false;
begin
  select count(*) into v_caller_count
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if v_caller_count <> 1 then raise exception 'Exactly one active portal user must match the current authentication identity.'; end if;
  select au.* into v_caller
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) <> 'maintenance_staff';
  if not found then raise exception 'Active portal user was not found.'; end if;
  if lower(coalesce(v_caller.role::text, '')) not in ('super_admin', 'booking_staff', 'booking_manager') then
    raise exception 'Only Booking Staff, Booking Manager, or Super Admin can confirm and assign a booking.';
  end if;
  select br.* into v_booking
  from public.booking_requests br
  where br.id::text = p_booking_request_id
  for update;
  if not found then raise exception 'Booking request was not found.'; end if;
  if lower(coalesce(v_booking.status::text, '')) in ('completed', 'no show', 'no_show', 'cancelled', 'canceled') then
    raise exception 'Completed, No Show, or Cancelled bookings cannot be confirmed and assigned.';
  end if;
  if v_booking.ride_started_at is not null then raise exception 'A ride that has already started cannot be confirmed and assigned.'; end if;
  if exists (
    select 1 from public.b2b_refund_requests rr
    where rr.booking_request_id = v_booking.id
      and rr.status = 'Pending'
  ) then
    raise exception 'A booking with a Pending cancellation or refund request cannot be confirmed.';
  end if;
  select au.* into v_manager
  from public.admin_users au
  where au.id = p_manager_id
    and lower(coalesce(au.status::text, '')) = 'active'
    and lower(coalesce(au.role::text, '')) = 'manager';
  if not found then raise exception 'The selected Ride Manager is not active.'; end if;
  v_before := to_jsonb(v_booking);

  if lower(coalesce(v_booking.payment_source::text, '')) = 'b2b' then
    if v_booking.b2b_agent_id is null then raise exception 'B2B booking is missing its stable Agent ID.'; end if;
    if not exists (
      select 1 from public.b2b_agents ba
      where ba.id = v_booking.b2b_agent_id
        and lower(coalesce(ba.status::text, '')) = 'active'
    ) then raise exception 'The linked B2B Agent is not active.'; end if;
    select w.* into v_wallet
    from public.b2b_wallets w
    where w.b2b_agent_id = v_booking.b2b_agent_id
    for update;
    if not found then raise exception 'The linked B2B Agent wallet was not found.'; end if;
    select l.* into v_existing_debit
    from public.b2b_wallet_ledger l
    where l.idempotency_key = 'booking:' || v_booking.id::text;
    if found then
      if v_existing_debit.booking_request_id is distinct from v_booking.id
        or v_existing_debit.b2b_agent_id is distinct from v_booking.b2b_agent_id
        or v_existing_debit.wallet_id is distinct from v_wallet.id
        or v_existing_debit.direction is distinct from 'debit'
        or v_existing_debit.transaction_type is distinct from 'booking_debit'
        or v_existing_debit.amount_aed is distinct from round(coalesce(v_booking.total_amount, 0)::numeric, 2) then
        raise exception 'Existing booking wallet ledger entry does not match this booking payment.';
      end if;
    else
      if coalesce(v_booking.total_amount, 0) <= 0 then
        raise exception 'B2B booking total must be greater than zero.';
      end if;
      if v_wallet.balance_aed < coalesce(v_booking.total_amount, 0) then
        raise exception 'Insufficient B2B wallet balance.';
      end if;
      v_balance := v_wallet.balance_aed - coalesce(v_booking.total_amount, 0);
      update public.b2b_wallets set balance_aed = v_balance, updated_at = now() where id = v_wallet.id;
      insert into public.b2b_wallet_ledger (
        wallet_id, b2b_agent_id, direction, transaction_type, amount_aed,
        balance_after_aed, booking_request_id, description, idempotency_key,
        actor_auth_user_id, actor_admin_user_id
      ) values (
        v_wallet.id, v_booking.b2b_agent_id, 'debit', 'booking_debit',
        v_booking.total_amount, v_balance, v_booking.id, 'B2B booking payment',
        'booking:' || v_booking.id::text, auth.uid(), v_caller.id
      );
      v_wallet_debit := true;
    end if;
  end if;

  perform set_config('edrive.assignment_rpc', 'on', true);
  update public.booking_requests
  set status = 'Confirmed',
      admin_status = 'Confirmed',
      manager_status = 'Pending',
      assigned_manager_id = v_manager.id,
      assigned_manager_name = coalesce(nullif(btrim(v_manager.full_name), ''), v_manager.email),
      confirmed_at = coalesce(v_booking.confirmed_at, now()),
      internal_note = coalesce(nullif(btrim(p_internal_note), ''), v_booking.internal_note),
      assignment_updated_at = now(),
      assignment_updated_by = v_caller.id,
      payment_status = case when lower(coalesce(v_booking.payment_source::text, '')) = 'b2b' then 'Paid' else v_booking.payment_status end,
      payment_method = case when lower(coalesce(v_booking.payment_source::text, '')) = 'b2b' then 'B2B Wallet' else v_booking.payment_method end,
      payment_workflow_status = case when lower(coalesce(v_booking.payment_source::text, '')) = 'b2b' then 'wallet_paid' else v_booking.payment_workflow_status end,
      wallet_payment_status = case when lower(coalesce(v_booking.payment_source::text, '')) = 'b2b' then 'paid' else v_booking.wallet_payment_status end,
      amount_received_aed = case when lower(coalesce(v_booking.payment_source::text, '')) = 'b2b' then v_booking.total_amount else v_booking.amount_received_aed end,
      amount_pending_aed = case when lower(coalesce(v_booking.payment_source::text, '')) = 'b2b' then 0 else v_booking.amount_pending_aed end,
      updated_at = now()
  where id = v_booking.id
  returning * into v_booking;
  insert into public.booking_action_history (
    booking_request_id, action, actor_auth_user_id, actor_admin_user_id,
    actor_role, assigned_manager_id, before_data, after_data, metadata
  ) values (
    v_booking.id, 'booking_confirmed_and_manager_assigned', auth.uid(), v_caller.id,
    v_caller.role::text, v_manager.id, v_before, to_jsonb(v_booking),
    jsonb_build_object('assigned_manager_id', v_manager.id, 'wallet_debit_created', v_wallet_debit)
  );
  return to_jsonb(v_booking);
end;
$$;

alter table public.b2b_wallets enable row level security;
alter table public.b2b_wallet_ledger enable row level security;
alter table public.b2b_refund_requests enable row level security;
alter table public.b2b_agents enable row level security;

revoke all on public.b2b_wallets, public.b2b_wallet_ledger, public.b2b_refund_requests from anon, authenticated;
grant select on public.b2b_wallets, public.b2b_wallet_ledger, public.b2b_refund_requests to authenticated;
revoke insert, update, delete on public.b2b_agents from public, anon, authenticated;
grant select on public.b2b_agents to authenticated;

do $$
declare
  v_policy record;
begin
  for v_policy in
    select p.policyname
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'b2b_agents'
      and p.cmd in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy if exists %I on public.b2b_agents', v_policy.policyname);
  end loop;
end
$$;

drop policy if exists "b2b_agents_authorized_select" on public.b2b_agents;
create policy "b2b_agents_authorized_select"
on public.b2b_agents
for select to authenticated
using (
  public.has_edrive_role(array['super_admin', 'admin'])
  or (
    auth_user_id = auth.uid()
    and lower(coalesce(status::text, '')) = 'active'
  )
);

drop policy if exists "booking_requests_b2b_own_select" on public.booking_requests;
create policy "booking_requests_b2b_own_select"
on public.booking_requests
for select to authenticated
using (
  exists (
    select 1
    from public.b2b_agents ba
    where ba.id = booking_requests.b2b_agent_id
      and ba.auth_user_id = auth.uid()
      and lower(coalesce(ba.status::text, '')) = 'active'
  )
);

drop policy if exists "booking_requests_b2b_identity_select_guard" on public.booking_requests;
create policy "booking_requests_b2b_identity_select_guard"
on public.booking_requests
as restrictive
for select to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = auth.uid()
      and lower(coalesce(au.status::text, '')) = 'active'
      and lower(coalesce(au.role::text, '')) <> 'maintenance_staff'
  )
  or (
    exists (
      select 1
      from public.b2b_agents linked_agent
      where linked_agent.auth_user_id = auth.uid()
        and lower(coalesce(linked_agent.status::text, '')) = 'active'
        and linked_agent.id = booking_requests.b2b_agent_id
    )
    and not exists (
      select 1
      from public.b2b_agents other_agent
      where other_agent.auth_user_id = auth.uid()
        and other_agent.id <> booking_requests.b2b_agent_id
    )
  )
);

drop policy if exists "booking_requests_b2b_own_insert" on public.booking_requests;
create policy "booking_requests_b2b_own_insert"
on public.booking_requests
for insert to authenticated
with check (false);
drop policy if exists "booking_requests_b2b_rpc_only_guard" on public.booking_requests;
create policy "booking_requests_b2b_rpc_only_guard"
on public.booking_requests
as restrictive
for insert to authenticated
with check (
  not exists (
    select 1 from public.b2b_agents ba
    where ba.auth_user_id = auth.uid()
  )
);

drop policy if exists "b2b_wallets_authorized_select" on public.b2b_wallets;
create policy "b2b_wallets_authorized_select" on public.b2b_wallets
for select to authenticated using (
  public.has_edrive_role(array['super_admin', 'admin', 'finance'])
  or exists (
    select 1 from public.b2b_agents ba
    where ba.id = b2b_wallets.b2b_agent_id
      and ba.auth_user_id = auth.uid()
      and lower(coalesce(ba.status::text, '')) = 'active'
  )
);
drop policy if exists "b2b_wallet_ledger_authorized_select" on public.b2b_wallet_ledger;
create policy "b2b_wallet_ledger_authorized_select" on public.b2b_wallet_ledger
for select to authenticated using (
  public.has_edrive_role(array['super_admin', 'admin', 'finance'])
  or exists (
    select 1 from public.b2b_agents ba
    where ba.id = b2b_wallet_ledger.b2b_agent_id
      and ba.auth_user_id = auth.uid()
      and lower(coalesce(ba.status::text, '')) = 'active'
  )
);
drop policy if exists "b2b_refunds_authorized_select" on public.b2b_refund_requests;
create policy "b2b_refunds_authorized_select" on public.b2b_refund_requests
for select to authenticated using (
  public.has_edrive_role(array['super_admin', 'admin', 'booking_staff', 'booking_manager', 'finance'])
  or exists (
    select 1 from public.b2b_agents ba
    where ba.id = b2b_refund_requests.b2b_agent_id
      and ba.auth_user_id = auth.uid()
      and lower(coalesce(ba.status::text, '')) = 'active'
  )
);

revoke all on function public.manage_b2b_agent_profile(uuid, uuid, jsonb) from public;
revoke all on function public.set_b2b_agent_status(uuid, text) from public;
revoke all on function public.adjust_b2b_wallet(uuid, text, numeric, text, text) from public;
revoke all on function public.reverse_b2b_wallet_entry(uuid, text, text) from public;
revoke all on function public.request_b2b_refund(text, text, text) from public;
revoke all on function public.decide_b2b_refund(uuid, text, text) from public;
revoke all on function public.get_b2b_finance_summary(uuid) from public;
revoke all on function public.get_b2b_agent_directory() from public;
revoke all on function public.get_edrive_report_data(jsonb) from public;
revoke all on function public.create_b2b_booking(jsonb) from public;
revoke all on function public.confirm_and_assign_booking(text, uuid, text) from public;
grant execute on function public.manage_b2b_agent_profile(uuid, uuid, jsonb) to authenticated;
grant execute on function public.set_b2b_agent_status(uuid, text) to authenticated;
grant execute on function public.adjust_b2b_wallet(uuid, text, numeric, text, text) to authenticated;
grant execute on function public.reverse_b2b_wallet_entry(uuid, text, text) to authenticated;
grant execute on function public.request_b2b_refund(text, text, text) to authenticated;
grant execute on function public.decide_b2b_refund(uuid, text, text) to authenticated;
grant execute on function public.get_b2b_finance_summary(uuid) to authenticated;
grant execute on function public.get_b2b_agent_directory() to authenticated;
grant execute on function public.get_edrive_report_data(jsonb) to authenticated;
grant execute on function public.create_b2b_booking(jsonb) to authenticated;
grant execute on function public.confirm_and_assign_booking(text, uuid, text) to authenticated;

commit;
