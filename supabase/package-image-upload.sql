-- eDrive package image storage rollout.
-- Run once in Supabase SQL Editor. Safe to rerun.
-- Existing package records, pricing, and bookings are not changed.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'package-images',
  'package-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "package_images_public_read" on storage.objects;
create policy "package_images_public_read"
on storage.objects
for select to public
using (bucket_id = 'package-images');

drop policy if exists "package_images_super_admin_insert" on storage.objects;
create policy "package_images_super_admin_insert"
on storage.objects
for insert to authenticated
with check (bucket_id = 'package-images' and public.has_edrive_role(array['super_admin']));

drop policy if exists "package_images_super_admin_update" on storage.objects;
create policy "package_images_super_admin_update"
on storage.objects
for update to authenticated
using (bucket_id = 'package-images' and public.has_edrive_role(array['super_admin']))
with check (bucket_id = 'package-images' and public.has_edrive_role(array['super_admin']));

drop policy if exists "package_images_super_admin_delete" on storage.objects;
create policy "package_images_super_admin_delete"
on storage.objects
for delete to authenticated
using (bucket_id = 'package-images' and public.has_edrive_role(array['super_admin']));

commit;

notify pgrst, 'reload schema';
