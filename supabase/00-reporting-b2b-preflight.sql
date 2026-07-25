-- eDrive reporting and B2B Phase A preflight.
-- Every statement in this file is read-only.

-- Active booking request shape, including defaults and nullability.
SELECT
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_schema,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'booking_requests'
ORDER BY c.ordinal_position;

-- Vehicle registration and lifecycle field definitions.
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('vehicles', 'fleet_vehicles')
  AND (
    c.column_name IN (
      'registration_number',
      'reg_no',
      'status',
      'operations_status',
      'is_available',
      'is_archived',
      'last_maintenance_date',
      'next_maintenance_date'
    )
    OR c.column_name LIKE '%registration%'
  )
ORDER BY c.table_name, c.ordinal_position;

-- Vehicles with neither registration field populated.
SELECT
  v.id,
  v.name,
  v.slug,
  v.type,
  v.registration_number,
  v.reg_no,
  v.status,
  v.operations_status,
  v.is_available,
  v.is_archived
FROM public.vehicles AS v
WHERE NULLIF(BTRIM(COALESCE(v.registration_number, '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(v.reg_no, '')), '') IS NULL
ORDER BY v.name, v.id;

-- Conflicting registration values on the same vehicle.
SELECT
  v.id,
  v.name,
  v.registration_number,
  v.reg_no
FROM public.vehicles AS v
WHERE NULLIF(BTRIM(COALESCE(v.registration_number, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(v.reg_no, '')), '') IS NOT NULL
  AND LOWER(BTRIM(v.registration_number)) <> LOWER(BTRIM(v.reg_no))
ORDER BY v.name, v.id;

-- Duplicate normalized registration values across both supported fields.
WITH registration_values AS (
  SELECT
    v.id AS vehicle_id,
    v.name AS vehicle_name,
    'registration_number'::text AS source_field,
    v.registration_number AS raw_value,
    LOWER(REGEXP_REPLACE(BTRIM(v.registration_number), '[^[:alnum:]]', '', 'g')) AS normalized_value
  FROM public.vehicles AS v
  WHERE NULLIF(BTRIM(COALESCE(v.registration_number, '')), '') IS NOT NULL

  UNION ALL

  SELECT
    v.id AS vehicle_id,
    v.name AS vehicle_name,
    'reg_no'::text AS source_field,
    v.reg_no AS raw_value,
    LOWER(REGEXP_REPLACE(BTRIM(v.reg_no), '[^[:alnum:]]', '', 'g')) AS normalized_value
  FROM public.vehicles AS v
  WHERE NULLIF(BTRIM(COALESCE(v.reg_no, '')), '') IS NOT NULL
),
duplicate_values AS (
  SELECT normalized_value
  FROM registration_values
  GROUP BY normalized_value
  HAVING COUNT(DISTINCT vehicle_id) > 1
)
SELECT
  rv.normalized_value,
  rv.vehicle_id,
  rv.vehicle_name,
  rv.source_field,
  rv.raw_value
FROM registration_values AS rv
JOIN duplicate_values AS dv USING (normalized_value)
ORDER BY rv.normalized_value, rv.vehicle_name, rv.source_field;

-- Vehicle status distribution and potentially inconsistent lifecycle flags.
SELECT
  COALESCE(NULLIF(BTRIM(v.status::text), ''), '<empty>') AS status,
  COALESCE(NULLIF(BTRIM(v.operations_status::text), ''), '<empty>') AS operations_status,
  v.is_available,
  v.is_archived,
  COUNT(*) AS vehicle_count
FROM public.vehicles AS v
GROUP BY
  COALESCE(NULLIF(BTRIM(v.status::text), ''), '<empty>'),
  COALESCE(NULLIF(BTRIM(v.operations_status::text), ''), '<empty>'),
  v.is_available,
  v.is_archived
ORDER BY status, operations_status, v.is_available, v.is_archived;

-- Active portal roles and account status distribution.
SELECT
  COALESCE(NULLIF(LOWER(BTRIM(au.role::text)), ''), '<empty>') AS role,
  COALESCE(NULLIF(LOWER(BTRIM(au.status::text)), ''), '<empty>') AS account_status,
  COUNT(*) AS user_count,
  COUNT(*) FILTER (WHERE au.auth_user_id IS NULL) AS users_without_auth_link
FROM public.admin_users AS au
GROUP BY
  COALESCE(NULLIF(LOWER(BTRIM(au.role::text)), ''), '<empty>'),
  COALESCE(NULLIF(LOWER(BTRIM(au.status::text)), ''), '<empty>')
ORDER BY role, account_status;

-- Maintenance staff accounts.
SELECT
  au.id,
  au.auth_user_id,
  au.full_name,
  au.email,
  au.role,
  au.status,
  au.created_at,
  au.updated_at
FROM public.admin_users AS au
WHERE LOWER(BTRIM(COALESCE(au.role::text, ''))) = 'maintenance_staff'
ORDER BY au.email, au.id;

-- Catalog fields and constraints that reference maintenance staff.
SELECT
  'column'::text AS object_kind,
  c.table_name AS object_name,
  c.column_name AS detail
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND (
    c.table_name ILIKE '%maintenance%'
    OR c.column_name ILIKE '%maintenance%'
    OR c.column_name ILIKE '%maintained_by%'
  )

UNION ALL

SELECT
  'policy'::text AS object_kind,
  p.tablename AS object_name,
  p.policyname AS detail
FROM pg_catalog.pg_policies AS p
WHERE p.schemaname = 'public'
  AND (
    p.policyname ILIKE '%maintenance%'
    OR COALESCE(p.qual, '') ILIKE '%maintenance_staff%'
    OR COALESCE(p.with_check, '') ILIKE '%maintenance_staff%'
  )

UNION ALL

SELECT
  'routine'::text AS object_kind,
  n.nspname || '.' || pr.proname AS object_name,
  pg_catalog.pg_get_function_identity_arguments(pr.oid) AS detail
FROM pg_catalog.pg_proc AS pr
JOIN pg_catalog.pg_namespace AS n ON n.oid = pr.pronamespace
WHERE n.nspname = 'public'
  AND (
    pr.proname ILIKE '%maintenance%'
    OR CASE
         WHEN pr.prokind IN ('f', 'p')
           THEN pg_catalog.pg_get_functiondef(pr.oid) ILIKE '%maintenance_staff%'
         ELSE false
       END
  )
ORDER BY object_kind, object_name, detail;

-- Current row security settings.
SELECT
  n.nspname AS table_schema,
  c.relname AS table_name,
  c.relrowsecurity AS row_security_enabled,
  c.relforcerowsecurity AS row_security_forced
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

-- Current row security policy definitions.
SELECT
  p.schemaname,
  p.tablename,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual,
  p.with_check
FROM pg_catalog.pg_policies AS p
WHERE p.schemaname = 'public'
ORDER BY p.tablename, p.policyname;

-- Public RPC and trigger-function inventory.
SELECT
  n.nspname AS routine_schema,
  pr.proname AS routine_name,
  pg_catalog.pg_get_function_identity_arguments(pr.oid) AS identity_arguments,
  pg_catalog.pg_get_function_result(pr.oid) AS result_type,
  l.lanname AS language_name,
  pr.prokind,
  pr.provolatile,
  pr.prosecdef AS security_definer,
  pr.proconfig,
  pg_catalog.pg_get_userbyid(pr.proowner) AS owner_name
FROM pg_catalog.pg_proc AS pr
JOIN pg_catalog.pg_namespace AS n ON n.oid = pr.pronamespace
JOIN pg_catalog.pg_language AS l ON l.oid = pr.prolang
WHERE n.nspname = 'public'
ORDER BY pr.proname, identity_arguments;

-- B2B, wallet, invoice, ledger, receipt, allocation and payment relation inventory.
SELECT
  t.table_schema,
  t.table_name,
  t.table_type
FROM information_schema.tables AS t
WHERE t.table_schema = 'public'
  AND t.table_name ~* '(b2b|agent|wallet|invoice|ledger|payment|receipt|allocation)'
ORDER BY t.table_name;

-- Columns for financial and B2B relations.
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name ~* '(b2b|agent|wallet|invoice|ledger|payment|receipt|allocation)'
ORDER BY c.table_name, c.ordinal_position;

-- Package B2B pricing values and anomalies.
SELECT
  p.id,
  p.slug,
  p.title,
  p.category,
  p.status,
  p.base_price,
  p.b2b_price,
  p.vat_percent,
  CASE
    WHEN p.b2b_price IS NULL THEN 'missing'
    WHEN p.b2b_price < 0 THEN 'negative'
    WHEN p.b2b_price > p.base_price THEN 'above_b2c'
    WHEN p.b2b_price = 0 THEN 'zero'
    ELSE 'ok'
  END AS b2b_price_check
FROM public.packages AS p
ORDER BY p.status, p.category, p.display_order, p.title;

-- Assignment, workflow, audit and history fields across public relations.
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND (
    c.table_name ~* '(booking|ride|assignment|audit|history|vehicle)'
    OR c.column_name ~* '(assign|manager|vehicle|ride|audit|history|created_by|updated_by|changed_by|created_at|updated_at|confirmed_at|completed_at)'
  )
ORDER BY c.table_name, c.ordinal_position;

-- Relevant indexes and their definitions.
SELECT
  i.schemaname,
  i.tablename,
  i.indexname,
  i.indexdef
FROM pg_catalog.pg_indexes AS i
WHERE i.schemaname = 'public'
  AND (
    i.tablename ~* '(booking|vehicle|b2b|agent|wallet|invoice|ledger|payment|receipt|allocation|audit|history)'
    OR i.indexdef ~* '(registration_number|reg_no|assigned_vehicle|assigned_manager|b2b_price)'
  )
ORDER BY i.tablename, i.indexname;

-- Relevant foreign keys with ordered source and target columns.
WITH foreign_key_columns AS (
  SELECT
    con.oid AS constraint_oid,
    con.conname AS constraint_name,
    source_ns.nspname AS source_schema,
    source_table.relname AS source_table,
    target_ns.nspname AS target_schema,
    target_table.relname AS target_table,
    source_key.ordinality,
    source_column.attname AS source_column,
    target_column.attname AS target_column,
    con.confupdtype,
    con.confdeltype,
    con.condeferrable,
    con.condeferred
  FROM pg_catalog.pg_constraint AS con
  JOIN pg_catalog.pg_class AS source_table ON source_table.oid = con.conrelid
  JOIN pg_catalog.pg_namespace AS source_ns ON source_ns.oid = source_table.relnamespace
  JOIN pg_catalog.pg_class AS target_table ON target_table.oid = con.confrelid
  JOIN pg_catalog.pg_namespace AS target_ns ON target_ns.oid = target_table.relnamespace
  JOIN LATERAL UNNEST(con.conkey) WITH ORDINALITY AS source_key(attnum, ordinality) ON true
  JOIN LATERAL UNNEST(con.confkey) WITH ORDINALITY AS target_key(attnum, ordinality)
    ON target_key.ordinality = source_key.ordinality
  JOIN pg_catalog.pg_attribute AS source_column
    ON source_column.attrelid = source_table.oid
   AND source_column.attnum = source_key.attnum
  JOIN pg_catalog.pg_attribute AS target_column
    ON target_column.attrelid = target_table.oid
   AND target_column.attnum = target_key.attnum
  WHERE con.contype = 'f'
    AND source_ns.nspname = 'public'
    AND target_ns.nspname = 'public'
)
SELECT
  fkc.constraint_name,
  fkc.source_schema,
  fkc.source_table,
  STRING_AGG(fkc.source_column, ', ' ORDER BY fkc.ordinality) AS source_columns,
  fkc.target_schema,
  fkc.target_table,
  STRING_AGG(fkc.target_column, ', ' ORDER BY fkc.ordinality) AS target_columns,
  fkc.confupdtype AS on_change_code,
  fkc.confdeltype AS on_remove_code,
  fkc.condeferrable,
  fkc.condeferred
FROM foreign_key_columns AS fkc
WHERE
  fkc.source_table ~* '(booking|vehicle|b2b|agent|wallet|invoice|ledger|payment|receipt|allocation|audit|history)'
  OR fkc.target_table ~* '(booking|vehicle|b2b|agent|wallet|invoice|ledger|payment|receipt|allocation|audit|history)'
GROUP BY
  fkc.constraint_oid,
  fkc.constraint_name,
  fkc.source_schema,
  fkc.source_table,
  fkc.target_schema,
  fkc.target_table,
  fkc.confupdtype,
  fkc.confdeltype,
  fkc.condeferrable,
  fkc.condeferred
ORDER BY fkc.source_table, fkc.constraint_name;

-- Wallet, refund, VAT and cancellation relation inventory.
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND (
    c.table_name ~* '(wallet|refund|cancel|b2b)'
    OR c.column_name ~* '(wallet|refund|vat|base_amount|paid_amount|pending_amount|source|channel|agent_id)'
  )
ORDER BY c.table_name, c.ordinal_position;

-- Booking financial snapshot coverage.
SELECT
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'booking_requests'
  AND c.column_name ~* '(subtotal|base|vat|total|paid|received|pending|refund|payment|source|channel|b2b)'
ORDER BY c.ordinal_position;

-- B2B identity links and uniqueness constraints.
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_catalog.pg_get_constraintdef(con.oid) AS definition
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid = to_regclass('public.b2b_agents')
ORDER BY con.conname;

-- Potential duplicate B2B authentication links.
SELECT
  ba.auth_user_id,
  COUNT(*) AS linked_profile_count
FROM public.b2b_agents AS ba
WHERE ba.auth_user_id IS NOT NULL
GROUP BY ba.auth_user_id
HAVING COUNT(*) > 1
ORDER BY linked_profile_count DESC, ba.auth_user_id;

-- Existing action-history coverage for financial and partner actions.
SELECT
  bah.action,
  COUNT(*) AS action_count,
  MIN(bah.occurred_at) AS first_action_at,
  MAX(bah.occurred_at) AS latest_action_at
FROM public.booking_action_history AS bah
WHERE bah.action ~* '(b2b|agent|wallet|refund|cancel|payment|invoice|ledger|no_show|no show)'
GROUP BY bah.action
ORDER BY bah.action;

-- Potential duplicate active refund structures and records.
SELECT
  t.table_name,
  COUNT(*) OVER () AS matching_relation_count
FROM information_schema.tables AS t
WHERE t.table_schema = 'public'
  AND t.table_name ~* '(refund|cancel)'
ORDER BY t.table_name;

-- Phase C safety review: status constraints and live allowed-value definitions.
SELECT c.conrelid::regclass::text AS table_name, c.conname AS constraint_name,
       pg_catalog.pg_get_constraintdef(c.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint c
WHERE c.contype = 'c'
  AND c.conrelid IN ('public.booking_requests'::regclass, 'public.b2b_agents'::regclass, 'public.packages'::regclass)
ORDER BY table_name, constraint_name;

SELECT cols.table_name, cols.column_name, cols.data_type, cols.udt_name,
       cols.is_nullable, cols.column_default
FROM information_schema.columns cols
WHERE cols.table_schema = 'public'
  AND (
    (cols.table_name = 'booking_requests' AND cols.column_name IN (
      'status', 'admin_status', 'manager_status', 'payment_status',
      'payment_workflow_status', 'payment_method', 'payment_source', 'collection_status'
    ))
    OR (cols.table_name = 'b2b_agents' AND cols.column_name IN ('status', 'is_active'))
    OR (cols.table_name = 'packages' AND cols.column_name IN ('status', 'category'))
  )
ORDER BY cols.table_name, cols.ordinal_position;

-- Existing B2B status/is_active inconsistencies.
SELECT ba.id, ba.status, to_jsonb(ba)->>'is_active' AS is_active,
  CASE
    WHEN LOWER(BTRIM(COALESCE(ba.status::text, ''))) = 'active'
      THEN COALESCE(to_jsonb(ba)->>'is_active', 'missing') <> 'true'
    WHEN LOWER(BTRIM(COALESCE(ba.status::text, ''))) IN ('suspended', 'inactive')
      THEN COALESCE(to_jsonb(ba)->>'is_active', 'missing') <> 'false'
    ELSE true
  END AS inconsistent
FROM public.b2b_agents ba
WHERE to_jsonb(ba) ? 'is_active'
ORDER BY ba.id;

-- Cross-linked and duplicate Auth identities across portal profile types.
WITH identity_links AS (
  SELECT 'admin_users'::text AS source_table, au.id::text AS profile_id, au.auth_user_id
  FROM public.admin_users au WHERE au.auth_user_id IS NOT NULL
  UNION ALL
  SELECT 'b2b_agents', ba.id::text, ba.auth_user_id
  FROM public.b2b_agents ba WHERE ba.auth_user_id IS NOT NULL
)
SELECT il.auth_user_id, COUNT(*) AS link_count,
       STRING_AGG(il.source_table || ':' || il.profile_id, ', ' ORDER BY il.source_table, il.profile_id) AS linked_profiles
FROM identity_links il
GROUP BY il.auth_user_id
HAVING COUNT(*) > 1
ORDER BY il.auth_user_id;

-- Live foreign-key targets for legacy creator/updater columns.
SELECT tc.table_name, kcu.column_name, tc.constraint_name,
       ccu.table_schema AS referenced_schema, ccu.table_name AS referenced_table,
       ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_schema = tc.constraint_schema AND kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_schema = tc.constraint_schema AND ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'b2b_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('created_by', 'updated_by')
ORDER BY kcu.column_name, tc.constraint_name;

-- Every INSERT policy on the live booking source, including additional permissive policies.
SELECT p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check,
       (p.policyname = 'booking_requests_b2b_own_insert') AS is_expected_b2b_policy
FROM pg_catalog.pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'booking_requests'
  AND p.cmd IN ('INSERT', 'ALL')
ORDER BY p.permissive DESC, p.policyname;

-- Existing B2B bookings missing their stable Agent UUID.
SELECT br.id,
       COALESCE(NULLIF(to_jsonb(br)->>'booking_code', ''), NULLIF(to_jsonb(br)->>'booking_number', ''), br.id::text) AS booking_reference,
       to_jsonb(br)->>'b2b_agent_name' AS legacy_agent_name,
       to_jsonb(br)->>'b2b_agent_email' AS legacy_agent_email
FROM public.booking_requests br
WHERE LOWER(COALESCE(to_jsonb(br)->>'payment_source', to_jsonb(br)->>'booking_source', to_jsonb(br)->>'source', '')) = 'b2b'
  AND NULLIF(to_jsonb(br)->>'b2b_agent_id', '') IS NULL
ORDER BY br.id;

-- Active package categories unsupported by the Phase B vehicle-type normalizer.
SELECT p.id, p.title, p.category,
       public.normalize_edrive_vehicle_type(p.category::text) AS normalized_vehicle_type
FROM public.packages p
WHERE LOWER(COALESCE(p.status::text, '')) = 'active'
  AND public.normalize_edrive_vehicle_type(p.category::text) IS NULL
ORDER BY p.category, p.title;
