-- eDrive package catalog hardening.
-- Apply after supabase/security-hardening.sql and supabase/public-request-hardening.sql.
-- Existing package and booking records are never deleted by this migration.

begin;

create table if not exists public.package_audit_logs (
  id bigint generated always as identity primary key,
  package_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid,
  created_at timestamptz not null default now()
);

alter table public.package_audit_logs enable row level security;
revoke all on table public.package_audit_logs from anon;
grant select on table public.package_audit_logs to authenticated;

drop policy if exists "package_audit_staff_select" on public.package_audit_logs;
create policy "package_audit_staff_select"
on public.package_audit_logs
for select
to authenticated
using (public.has_edrive_role(array['super_admin', 'admin']));

create or replace function public.audit_package_catalog_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.package_audit_logs (package_id, action, new_data, actor_id)
    values (new.id, 'insert', to_jsonb(new), auth.uid());
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.package_audit_logs (package_id, action, old_data, new_data, actor_id)
    values (new.id, 'update', to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  end if;

  insert into public.package_audit_logs (package_id, action, old_data, actor_id)
  values (old.id, 'delete', to_jsonb(old), auth.uid());
  return old;
end;
$$;

revoke all on function public.audit_package_catalog_change() from public;

drop trigger if exists packages_catalog_audit_trigger on public.packages;
create trigger packages_catalog_audit_trigger
after insert or update or delete on public.packages
for each row execute function public.audit_package_catalog_change();

-- Safely resolve existing duplicate specifications before enforcement starts.
-- The best named/ordered package remains live; additional matching records become inactive.
with ranked_packages as (
  select
    p.id,
    row_number() over (
      partition by
        lower(btrim(coalesce(p.category::text, ''))),
        coalesce(p.capacity, 0),
        coalesce(p.duration_minutes, 0)
      order by
        case
          when lower(coalesce(p.category::text, '')) = 'jet_car_rental'
            and lower(btrim(coalesce(p.title::text, ''))) like 'jet car%' then 0
          when lower(coalesce(p.category::text, '')) = 'jet_ski_rental'
            and lower(btrim(coalesce(p.title::text, ''))) like 'jet ski%' then 0
          when lower(coalesce(p.category::text, '')) = 'yacht_rental'
            and lower(btrim(coalesce(p.title::text, ''))) like 'yacht%' then 0
          else 1
        end,
        case lower(coalesce(p.status::text, 'active'))
          when 'active' then 0
          when 'draft' then 1
          else 2
        end,
        coalesce(p.display_order, 100),
        p.id
    ) as package_rank
  from public.packages p
  where lower(coalesce(p.status::text, 'active')) <> 'inactive'
)
update public.packages p
set status = 'inactive'
from ranked_packages r
where p.id = r.id
  and r.package_rank > 1;

create or replace function public.prevent_duplicate_package_catalog_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.status::text, 'active')) <> 'inactive' then
    if exists (
      select 1
      from public.packages p
      where p.id is distinct from new.id
        and lower(coalesce(p.status::text, 'active')) <> 'inactive'
        and lower(btrim(coalesce(p.category::text, ''))) = lower(btrim(coalesce(new.category::text, '')))
        and coalesce(p.capacity, 0) = coalesce(new.capacity, 0)
        and coalesce(p.duration_minutes, 0) = coalesce(new.duration_minutes, 0)
    ) then
      raise exception 'A non-inactive package already exists for this ride type, capacity, and duration.';
    end if;

    if exists (
      select 1
      from public.packages p
      where p.id is distinct from new.id
        and lower(coalesce(p.status::text, 'active')) <> 'inactive'
        and lower(regexp_replace(btrim(coalesce(p.title::text, '')), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(coalesce(new.title::text, '')), '\s+', ' ', 'g'))
    ) then
      raise exception 'A non-inactive package already uses this title.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_duplicate_package_catalog_entries() from public;

drop trigger if exists packages_prevent_duplicate_trigger on public.packages;
create trigger packages_prevent_duplicate_trigger
before insert or update of title, category, capacity, duration_minutes, status on public.packages
for each row execute function public.prevent_duplicate_package_catalog_entries();

create or replace function public.save_package_catalog_entry(
  p_payload jsonb,
  p_package_id uuid default null
)
returns table (package_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text := left(btrim(coalesce(p_payload->>'title', '')), 120);
  v_slug text := left(lower(btrim(coalesce(p_payload->>'slug', ''))), 160);
  v_category text := lower(btrim(coalesce(p_payload->>'category', '')));
  v_duration integer;
  v_capacity integer;
  v_base_price numeric;
  v_b2b_price numeric;
  v_image_url text := left(btrim(coalesce(p_payload->>'image_url', '')), 500);
  v_description text := left(btrim(coalesce(p_payload->>'short_description', '')), 500);
  v_status text := lower(btrim(coalesce(p_payload->>'status', 'active')));
  v_featured boolean := coalesce((p_payload->>'is_featured')::boolean, false);
  v_display_order integer;
  v_id uuid;
begin
  if not public.has_edrive_role(array['super_admin']) then
    raise exception 'Only the Super Admin can create or edit packages.';
  end if;

  begin
    v_duration := (p_payload->>'duration_minutes')::integer;
    v_capacity := (p_payload->>'capacity')::integer;
    v_base_price := (p_payload->>'base_price')::numeric;
    v_b2b_price := (p_payload->>'b2b_price')::numeric;
    v_display_order := coalesce((p_payload->>'display_order')::integer, 100);
  exception when others then
    raise exception 'Package configuration contains an invalid number.';
  end;

  if length(v_title) < 5 then raise exception 'Package title must contain at least 5 characters.'; end if;
  if v_title !~* '^[a-z0-9][a-z0-9 ''&()+,./-]*$' then raise exception 'Package title contains unsupported characters.'; end if;
  if v_slug = '' or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Package slug is invalid.'; end if;
  if v_category not in ('jet_car_rental', 'jet_ski_rental', 'yacht_rental') then raise exception 'Package category is invalid.'; end if;
  if v_duration < 10 or v_duration > 480 then raise exception 'Duration must be between 10 and 480 minutes.'; end if;
  if v_capacity < 1 or v_capacity > 12 then raise exception 'Capacity must be between 1 and 12.'; end if;
  if v_base_price <= 0 then raise exception 'B2C price must be greater than zero.'; end if;
  if v_b2b_price < 0 then raise exception 'B2B price cannot be negative.'; end if;
  if v_b2b_price > v_base_price then raise exception 'B2B price cannot be higher than B2C price.'; end if;
  if v_status not in ('active', 'draft', 'inactive') then raise exception 'Package status is invalid.'; end if;
  if v_display_order < 0 or v_display_order > 9999 then raise exception 'Display order must be between 0 and 9999.'; end if;

  if p_package_id is null then
    insert into public.packages (
      title, slug, category, duration_minutes, base_price, b2b_price, capacity,
      image_url, short_description, status, is_featured, display_order
    ) values (
      v_title, v_slug, v_category, v_duration, v_base_price, v_b2b_price, v_capacity,
      nullif(v_image_url, ''), nullif(v_description, ''), v_status, v_featured, v_display_order
    ) returning id into v_id;
  else
    update public.packages
    set title = v_title,
        slug = v_slug,
        category = v_category,
        duration_minutes = v_duration,
        base_price = v_base_price,
        b2b_price = v_b2b_price,
        capacity = v_capacity,
        image_url = nullif(v_image_url, ''),
        short_description = nullif(v_description, ''),
        status = v_status,
        is_featured = v_featured,
        display_order = v_display_order
    where id = p_package_id
    returning id into v_id;

    if v_id is null then raise exception 'Package was not found.'; end if;
  end if;

  return query select v_id;
end;
$$;

revoke all on function public.save_package_catalog_entry(jsonb, uuid) from public;
grant execute on function public.save_package_catalog_entry(jsonb, uuid) to authenticated;

create or replace function public.delete_package_if_unused(p_package_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package public.packages%rowtype;
  v_used boolean := false;
begin
  if not public.has_edrive_role(array['super_admin']) then
    raise exception 'Only the Super Admin can delete packages.';
  end if;

  select * into v_package
  from public.packages
  where id = p_package_id
  for update;

  if not found then raise exception 'Package was not found.'; end if;

  select exists (
    select 1
    from public.booking_requests br
    where lower(btrim(coalesce(br.selected_package_slug::text, ''))) = lower(btrim(coalesce(v_package.slug::text, '')))
       or lower(btrim(coalesce(br.selected_package_name::text, ''))) = lower(btrim(coalesce(v_package.title::text, '')))
  ) into v_used;

  if v_used then
    raise exception 'This package is linked to an existing booking and cannot be deleted. Deactivate it instead.';
  end if;

  delete from public.packages where id = p_package_id;
  return true;
end;
$$;

revoke all on function public.delete_package_if_unused(uuid) from public;
grant execute on function public.delete_package_if_unused(uuid) to authenticated;

-- The RPC is the preferred delete path. This policy also protects direct Supabase deletes.
alter table public.packages enable row level security;
grant delete on table public.packages to authenticated;
drop policy if exists "packages_super_admin_delete" on public.packages;
create policy "packages_super_admin_delete"
on public.packages
for delete
to authenticated
using (public.has_edrive_role(array['super_admin']));

commit;
