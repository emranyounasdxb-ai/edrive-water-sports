-- Secure self-service profile updates and avatar uploads.
-- Non-destructive: no existing profile or authentication records are removed.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile avatars insert own folder" on storage.objects;
create policy "profile avatars insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile avatars update own folder" on storage.objects;
create policy "profile avatars update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile avatars delete own folder" on storage.objects;
create policy "profile avatars delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.update_my_admin_profile(
  p_full_name text,
  p_phone text,
  p_nationality text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if nullif(btrim(coalesce(p_full_name, '')), '') is null then
    raise exception 'Full name is required';
  end if;

  update public.admin_users
  set full_name = btrim(p_full_name),
      phone = btrim(coalesce(p_phone, '')),
      nationality = btrim(coalesce(p_nationality, '')),
      avatar_url = btrim(coalesce(p_avatar_url, ''))
  where auth_user_id = auth.uid();

  if not found then
    raise exception 'Linked staff profile was not found';
  end if;
end;
$$;

revoke all on function public.update_my_admin_profile(text, text, text, text) from public;
grant execute on function public.update_my_admin_profile(text, text, text, text) to authenticated;
