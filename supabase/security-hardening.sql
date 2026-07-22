-- eDrive production RLS hardening.
-- Non-destructive: this migration changes policies and helper functions only.
-- Existing users, bookings, receipts, allocations and ledger entries are not modified.

begin;

-- Resolve the current active portal role from the live admin_users table.
create or replace function public.current_edrive_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(au.role::text, ''))
  from public.admin_users au
  where au.auth_user_id = auth.uid()
    and lower(coalesce(au.status::text, '')) = 'active'
  limit 1;
$$;

create or replace function public.has_edrive_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_edrive_role() = any(allowed_roles), false);
$$;

-- Match a Ride Manager only to bookings assigned to their own profile name or email.
create or replace function public.is_current_ride_manager_assignment(p_assigned_manager_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = auth.uid()
      and lower(coalesce(au.status::text, '')) = 'active'
      and lower(coalesce(au.role::text, '')) = 'manager'
      and lower(btrim(coalesce(p_assigned_manager_name, ''))) <> ''
      and lower(btrim(coalesce(p_assigned_manager_name, ''))) in (
        lower(btrim(coalesce(au.full_name, ''))),
        lower(btrim(coalesce(au.email, '')))
      )
  );
$$;

-- Match a B2B user to their own active agent profile and booking identity.
create or replace function public.is_current_b2b_agent_booking(
  p_agent_id uuid,
  p_agent_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.b2b_agents b
    where b.auth_user_id = auth.uid()
      and lower(coalesce(b.status::text, '')) = 'active'
      and (
        b.id = p_agent_id
        or (
          lower(btrim(coalesce(p_agent_email, ''))) <> ''
          and lower(btrim(coalesce(p_agent_email, ''))) in (
            lower(btrim(coalesce(b.login_email, ''))),
            lower(btrim(coalesce(b.email, '')))
          )
        )
      )
  );
$$;

revoke all on function public.current_edrive_role() from public;
revoke all on function public.has_edrive_role(text[]) from public;
revoke all on function public.is_current_ride_manager_assignment(text) from public;
revoke all on function public.is_current_b2b_agent_booking(uuid, text) from public;

grant execute on function public.current_edrive_role() to authenticated;
grant execute on function public.has_edrive_role(text[]) to authenticated;
grant execute on function public.is_current_ride_manager_assignment(text) to authenticated;
grant execute on function public.is_current_b2b_agent_booking(uuid, text) to authenticated;

alter table public.admin_users enable row level security;
alter table public.b2b_agents enable row level security;
alter table public.booking_requests enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.payment_receipt_allocations enable row level security;
alter table public.payment_ledger_entries enable row level security;

-- Remove all existing policies from the active tables so permissive legacy policies
-- cannot remain active alongside the restrictive rules below.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'admin_users',
        'b2b_agents',
        'booking_requests',
        'payment_receipts',
        'payment_receipt_allocations',
        'payment_ledger_entries'
      ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- admin_users
-- -----------------------------------------------------------------------------

create policy "admin_users_authorized_select"
on public.admin_users
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or public.has_edrive_role(array['super_admin', 'admin'])
  or (
    public.has_edrive_role(array['booking_staff', 'booking_manager'])
    and lower(coalesce(role::text, '')) = 'manager'
    and lower(coalesce(status::text, '')) = 'active'
  )
);

create policy "admin_users_super_admin_insert"
on public.admin_users
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin']));

create policy "admin_users_super_admin_update"
on public.admin_users
for update
to authenticated
using (public.has_edrive_role(array['super_admin']))
with check (public.has_edrive_role(array['super_admin']));

create policy "admin_users_super_admin_delete"
on public.admin_users
for delete
to authenticated
using (public.has_edrive_role(array['super_admin']));

-- -----------------------------------------------------------------------------
-- b2b_agents
-- -----------------------------------------------------------------------------

create policy "b2b_agents_authorized_select"
on public.b2b_agents
for select
to authenticated
using (
  (
    auth_user_id = auth.uid()
    and lower(coalesce(status::text, '')) = 'active'
  )
  or public.has_edrive_role(array[
    'super_admin',
    'admin',
    'booking_staff',
    'booking_manager',
    'finance'
  ])
);

create policy "b2b_agents_super_admin_insert"
on public.b2b_agents
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin']));

create policy "b2b_agents_super_admin_update"
on public.b2b_agents
for update
to authenticated
using (public.has_edrive_role(array['super_admin']))
with check (public.has_edrive_role(array['super_admin']));

create policy "b2b_agents_super_admin_delete"
on public.b2b_agents
for delete
to authenticated
using (public.has_edrive_role(array['super_admin']));

-- -----------------------------------------------------------------------------
-- booking_requests
-- -----------------------------------------------------------------------------

-- Public website submissions are insert-only and must remain new, unpaid,
-- unassigned direct bookings.
create policy "booking_requests_website_insert"
on public.booking_requests
for insert
to anon, authenticated
with check (
  lower(coalesce(source::text, '')) = 'website'
  and lower(coalesce(status::text, 'pending')) = 'pending'
  and lower(coalesce(admin_status::text, 'new')) = 'new'
  and lower(coalesce(payment_source::text, 'direct')) = 'direct'
  and lower(coalesce(payment_status::text, 'not paid')) in ('not paid', 'unpaid')
  and lower(coalesce(payment_workflow_status::text, 'unpaid')) = 'unpaid'
  and lower(coalesce(collection_status::text, 'pending_collection')) = 'pending_collection'
  and coalesce(amount_received_aed, 0) = 0
  and assigned_manager_name is null
  and assigned_vehicle_id is null
  and b2b_agent_id is null
);

-- Active B2B agents can create only their own new B2B bookings.
create policy "booking_requests_b2b_own_insert"
on public.booking_requests
for insert
to authenticated
with check (
  lower(coalesce(source::text, '')) = 'b2b'
  and lower(coalesce(payment_source::text, '')) = 'b2b'
  and lower(coalesce(status::text, 'pending')) = 'pending'
  and lower(coalesce(admin_status::text, 'new')) = 'new'
  and lower(coalesce(payment_status::text, 'not paid')) in ('not paid', 'unpaid')
  and coalesce(amount_received_aed, 0) = 0
  and assigned_manager_name is null
  and assigned_vehicle_id is null
  and public.is_current_b2b_agent_booking(b2b_agent_id, b2b_agent_email)
);

-- Super Admin and Booking Manager can create internal/manual booking records.
create policy "booking_requests_staff_insert"
on public.booking_requests
for insert
to authenticated
with check (
  public.has_edrive_role(array['super_admin', 'booking_staff', 'booking_manager'])
);

-- Super Admin, read-only Admin, Booking Manager and Finance can read all bookings.
create policy "booking_requests_staff_select"
on public.booking_requests
for select
to authenticated
using (
  public.has_edrive_role(array[
    'super_admin',
    'admin',
    'booking_staff',
    'booking_manager',
    'finance'
  ])
);

-- Ride Managers can read only bookings assigned to their own profile.
create policy "booking_requests_manager_assigned_select"
on public.booking_requests
for select
to authenticated
using (public.is_current_ride_manager_assignment(assigned_manager_name));

-- B2B agents can read only their own linked bookings.
create policy "booking_requests_b2b_own_select"
on public.booking_requests
for select
to authenticated
using (public.is_current_b2b_agent_booking(b2b_agent_id, b2b_agent_email));

-- Booking operations and Finance can update workflows; Admin remains read-only.
create policy "booking_requests_operations_update"
on public.booking_requests
for update
to authenticated
using (
  public.has_edrive_role(array[
    'super_admin',
    'booking_staff',
    'booking_manager',
    'finance'
  ])
)
with check (
  public.has_edrive_role(array[
    'super_admin',
    'booking_staff',
    'booking_manager',
    'finance'
  ])
);

-- Ride Managers can update only rows already assigned to them.
create policy "booking_requests_manager_assigned_update"
on public.booking_requests
for update
to authenticated
using (public.is_current_ride_manager_assignment(assigned_manager_name))
with check (public.is_current_ride_manager_assignment(assigned_manager_name));

create policy "booking_requests_super_admin_delete"
on public.booking_requests
for delete
to authenticated
using (public.has_edrive_role(array['super_admin']));

-- -----------------------------------------------------------------------------
-- payment_receipts
-- -----------------------------------------------------------------------------

create policy "payment_receipts_authorized_select"
on public.payment_receipts
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'finance']));

create policy "payment_receipts_finance_insert"
on public.payment_receipts
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin', 'finance']));

create policy "payment_receipts_finance_update"
on public.payment_receipts
for update
to authenticated
using (public.has_edrive_role(array['super_admin', 'finance']))
with check (public.has_edrive_role(array['super_admin', 'finance']));

create policy "payment_receipts_super_admin_delete"
on public.payment_receipts
for delete
to authenticated
using (public.has_edrive_role(array['super_admin']));

-- -----------------------------------------------------------------------------
-- payment_receipt_allocations
-- -----------------------------------------------------------------------------

create policy "payment_allocations_authorized_select"
on public.payment_receipt_allocations
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'finance']));

create policy "payment_allocations_finance_insert"
on public.payment_receipt_allocations
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin', 'finance']));

create policy "payment_allocations_finance_update"
on public.payment_receipt_allocations
for update
to authenticated
using (public.has_edrive_role(array['super_admin', 'finance']))
with check (public.has_edrive_role(array['super_admin', 'finance']));

create policy "payment_allocations_super_admin_delete"
on public.payment_receipt_allocations
for delete
to authenticated
using (public.has_edrive_role(array['super_admin']));

-- -----------------------------------------------------------------------------
-- payment_ledger_entries
-- -----------------------------------------------------------------------------

create policy "payment_ledger_authorized_select"
on public.payment_ledger_entries
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin', 'finance']));

create policy "payment_ledger_finance_insert"
on public.payment_ledger_entries
for insert
to authenticated
with check (public.has_edrive_role(array['super_admin', 'finance']));

-- Ledger entries are append-only for Finance. Only Super Admin can correct or remove one.
create policy "payment_ledger_super_admin_update"
on public.payment_ledger_entries
for update
to authenticated
using (public.has_edrive_role(array['super_admin']))
with check (public.has_edrive_role(array['super_admin']));

create policy "payment_ledger_super_admin_delete"
on public.payment_ledger_entries
for delete
to authenticated
using (public.has_edrive_role(array['super_admin']));

commit;

-- Verification output: no data is changed by this query.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'admin_users',
    'b2b_agents',
    'booking_requests',
    'payment_receipts',
    'payment_receipt_allocations',
    'payment_ledger_entries'
  )
order by tablename, policyname;
