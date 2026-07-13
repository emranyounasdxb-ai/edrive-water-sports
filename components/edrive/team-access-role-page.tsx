'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { KeyRound, Pencil, Plus, RefreshCw, Search, ShieldCheck, UserRound, UsersRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { recordAuditLog } from '@/lib/audit-log';
import { countryFlagUrl, countryOptionsForValue } from '@/lib/country-options';
import { supabase } from '@/lib/supabase-client';
import { portalRoleLabel, usePortalAccess } from './portal-access';

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'booking_staff', label: 'Booking Manager' },
  { value: 'manager', label: 'Ride Manager' },
  { value: 'finance', label: 'Finance' },
  { value: 'maintenance_staff', label: 'Maintenance Staff' }
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
];

const accessByRole: Record<string, string[]> = {
  super_admin: ['Full portal control', 'Bookings', 'Payments', 'Team & Access', 'Settings'],
  admin: ['All portal modules', 'Booking operations', 'Payments', 'Reports', 'Audit Log', 'Workflow Check'],
  booking_staff: ['Booking dashboard', 'Bookings', 'Schedule', 'Customers', 'Packages & Fleet reference', 'Booking Activity'],
  manager: ['Today', 'My Rides', 'Schedule', 'Collections'],
  finance: ['Dashboard', 'Customers', 'Payments', 'Reports', 'Audit Log'],
  maintenance_staff: ['Dashboard', 'Schedule', 'Fleet', 'Maintenance']
};

type TeamRow = {
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
  notes: string | null;
  created_at: string | null;
};

type TeamForm = {
  authUserId: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  role: string;
  department: string;
  status: string;
  avatarUrl: string;
  notes: string;
};

const emptyForm: TeamForm = {
  authUserId: '',
  fullName: '',
  email: '',
  phone: '',
  nationality: '',
  role: 'booking_staff',
  department: 'Booking Operations',
  status: 'active',
  avatarUrl: '',
  notes: ''
};

function titleCase(value: string | null | undefined) {
  return String(value || '').trim().replace(/\s+/g, ' ').split(' ').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function statusTone(status: string | null) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'suspended') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function CountryFlagBadge({ nationality }: { nationality: string | null | undefined }) {
  const src = countryFlagUrl(nationality, 40);
  if (!src) return null;
  return (
    <span className="inline-flex h-[14px] w-[20px] shrink-0 items-center overflow-hidden rounded-[3px] border border-border/80 bg-white shadow-sm" title={`${nationality} flag`}>
      <img src={src} alt={`${nationality} flag`} className="h-full w-full object-cover" loading="lazy" />
    </span>
  );
}

function TeamModal({ row, saving, error, onClose, onSave }: { row: TeamRow | null; saving: boolean; error: string; onClose: () => void; onSave: (form: TeamForm) => Promise<void> }) {
  const [form, setForm] = useState<TeamForm>(() => row ? {
    authUserId: row.auth_user_id || '',
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    nationality: row.nationality || '',
    role: row.role || 'booking_staff',
    department: row.department || '',
    status: row.status || 'active',
    avatarUrl: row.avatar_url || '',
    notes: row.notes || ''
  } : emptyForm);

  const nationalityOptions = useMemo(() => countryOptionsForValue(form.nationality), [form.nationality]);

  function change(key: keyof TeamForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-primary-950/45 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-[#F7FAFA] px-5 py-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Team & Access</p><h2 className="mt-1 font-heading text-xl font-semibold">{row ? 'Edit profile and permissions' : 'Add linked profile'}</h2></div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white"><X className="size-4" /></button>
        </div>
        <form onSubmit={submit} className="max-h-[calc(92vh-5rem)] overflow-y-auto p-5">
          {error ? <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          {!row ? <p className="mb-4 rounded-xl border border-primary/15 bg-primary-50 px-3 py-2 text-xs font-semibold leading-5 text-primary-900">Create the account in Supabase Authentication first, then paste its Auth User UID here.</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Auth User UID<Input value={form.authUserId} onChange={(event) => change('authUserId', event.target.value)} required={!row} className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Full Name<Input value={form.fullName} onChange={(event) => change('fullName', event.target.value)} required className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Email<Input type="email" value={form.email} onChange={(event) => change('email', event.target.value)} required className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Phone<Input value={form.phone} onChange={(event) => change('phone', event.target.value)} className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Nationality<select value={form.nationality} onChange={(event) => change('nationality', event.target.value)} required className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold"><option value="">Select nationality</option>{nationalityOptions.map((option) => <option key={`${option.code}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold">Role<select value={form.role} onChange={(event) => change('role', event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold">{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold">Status<select value={form.status} onChange={(event) => change('status', event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold">Department<Input value={form.department} onChange={(event) => change('department', event.target.value)} className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Avatar URL<Input value={form.avatarUrl} onChange={(event) => change('avatarUrl', event.target.value)} className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Notes<textarea value={form.notes} onChange={(event) => change('notes', event.target.value)} className="min-h-24 rounded-xl border border-border p-3" /></label>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button><Button type="submit" disabled={saving} className="rounded-full">{saving ? 'Saving...' : 'Save Access'}</Button></div>
        </form>
      </div>
    </div>
  );
}

export function TeamAccessRolePage() {
  const { loading: roleLoading, isSuperAdmin, isReadOnlyAdmin } = usePortalAccess();
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from('admin_users').select('id,auth_user_id,full_name,email,phone,nationality,role,department,status,avatar_url,notes,created_at').order('full_name', { ascending: true }).limit(500);
    if (loadError) setError(loadError.message);
    else setRows((data || []) as TeamRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!roleLoading && (isSuperAdmin || isReadOnlyAdmin)) void load();
  }, [isReadOnlyAdmin, isSuperAdmin, roleLoading]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => (!roleFilter || row.role === roleFilter) && (!term || [row.full_name, row.email, row.phone, row.nationality, row.department, row.role].some((value) => String(value || '').toLowerCase().includes(term))));
  }, [query, roleFilter, rows]);

  async function save(form: TeamForm) {
    if (!isSuperAdmin) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        auth_user_id: form.authUserId.trim() || null,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        nationality: form.nationality.trim(),
        role: form.role,
        department: form.department.trim(),
        status: form.status,
        avatar_url: form.avatarUrl.trim(),
        notes: form.notes.trim(),
        updated_at: new Date().toISOString()
      };
      const result = editing ? await supabase.from('admin_users').update(payload).eq('id', editing.id) : await supabase.from('admin_users').insert(payload);
      if (result.error) throw new Error(result.error.message);
      await recordAuditLog({ module: 'team', action: editing ? 'team_access_updated' : 'team_profile_created', entityType: 'admin_user', entityId: editing?.id || form.authUserId, entityLabel: form.fullName, summary: `${form.fullName} was assigned ${portalRoleLabel(form.role)} access.`, metadata: { role: form.role, status: form.status, nationality: form.nationality } });
      setModalOpen(false);
      setEditing(null);
      setNotice('Team access saved.');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save team access.');
    } finally {
      setSaving(false);
    }
  }

  async function sendReset(row: TeamRow) {
    if (!isSuperAdmin || !row.email) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(row.email, { redirectTo: `${window.location.origin}/admin/reset-password/` });
    if (resetError) setError(resetError.message);
    else setNotice(`Password reset email sent to ${row.email}.`);
  }

  if (roleLoading || loading) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading team access...</div>;
  if (!isSuperAdmin && !isReadOnlyAdmin) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">This page is available to Super Admin and Admin accounts.</div>;

  return (
    <section className="w-full overflow-hidden px-1 py-1 sm:px-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Team & Access</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Portal users and permissions</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{isSuperAdmin ? 'Manage linked accounts, roles and access status.' : 'View the complete team directory and assigned portal permissions.'}</p></div>
        <div className="flex gap-2"><Button type="button" variant="outline" onClick={load} data-readonly-allow="true" className="rounded-full bg-white"><RefreshCw className="size-4" />Refresh</Button>{isSuperAdmin ? <Button type="button" onClick={() => { setEditing(null); setModalOpen(true); }} className="rounded-full"><Plus className="size-4" />Add Profile</Button> : null}</div>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.2rem]"><CardContent className="flex items-center gap-3 p-4"><UsersRound className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">Profiles</p><p className="font-heading text-2xl font-semibold">{rows.length}</p></div></CardContent></Card>
        <Card className="rounded-[1.2rem]"><CardContent className="flex items-center gap-3 p-4"><ShieldCheck className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">Active</p><p className="font-heading text-2xl font-semibold">{rows.filter((row) => row.status === 'active').length}</p></div></CardContent></Card>
        <Card className="rounded-[1.2rem]"><CardContent className="flex items-center gap-3 p-4"><UserRound className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">Booking Managers</p><p className="font-heading text-2xl font-semibold">{rows.filter((row) => row.role === 'booking_staff' && row.status === 'active').length}</p></div></CardContent></Card>
        <Card className="rounded-[1.2rem]"><CardContent className="flex items-center gap-3 p-4"><UserRound className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">Ride Managers</p><p className="font-heading text-2xl font-semibold">{rows.filter((row) => row.role === 'manager' && row.status === 'active').length}</p></div></CardContent></Card>
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-xl font-semibold">Team directory</CardTitle><p className="mt-1 text-xs text-muted-foreground">{visible.length} profiles</p></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_220px] lg:w-[620px]"><label className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or role..." className="h-10 rounded-full bg-white pl-9" /></label><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-full border border-border bg-white px-3 text-sm font-semibold"><option value="">All roles</option>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4">
          {!visible.length ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No matching profiles.</div> : visible.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-2xl border border-border p-4 lg:grid-cols-[1.2fr_0.8fr_1.5fr_auto] lg:items-center">
              <div className="flex items-center gap-3">
                {row.avatar_url ? <img src={row.avatar_url} alt={row.full_name || 'Profile'} className="size-11 rounded-2xl object-cover" /> : <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><UserRound className="size-5" /></span>}
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-semibold">{titleCase(row.full_name) || 'Unnamed user'}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.email || '-'}</p>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                    <span>{row.phone || 'No phone'}</span>
                    <span>·</span>
                    {row.nationality ? <><CountryFlagBadge nationality={row.nationality} /><span>{row.nationality}</span></> : <span>No nationality</span>}
                  </div>
                </div>
              </div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Role</p><p className="mt-1 text-sm font-bold">{portalRoleLabel(row.role || '')}</p><span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(row.status)}`}>{titleCase(row.status)}</span></div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Portal Access</p><div className="mt-2 flex flex-wrap gap-1.5">{(accessByRole[row.role || ''] || ['No access assigned']).slice(0, 6).map((item) => <span key={item} className="rounded-full bg-[#F4F7F8] px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{item}</span>)}</div></div>
              {isSuperAdmin ? <div className="flex flex-wrap gap-2 lg:justify-end"><Button type="button" size="sm" variant="outline" onClick={() => { setEditing(row); setModalOpen(true); }} className="rounded-full"><Pencil className="size-3.5" />Edit</Button><Button type="button" size="sm" variant="outline" onClick={() => sendReset(row)} className="rounded-full"><KeyRound className="size-3.5" />Reset</Button></div> : <span className="rounded-full border border-primary/15 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary">Admin Access</span>}
            </div>
          ))}
        </CardContent>
      </Card>

      {modalOpen && isSuperAdmin ? <TeamModal row={editing} saving={saving} error={error} onClose={() => { setModalOpen(false); setEditing(null); setError(''); }} onSave={save} /> : null}
    </section>
  );
}
