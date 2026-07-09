create extension if not exists btree_gist;

do $$ begin create type public.payment_workflow_status as enum ('unpaid','partial_paid','paid','paid_to_manager','pending_from_b2b_agent','received_by_admin','settled','refund_pending','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type public.collection_status as enum ('pending_collection','with_admin','with_manager','with_captain','with_driver','with_b2b_agent','deposited','verified_by_finance'); exception when duplicate_object then null; end $$;
do $$ begin create type public.fleet_status as enum ('available','assigned','in_ride','maintenance','damaged','out_of_service'); exception when duplicate_object then null; end $$;
do $$ begin create type public.b2b_invoice_status as enum ('issued','due','partial_paid','paid','void','refunded'); exception when duplicate_object then null; end $$;

alter type public.booking_status add value if not exists 'contacted';
alter type public.booking_status add value if not exists 'checked_in';
alter type public.booking_status add value if not exists 'ready';
alter type public.booking_status add value if not exists 'in_progress';
alter type public.booking_status add value if not exists 'no_show';
alter type public.booking_status add value if not exists 'rescheduled';
alter type public.booking_status add value if not exists 'refund_pending';
alter type public.booking_status add value if not exists 'refunded';
alter type public.payment_workflow_status add value if not exists 'paid_to_manager';
alter type public.payment_workflow_status add value if not exists 'pending_from_b2b_agent';
alter type public.payment_workflow_status add value if not exists 'received_by_admin';
alter type public.payment_workflow_status add value if not exists 'settled';
alter type public.collection_status add value if not exists 'with_b2b_agent';

alter table public.roles drop constraint if exists roles_slug_check;
alter table public.roles drop constraint if exists roles_slug_valid;
alter table public.roles add constraint roles_slug_valid check (slug in ('super_admin','admin','booking_manager','finance','captain','driver','manager','booking_agent','b2b_agent'));

insert into public.roles (slug,name,description) values
('super_admin','Super Admin','Full owner level access'),
('admin','Admin','Full system access'),
('booking_manager','Booking Manager','Booking and operations supervision'),
('finance','Finance','Payment, collection, and receivable access'),
('captain','Captain','Ride and fleet handover support'),
('driver','Driver','Transport and guest movement support'),
('manager','Manager','Operations management access'),
('booking_agent','Booking Agent','Booking workflow access'),
('b2b_agent','B2B Agent','Agent portal access')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

alter table public.vehicles
  add column if not exists operations_status public.fleet_status not null default 'available',
  add column if not exists registration_number text,
  add column if not exists last_maintenance_date date,
  add column if not exists next_maintenance_date date,
  add column if not exists notes text;

create table if not exists public.b2b_agents (
  id uuid primary key default gen_random_uuid(),
  portal_user_id uuid unique references public.users(id) on delete set null,
  company_name text not null,
  contact_person text,
  email text unique,
  phone text,
  billing_email text,
  commission_type public.discount_type not null default 'percentage',
  commission_value numeric(12,2) not null default 0 check (commission_value >= 0),
  credit_limit_aed numeric(12,2) not null default 0 check (credit_limit_aed >= 0),
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2b_percentage_commission_limit check (commission_type <> 'percentage' or commission_value <= 100)
);

alter table public.bookings
  add column if not exists admin_status public.booking_status not null default 'pending',
  add column if not exists manager_status public.booking_status,
  add column if not exists assigned_manager_id uuid references public.users(id),
  add column if not exists assigned_vehicle_id uuid references public.vehicles(id),
  add column if not exists assigned_vehicle_name text,
  add column if not exists service_type text,
  add column if not exists vehicle_type text,
  add column if not exists guest_count integer not null default 1 check (guest_count > 0),
  add column if not exists meeting_location text,
  add column if not exists captain_name text,
  add column if not exists driver_required boolean not null default false,
  add column if not exists driver_name text,
  add column if not exists ride_start_time timestamptz,
  add column if not exists ride_end_time timestamptz,
  add column if not exists extra_time_minutes integer not null default 0 check (extra_time_minutes >= 0),
  add column if not exists customer_arrived boolean not null default false,
  add column if not exists damage_reported boolean not null default false,
  add column if not exists damage_note text,
  add column if not exists manager_note text,
  add column if not exists internal_note text,
  add column if not exists customer_note text,
  add column if not exists amount_received_aed numeric(12,2) not null default 0 check (amount_received_aed >= 0),
  add column if not exists amount_pending_aed numeric(12,2) not null default 0 check (amount_pending_aed >= 0),
  add column if not exists payment_workflow_status public.payment_workflow_status not null default 'unpaid',
  add column if not exists payment_method text,
  add column if not exists payment_received_by uuid references public.users(id),
  add column if not exists payment_collected_by uuid references public.users(id),
  add column if not exists collection_status public.collection_status not null default 'pending_collection',
  add column if not exists payment_notes text,
  add column if not exists source text not null default 'website',
  add column if not exists b2b_agent_id uuid references public.b2b_agents(id),
  add column if not exists guest_received_by_manager_id uuid references public.users(id),
  add column if not exists guest_received_at timestamptz,
  add column if not exists vehicle_handed_over_by_manager_id uuid references public.users(id),
  add column if not exists vehicle_handed_over_at timestamptz,
  add column if not exists completed_by_manager_id uuid references public.users(id),
  add column if not exists completed_at timestamptz,
  add column if not exists admin_payment_received_by uuid references public.users(id),
  add column if not exists admin_payment_received_at timestamptz;

alter table public.bookings drop constraint if exists bookings_source_check;
alter table public.bookings add constraint bookings_source_check check (source in ('website','admin','walk_in','b2b'));
alter table public.bookings drop constraint if exists bookings_no_active_overlap;
alter table public.bookings add constraint bookings_no_active_overlap exclude using gist (coalesce(assigned_vehicle_id, vehicle_id) with =, tstzrange(start_at,end_at,'[)') with &&) where (status in ('pending'::public.booking_status,'confirmed'::public.booking_status,'checked_in'::public.booking_status,'ready'::public.booking_status,'in_progress'::public.booking_status));

alter table public.payments drop constraint if exists payments_payment_status_check;
alter table public.payments add constraint payments_payment_status_check check (payment_status in ('unpaid','authorized','paid','paid_to_manager','pending_from_b2b_agent','received_by_admin','settled','failed','refunded'));
alter table public.payments
  add column if not exists payment_source text not null default 'direct',
  add column if not exists b2b_agent_id uuid references public.b2b_agents(id),
  add column if not exists collected_by uuid references public.users(id),
  add column if not exists received_by uuid references public.users(id),
  add column if not exists collected_by_manager_id uuid references public.users(id),
  add column if not exists received_by_admin_id uuid references public.users(id),
  add column if not exists collection_status public.collection_status not null default 'pending_collection',
  add column if not exists admin_received_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists note text,
  add column if not exists created_by uuid references public.users(id);
alter table public.payments drop constraint if exists payments_payment_source_check;
alter table public.payments add constraint payments_payment_source_check check (payment_source in ('direct','b2b'));

create table if not exists public.b2b_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('EDW-B2B-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  b2b_agent_id uuid not null references public.b2b_agents(id),
  amount_aed numeric(12,2) not null check (amount_aed >= 0),
  status public.b2b_invoice_status not null default 'issued',
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  settled_at timestamptz,
  settled_by uuid references public.users(id),
  portal_visible boolean not null default true,
  notes text,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  previous_status public.booking_status,
  new_status public.booking_status not null,
  changed_by uuid references public.users(id),
  changed_by_role text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.b2b_agents enable row level security;
alter table public.b2b_invoices enable row level security;
alter table public.booking_status_history enable row level security;
create index if not exists b2b_agents_active_idx on public.b2b_agents(is_active);
create index if not exists bookings_b2b_agent_idx on public.bookings(b2b_agent_id);
create index if not exists bookings_assigned_vehicle_idx on public.bookings(assigned_vehicle_id);
create index if not exists payments_b2b_agent_idx on public.payments(b2b_agent_id);
create index if not exists payments_collection_status_idx on public.payments(collection_status);
create index if not exists b2b_invoices_agent_status_idx on public.b2b_invoices(b2b_agent_id,status);
create index if not exists booking_status_history_booking_idx on public.booking_status_history(booking_id,created_at desc);

drop trigger if exists touch_b2b_agents_updated_at on public.b2b_agents;
create trigger touch_b2b_agents_updated_at before update on public.b2b_agents for each row execute function public.touch_updated_at();
drop trigger if exists touch_b2b_invoices_updated_at on public.b2b_invoices;
create trigger touch_b2b_invoices_updated_at before update on public.b2b_invoices for each row execute function public.touch_updated_at();

drop policy if exists "bookings staff read" on public.bookings;
drop policy if exists "bookings b2b agent read own" on public.bookings;
drop policy if exists "bookings staff update" on public.bookings;
drop policy if exists "bookings staff insert" on public.bookings;
create policy "bookings staff read" on public.bookings for select to authenticated using (public.is_staff());
create policy "bookings b2b agent read own" on public.bookings for select to authenticated using (exists (select 1 from public.b2b_agents a where a.id = b2b_agent_id and a.portal_user_id = auth.uid() and a.is_active = true));
create policy "bookings staff update" on public.bookings for update to authenticated using (public.has_staff_role(array['super_admin','admin','booking_manager','manager','booking_agent'])) with check (public.has_staff_role(array['super_admin','admin','booking_manager','manager','booking_agent']));
create policy "bookings staff insert" on public.bookings for insert to authenticated with check (public.has_staff_role(array['super_admin','admin','booking_manager','manager','booking_agent']));

drop policy if exists "payments staff read" on public.payments;
drop policy if exists "payments b2b agent read own" on public.payments;
drop policy if exists "payments admin manager manage" on public.payments;
create policy "payments staff read" on public.payments for select to authenticated using (public.is_staff());
create policy "payments b2b agent read own" on public.payments for select to authenticated using (exists (select 1 from public.b2b_agents a where a.id = b2b_agent_id and a.portal_user_id = auth.uid() and a.is_active = true));
create policy "payments admin manager manage" on public.payments for all to authenticated using (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager'])) with check (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager']));

drop policy if exists "b2b agents staff read" on public.b2b_agents;
drop policy if exists "b2b agents admin manager manage" on public.b2b_agents;
drop policy if exists "b2b agents self read" on public.b2b_agents;
create policy "b2b agents staff read" on public.b2b_agents for select to authenticated using (public.is_staff());
create policy "b2b agents admin manager manage" on public.b2b_agents for all to authenticated using (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager'])) with check (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager']));
create policy "b2b agents self read" on public.b2b_agents for select to authenticated using (portal_user_id = auth.uid() and is_active = true);

drop policy if exists "b2b invoices staff read" on public.b2b_invoices;
drop policy if exists "b2b invoices admin manager manage" on public.b2b_invoices;
drop policy if exists "b2b invoices agent read own" on public.b2b_invoices;
create policy "b2b invoices staff read" on public.b2b_invoices for select to authenticated using (public.is_staff());
create policy "b2b invoices admin manager manage" on public.b2b_invoices for all to authenticated using (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager'])) with check (public.has_staff_role(array['super_admin','admin','finance','booking_manager','manager']));
create policy "b2b invoices agent read own" on public.b2b_invoices for select to authenticated using (exists (select 1 from public.b2b_agents a where a.id = b2b_agent_id and a.portal_user_id = auth.uid() and a.is_active = true));

drop policy if exists "booking status history staff read" on public.booking_status_history;
drop policy if exists "booking status history staff insert" on public.booking_status_history;
create policy "booking status history staff read" on public.booking_status_history for select to authenticated using (public.is_staff());
create policy "booking status history staff insert" on public.booking_status_history for insert to authenticated with check (public.is_staff());

create or replace function public.manager_complete_booking(p_booking_id uuid,p_assigned_vehicle_id uuid,p_payment_method text,p_amount_received_aed numeric default 0,p_payment_source text default 'direct',p_b2b_agent_id uuid default null,p_manager_note text default null,p_provider_reference text default null)
returns table (booking_id uuid,booking_number text,booking_status public.booking_status,payment_id uuid,invoice_id uuid,payment_status text,collection_status public.collection_status,amount_received_aed numeric,amount_pending_aed numeric)
language plpgsql security definer set search_path = public as $$
declare v_role text := public.current_staff_role(); v_booking public.bookings%rowtype; v_previous_status public.booking_status; v_payment public.payments%rowtype; v_invoice public.b2b_invoices%rowtype; v_source text := coalesce(nullif(trim(p_payment_source),''),'direct'); v_method text := coalesce(nullif(trim(p_payment_method),''),case when v_source = 'b2b' then 'b2b_agent' else 'cash' end); v_received numeric(12,2) := greatest(coalesce(p_amount_received_aed,0),0); v_pending numeric(12,2);
begin
  if v_role is null or v_role not in ('super_admin','admin','booking_manager','manager','booking_agent') then raise exception 'Only admin, booking manager, manager, or booking agent can complete a booking'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  v_previous_status := v_booking.status;
  if p_assigned_vehicle_id is null then raise exception 'Manager must select the vehicle before completing the booking'; end if;
  if not exists (select 1 from public.vehicles where id = p_assigned_vehicle_id and is_available = true and is_archived = false) then raise exception 'Selected vehicle is not available'; end if;
  if v_source not in ('direct','b2b') then raise exception 'Invalid payment source'; end if;
  if v_source = 'b2b' then
    if p_b2b_agent_id is null then raise exception 'B2B agent is required for B2B payment'; end if;
    if not exists (select 1 from public.b2b_agents where id = p_b2b_agent_id and is_active = true) then raise exception 'Selected B2B agent is not active'; end if;
    v_received := 0; v_pending := v_booking.net_amount_aed;
    update public.bookings set status='completed',admin_status='completed',manager_status='completed',assigned_manager_id=coalesce(assigned_manager_id,auth.uid()),assigned_staff_id=coalesce(assigned_staff_id,auth.uid()),assigned_vehicle_id=p_assigned_vehicle_id,assigned_vehicle_name=(select name from public.vehicles where id=p_assigned_vehicle_id),b2b_agent_id=p_b2b_agent_id,source='b2b',customer_arrived=true,guest_received_by_manager_id=coalesce(guest_received_by_manager_id,auth.uid()),guest_received_at=coalesce(guest_received_at,now()),vehicle_handed_over_by_manager_id=coalesce(vehicle_handed_over_by_manager_id,auth.uid()),vehicle_handed_over_at=coalesce(vehicle_handed_over_at,now()),completed_by_manager_id=auth.uid(),completed_at=now(),amount_received_aed=v_received,amount_pending_aed=v_pending,payment_workflow_status='pending_from_b2b_agent',payment_method='b2b_agent',payment_collected_by=auth.uid(),collection_status='with_b2b_agent',manager_note=coalesce(nullif(trim(p_manager_note),''),manager_note),updated_by=auth.uid() where id=p_booking_id returning * into v_booking;
    insert into public.payments (booking_id,amount_aed,payment_method,payment_status,payment_source,b2b_agent_id,collection_status,due_at,provider_reference,note,created_by,metadata) values (p_booking_id,v_pending,'b2b_agent','pending_from_b2b_agent','b2b',p_b2b_agent_id,'with_b2b_agent',now()+interval '7 days',nullif(trim(coalesce(p_provider_reference,'')),''),nullif(trim(coalesce(p_manager_note,'')),''),auth.uid(),jsonb_build_object('booking_number',v_booking.booking_number,'source','b2b')) returning * into v_payment;
    insert into public.b2b_invoices (booking_id,payment_id,b2b_agent_id,amount_aed,status,due_at,notes,created_by) values (p_booking_id,v_payment.id,p_b2b_agent_id,v_pending,'issued',now()+interval '7 days',nullif(trim(coalesce(p_manager_note,'')),''),auth.uid()) returning * into v_invoice;
  else
    v_pending := greatest(v_booking.net_amount_aed - v_received,0);
    update public.bookings set status='completed',admin_status='completed',manager_status='completed',assigned_manager_id=coalesce(assigned_manager_id,auth.uid()),assigned_staff_id=coalesce(assigned_staff_id,auth.uid()),assigned_vehicle_id=p_assigned_vehicle_id,assigned_vehicle_name=(select name from public.vehicles where id=p_assigned_vehicle_id),customer_arrived=true,guest_received_by_manager_id=coalesce(guest_received_by_manager_id,auth.uid()),guest_received_at=coalesce(guest_received_at,now()),vehicle_handed_over_by_manager_id=coalesce(vehicle_handed_over_by_manager_id,auth.uid()),vehicle_handed_over_at=coalesce(vehicle_handed_over_at,now()),completed_by_manager_id=auth.uid(),completed_at=now(),amount_received_aed=v_received,amount_pending_aed=v_pending,payment_workflow_status=case when v_pending = 0 then 'paid_to_manager' else 'partial_paid' end,payment_method=v_method,payment_collected_by=auth.uid(),collection_status=case when v_received > 0 then 'with_manager' else 'pending_collection' end,manager_note=coalesce(nullif(trim(p_manager_note),''),manager_note),updated_by=auth.uid() where id=p_booking_id returning * into v_booking;
    insert into public.payments (booking_id,amount_aed,payment_method,payment_status,payment_source,collected_by,collected_by_manager_id,collection_status,provider_reference,note,created_by,metadata) values (p_booking_id,v_received,v_method,case when v_received > 0 then 'paid_to_manager' else 'unpaid' end,'direct',auth.uid(),auth.uid(),case when v_received > 0 then 'with_manager' else 'pending_collection' end,nullif(trim(coalesce(p_provider_reference,'')),''),nullif(trim(coalesce(p_manager_note,'')),''),auth.uid(),jsonb_build_object('booking_number',v_booking.booking_number,'source','direct')) returning * into v_payment;
  end if;
  insert into public.booking_status_history (booking_id,previous_status,new_status,changed_by,changed_by_role,note) values (p_booking_id,v_previous_status,'completed',auth.uid(),v_role,nullif(trim(coalesce(p_manager_note,'')),''));
  insert into public.logs (actor_user_id,action,entity_table,entity_id,after_data) values (auth.uid(),'manager_completed_booking','bookings',p_booking_id,to_jsonb(v_booking));
  booking_id := v_booking.id; booking_number := v_booking.booking_number; booking_status := v_booking.status; payment_id := v_payment.id; invoice_id := v_invoice.id; payment_status := v_payment.payment_status; collection_status := v_booking.collection_status; amount_received_aed := v_booking.amount_received_aed; amount_pending_aed := v_booking.amount_pending_aed; return next;
end; $$;
revoke all on function public.manager_complete_booking(uuid,uuid,text,numeric,text,uuid,text,text) from public;
grant execute on function public.manager_complete_booking(uuid,uuid,text,numeric,text,uuid,text,text) to authenticated;

create or replace function public.admin_mark_payment_received(p_payment_id uuid,p_note text default null)
returns table (payment_id uuid,booking_id uuid,booking_number text,payment_status text,collection_status public.collection_status,invoice_id uuid,invoice_status public.b2b_invoice_status)
language plpgsql security definer set search_path = public as $$
declare v_role text := public.current_staff_role(); v_payment public.payments%rowtype; v_booking public.bookings%rowtype; v_invoice public.b2b_invoices%rowtype;
begin
  if v_role is null or v_role not in ('super_admin','admin','finance') then raise exception 'Only admin or finance can receive manager or B2B payments'; end if;
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  select * into v_booking from public.bookings where id = v_payment.booking_id for update;
  update public.payments set payment_status='received_by_admin',collection_status='with_admin',received_by=auth.uid(),received_by_admin_id=auth.uid(),admin_received_at=now(),note=coalesce(nullif(trim(p_note),''),note),updated_at=now() where id=p_payment_id returning * into v_payment;
  select * into v_invoice from public.b2b_invoices where payment_id = p_payment_id for update;
  if found then update public.b2b_invoices set status='paid',settled_at=now(),settled_by=auth.uid(),notes=coalesce(nullif(trim(p_note),''),notes),updated_by=auth.uid() where id=v_invoice.id returning * into v_invoice; end if;
  update public.bookings set payment_workflow_status='settled',collection_status='with_admin',amount_pending_aed=0,payment_received_by=auth.uid(),admin_payment_received_by=auth.uid(),admin_payment_received_at=now(),payment_notes=coalesce(nullif(trim(p_note),''),payment_notes),updated_by=auth.uid() where id=v_payment.booking_id returning * into v_booking;
  insert into public.logs (actor_user_id,action,entity_table,entity_id,after_data) values (auth.uid(),'admin_received_payment','payments',p_payment_id,to_jsonb(v_payment));
  payment_id := v_payment.id; booking_id := v_booking.id; booking_number := v_booking.booking_number; payment_status := v_payment.payment_status; collection_status := v_payment.collection_status; invoice_id := v_invoice.id; invoice_status := v_invoice.status; return next;
end; $$;
revoke all on function public.admin_mark_payment_received(uuid,text) from public;
grant execute on function public.admin_mark_payment_received(uuid,text) to authenticated;

create or replace view public.payment_ledger with (security_invoker = true) as select p.id payment_id,p.booking_id,b.booking_number,c.full_name customer_name,b.start_at,b.status booking_status,p.amount_aed,p.payment_method,p.payment_status,p.payment_source,p.collection_status,p.b2b_agent_id,a.company_name b2b_agent_name,p.collected_by_manager_id,cm.full_name collected_by_manager_name,p.received_by_admin_id,au.full_name received_by_admin_name,p.admin_received_at,bi.id invoice_id,bi.invoice_number,bi.status invoice_status,p.created_at from public.payments p join public.bookings b on b.id=p.booking_id join public.customers c on c.id=b.customer_id left join public.b2b_agents a on a.id=p.b2b_agent_id left join public.users cm on cm.id=p.collected_by_manager_id left join public.users au on au.id=p.received_by_admin_id left join public.b2b_invoices bi on bi.payment_id=p.id;
create or replace view public.b2b_agent_portal_invoices with (security_invoker = true) as select bi.id invoice_id,bi.invoice_number,bi.booking_id,b.booking_number,bi.b2b_agent_id,a.company_name b2b_agent_name,c.full_name customer_name,b.start_at,b.end_at,b.net_amount_aed,bi.amount_aed,bi.status,bi.issued_at,bi.due_at,bi.settled_at,bi.portal_visible from public.b2b_invoices bi join public.bookings b on b.id=bi.booking_id join public.customers c on c.id=b.customer_id join public.b2b_agents a on a.id=bi.b2b_agent_id where bi.portal_visible = true;
revoke all on public.payment_ledger from anon;
grant select on public.payment_ledger to authenticated;
revoke all on public.b2b_agent_portal_invoices from anon;
grant select on public.b2b_agent_portal_invoices to authenticated;

create or replace view public.report_booking_summary with (security_invoker = true) as select date_trunc('day',start_at) booking_day,count(*) total_bookings,count(*) filter (where status::text='cancelled') cancelled_bookings,count(*) filter (where status::text='completed') completed_bookings,count(*) filter (where payment_workflow_status::text='pending_from_b2b_agent') b2b_receivable_bookings,count(*) filter (where collection_status::text='with_manager') manager_collection_bookings,coalesce(sum(net_amount_aed),0) estimated_revenue_aed,coalesce(sum(amount_received_aed),0) collected_by_managers_aed,coalesce(sum(amount_pending_aed),0) receivable_aed from public.bookings group by 1;
