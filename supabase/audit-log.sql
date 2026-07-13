create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  entity_type text,
  entity_id text,
  entity_label text,
  actor_user_id uuid,
  actor_name text,
  actor_email text,
  actor_role text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_module_idx on public.audit_logs(module, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs(action, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_insert_own" on public.audit_logs;
drop policy if exists "audit_logs_admin_read" on public.audit_logs;

create policy "audit_logs_insert_own"
on public.audit_logs
for insert
to authenticated
with check (actor_user_id = auth.uid());

create policy "audit_logs_admin_read"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.auth_user_id::text = auth.uid()::text
      and lower(coalesce(au.status, '')) = 'active'
      and lower(coalesce(au.role, '')) in ('super_admin', 'admin', 'finance')
  )
);

comment on table public.audit_logs is 'Immutable operational activity history for the eDrive admin and manager workflows.';
