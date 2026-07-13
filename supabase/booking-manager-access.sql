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
      and lower(coalesce(au.role::text, '')) in ('super_admin', 'admin', 'finance', 'booking_staff')
  )
);

comment on policy "audit_logs_admin_read" on public.audit_logs is
  'Allows active Super Admin, read-only Admin, Finance and Booking Manager accounts to read permitted audit records.';
