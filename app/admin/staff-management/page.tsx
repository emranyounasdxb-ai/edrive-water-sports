'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { FileClock, ImagePlus, KeyRound, Pencil, Plus, ShieldCheck, UploadCloud, UserCog, UsersRound, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';

type StaffRecord = {
  id: string;
  avatarUrl: string;
  fullName: string;
  email: string;
  phone: string;
  passportNumber: string;
  emiratesId: string;
  role: string;
  department: string;
  status: string;
  notes: string;
};

type StaffFormValues = Omit<StaffRecord, 'id'> & {
  temporaryPassword: string;
};

const roleMap: Record<string, string> = {
  'Super Admin': 'super_admin',
  Admin: 'admin',
  'Booking Staff': 'booking_staff',
  'Manager / Operations': 'manager',
  Finance: 'finance',
  'Maintenance Staff': 'maintenance_staff'
};

const statusMap: Record<string, string> = {
  Active: 'active',
  Inactive: 'inactive',
  Suspended: 'suspended'
};

const reverse = (map: Record<string, string>, value?: string) => Object.keys(map).find((key) => map[key] === value) || value || '';

const emptyForm: StaffFormValues = {
  avatarUrl: '',
  fullName: '',
  email: '',
  phone: '',
  passportNumber: '',
  emiratesId: '',
  role: 'Booking Staff',
  department: 'Booking',
  status: 'Active',
  notes: '',
  temporaryPassword: ''
};

function toText(value: unknown) {
  return String(value || '');
}

function mapStaff(row: Record<string, unknown>): StaffRecord {
  return {
    id: toText(row.id),
    avatarUrl: toText(row.avatar_url),
    fullName: toText(row.full_name),
    email: toText(row.email),
    phone: toText(row.phone),
    passportNumber: toText(row.passport_number),
    emiratesId: toText(row.emirates_id),
    role: reverse(roleMap, toText(row.role)),
    department: toText(row.department),
    status: reverse(statusMap, toText(row.status)),
    notes: toText(row.notes)
  };
}

function makeTemporaryPassword() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `eDrive@${new Date().getFullYear()}-${suffix}`;
}

async function readApiMessage(response: Response) {
  try {
    const body = await response.json();
    return typeof body?.error === 'string' ? body.error : typeof body?.message === 'string' ? body.message : '';
  } catch {
    return '';
  }
}

async function uploadAvatar(file?: File) {
  if (!file) return '';
  const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `${Date.now()}-${cleanName}`;
  const { error } = await supabase.storage.from('staff-avatars').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('staff-avatars').getPublicUrl(path).data.publicUrl;
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UserCog }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRecord | null>(null);

  async function loadData() {
    setLoading(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const authUser = userData.user;

    if (authUser) {
      const { data: profile } = await supabase
        .from('admin_users')
        .select('role, status')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      setIsSuperAdmin(Boolean(profile && profile.status === 'active' && profile.role === 'super_admin'));
    }

    const { data, error: queryError } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setStaff(((data || []) as Array<Record<string, unknown>>).map(mapStaff));

    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const metrics = useMemo(() => {
    const active = staff.filter((item) => item.status === 'Active').length;
    const managers = staff.filter((item) => item.role === 'Manager / Operations').length;
    const inactive = staff.filter((item) => item.status !== 'Active').length;
    return { active, managers, inactive };
  }, [staff]);

  async function syncLogin(email: string, password: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Admin login session is required. Please login again.');

    const response = await fetch('/api/admin/staff-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email, mode: 'set-password', password })
    });

    if (!response.ok) {
      const message = await readApiMessage(response);
      throw new Error(message || 'Staff login sync failed.');
    }
  }

  async function handleSave(values: StaffFormValues, file?: File) {
    if (!isSuperAdmin) {
      setError('Only Super Admin can add or edit staff records.');
      return;
    }

    setError('');
    setNotice('');

    const cleanEmail = values.email.trim().toLowerCase();
    const cleanPassword = values.temporaryPassword.trim();
    const emailChanged = editing ? editing.email.trim().toLowerCase() !== cleanEmail : true;

    if ((emailChanged || !editing) && cleanPassword.length < 8) {
      setError('Temporary password is required when adding staff or changing staff email. Minimum 8 characters.');
      return;
    }

    const avatarUrl = (await uploadAvatar(file)) || values.avatarUrl || editing?.avatarUrl || '';
    const payload = {
      avatar_url: avatarUrl,
      full_name: values.fullName,
      email: cleanEmail,
      phone: values.phone,
      passport_number: values.passportNumber,
      emirates_id: values.emiratesId,
      role: roleMap[values.role] || 'booking_staff',
      department: values.department,
      status: statusMap[values.status] || 'active',
      notes: values.notes
    };

    const result = editing
      ? await supabase.from('admin_users').update(payload).eq('id', editing.id)
      : await supabase.from('admin_users').insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (cleanPassword) {
      try {
        await syncLogin(cleanEmail, cleanPassword);
        setNotice('Staff profile and login access have been synced with Supabase Auth.');
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : 'Staff saved, but login sync failed.');
        await loadData();
        return;
      }
    } else {
      setNotice('Staff profile saved. Login password was not changed.');
    }

    setOpen(false);
    setEditing(null);
    await loadData();
  }

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(record: StaffRecord) {
    setEditing(record);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Staff</span>
            <Badge variant="secondary" className="rounded-full">Supabase connected</Badge>
            {isSuperAdmin ? <Badge className="rounded-full bg-primary text-white">Super Admin controls</Badge> : <Badge variant="secondary" className="rounded-full">Read only</Badge>}
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Staff and login access</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Create staff records and sync the same email, name, and temporary password with Supabase Auth.</p>
        </div>
        {isSuperAdmin ? <Button type="button" onClick={openAdd}><Plus data-icon aria-hidden="true" />Add Staff</Button> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Active Staff" value={String(metrics.active)} icon={UserCog} />
        <MetricCard label="Managers" value={String(metrics.managers)} icon={UsersRound} />
        <MetricCard label="Inactive Staff" value={String(metrics.inactive)} icon={FileClock} />
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Records</CardTitle>
          <CardDescription>{isSuperAdmin ? 'Only Super Admin can edit staff and sync login passwords.' : 'Staff records are visible, but edit and login sync are restricted to Super Admin.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {['Photo', 'Staff Name', 'Email', 'Role', 'Phone', 'Status', ...(isSuperAdmin ? ['Action'] : [])].map((column) => <TableHead key={column}>{column}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length ? staff.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.avatarUrl ? <img src={row.avatarUrl} alt={row.fullName || 'Staff'} className="size-11 rounded-2xl border border-border object-cover" /> : <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ImagePlus className="size-4" aria-hidden="true" /></span>}</TableCell>
                  <TableCell className="max-w-[14rem] truncate font-semibold">{row.fullName || '-'}</TableCell>
                  <TableCell className="max-w-[14rem] truncate text-xs text-muted-foreground">{row.email || '-'}</TableCell>
                  <TableCell>{row.role || '-'}</TableCell>
                  <TableCell>{row.phone || '-'}</TableCell>
                  <TableCell>{row.status || '-'}</TableCell>
                  {isSuperAdmin ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(row)}><Pencil className="size-4" aria-hidden="true" />Edit / Sync</Button>
                        <Button asChild size="sm" variant="subtle"><Link href={`/admin/staff-password?email=${encodeURIComponent(row.email)}`}><KeyRound className="size-4" aria-hidden="true" />Password Page</Link></Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="h-28 text-center text-sm text-muted-foreground">{loading ? 'Loading records...' : 'No staff users added yet.'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {open ? <StaffModal initialValues={editing || undefined} onClose={() => { setOpen(false); setEditing(null); }} onSubmit={handleSave} /> : null}
    </div>
  );
}

function StaffModal({ initialValues, onClose, onSubmit }: { initialValues?: StaffRecord; onClose: () => void; onSubmit: (values: StaffFormValues, file?: File) => Promise<void> }) {
  const [values, setValues] = useState<StaffFormValues>(initialValues ? { ...initialValues, temporaryPassword: '' } : emptyForm);
  const [file, setFile] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const departments = ['Admin', 'Booking', 'Operations', 'Finance', 'Maintenance', 'Management'];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSubmit(values, file);
    setSaving(false);
  }

  function updateField(name: keyof StaffFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    updateField('avatarUrl', selected.name);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[34rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Super Admin Form</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{initialValues ? 'Edit Staff & Sync Login' : 'Add Staff & Create Login'}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-foreground sm:col-span-2">Profile Photo
              <div className="rounded-[1.15rem] border border-dashed border-primary/35 bg-primary-50/65 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">{values.avatarUrl && values.avatarUrl.startsWith('http') ? <img src={values.avatarUrl} alt="Selected" className="size-11 rounded-2xl object-cover" /> : <ImagePlus className="size-5" aria-hidden="true" />}</span>
                    <div><p className="text-sm font-semibold text-foreground">{values.avatarUrl ? (values.avatarUrl.startsWith('http') ? 'Current image selected' : values.avatarUrl) : 'No image selected'}</p><p className="mt-1 text-xs font-normal leading-5 text-muted-foreground">Recommended size: 600 × 600 px square.</p></div>
                  </div>
                  <span className="relative inline-flex"><input type="file" accept="image/webp,image/jpeg,image/png" onChange={handleFile} className="absolute inset-0 cursor-pointer opacity-0" /><Button type="button" variant="outline" size="sm"><UploadCloud className="size-4" aria-hidden="true" />Upload Image</Button></span>
                </div>
              </div>
            </label>
            <FormInput label="Full Name" value={values.fullName} required onChange={(value) => updateField('fullName', value)} />
            <FormInput label="Email" type="email" value={values.email} required onChange={(value) => updateField('email', value)} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Temporary Password
              <div className="flex gap-2">
                <input type="text" value={values.temporaryPassword} onChange={(event) => updateField('temporaryPassword', event.target.value)} placeholder={initialValues ? 'Leave blank if password is not changing' : 'Required for new staff'} className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" />
                <Button type="button" variant="outline" onClick={() => updateField('temporaryPassword', makeTemporaryPassword())}>Generate</Button>
              </div>
              <span className="text-xs font-normal leading-5 text-muted-foreground">Used to create/update the Supabase Auth login for this staff email.</span>
            </label>
            <FormInput label="Phone / WhatsApp" type="tel" value={values.phone} required onChange={(value) => updateField('phone', value)} />
            <FormInput label="Passport Number" value={values.passportNumber} onChange={(value) => updateField('passportNumber', value)} />
            <FormInput label="Emirates ID / EID Number" value={values.emiratesId} onChange={(value) => updateField('emiratesId', value)} />
            <SelectInput label="Role" value={values.role} options={Object.keys(roleMap)} required onChange={(value) => updateField('role', value)} />
            <SelectInput label="Department" value={values.department} options={departments} onChange={(value) => updateField('department', value)} />
            <SelectInput label="Status" value={values.status} options={Object.keys(statusMap)} required onChange={(value) => updateField('status', value)} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Notes<textarea value={values.notes} onChange={(event) => updateField('notes', event.target.value)} className="min-h-20 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label>
          </div>
          <div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save & Sync Login'}</Button></div>
        </form>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>;
}

function SelectInput({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
