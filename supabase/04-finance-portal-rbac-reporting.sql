begin;

-- Read-only fail-fast preflight. No schema or data changes occur before this block succeeds.
do $$
declare
  v_missing text[];
  v_missing_columns text[];
begin
  select array_agg(required_name order by required_name)
  into v_missing
  from (
    values
      ('public.admin_users'),
      ('public.audit_logs'),
      ('public.booking_requests'),
      ('public.booking_request_vehicle_assignments'),
      ('public.vehicles'),
      ('public.b2b_agents'),
      ('public.b2b_wallets'),
      ('public.b2b_wallet_ledger'),
      ('public.b2b_refund_requests'),
      ('public.payment_receipts'),
      ('public.payment_receipt_allocations'),
      ('public.payment_ledger_entries')
  ) required(required_name)
  where to_regclass(required_name) is null;

  if coalesce(array_length(v_missing, 1), 0) > 0 then
    raise exception 'Finance Portal migration missing required relations: %', array_to_string(v_missing, ', ');
  end if;

  select array_agg(required_table || '.' || required_column order by required_table, required_column)
  into v_missing_columns
  from (
    values
      ('admin_users', 'id'), ('admin_users', 'auth_user_id'), ('admin_users', 'full_name'),
      ('admin_users', 'email'), ('admin_users', 'role'), ('admin_users', 'status'),
      ('audit_logs', 'module'), ('audit_logs', 'action'), ('audit_logs', 'created_at'),
      ('booking_requests', 'id'), ('booking_requests', 'booking_code'), ('booking_requests', 'booking_number'),
      ('booking_requests', 'preferred_date'), ('booking_requests', 'customer_name'), ('booking_requests', 'customer_email'),
      ('booking_requests', 'customer_phone'), ('booking_requests', 'booking_source'), ('booking_requests', 'source'),
      ('booking_requests', 'status'), ('booking_requests', 'payment_status'), ('booking_requests', 'payment_method'),
      ('booking_requests', 'manager_status'), ('booking_requests', 'payment_workflow_status'), ('booking_requests', 'collection_status'),
      ('booking_requests', 'selected_package_name'), ('booking_requests', 'selected_package_category'),
      ('booking_requests', 'preferred_time'), ('booking_requests', 'vehicle_quantity'),
      ('booking_requests', 'assigned_manager_id'), ('booking_requests', 'assigned_manager_name'),
      ('booking_requests', 'assigned_vehicle_id'), ('booking_requests', 'assigned_vehicle_name'),
      ('booking_requests', 'b2b_agent_id'), ('booking_requests', 'b2b_agent_name'),
      ('booking_requests', 'amount_received_aed'), ('booking_requests', 'amount_pending_aed'),
      ('booking_requests', 'base_amount_aed'),
      ('booking_requests', 'subtotal'), ('booking_requests', 'total_amount'),
      ('booking_requests', 'vat_amount'), ('booking_requests', 'total_refunded_aed'),
      ('booking_requests', 'internal_note'), ('booking_requests', 'created_at'), ('booking_requests', 'updated_at'),
      ('payment_receipts', 'id'), ('payment_receipts', 'received_by'), ('payment_receipts', 'received_at'),
      ('payment_receipts', 'receipt_number'), ('payment_receipts', 'source_type'), ('payment_receipts', 'source_name'),
      ('payment_receipts', 'received_amount'), ('payment_receipts', 'payment_method'), ('payment_receipts', 'reference_no'),
      ('payment_receipts', 'note'),
      ('payment_receipt_allocations', 'receipt_id'), ('payment_receipt_allocations', 'booking_request_id'),
      ('payment_receipt_allocations', 'id'), ('payment_receipt_allocations', 'booking_code'),
      ('payment_receipt_allocations', 'allocated_amount'), ('payment_receipt_allocations', 'balance_before'),
      ('payment_receipt_allocations', 'balance_after'),
      ('payment_ledger_entries', 'id'), ('payment_ledger_entries', 'receipt_id'),
      ('payment_ledger_entries', 'allocation_id'), ('payment_ledger_entries', 'booking_request_id'),
      ('payment_ledger_entries', 'booking_code'), ('payment_ledger_entries', 'account_type'),
      ('payment_ledger_entries', 'account_name'), ('payment_ledger_entries', 'entry_type'),
      ('payment_ledger_entries', 'amount'), ('payment_ledger_entries', 'narration'), ('payment_ledger_entries', 'created_at'),
      ('b2b_agents', 'id'), ('b2b_agents', 'company_name'), ('b2b_agents', 'agent_code'),
      ('b2b_wallet_ledger', 'id'), ('b2b_wallet_ledger', 'b2b_agent_id'), ('b2b_wallet_ledger', 'direction'),
      ('b2b_wallet_ledger', 'transaction_type'), ('b2b_wallet_ledger', 'amount_aed'),
      ('b2b_wallet_ledger', 'balance_after_aed'), ('b2b_wallet_ledger', 'booking_request_id'),
      ('b2b_wallet_ledger', 'refund_request_id'), ('b2b_wallet_ledger', 'description'),
      ('b2b_wallet_ledger', 'created_at'),
      ('b2b_refund_requests', 'id'), ('b2b_refund_requests', 'booking_request_id'),
      ('b2b_refund_requests', 'b2b_agent_id'), ('b2b_refund_requests', 'status'),
      ('b2b_refund_requests', 'request_type'), ('b2b_refund_requests', 'requested_amount_aed'),
      ('b2b_refund_requests', 'approved_amount_aed'), ('b2b_refund_requests', 'decision_note'),
      ('b2b_refund_requests', 'requested_at'), ('b2b_refund_requests', 'decided_at'),
      ('booking_request_vehicle_assignments', 'booking_request_id'), ('booking_request_vehicle_assignments', 'vehicle_id'),
      ('vehicles', 'id')
  ) required(required_table, required_column)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = required.required_table
      and c.column_name = required.required_column
  );
  if coalesce(array_length(v_missing_columns, 1), 0) > 0 then
    raise exception 'Finance Portal migration missing required columns: %', array_to_string(v_missing_columns, ', ');
  end if;

  if to_regprocedure('public.current_edrive_role()') is null
     or to_regprocedure('public.has_edrive_role(text[])') is null
     or to_regprocedure('public.get_edrive_report_data(jsonb)') is null
     or to_regprocedure('public.normalize_edrive_vehicle_type(text)') is null
     or to_regprocedure('public.get_b2b_finance_summary(uuid)') is null
     or to_regprocedure('extensions.digest(text,text)') is null then
    raise exception 'Finance Portal migration requires current role, report, vehicle normalization and B2B finance functions.';
  end if;

  if exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('audit_logs', 'booking_requests', 'payment_receipts', 'payment_receipt_allocations', 'payment_ledger_entries', 'b2b_wallet_ledger', 'b2b_refund_requests')
      and not c.relrowsecurity
  ) then
    raise exception 'Finance Portal migration requires RLS enabled on all protected Finance relations.';
  end if;

  if not pg_catalog.has_function_privilege('authenticated', 'public.get_edrive_report_data(jsonb)', 'EXECUTE')
     or not pg_catalog.has_function_privilege('authenticated', 'public.get_b2b_finance_summary(uuid)', 'EXECUTE') then
    raise exception 'Finance Portal reporting dependencies require authenticated EXECUTE grants.';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint con
    where con.conrelid = 'public.payment_receipts'::regclass and con.contype = 'p'
  ) or not exists (
    select 1 from pg_catalog.pg_constraint con
    where con.conrelid = 'public.payment_receipt_allocations'::regclass and con.contype = 'f'
  ) or not exists (
    select 1 from pg_catalog.pg_constraint con
    where con.conrelid = 'public.payment_ledger_entries'::regclass and con.contype = 'f'
  ) then
    raise exception 'Finance Portal requires receipt primary-key and allocation/ledger foreign-key constraints.';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint con
    where con.conrelid = 'public.payment_receipts'::regclass
      and con.contype = 'u'
      and pg_catalog.pg_get_constraintdef(con.oid) ilike '%receipt_number%'
  ) or not exists (
    select 1 from pg_catalog.pg_constraint con
    where con.conrelid = 'public.payment_receipts'::regclass
      and con.contype = 'c'
      and pg_catalog.pg_get_constraintdef(con.oid) ilike '%received_amount%'
  ) or not exists (
    select 1 from pg_catalog.pg_constraint con
    where con.conrelid = 'public.payment_receipt_allocations'::regclass
      and con.contype = 'c'
      and pg_catalog.pg_get_constraintdef(con.oid) ilike '%allocated_amount%'
  ) or not exists (
    select 1 from pg_catalog.pg_constraint con
    where con.conrelid = 'public.payment_ledger_entries'::regclass
      and con.contype = 'c'
      and pg_catalog.pg_get_constraintdef(con.oid) ilike '%entry_type%'
  ) then
    raise exception 'Finance Portal requires receipt uniqueness and positive amount/ledger direction constraints.';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname = 'public' and p.tablename = 'payment_receipts' and p.cmd = 'SELECT'
  ) or not exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname = 'public' and p.tablename = 'payment_receipt_allocations' and p.cmd = 'SELECT'
  ) or not exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname = 'public' and p.tablename = 'payment_ledger_entries' and p.cmd = 'SELECT'
  ) then
    raise exception 'Finance Portal requires existing protected SELECT policies for receipt, allocation and ledger records.';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'booking_requests'
      and p.cmd = 'UPDATE'
      and p.policyname = 'booking_requests_operations_update'
  ) then
    raise exception 'Finance Portal requires the activated booking operations update policy.';
  end if;

  if exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'booking_requests'
      and p.cmd in ('UPDATE', 'ALL')
      and (coalesce(p.qual, '') ilike '%finance%' or coalesce(p.with_check, '') ilike '%finance%')
      and p.policyname <> 'booking_requests_finance_collection_update'
  ) then
    raise exception 'Finance Portal preflight found an unsafe existing Finance booking update policy.';
  end if;

  if (select c.udt_name from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'booking_requests' and c.column_name = 'id') <> 'uuid'
     or (select c.udt_name from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'booking_requests' and c.column_name = 'assigned_manager_id') <> 'uuid'
     or (select c.udt_name from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'booking_requests' and c.column_name = 'b2b_agent_id') <> 'uuid'
     or (select c.udt_name from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'payment_receipt_allocations' and c.column_name = 'booking_request_id') not in ('text', 'varchar')
     or (select c.udt_name from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'payment_ledger_entries' and c.column_name = 'booking_request_id') not in ('text', 'varchar') then
    raise exception 'Finance Portal payment relationship column types are incompatible with the secured settlement RPC.';
  end if;

  if exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'payment_receipts'
      and c.column_name = 'operation_key' and c.udt_name <> 'uuid'
  ) then
    raise exception 'payment_receipts.operation_key exists with an incompatible type.';
  end if;
end;
$$;

-- The repository defines audit_logs_insert_own (INSERT) and audit_logs_admin_read
-- (SELECT). Replace only the identified SELECT policy; preserve the INSERT policy.
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where (
      au.auth_user_id::text = auth.uid()::text
      or lower(coalesce(au.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
      and lower(coalesce(au.status::text, '')) = 'active'
      and lower(coalesce(au.role::text, '')) in ('super_admin', 'admin', 'booking_staff')
  )
);

create or replace function public.get_finance_audit_logs(p_limit integer default 1000)
returns table (
  id uuid,
  module text,
  action text,
  entity_type text,
  entity_id text,
  entity_label text,
  actor_name text,
  actor_email text,
  actor_role text,
  summary text,
  created_at timestamptz,
  metadata jsonb
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_role text;
begin
  select lower(coalesce(au.role::text, '')) into strict v_role
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active';

  if v_role <> 'finance' then
    raise exception 'Only Finance may use the Finance Activity feed.';
  end if;

  return query
  select al.id, al.module, al.action, al.entity_type, al.entity_id, al.entity_label,
    al.actor_name, al.actor_email, al.actor_role, al.summary, al.created_at,
    jsonb_strip_nulls(jsonb_build_object(
      'receipt_number', al.metadata->'receipt_number',
      'source_type', al.metadata->'source_type',
      'allocation_count', al.metadata->'allocation_count',
      'amount_aed', al.metadata->'amount_aed',
      'format', al.metadata->'format',
      'report_type', al.metadata->'report_type',
      'date_from', al.metadata->'date_from',
      'date_to', al.metadata->'date_to',
      'applied_filter_names', al.metadata->'applied_filter_names',
      'row_count', al.metadata->'row_count'
    )) as metadata
  from public.audit_logs al
  where lower(coalesce(al.module, '')) in ('finance', 'payment', 'payments', 'collection', 'receipt', 'receipts', 'ledger', 'refund', 'refunds', 'b2b_finance', 'wallet')
     or lower(coalesce(al.action, '')) = 'finance_report_exported'
  order by al.created_at desc
  limit greatest(1, least(coalesce(p_limit, 1000), 1000));
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal profile must match the authenticated user.';
end;
$$;

revoke all on function public.get_finance_audit_logs(integer) from public;
grant execute on function public.get_finance_audit_logs(integer) to authenticated;

create or replace function public.edrive_booking_matches_report_filters(
  p_booking_request_id uuid,
  p_filters jsonb
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.booking_requests br
    where br.id = p_booking_request_id
      and (nullif(p_filters->>'date_from', '') is null or br.preferred_date >= (p_filters->>'date_from')::date)
      and (nullif(p_filters->>'date_to', '') is null or br.preferred_date <= (p_filters->>'date_to')::date)
      and (nullif(p_filters->>'booking_status', '') is null or lower(br.status::text) = lower(p_filters->>'booking_status'))
      and (nullif(p_filters->>'payment_status', '') is null or lower(br.payment_status::text) = lower(p_filters->>'payment_status'))
      and (nullif(p_filters->>'payment_method', '') is null or lower(br.payment_method::text) = lower(p_filters->>'payment_method'))
      and (nullif(p_filters->>'collection_status', '') is null or lower(br.collection_status::text) = lower(p_filters->>'collection_status'))
      and (nullif(p_filters->>'booking_reference', '') is null or coalesce(br.booking_code, br.booking_number, br.id::text) ilike concat('%', p_filters->>'booking_reference', '%'))
      and (nullif(p_filters->>'customer', '') is null or concat_ws(' ', br.customer_name, br.customer_email, br.customer_phone) ilike concat('%', p_filters->>'customer', '%'))
      and (nullif(p_filters->>'agent_id', '') is null or br.b2b_agent_id::text = p_filters->>'agent_id')
      and (nullif(p_filters->>'manager_id', '') is null or br.assigned_manager_id::text = p_filters->>'manager_id')
      and (nullif(p_filters->>'package', '') is null or lower(br.selected_package_name::text) = lower(p_filters->>'package'))
      and (nullif(p_filters->>'vehicle_type', '') is null or public.normalize_edrive_vehicle_type(br.selected_package_category::text) = public.normalize_edrive_vehicle_type(p_filters->>'vehicle_type'))
      and (
        nullif(p_filters->>'processed_by', '') is null
        or exists (
          select 1
          from public.payment_receipt_allocations pra
          join public.payment_receipts pr on pr.id = pra.receipt_id
          where pra.booking_request_id = br.id::text
            and pr.received_by ilike concat('%', p_filters->>'processed_by', '%')
        )
      )
      and (
        nullif(p_filters->>'booking_source', '') is null
        or (lower(p_filters->>'booking_source') = 'b2b' and lower(coalesce(br.booking_source::text, br.source::text, '')) = 'b2b')
        or (lower(p_filters->>'booking_source') in ('direct', 'website') and lower(coalesce(br.booking_source::text, br.source::text, '')) <> 'b2b')
        or lower(coalesce(br.booking_source::text, br.source::text, '')) = lower(p_filters->>'booking_source')
      )
      and (coalesce((p_filters->>'outstanding_only')::boolean, false) = false or greatest(coalesce(br.amount_pending_aed, 0), coalesce(br.total_amount, 0) - coalesce(br.amount_received_aed, 0)) > 0)
      and (
        nullif(p_filters->>'refund_status', '') is null
        or exists (select 1 from public.b2b_refund_requests rr where rr.booking_request_id = br.id and lower(rr.status::text) = lower(p_filters->>'refund_status'))
      )
      and (
        nullif(p_filters->>'vehicle_id', '') is null
        or exists (select 1 from public.booking_request_vehicle_assignments bva where bva.booking_request_id = br.id and bva.vehicle_id::text = p_filters->>'vehicle_id')
      )
  );
$$;

revoke all on function public.edrive_booking_matches_report_filters(uuid, jsonb) from public;
revoke all on function public.edrive_booking_matches_report_filters(uuid, jsonb) from authenticated;

create or replace function public.get_finance_portal_data(
  p_filters jsonb default '{}'::jsonb,
  p_page integer default 0,
  p_page_size integer default 500
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_role text;
  v_page integer := greatest(coalesce(p_page, 0), 0);
  v_page_size integer := greatest(1, least(coalesce(p_page_size, 500), 1000));
begin
  select lower(coalesce(au.role::text, '')) into strict v_role
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active';
  if v_role not in ('super_admin', 'admin', 'finance') then
    raise exception 'Current role cannot view Finance Portal reporting.';
  end if;

  v_result := public.get_edrive_report_data(p_filters);
  v_result := jsonb_set(v_result, '{bookings}', coalesce((
    select jsonb_agg(to_jsonb(x) order by x.preferred_date desc nulls last, x.created_at desc, x.id desc)
    from (
      select br.id, br.booking_code, br.booking_number, br.booking_source, br.source,
        br.status, br.admin_status, br.payment_status, br.payment_method, br.payment_source,
        br.payment_workflow_status, br.collection_status, br.customer_name, br.customer_email,
        br.customer_phone, br.selected_package_name, br.selected_package_category,
        br.preferred_date, br.preferred_time, br.vehicle_quantity, br.assigned_manager_id,
        br.assigned_manager_name, br.assigned_vehicle_id, br.assigned_vehicle_name,
        br.b2b_agent_id, ba.company_name as b2b_agent_name, br.base_amount_aed,
        br.subtotal, br.vat_amount, br.total_amount,
        br.amount_received_aed, br.amount_pending_aed, br.total_refunded_aed, br.created_at
      from public.booking_requests br
      left join public.b2b_agents ba on ba.id = br.b2b_agent_id
      where public.edrive_booking_matches_report_filters(br.id, p_filters)
      order by br.preferred_date desc nulls last, br.created_at desc, br.id desc
      limit v_page_size offset (v_page * v_page_size)
    ) x
  ), '[]'::jsonb));
  v_result := jsonb_set(v_result, '{receipts}', coalesce((
    select jsonb_agg(to_jsonb(r) order by r.received_at desc, r.id desc)
    from (
      select pr.id, pr.receipt_number, pr.source_type, pr.source_name,
        pr.received_amount, pr.payment_method, pr.reference_no, pr.received_by, pr.received_at
      from public.payment_receipts pr
      where (nullif(p_filters->>'date_from', '') is null or pr.received_at >= (p_filters->>'date_from')::date)
        and (nullif(p_filters->>'date_to', '') is null or pr.received_at < ((p_filters->>'date_to')::date + 1))
        and (nullif(p_filters->>'payment_method', '') is null or lower(pr.payment_method) = lower(p_filters->>'payment_method'))
        and (nullif(p_filters->>'processed_by', '') is null or pr.received_by ilike concat('%', p_filters->>'processed_by', '%'))
        and (
          not exists (
            select 1 from jsonb_each_text(p_filters) f
            where f.key in ('booking_source', 'booking_status', 'payment_status', 'customer', 'booking_reference', 'agent_id', 'manager_id', 'package', 'vehicle_type', 'refund_status', 'collection_status')
              and nullif(f.value, '') is not null
          )
          or exists (
            select 1
            from public.payment_receipt_allocations pra
            where pra.receipt_id = pr.id
              and exists (
                select 1 from public.booking_requests br
                where br.id::text = pra.booking_request_id
                  and public.edrive_booking_matches_report_filters(br.id, p_filters)
              )
          )
        )
      order by pr.received_at desc, pr.id desc
      limit v_page_size offset (v_page * v_page_size)
    ) r
  ), '[]'::jsonb));
  v_result := jsonb_set(v_result, '{ledger}', coalesce((
    select jsonb_agg(to_jsonb(l) order by l.created_at desc, l.id desc)
    from (
      select ple.id, ple.receipt_id, ple.booking_code, ple.account_type,
        ple.account_name, ple.entry_type, ple.amount, ple.narration, ple.created_at
      from public.payment_ledger_entries ple
      where ple.account_type = 'company'
        and ple.entry_type = 'company_in'
        and (nullif(p_filters->>'date_from', '') is null or ple.created_at >= (p_filters->>'date_from')::date)
        and (nullif(p_filters->>'date_to', '') is null or ple.created_at < ((p_filters->>'date_to')::date + 1))
        and (
          not exists (
            select 1 from jsonb_each_text(p_filters) f
            where f.key in ('booking_source', 'booking_status', 'payment_status', 'customer', 'booking_reference', 'agent_id', 'manager_id', 'package', 'vehicle_type', 'refund_status', 'collection_status')
              and nullif(f.value, '') is not null
          )
          or exists (
            select 1 from public.booking_requests br
            where (br.booking_code = ple.booking_code or br.booking_number = ple.booking_code)
              and public.edrive_booking_matches_report_filters(br.id, p_filters)
          )
        )
      order by ple.created_at desc, ple.id desc
      limit v_page_size offset (v_page * v_page_size)
    ) l
  ), '[]'::jsonb));
  v_result := jsonb_set(v_result, '{wallet_ledger}', coalesce((
    select jsonb_agg(to_jsonb(w) order by w.created_at desc, w.id desc)
    from (
      select bwl.id, bwl.b2b_agent_id, ba.company_name as b2b_agent_name,
        bwl.direction, bwl.transaction_type, bwl.amount_aed, bwl.balance_after_aed,
        bwl.booking_request_id, bwl.refund_request_id, bwl.description, bwl.created_at
      from public.b2b_wallet_ledger bwl
      left join public.b2b_agents ba on ba.id = bwl.b2b_agent_id
      where (nullif(p_filters->>'date_from', '') is null or bwl.created_at >= (p_filters->>'date_from')::date)
        and (nullif(p_filters->>'date_to', '') is null or bwl.created_at < ((p_filters->>'date_to')::date + 1))
        and (nullif(p_filters->>'agent_id', '') is null or bwl.b2b_agent_id::text = p_filters->>'agent_id')
        and (
          not exists (
            select 1 from jsonb_each_text(p_filters) f
            where f.key in ('booking_source', 'booking_status', 'payment_status', 'payment_method', 'customer', 'booking_reference', 'manager_id', 'package', 'vehicle_type', 'collection_status', 'outstanding_only')
              and nullif(f.value, '') is not null
          )
          or (
            bwl.booking_request_id is not null
            and public.edrive_booking_matches_report_filters(bwl.booking_request_id, p_filters)
          )
        )
      order by bwl.created_at desc, bwl.id desc
      limit v_page_size offset (v_page * v_page_size)
    ) w
  ), '[]'::jsonb));
  v_result := jsonb_set(v_result, '{refunds}', coalesce((
    select jsonb_agg(to_jsonb(rf) order by rf.requested_at desc, rf.id desc)
    from (
      select rr.id, rr.booking_request_id, rr.b2b_agent_id,
        ba.company_name as b2b_agent_name, rr.request_type, rr.status,
        rr.requested_amount_aed, rr.approved_amount_aed, rr.decision_note,
        rr.requested_at, rr.decided_at
      from public.b2b_refund_requests rr
      left join public.b2b_agents ba on ba.id = rr.b2b_agent_id
      where (nullif(p_filters->>'date_from', '') is null or rr.requested_at >= (p_filters->>'date_from')::date)
        and (nullif(p_filters->>'date_to', '') is null or rr.requested_at < ((p_filters->>'date_to')::date + 1))
        and (nullif(p_filters->>'agent_id', '') is null or rr.b2b_agent_id::text = p_filters->>'agent_id')
        and (nullif(p_filters->>'refund_status', '') is null or lower(rr.status) = lower(p_filters->>'refund_status'))
        and public.edrive_booking_matches_report_filters(rr.booking_request_id, p_filters)
      order by rr.requested_at desc, rr.id desc
      limit v_page_size offset (v_page * v_page_size)
    ) rf
  ), '[]'::jsonb));
  v_result := v_result || public.get_b2b_finance_summary(null);
  v_result := v_result || jsonb_build_object(
    'page', v_page,
    'page_size', v_page_size,
    'booking_page_count', jsonb_array_length(coalesce(v_result->'bookings', '[]'::jsonb)),
    'receipt_page_count', jsonb_array_length(coalesce(v_result->'receipts', '[]'::jsonb)),
    'ledger_page_count', jsonb_array_length(coalesce(v_result->'ledger', '[]'::jsonb)),
    'wallet_ledger_page_count', jsonb_array_length(coalesce(v_result->'wallet_ledger', '[]'::jsonb)),
    'refund_page_count', jsonb_array_length(coalesce(v_result->'refunds', '[]'::jsonb))
  );
  return v_result;
exception
  when no_data_found or too_many_rows then
    raise exception 'Exactly one active portal profile must match the authenticated user.';
end;
$$;

revoke all on function public.get_finance_portal_data(jsonb, integer, integer) from public;
grant execute on function public.get_finance_portal_data(jsonb, integer, integer) to authenticated;

drop policy if exists "booking_requests_finance_collection_update" on public.booking_requests;
do $$
begin
  if exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'booking_requests'
      and p.cmd in ('UPDATE', 'ALL')
      and (coalesce(p.qual, '') ilike '%finance%' or coalesce(p.with_check, '') ilike '%finance%')
  ) then
    raise exception 'Finance booking UPDATE policy remains after Finance Portal lockdown.';
  end if;
end;
$$;

drop policy if exists "payment_receipts_finance_insert" on public.payment_receipts;
drop policy if exists "payment_receipts_finance_update" on public.payment_receipts;
drop policy if exists "payment_allocations_finance_insert" on public.payment_receipt_allocations;
drop policy if exists "payment_allocations_finance_update" on public.payment_receipt_allocations;
drop policy if exists "payment_ledger_finance_insert" on public.payment_ledger_entries;

-- Remove historical broad browser-write policies if they still exist.
drop policy if exists "payment_receipts_admin_access" on public.payment_receipts;
drop policy if exists "payment_allocations_admin_access" on public.payment_receipt_allocations;
drop policy if exists "payment_ledger_admin_access" on public.payment_ledger_entries;
drop policy if exists "payment_receipts_super_admin_insert_activation" on public.payment_receipts;
drop policy if exists "payment_allocations_super_admin_insert_activation" on public.payment_receipt_allocations;
drop policy if exists "payment_ledger_super_admin_insert_activation" on public.payment_ledger_entries;

alter table public.payment_receipts add column if not exists operation_key uuid;
alter table public.payment_receipts add column if not exists operation_fingerprint text;
do $$
begin
  if (select c.udt_name from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'payment_receipts' and c.column_name = 'operation_key') <> 'uuid' then
    raise exception 'payment_receipts.operation_key must be uuid.';
  end if;
end;
$$;
create unique index if not exists payment_receipts_operation_key_unique
  on public.payment_receipts(operation_key)
  where operation_key is not null;

revoke insert, update, delete, truncate on table public.payment_receipts from anon, authenticated;
revoke insert, update, delete, truncate on table public.payment_receipt_allocations from anon, authenticated;
revoke insert, update, delete, truncate on table public.payment_ledger_entries from anon, authenticated;

create or replace function public.receive_finance_settlement(
  p_operation_key uuid,
  p_source_type text,
  p_source_id uuid,
  p_received_amount numeric,
  p_payment_method text,
  p_reference_no text default null,
  p_note text default null,
  p_allocations jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor public.admin_users%rowtype;
  v_actor_count integer;
  v_source_type text := lower(btrim(coalesce(p_source_type, '')));
  v_source_name text;
  v_method text := btrim(coalesce(p_payment_method, ''));
  v_amount numeric(12,2) := round(coalesce(p_received_amount, 0), 2);
  v_fingerprint text;
  v_canonical_allocations jsonb;
  v_existing public.payment_receipts%rowtype;
  v_receipt public.payment_receipts%rowtype;
  v_allocation jsonb;
  v_booking public.booking_requests%rowtype;
  v_allocation_id uuid;
  v_booking_id uuid;
  v_allocated numeric(12,2);
  v_outstanding numeric(12,2);
  v_sum numeric(12,2) := 0;
  v_receipt_number text;
  v_note_line text;
begin
  select count(*) into v_actor_count
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active';
  if v_actor_count <> 1 then
    raise exception 'Exactly one active portal profile must match the authenticated user.';
  end if;

  select au.* into v_actor
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active';
  if lower(coalesce(v_actor.role::text, '')) not in ('super_admin', 'finance') then
    raise exception 'Only Finance or Super Admin may receive a settlement.';
  end if;

  if p_operation_key is null then raise exception 'An operation key is required.'; end if;
  if v_source_type not in ('manager', 'b2b_agent') then raise exception 'Unsupported payment source.'; end if;
  if p_source_id is null then raise exception 'A stable payment source ID is required.'; end if;
  if v_source_type = 'manager' then
    select coalesce(nullif(btrim(au.full_name), ''), nullif(btrim(au.email), ''), au.id::text)
    into v_source_name
    from public.admin_users au
    where au.id = p_source_id
      and lower(coalesce(au.role::text, '')) = 'manager'
      and lower(coalesce(au.status::text, '')) = 'active';
    if not found then raise exception 'The selected Ride Manager is not an active valid source.'; end if;
    if lower(v_method) not in ('cash handover', 'card settlement', 'mixed handover') then
      raise exception 'Unsupported Manager settlement payment method.';
    end if;
  else
    select coalesce(nullif(btrim(ba.company_name), ''), nullif(btrim(ba.agent_code), ''), ba.id::text)
    into v_source_name
    from public.b2b_agents ba
    where ba.id = p_source_id;
    if not found then raise exception 'The selected B2B Agent is not a valid source.'; end if;
    if lower(v_method) not in ('bank transfer', 'cash', 'card settlement', 'cheque') then
      raise exception 'Unsupported B2B receivable payment method.';
    end if;
  end if;
  if v_amount <= 0 then raise exception 'Received amount must be positive.'; end if;
  if jsonb_typeof(p_allocations) <> 'array' or jsonb_array_length(p_allocations) = 0 then
    raise exception 'At least one booking allocation is required.';
  end if;
  if jsonb_array_length(p_allocations) > 500 then
    raise exception 'A settlement may contain at most 500 booking allocations.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) a
    group by a->>'booking_request_id'
    having count(*) > 1
  ) then
    raise exception 'Duplicate booking allocations are not allowed.';
  end if;

  begin
    select jsonb_agg(
      jsonb_build_object(
        'booking_request_id', ((a->>'booking_request_id')::uuid)::text,
        'allocated_amount', to_char(round((a->>'allocated_amount')::numeric, 2), 'FM999999999990.00')
      )
      order by (a->>'booking_request_id')::uuid
    )
    into v_canonical_allocations
    from jsonb_array_elements(p_allocations) a;
  exception when others then
    raise exception 'Each allocation requires a valid booking ID and amount.';
  end;

  v_fingerprint := encode(extensions.digest(
    concat_ws('|', v_source_type, p_source_id::text, v_amount::text, lower(v_method),
      coalesce(nullif(btrim(p_reference_no), ''), ''), coalesce(nullif(btrim(p_note), ''), ''),
      v_canonical_allocations::text),
    'sha256'
  ), 'hex');

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_key::text, 0));

  select pr.* into v_existing
  from public.payment_receipts pr
  where pr.operation_key = p_operation_key;
  if found then
    if v_existing.operation_fingerprint is distinct from v_fingerprint then
      raise exception 'This operation key was already used for a different settlement.';
    end if;
    return jsonb_build_object(
      'id', v_existing.id, 'receipt_number', v_existing.receipt_number,
      'received_amount', v_existing.received_amount, 'received_at', v_existing.received_at,
      'replayed', true
    );
  end if;

  -- Lock every selected booking in UUID order before validating or writing.
  perform br.id
  from public.booking_requests br
  where br.id in (
    select (a->>'booking_request_id')::uuid from jsonb_array_elements(p_allocations) a
  )
  order by br.id
  for update;

  if (select count(*) from public.booking_requests br where br.id in (
    select (a->>'booking_request_id')::uuid from jsonb_array_elements(p_allocations) a
  )) <> jsonb_array_length(p_allocations) then
    raise exception 'One or more selected bookings do not exist.';
  end if;

  for v_allocation in select value from jsonb_array_elements(p_allocations)
  loop
    begin
      v_booking_id := (v_allocation->>'booking_request_id')::uuid;
      v_allocated := round((v_allocation->>'allocated_amount')::numeric, 2);
    exception when others then
      raise exception 'Each allocation requires a valid booking ID and amount.';
    end;
    if v_allocated <= 0 then raise exception 'Every allocation amount must be positive.'; end if;

    select br.* into strict v_booking from public.booking_requests br where br.id = v_booking_id;
    if lower(coalesce(v_booking.status::text, '')) in ('cancelled', 'no show', 'no_show')
       or (
         lower(coalesce(v_booking.status::text, '')) <> 'completed'
         and lower(coalesce(v_booking.manager_status::text, '')) <> 'completed'
       ) then
      raise exception 'Settlement booking % is not an eligible completed booking.', coalesce(v_booking.booking_code, v_booking.booking_number, v_booking.id::text);
    end if;

    if v_source_type = 'manager' then
      if v_booking.assigned_manager_id is distinct from p_source_id
         or lower(coalesce(v_booking.payment_method::text, '')) not in ('cash', 'card')
         or lower(coalesce(v_booking.collection_status::text, '')) = 'company_received'
         or lower(coalesce(v_booking.payment_workflow_status::text, '')) like '%received by admin%' then
        raise exception 'Selected booking does not belong to the eligible manager settlement.';
      end if;
      v_outstanding := greatest(coalesce(v_booking.amount_received_aed, 0), 0);
    else
      if v_booking.b2b_agent_id is distinct from p_source_id then
        raise exception 'Selected booking does not belong to the eligible B2B receivable.';
      end if;
      v_outstanding := greatest(
        coalesce(v_booking.amount_pending_aed, 0),
        coalesce(v_booking.total_amount, 0) - coalesce(v_booking.amount_received_aed, 0),
        0
      );
    end if;
    if v_outstanding <= 0 or v_allocated > v_outstanding then
      raise exception 'Allocation exceeds the current outstanding balance for booking %.', coalesce(v_booking.booking_code, v_booking.booking_number, v_booking.id::text);
    end if;
    v_sum := v_sum + v_allocated;
  end loop;

  if v_sum <> v_amount then raise exception 'Allocation total must equal the received amount.'; end if;
  if v_source_type = 'manager' and exists (
    select 1 from jsonb_array_elements(p_allocations) a
    join public.booking_requests br on br.id = (a->>'booking_request_id')::uuid
    where round((a->>'allocated_amount')::numeric, 2) <> round(greatest(coalesce(br.amount_received_aed, 0), 0), 2)
  ) then
    raise exception 'Manager settlement bookings must be received in full.';
  end if;

  v_receipt_number := 'RC-' || to_char(now() at time zone 'Asia/Dubai', 'YYYYMMDD') || '-' || upper(substr(replace(p_operation_key::text, '-', ''), 1, 10));
  insert into public.payment_receipts (
    receipt_number, source_type, source_name, received_amount, payment_method,
    reference_no, note, received_by, received_at, operation_key, operation_fingerprint
  ) values (
    v_receipt_number, v_source_type, v_source_name, v_amount, v_method,
    nullif(btrim(p_reference_no), ''), nullif(btrim(p_note), ''),
    coalesce(nullif(btrim(v_actor.full_name), ''), v_actor.email), now(),
    p_operation_key, v_fingerprint
  ) returning * into v_receipt;

  for v_allocation in select value from jsonb_array_elements(p_allocations)
  loop
    v_booking_id := (v_allocation->>'booking_request_id')::uuid;
    v_allocated := round((v_allocation->>'allocated_amount')::numeric, 2);
    select br.* into strict v_booking from public.booking_requests br where br.id = v_booking_id;
    v_outstanding := case when v_source_type = 'manager'
      then greatest(coalesce(v_booking.amount_received_aed, 0), 0)
      else greatest(coalesce(v_booking.amount_pending_aed, 0), coalesce(v_booking.total_amount, 0) - coalesce(v_booking.amount_received_aed, 0), 0)
    end;

    insert into public.payment_receipt_allocations (
      receipt_id, booking_request_id, booking_code, allocated_amount, balance_before, balance_after
    ) values (
      v_receipt.id, v_booking.id::text, coalesce(v_booking.booking_code, v_booking.booking_number, v_booking.id::text),
      v_allocated, v_outstanding, v_outstanding - v_allocated
    ) returning id into v_allocation_id;

    insert into public.payment_ledger_entries (
      receipt_id, allocation_id, booking_request_id, booking_code,
      account_type, account_name, entry_type, amount, narration
    ) values
      (v_receipt.id, v_allocation_id, v_booking.id::text, coalesce(v_booking.booking_code, v_booking.booking_number, v_booking.id::text),
       v_source_type, v_source_name, 'source_out', v_allocated, v_receipt_number || ' | payment received'),
      (v_receipt.id, v_allocation_id, v_booking.id::text, coalesce(v_booking.booking_code, v_booking.booking_number, v_booking.id::text),
       'company', 'Company Account', 'company_in', v_allocated, v_receipt_number || ' | payment received');

    v_note_line := v_receipt_number || ': AED ' || to_char(v_allocated, 'FM999999990.00') || ' received by Finance from ' || v_source_name || '.';
    if v_source_type = 'manager' then
      update public.booking_requests br set
        payment_status = 'Paid',
        collection_status = 'company_received',
        payment_workflow_status = 'Received By Admin',
        internal_note = concat_ws(E'\n', nullif(btrim(br.internal_note), ''), v_note_line),
        updated_at = now()
      where br.id = v_booking.id;
    else
      update public.booking_requests br set
        amount_received_aed = coalesce(br.amount_received_aed, 0) + v_allocated,
        amount_pending_aed = v_outstanding - v_allocated,
        payment_status = case when v_outstanding - v_allocated = 0 then 'Paid' else 'Partial Paid' end,
        collection_status = case when v_outstanding - v_allocated = 0 then 'company_received' else 'partial_collection' end,
        payment_workflow_status = case when v_outstanding - v_allocated = 0 then 'B2B Paid' else 'B2B Payment Received' end,
        internal_note = concat_ws(E'\n', nullif(btrim(br.internal_note), ''), v_note_line),
        updated_at = now()
      where br.id = v_booking.id;
    end if;
  end loop;

  insert into public.audit_logs (
    module, action, entity_type, entity_id, entity_label, actor_user_id,
    actor_name, actor_email, actor_role, summary, metadata
  ) values (
    'finance', 'finance_settlement_received', 'payment_receipt', v_receipt.id::text,
    v_receipt.receipt_number, auth.uid(), v_actor.full_name, v_actor.email, v_actor.role::text,
    'A secured Finance settlement was received.',
    jsonb_build_object('receipt_number', v_receipt.receipt_number, 'source_type', v_source_type, 'allocation_count', jsonb_array_length(p_allocations), 'amount_aed', v_amount)
  );

  return jsonb_build_object(
    'id', v_receipt.id, 'receipt_number', v_receipt.receipt_number,
    'received_amount', v_receipt.received_amount, 'received_at', v_receipt.received_at,
    'replayed', false
  );
end;
$$;

revoke all on function public.receive_finance_settlement(uuid, text, uuid, numeric, text, text, text, jsonb) from public;
grant execute on function public.receive_finance_settlement(uuid, text, uuid, numeric, text, text, text, jsonb) to authenticated;

commit;
