alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.customers enable row level security;
alter table public.coupons enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.logs enable row level security;

create or replace function public.current_staff_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select r.slug
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid()
    and u.is_active = true
  limit 1;
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_staff_role() is not null;
$$;

create or replace function public.has_staff_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_staff_role() = any(allowed_roles), false);
$$;

create policy "roles staff read" on public.roles for select to authenticated using (public.is_staff());

create policy "users self read" on public.users for select to authenticated using (id = auth.uid() or public.has_staff_role(array['admin','manager']));
create policy "users admin manage" on public.users for all to authenticated using (public.has_staff_role(array['admin'])) with check (public.has_staff_role(array['admin']));

create policy "vehicles public read" on public.vehicles for select to anon, authenticated using (is_visible_public = true and is_archived = false);
create policy "vehicles staff manage" on public.vehicles for all to authenticated using (public.has_staff_role(array['admin','manager'])) with check (public.has_staff_role(array['admin','manager']));

create policy "vehicle images public read" on public.vehicle_images for select to anon, authenticated using (
  exists (select 1 from public.vehicles v where v.id = vehicle_id and v.is_visible_public = true and v.is_archived = false)
);
create policy "vehicle images staff manage" on public.vehicle_images for all to authenticated using (public.has_staff_role(array['admin','manager'])) with check (public.has_staff_role(array['admin','manager']));

create policy "customers staff read" on public.customers for select to authenticated using (public.is_staff());
create policy "customers staff manage" on public.customers for all to authenticated using (public.has_staff_role(array['admin','manager','booking_agent'])) with check (public.has_staff_role(array['admin','manager','booking_agent']));

create policy "coupons staff read" on public.coupons for select to authenticated using (public.is_staff());
create policy "coupons admin manager manage" on public.coupons for all to authenticated using (public.has_staff_role(array['admin','manager'])) with check (public.has_staff_role(array['admin','manager']));

create policy "bookings staff read" on public.bookings for select to authenticated using (public.is_staff());
create policy "bookings staff update" on public.bookings for update to authenticated using (public.has_staff_role(array['admin','manager','booking_agent'])) with check (public.has_staff_role(array['admin','manager','booking_agent']));
create policy "bookings staff insert" on public.bookings for insert to authenticated with check (public.has_staff_role(array['admin','manager','booking_agent']));

create policy "payments staff read" on public.payments for select to authenticated using (public.is_staff());
create policy "payments admin manager manage" on public.payments for all to authenticated using (public.has_staff_role(array['admin','manager'])) with check (public.has_staff_role(array['admin','manager']));

create policy "logs staff read" on public.logs for select to authenticated using (public.has_staff_role(array['admin','manager']));
create policy "logs staff insert" on public.logs for insert to authenticated with check (public.is_staff());
