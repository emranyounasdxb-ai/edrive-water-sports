-- eDrive test operational data preview.
-- SAFE: this script does not delete or update permanent data.
-- Run in Supabase SQL Editor before any test-data purge.

begin;

create temp table if not exists _edrive_test_data_preview (
  section text not null,
  object_name text not null,
  detail text,
  row_count bigint
) on commit preserve rows;

truncate table _edrive_test_data_preview;

do $$
declare
  r record;
  v_count bigint;
  v_detail text;
begin
  -- Operational/customer/payment tables discovered by name.
  for r in
    select t.table_name
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and (
        t.table_name ~* '(booking|customer|payment|receipt|ledger|ride|assignment|inquir|contact|refund|transaction)'
        or t.table_name in (
          'booking_requests',
          'payment_receipts',
          'payment_receipt_allocations',
          'payment_ledger_entries'
        )
      )
    order by t.table_name
  loop
    execute format('select count(*) from public.%I', r.table_name) into v_count;
    insert into _edrive_test_data_preview(section, object_name, detail, row_count)
    values ('candidate_table', r.table_name, 'Operational/customer/payment candidate table', v_count)
    on conflict do nothing;
  end loop;

  -- Tables that directly reference booking, payment, customer, or vehicle records.
  for r in
    select distinct
      child.relname as child_table,
      parent.relname as parent_table,
      att.attname as child_column,
      con.conname as constraint_name
    from pg_constraint con
    join pg_class child on child.oid = con.conrelid
    join pg_namespace child_ns on child_ns.oid = child.relnamespace
    join pg_class parent on parent.oid = con.confrelid
    join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
    join unnest(con.conkey) with ordinality as ck(attnum, ord) on true
    join pg_attribute att on att.attrelid = child.oid and att.attnum = ck.attnum
    where con.contype = 'f'
      and child_ns.nspname = 'public'
      and parent_ns.nspname = 'public'
      and parent.relname in (
        'booking_requests',
        'payment_receipts',
        'payment_receipt_allocations',
        'payment_ledger_entries',
        'customers',
        'vehicles'
      )
    order by child.relname, parent.relname, att.attname
  loop
    execute format('select count(*) from public.%I', r.child_table) into v_count;
    insert into _edrive_test_data_preview(section, object_name, detail, row_count)
    values (
      'foreign_key_dependency',
      r.child_table,
      format('%I.%I -> %I (%s)', r.child_table, r.child_column, r.parent_table, r.constraint_name),
      v_count
    );
  end loop;

  -- Columns that can keep a fleet unit operationally linked even without an FK.
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name in (
        'assigned_vehicle_id',
        'assigned_vehicle_name',
        'vehicle_id',
        'fleet_id',
        'vehicle_code',
        'fleet_code',
        'registration_number',
        'reg_no'
      )
      and c.table_name <> 'vehicles'
      and (
        c.table_name ~* '(booking|ride|assignment|maintenance|payment|receipt|ledger|document|expense|tracker)'
        or c.table_name = 'booking_requests'
      )
    order by c.table_name, c.column_name
  loop
    execute format(
      'select count(*) from public.%I where nullif(btrim(coalesce(%I::text, '''')), '''') is not null',
      r.table_name,
      r.column_name
    ) into v_count;

    insert into _edrive_test_data_preview(section, object_name, detail, row_count)
    values (
      'vehicle_link',
      r.table_name,
      format('Non-empty values in %I.%I', r.table_name, r.column_name),
      v_count
    );
  end loop;

  -- Non-PII booking date range for rollout confirmation.
  if to_regclass('public.booking_requests') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'booking_requests' and column_name = 'created_at'
     ) then
    execute 'select concat(coalesce(min(created_at)::text, ''none''), '' to '', coalesce(max(created_at)::text, ''none'')) from public.booking_requests'
      into v_detail;
    insert into _edrive_test_data_preview(section, object_name, detail, row_count)
    values ('booking_window', 'booking_requests', v_detail, null);
  end if;
end
$$;

commit;

select
  section,
  object_name,
  detail,
  row_count
from _edrive_test_data_preview
order by
  case section
    when 'candidate_table' then 1
    when 'foreign_key_dependency' then 2
    when 'vehicle_link' then 3
    when 'booking_window' then 4
    else 9
  end,
  object_name,
  detail;
