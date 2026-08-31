begin;

do $$
declare
  v_invalid_columns text;
begin
  if to_regprocedure('public.manage_b2b_agent_profile(uuid,uuid,jsonb)') is null then
    raise exception 'Required function public.manage_b2b_agent_profile(uuid, uuid, jsonb) is missing.';
  end if;

  select string_agg(c.column_name, ', ' order by c.column_name)
  into v_invalid_columns
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'b2b_agents'
    and c.column_name in ('created_by', 'updated_by')
    and (c.data_type <> 'uuid' or c.is_nullable <> 'YES');

  if v_invalid_columns is not null then
    raise exception 'B2B Agent audit foreign-key columns must remain nullable UUIDs: %', v_invalid_columns;
  end if;

  if exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_schema = tc.constraint_schema
     and kcu.constraint_name = tc.constraint_name
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_schema = tc.constraint_schema
     and ccu.constraint_name = tc.constraint_name
    where tc.table_schema = 'public'
      and tc.table_name = 'b2b_agents'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name in ('created_by', 'updated_by')
      and ccu.table_name not in ('admin_users', 'users')
  ) then
    raise exception 'Unsupported b2b_agents created_by or updated_by foreign-key target.';
  end if;
end;
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
  v_created_by := case
    when v_creator_target = 'admin_users' then v_caller.id
    when v_creator_target = 'users'
      and exists (select 1 from public.users u where u.id = auth.uid()) then auth.uid()
    else null
  end;
  v_updated_by := case
    when v_updater_target = 'admin_users' then v_caller.id
    when v_updater_target = 'users'
      and exists (select 1 from public.users u where u.id = auth.uid()) then auth.uid()
    else null
  end;
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

revoke all on function public.manage_b2b_agent_profile(uuid, uuid, jsonb) from public;
revoke all on function public.manage_b2b_agent_profile(uuid, uuid, jsonb) from anon;
grant execute on function public.manage_b2b_agent_profile(uuid, uuid, jsonb) to authenticated;

commit;
