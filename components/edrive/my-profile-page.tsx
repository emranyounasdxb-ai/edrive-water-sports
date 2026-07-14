'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, KeyRound, MailCheck, Save, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { countryFlagUrl, countryOptionsForValue } from '@/lib/country-options';
import { recordAuditLog } from '@/lib/audit-log';
import { supabase } from '@/lib/supabase-client';
import { portalRoleLabel } from './portal-access';

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  role: string | null;
  department: string | null;
  status: string | null;
  avatar_url: string | null;
};

type ProfileForm = {
  fullName: string;
  phone: string;
  nationality: string;
  avatarUrl: string;
};

const avatarBucket = 'profile-avatars';
const maxAvatarSize = 3 * 1024 * 1024;
const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function cleanExtension(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${avatarBucket}/`;
  const position = url.indexOf(marker);
  if (position < 0) return '';
  return decodeURIComponent(url.slice(position + marker.length));
}

function toneClass(tone: 'success' | 'error' | 'info') {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (tone === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-primary/15 bg-primary-50 text-primary-900';
}

export function MyProfilePage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [form, setForm] = useState<ProfileForm>({ fullName: '', phone: '', nationality: '', avatarUrl: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);

  const nationalityOptions = useMemo(() => countryOptionsForValue(form.nationality), [form.nationality]);
  const flagUrl = countryFlagUrl(form.nationality, 40);

  async function loadProfile() {
    setLoading(true);
    setNotice(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setNotice({ tone: 'error', text: 'Your login session was not found. Please sign in again.' });
      setLoading(false);
      return;
    }

    setAuthEmail(user.email || '');
    const { data, error } = await supabase
      .from('admin_users')
      .select('id,auth_user_id,full_name,email,phone,nationality,role,department,status,avatar_url')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      setNotice({ tone: 'error', text: error?.message || 'Linked staff profile was not found.' });
      setLoading(false);
      return;
    }

    const row = data as ProfileRow;
    setProfile(row);
    setForm({
      fullName: row.full_name || '',
      phone: row.phone || '',
      nationality: row.nationality || '',
      avatarUrl: row.avatar_url || ''
    });
    setAvatarPreview(row.avatar_url || '');
    setAvatarFile(null);
    setLoading(false);
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!allowedAvatarTypes.has(file.type)) {
      setNotice({ tone: 'error', text: 'Use a JPG, PNG or WebP image.' });
      event.target.value = '';
      return;
    }

    if (file.size > maxAvatarSize) {
      setNotice({ tone: 'error', text: 'Profile photo must be 3 MB or smaller.' });
      event.target.value = '';
      return;
    }

    if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setNotice({ tone: 'info', text: 'Photo selected. Press Save Profile to upload it.' });
  }

  async function uploadAvatar(userId: string) {
    if (!avatarFile) return form.avatarUrl;

    const path = `${userId}/profile-${Date.now()}.${cleanExtension(avatarFile)}`;
    const { error: uploadError } = await supabase.storage.from(avatarBucket).upload(path, avatarFile, {
      cacheControl: '3600',
      contentType: avatarFile.type,
      upsert: false
    });
    if (uploadError) throw new Error(uploadError.message);

    const publicUrl = supabase.storage.from(avatarBucket).getPublicUrl(path).data.publicUrl;
    return publicUrl;
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    if (!form.fullName.trim()) {
      setNotice({ tone: 'error', text: 'Full name is required.' });
      return;
    }
    if (!form.nationality.trim()) {
      setNotice({ tone: 'error', text: 'Select your nationality.' });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error('Your login session was not found.');

      const previousAvatarUrl = form.avatarUrl;
      const avatarUrl = await uploadAvatar(user.id);
      const { error: updateError } = await supabase.rpc('update_my_admin_profile', {
        p_full_name: form.fullName.trim(),
        p_phone: form.phone.trim(),
        p_nationality: form.nationality.trim(),
        p_avatar_url: avatarUrl
      });
      if (updateError) throw new Error(updateError.message);

      if (avatarFile && previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
        const previousPath = storagePathFromPublicUrl(previousAvatarUrl);
        if (previousPath) await supabase.storage.from(avatarBucket).remove([previousPath]);
      }

      await recordAuditLog({
        module: 'profile',
        action: 'own_profile_updated',
        entityType: 'admin_user',
        entityId: profile.id,
        entityLabel: form.fullName.trim(),
        summary: `${form.fullName.trim()} updated their profile details.`,
        metadata: { phone_updated: true, nationality: form.nationality.trim(), avatar_updated: Boolean(avatarFile) }
      });

      setForm((current) => ({ ...current, avatarUrl }));
      setAvatarPreview(avatarUrl);
      setAvatarFile(null);
      setProfile((current) => current ? { ...current, full_name: form.fullName.trim(), phone: form.phone.trim(), nationality: form.nationality.trim(), avatar_url: avatarUrl } : current);
      setNotice({ tone: 'success', text: 'Profile updated successfully. The sidebar will refresh on your next page load.' });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to update profile.' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (!authEmail) return;
    if (!currentPassword) {
      setNotice({ tone: 'error', text: 'Enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setNotice({ tone: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ tone: 'error', text: 'New password confirmation does not match.' });
      return;
    }
    if (currentPassword === newPassword) {
      setNotice({ tone: 'error', text: 'Choose a password different from your current password.' });
      return;
    }

    setPasswordSaving(true);
    setNotice(null);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: authEmail, password: currentPassword });
      if (verifyError) throw new Error('Current password is incorrect.');

      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) throw new Error(passwordError.message);

      await recordAuditLog({
        module: 'profile',
        action: 'own_password_changed',
        entityType: 'admin_user',
        entityId: profile?.id || null,
        entityLabel: profile?.full_name || authEmail,
        summary: `${profile?.full_name || authEmail} changed their login password.`
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({ tone: 'success', text: 'Password changed successfully.' });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function sendResetEmail() {
    if (!authEmail) return;
    setResetSending(true);
    setNotice(null);

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password/`
    });

    if (error) setNotice({ tone: 'error', text: error.message });
    else {
      await recordAuditLog({
        module: 'profile',
        action: 'own_password_reset_requested',
        entityType: 'admin_user',
        entityId: profile?.id || null,
        entityLabel: profile?.full_name || authEmail,
        summary: `${profile?.full_name || authEmail} requested a password reset email.`
      });
      setNotice({ tone: 'success', text: `Password reset email sent to ${authEmail}. Check Inbox and Spam.` });
    }

    setResetSending(false);
  }

  if (loading) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading your profile...</div>;
  if (!profile) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">Your linked staff profile could not be loaded.</div>;

  return (
    <section className="mx-auto w-full max-w-6xl px-1 py-1 sm:px-2">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">My Profile</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Personal details and security</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Update your own contact details, profile photo and password. Account permissions remain controlled by Super Admin.</p>
      </div>

      {notice ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${toneClass(notice.tone)}`}>{notice.text}</div> : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
            <CardTitle className="font-heading text-xl font-semibold">Profile details</CardTitle>
            <CardDescription>You can update these personal details yourself.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={saveProfile} className="grid gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-border bg-primary-50 text-primary shadow-sm">
                  {avatarPreview ? <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" /> : <UserRound className="size-11" aria-hidden="true" />}
                </div>
                <div className="grid gap-2">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary-900 px-4 py-2 text-sm font-bold text-white shadow-sm">
                    <Camera className="size-4" aria-hidden="true" />Choose Photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectAvatar} className="sr-only" />
                  </label>
                  <p className="text-xs leading-5 text-muted-foreground">JPG, PNG or WebP. Maximum 3 MB.</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold">Full Name<Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required className="h-11 rounded-xl" /></label>
                <label className="grid gap-1.5 text-sm font-semibold">Phone Number<Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+971..." className="h-11 rounded-xl" /></label>
                <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Nationality
                  <span className="flex items-center gap-2">
                    {flagUrl ? <img src={flagUrl} alt="Selected country flag" className="h-5 w-7 rounded object-cover shadow-sm" /> : null}
                    <select value={form.nationality} onChange={(event) => setForm((current) => ({ ...current, nationality: event.target.value }))} required className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-sm font-semibold">
                      <option value="">Select nationality</option>
                      {nationalityOptions.map((option) => <option key={`${option.code}-${option.value}`} value={option.value}>{option.value}</option>)}
                    </select>
                  </span>
                </label>
              </div>

              <Button type="submit" disabled={saving} className="w-fit rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Profile'}</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card className="overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
            <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
              <CardTitle className="font-heading text-xl font-semibold">Account access</CardTitle>
              <CardDescription>These fields are managed by Super Admin.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-1">
              <ReadOnlyField label="Login Email" value={profile.email || authEmail || '-'} />
              <ReadOnlyField label="Role" value={portalRoleLabel(profile.role || '')} />
              <ReadOnlyField label="Department" value={profile.department || '-'} />
              <ReadOnlyField label="Status" value={profile.status || '-'} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
            <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
              <CardTitle className="font-heading text-xl font-semibold">Password security</CardTitle>
              <CardDescription>Verify your current password before setting a new one.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={changePassword} className="grid gap-3">
                <label className="grid gap-1.5 text-sm font-semibold">Current Password<Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="h-11 rounded-xl" /></label>
                <label className="grid gap-1.5 text-sm font-semibold">New Password<Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" className="h-11 rounded-xl" /></label>
                <label className="grid gap-1.5 text-sm font-semibold">Confirm New Password<Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" className="h-11 rounded-xl" /></label>
                <Button type="submit" disabled={passwordSaving} className="mt-1 rounded-full"><KeyRound className="size-4" aria-hidden="true" />{passwordSaving ? 'Updating...' : 'Change Password'}</Button>
              </form>

              <div className="my-5 h-px bg-border" />

              <div className="rounded-2xl border border-primary/15 bg-primary-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div><p className="text-sm font-bold text-primary-900">Cannot remember your current password?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Send a secure reset link to your login email.</p></div>
                </div>
                <Button type="button" variant="outline" onClick={sendResetEmail} disabled={resetSending} className="mt-3 w-full rounded-full bg-white"><MailCheck className="size-4" aria-hidden="true" />{resetSending ? 'Sending...' : 'Send Reset Email'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-[#F7FAFA] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
