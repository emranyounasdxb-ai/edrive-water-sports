'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { KeyRound, Pencil, Plus, RefreshCw, Search, ShieldCheck, UserCheck, UserRound, UsersRound, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { recordAuditLog } from '@/lib/audit-log';
import { supabase } from '@/lib/supabase-client';

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'booking_staff', label: 'Booking Staff' },
  { value: 'finance', label: 'Finance' },
  { value: 'maintenance_staff', label: 'Maintenance Staff' },
  { value: 'manager', label: 'Manager' }
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
];

const accessByRole: Record<string, string[]> = {
  super_admin: ['Full portal access'],
  admin: ['Dashboard', 'Bookings', 'Schedule', 'Customers', 'Packages', 'Fleet', 'Payments', 'Reports', 'Audit Log'],
  booking_staff: ['Dashboard', 'Bookings', 'Schedule', 'Customers', 'Packages'],
  finance: ['Dashboard', 'Schedule', 'Customers', 'Payments', 'Reports', 'Audit Log'],
  maintenance_staff: ['Dashboard', 'Schedule', 'Fleet', 'Maintenance'],
  manager: ['Today', 'My Rides', 'Schedule', 'Collections']
};

const countryCodes: Record<string, string> = {
  UAE: 'AE',
  'United Arab Emirates': 'AE',
  Pakistan: 'PK',
  India: 'IN',
  Philippines: 'PH',
  Nepal: 'NP',
  'Sri Lanka': 'LK',
  Bangladesh: 'BD',
  Indonesia: 'ID',
  Algeria: 'DZ',
  Egypt: 'EG',
  Jordan: 'JO',
  Syria: 'SY',
  Lebanon: 'LB',
  Morocco: 'MA',
  Kenya: 'KE',
  Uganda: 'UG',
  Ghana: 'GH',
  Nigeria: 'NG',
  Ethiopia: 'ET',
  Tanzania: 'TZ',
  'United Kingdom': 'GB',
  'United States': 'US'
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
  role: 'manager',
  department: 'Operations',
  status: 'active',
  avatarUrl: '',
  notes: ''
};

function displayRole(role: string | null | undefined) {
  return roleOptions.find((item) => item.value === role)?.label || String(role || 'Unknown');
}

function displayStatus(status: string | null | undefined) {
  return statusOptions.find((item) => item.value === status)?.label || String(status || 'Unknown');
}

function displayName(value: string | null | undefined) {
  return String(value || '').trim().replace(/\s+/g, ' ').split(' ').map((part) => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function flagCode(nationality: string | null | undefined) {
  const value = String(nationality || '').trim();
  if (value.length === 2) return value.toUpperCase();
  return countryCodes[value] || '';
}

function TeamAvatar({ row }: { row: TeamRow }) {
  const code = flagCode(row.nationality);
  return (
    <div className="relative shrink-0">
      {row.avatar_url ? <img src={row.avatar_url} alt={row.full_name || 'Team member'} className="size-12 rounded-2xl border-2 border-white object-cover shadow-sm" /> : <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary shadow-sm"><UserRound className="size-5" aria-hidden="true" /></span>}
      {code ? <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={`${row.nationality || code} flag`} className="absolute -bottom-1 -right-1 h-3.5 w-5 rounded-[0.2rem] border border-white object-cover shadow-sm" /> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const clean = String(status || '').toLowerCase();
  const className = clean === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : clean === 'suspended' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>{displayStatus(status)}</span>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UsersRound }) {
  return <Card className="rounded-[1.25rem] bg-white"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div><span className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span></CardContent></Card>;
}

function TeamModal({ row, saving, error, onClose, onSave }: { row: TeamRow | null; saving: boolean; error: string; onClose: () => void; onSave: (form: TeamForm) => Promise<void> }) {
  const [form, setForm] = useState<TeamForm>(() => row ? {
    authUserId: row.auth_user_id || '',
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    nationality: row.nationality || '',
    role: row.role || 'manager',
    department: row.department || '',
    status: row.status || 'active',
    avatarUrl: row.avatar_url || '',
    notes: row.notes || ''
  } : emptyForm);

  function change(key: keyof TeamForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-900/40 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-[#F7FAFA] px-4 py-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Team & Access</p><h2 className="mt-1 font-heading text-xl font-semibold">{row ? 'Edit profile and access' : 'Add linked profile'}</h2></div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <form onSubmit={submit} className="max-h-[calc(92vh-4.5rem)] overflow-y-auto p-4">
          {error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          {!row ? <p className="mb-4 rounded-xl border border-primary/15 bg-primary-50 px-3 py-2 text-xs font-semibold leading-5 text-primary-900">Create the user first in Supabase Authentication, then paste the Auth User UID here. No password or service key is stored in the website.</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Auth User UID<Input value={form.authUserId} onChange={(event) => change('authUserId', event.target.value)} required={!row} placeholder="Supabase Auth user UID" className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Full Name<Input value={form.fullName} onChange={(event) => change('fullName', event.target.value)} required className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Email<Input type="email" value={form.email} onChange={(event) => change('email', event.target.value)} required className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Phone<Input value={form.phone} onChange={(event) => change('phone', event.target.value)} className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Nationality<Input value={form.nationality} onChange={(event) => change('nationality', event.target.value)} placeholder="Sri Lanka" className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">Role<select value={form.role} onChange={(event) => change('role', event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold">{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold">Status<select value={form.status} onChange={(event) => change('status', event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold">Department<Input value={form.department} onChange={(event) => change('department', event.target.value)} className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Avatar URL<Input value={form.avatarUrl} onChange={(event) => change('avatarUrl', event.target.value)} placeholder="Optional public image URL" className="h-11 rounded-xl" /></label>
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Notes<textarea value={form.notes} onChange={(event) => change('notes', event.target.value)} className="min-h-24 rounded-xl border border-border bg-white p-3 text-sm" /></label>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button><Button type="submit" disabled={saving} className="rounded-full">{saving ? 'Saving...' : row ? 'Save Access' : 'Add Profile'}</Button></div>
        </form>
      </div>
    </div>
  );
}

export function TeamAccessPage() {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const authUser = userData.user;
    if (!authUser) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const authEmail = authUser.email || '';
    const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
    const { data: profiles } = await supabase.from('admin_users').select('role,status').or(filter).limit(1);
    const profile = (profiles?.[0] || null) as { role?: string | null; status?: string | null } | null;
    const canManage = profile?.role === 'super_admin' && profile?.status === 'active';
    setAllowed(canManage);
    if (!canManage) {
      setLoading(false);
      return;
    }

    const { data, error: loadError } = await supabase.from('admin_users').select('id,auth_user_id,full_name,email,phone,nationality,role,department,status,avatar_url,notes,created_at').order('full_name', { ascending: true }).limit(500);
    if (loadError) setError(loadError.message);
    else setRows((data || []) as TeamRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const metrics = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === 'active').length,
    managers: rows.filter((row) => row.role === 'manager' && row.status === 'active').length,
    blocked: rows.filter((row) => row.status !== 'active').length
  }), [rows]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !term || [row.full_name, row.email, row.phone, row.nationality, row.department, row.role].some((value) => String(value || '').toLowerCase().includes(term));
      return matchesSearch && (!roleFilter || row.role === roleFilter) && (!statusFilter || row.status === statusFilter);
    });
  }, [query, roleFilter, rows, statusFilter]);

  function openAdd() {
    setEditing(null);
    setError('');
    setModalOpen(true);
  }

  function openEdit(row: TeamRow) {
    setEditing(row);
    setError('');
    setModalOpen(true);
  }

  async function save(form: TeamForm) {
    setSaving(true);
    setError('');
    setNotice('');
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
      await recordAuditLog({
        module: 'team',
        action: editing ? 'team_access_updated' : 'team_profile_created',
        entityType: 'admin_user',
        entityId: editing?.id || form.authUserId.trim(),
        entityLabel: form.fullName.trim(),
        summary: editing ? `Access was updated for ${form.fullName.trim()}.` : `Team profile was created for ${form.fullName.trim()}.`,
        metadata: { email: form.email.trim().toLowerCase(), role: form.role, status: form.status }
      });
      setModalOpen(false);
      setEditing(null);
      setNotice(editing ? 'Team access updated.' : 'Linked team profile created.');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save team profile.');
    } finally {
      setSaving(false);
    }
  }

  async function sendReset(row: TeamRow) {
    const email = String(row.email || '').trim().toLowerCase();
    if (!email) return;
    setError('');
    setNotice('');
    const redirectTo = `${window.location.origin}/admin/reset-password/`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) {
      setError(resetError.message);
      return;
    }
    await recordAuditLog({ module: 'team', action: 'password_reset_sent', entityType: 'admin_user', entityId: row.id, entityLabel: row.full_name, summary: `Password reset email was sent to ${email}.`, metadata: { email } });
    setNotice(`Password reset email sent to ${email}.`);
  }

  if (loading) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading team access...</div>;
  if (!allowed) return <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6"><h1 className="font-heading text-2xl font-semibold text-red-800">Super Admin access required</h1><p className="mt-2 text-sm text-red-700">Only an active Super Admin can manage team profiles and portal access.</p></div>;

  return (
    <section className="w-full py-4 sm:py-6">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Team & Access</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">Portal users and permissions</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Manage linked staff profiles, roles, status and password reset emails without exposing any privileged key in the website.</p></div>
        <div className="flex gap-2"><Button type="button" variant="outline" onClick={load} className="rounded-full"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button><Button type="button" onClick={openAdd} className="rounded-full"><Plus className="size-4" aria-hidden="true" />Add Profile</Button></div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Profiles" value={metrics.total} icon={UsersRound} />
        <Metric label="Active Access" value={metrics.active} icon={UserCheck} />
        <Metric label="Active Managers" value={metrics.managers} icon={UserRound} />
        <Metric label="Inactive / Suspended" value={metrics.blocked} icon={ShieldCheck} />
      </div>

      {error && !modalOpen ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p> : null}

      <Card className="mt-4 overflow-hidden rounded-[1.35rem] border-border/80 bg-white">
        <CardHeader className="border-b border-border/70 bg-[#F7FAFA] px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><CardTitle className="font-heading text-xl font-semibold">Team directory</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{visible.length} of {rows.length} profiles</p></div><div className="grid gap-2 sm:grid-cols-3 xl:w-[680px]"><label className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, role..." className="h-10 rounded-full bg-white pl-9" /></label><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-full border border-border bg-white px-3 text-sm font-semibold"><option value="">All roles</option>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-full border border-border bg-white px-3 text-sm font-semibold"><option value="">All statuses</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 sm:p-4">
          {!visible.length ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No matching team profiles.</div> : null}
          {visible.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-[1.15rem] border border-border/70 bg-white p-3 shadow-sm lg:grid-cols-[1.15fr_0.8fr_0.9fr_1.5fr_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-3"><TeamAvatar row={row} /><div className="min-w-0"><p className="truncate font-heading text-base font-semibold text-foreground">{displayName(row.full_name) || 'Unnamed user'}</p><p className="truncate text-xs text-muted-foreground">{row.email || '-'}</p><p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">{row.phone || 'No phone'} · {row.nationality || 'No nationality'}</p></div></div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Role</p><p className="mt-1 text-sm font-bold text-foreground">{displayRole(row.role)}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.department || 'Department not set'}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={row.status} /></div><p className="mt-1 text-[11px] text-muted-foreground">{row.auth_user_id ? 'Auth linked' : 'Auth UID missing'}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Portal Access</p><div className="mt-1 flex flex-wrap gap-1.5">{(accessByRole[row.role || ''] || ['No modules assigned']).slice(0, 5).map((item) => <Badge key={item} variant="secondary" className="rounded-full text-[10px]">{item}</Badge>)}</div></div>
              <div className="flex flex-wrap gap-2 lg:justify-end"><Button type="button" size="sm" variant="outline" onClick={() => openEdit(row)} className="rounded-full"><Pencil className="size-3.5" aria-hidden="true" />Edit</Button><Button type="button" size="sm" variant="outline" onClick={() => sendReset(row)} disabled={!row.email} className="rounded-full"><KeyRound className="size-3.5" aria-hidden="true" />Reset</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      {modalOpen ? <TeamModal row={editing} saving={saving} error={error} onClose={() => { setModalOpen(false); setEditing(null); setError(''); }} onSave={save} /> : null}
    </section>
  );
}
