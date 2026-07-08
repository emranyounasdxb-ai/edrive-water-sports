'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { FileClock, ImagePlus, KeyRound, MoreHorizontal, Pencil, PhoneCall, Plus, Search, SlidersHorizontal, UploadCloud, UserCog, UsersRound, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

type StaffRecord = {
  id: string;
  avatarUrl: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  gender: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiryDate: string;
  emiratesId: string;
  emiratesIdExpiryDate: string;
  role: string;
  department: string;
  status: string;
  notes: string;
};

type StaffFormValues = Omit<StaffRecord, 'id'> & {
  temporaryPassword: string;
};

type SelectOption = {
  value: string;
  label: string;
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

const countryCodes = [
  'AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ',
  'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR',
  'IO', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC',
  'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO',
  'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF',
  'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY',
  'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM',
  'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY',
  'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX',
  'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI',
  'NE', 'NG', 'NU', 'NF', 'MK', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH',
  'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC',
  'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS',
  'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK',
  'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU',
  'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW', 'XK'
];

const priorityCountryCodes = ['AE', 'PK', 'IN', 'PH', 'NP', 'LK', 'BD', 'ID', 'DZ', 'EG', 'JO', 'SY', 'LB', 'MA', 'KE', 'UG', 'GH', 'NG', 'ET'];
const genderOptions = ['Male', 'Female', 'Other'];
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function countryName(code: string) {
  const names: Record<string, string> = {
    AE: 'UAE',
    PS: 'Palestine',
    CD: 'Congo (DRC)',
    CG: 'Congo',
    CI: 'Ivory Coast',
    KR: 'South Korea',
    KP: 'North Korea',
    LA: 'Laos',
    RU: 'Russia',
    SY: 'Syria',
    TZ: 'Tanzania',
    US: 'United States',
    GB: 'United Kingdom',
    VN: 'Vietnam',
    XK: 'Kosovo'
  };
  return names[code] || regionNames.of(code) || code;
}

function toNationalityOption(code: string): SelectOption {
  const value = countryName(code);
  return { value, label: value };
}

const nationalityOptions: SelectOption[] = [
  ...priorityCountryCodes.map(toNationalityOption),
  ...countryCodes
    .filter((code) => !priorityCountryCodes.includes(code))
    .map(toNationalityOption)
    .sort((a, b) => a.value.localeCompare(b.value)),
  { value: 'Other', label: 'Other' }
];

const countryCodeByNationality = nationalityOptions.reduce<Record<string, string>>((codes, option) => {
  const code = countryCodes.find((item) => countryName(item) === option.value);
  if (code) codes[option.value] = code;
  return codes;
}, { UAE: 'AE', 'United Arab Emirates': 'AE' });

const reverse = (map: Record<string, string>, value?: string) => Object.keys(map).find((key) => map[key] === value) || value || '';

const emptyForm: StaffFormValues = {
  avatarUrl: '',
  fullName: '',
  email: '',
  phone: '',
  nationality: '',
  gender: '',
  dateOfBirth: '',
  passportNumber: '',
  passportExpiryDate: '',
  emiratesId: '',
  emiratesIdExpiryDate: '',
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
    nationality: toText(row.nationality),
    gender: toText(row.gender),
    dateOfBirth: toText(row.date_of_birth),
    passportNumber: toText(row.passport_number),
    passportExpiryDate: toText(row.passport_expiry_date),
    emiratesId: toText(row.emirates_id),
    emiratesIdExpiryDate: toText(row.emirates_id_expiry_date),
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

function formatDate(value: string) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return '';
  const birthDate = new Date(`${dateOfBirth}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age > 0 ? `${age} years` : '';
}

function expiryTone(expiryDate: string) {
  if (!expiryDate) return 'muted';
  const today = new Date();
  const expiry = new Date(`${expiryDate}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return 'muted';
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'expired';
  if (days <= 90) return 'soon';
  return 'valid';
}

function normalizePhoneForWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `971${digits.slice(1)}`;
  return digits;
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

function CountryFlag({ nationality }: { nationality: string }) {
  const code = countryCodeByNationality[nationality];
  if (!code) return <span className="flex size-6 items-center justify-center rounded-full bg-primary-50 text-[10px] font-bold text-primary">--</span>;
  return <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={`${nationality} flag`} className="h-4 w-6 rounded-[0.25rem] border border-white object-cover shadow-sm" loading="lazy" />;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-3.5" aria-hidden="true">
      <path fill="currentColor" d="M16.04 3C9.39 3 4 8.32 4 14.88c0 2.1.56 4.15 1.62 5.95L4 29l8.36-1.58a12.3 12.3 0 0 0 3.68.55C22.68 27.97 28 22.65 28 16.1S22.68 3 16.04 3Zm.01 22.9c-1.18 0-2.34-.18-3.44-.54l-.49-.16-4.95.94.96-4.8-.26-.5a9.71 9.71 0 0 1-1.47-5.1c0-5.38 4.43-9.75 9.87-9.75 5.43 0 9.72 4.47 9.72 9.85 0 5.37-4.42 10.06-9.94 10.06Zm5.5-7.28c-.3-.15-1.8-.88-2.08-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.36.23-.66.08-.3-.15-1.27-.46-2.42-1.47-.9-.78-1.5-1.75-1.67-2.04-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.62-.93-2.22-.25-.58-.5-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.48s1.08 2.88 1.23 3.08c.15.2 2.13 3.22 5.16 4.52.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.8-.73 2.05-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35Z" />
    </svg>
  );
}

function ContactCell({ email, phone }: { email: string; phone: string }) {
  const whatsappPhone = normalizePhoneForWhatsapp(phone);
  return (
    <div className="min-w-[12rem]">
      <p className="text-sm text-foreground">{email || '-'}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {phone ? <a href={`tel:${phone}`} className="inline-flex size-6 items-center justify-center rounded-full bg-sky-50 text-sky-600 transition hover:bg-sky-100" aria-label={`Call ${phone}`}><PhoneCall className="size-3.5" aria-hidden="true" /></a> : null}
        {whatsappPhone ? <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[#25D366] transition hover:bg-emerald-100" aria-label={`WhatsApp ${phone}`}><WhatsAppIcon /></a> : null}
        <span>{phone || '-'}</span>
      </div>
    </div>
  );
}

function NationalityText({ value }: { value: string }) {
  return <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><CountryFlag nationality={value} />{value || '-'}</span>;
}

function RoleText({ value }: { value: string }) {
  const display = value === 'Manager / Operations' ? 'Manager' : value;
  return <span title={value} className="text-sm font-semibold text-foreground">{display || '-'}</span>;
}

function StatusPill({ value }: { value: string }) {
  const tones: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Inactive: 'bg-slate-50 text-slate-600 border-slate-100',
    Suspended: 'bg-red-50 text-red-700 border-red-100'
  };
  return <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]', tones[value] || 'bg-slate-50 text-slate-600 border-slate-100')}>{value || '-'}</span>;
}

function DocumentCell({ number, expiry }: { label: string; number: string; expiry: string }) {
  const tone = expiryTone(expiry);
  return (
    <div className="min-w-[9rem] leading-5">
      <p className="truncate text-sm font-bold text-foreground">{number || '-'}</p>
      <p className={cn('mt-0.5 flex items-center gap-1.5 text-xs font-semibold', tone === 'expired' && 'text-red-600', tone === 'soon' && 'text-amber-700', tone === 'valid' && 'text-muted-foreground', tone === 'muted' && 'text-muted-foreground')}>
        <span className={cn('size-1.5 rounded-full', tone === 'expired' && 'bg-red-500', tone === 'soon' && 'bg-amber-500', tone === 'valid' && 'bg-emerald-500', tone === 'muted' && 'bg-slate-300')} />
        {expiry ? `Exp: ${formatDate(expiry)}` : 'Expiry not set'}
      </p>
    </div>
  );
}

function ActionMenu({ row, onEdit }: { row: StaffRecord; onEdit: (record: StaffRecord) => void }) {
  return (
    <details className="group relative inline-block text-left">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-bold text-foreground shadow-sm transition hover:border-primary/30 hover:text-primary group-open:border-primary/40">
        <MoreHorizontal className="size-4" aria-hidden="true" /> Actions
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-[0_18px_45px_rgba(8,37,50,0.16)]">
        <button type="button" onClick={() => onEdit(row)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-foreground transition hover:bg-primary-50 hover:text-primary"><Pencil className="size-4" aria-hidden="true" />Edit / Sync</button>
        <Link href={`/admin/staff-password?email=${encodeURIComponent(row.email)}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-foreground transition hover:bg-primary-50 hover:text-primary"><KeyRound className="size-4" aria-hidden="true" />Password Page</Link>
      </div>
    </details>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const availableNationalities = useMemo(() => [...new Set(staff.map((item) => item.nationality).filter(Boolean))].sort(), [staff]);

  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return staff.filter((item) => {
      const searchable = [item.fullName, item.email, item.phone, item.nationality, item.gender, item.role, item.passportNumber, item.emiratesId].join(' ').toLowerCase();
      return (!query || searchable.includes(query))
        && (!roleFilter || item.role === roleFilter)
        && (!nationalityFilter || item.nationality === nationalityFilter)
        && (!statusFilter || item.status === statusFilter);
    });
  }, [nationalityFilter, roleFilter, searchTerm, staff, statusFilter]);

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
      nationality: values.nationality,
      gender: values.gender,
      date_of_birth: values.dateOfBirth || null,
      passport_number: values.passportNumber,
      passport_expiry_date: values.passportExpiryDate || null,
      emirates_id: values.emiratesId,
      emirates_id_expiry_date: values.emiratesIdExpiryDate || null,
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

  const tableColumns = isSuperAdmin ? 9 : 8;

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
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Create staff records, identity details, and sync the same email, name, and temporary password with Supabase Auth.</p>
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
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle className="text-base">Records</CardTitle>
              <CardDescription>{isSuperAdmin ? 'Only Super Admin can edit staff identity details and sync login passwords.' : 'Staff records are visible, but edit and login sync are restricted to Super Admin.'}</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_150px_170px_140px] xl:w-[780px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search staff, passport, EID..." className="h-10 w-full rounded-2xl border border-border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary" />
              </label>
              <FilterSelect label="Role" value={roleFilter} options={Object.keys(roleMap)} onChange={setRoleFilter} />
              <FilterSelect label="Nationality" value={nationalityFilter} options={availableNationalities} onChange={setNationalityFilter} />
              <FilterSelect label="Status" value={statusFilter} options={Object.keys(statusMap)} onChange={setStatusFilter} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />Showing {filteredStaff.length} of {staff.length} staff records</div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <TableRow>
                  {['Photo', 'Staff', 'Contact', 'Nationality', 'Role', 'Passport', 'EID', 'Status', ...(isSuperAdmin ? ['Action'] : [])].map((column) => <TableHead key={column} className="text-[11px]">{column}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length ? filteredStaff.map((row) => {
                  const age = calculateAge(row.dateOfBirth);
                  return (
                    <TableRow key={row.id} className="group align-middle transition hover:bg-primary-50/35">
                      <TableCell className="py-3"><div className="flex items-center gap-2"><span className="h-11 w-1 rounded-full bg-transparent transition group-hover:bg-primary" />{row.avatarUrl ? <img src={row.avatarUrl} alt={row.fullName || 'Staff'} className="size-12 rounded-2xl border-2 border-white object-cover shadow-[0_8px_18px_rgba(8,37,50,0.12)]" /> : <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ImagePlus className="size-4" aria-hidden="true" /></span>}</div></TableCell>
                      <TableCell className="min-w-[11rem] py-3">
                        <p className="font-semibold text-foreground">{row.fullName || '-'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{[row.gender, age].filter(Boolean).join(' • ') || 'Gender / age not set'}</p>
                      </TableCell>
                      <TableCell className="py-3"><ContactCell email={row.email} phone={row.phone} /></TableCell>
                      <TableCell className="min-w-[10rem] py-3"><NationalityText value={row.nationality} /></TableCell>
                      <TableCell className="min-w-[8rem] py-3"><RoleText value={row.role} /></TableCell>
                      <TableCell className="py-3"><DocumentCell label="Passport" number={row.passportNumber} expiry={row.passportExpiryDate} /></TableCell>
                      <TableCell className="py-3"><DocumentCell label="EID" number={row.emiratesId} expiry={row.emiratesIdExpiryDate} /></TableCell>
                      <TableCell className="py-3"><StatusPill value={row.status} /></TableCell>
                      {isSuperAdmin ? (
                        <TableCell className="py-3"><ActionMenu row={row} onEdit={openEdit} /></TableCell>
                      ) : null}
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={tableColumns} className="h-28 text-center text-sm text-muted-foreground">{loading ? 'Loading records...' : 'No staff records match the current filters.'}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {open ? <StaffModal initialValues={editing || undefined} onClose={() => { setOpen(false); setEditing(null); }} onSubmit={handleSave} /> : null}
    </div>
  );
}

function StaffModal({ initialValues, onClose, onSubmit }: { initialValues?: StaffRecord; onClose: () => void; onSubmit: (values: StaffFormValues, file?: File) => Promise<void> }) {
  const [values, setValues] = useState<StaffFormValues>({ ...emptyForm, ...initialValues, temporaryPassword: '' });
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
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Super Admin Form</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{initialValues ? 'Edit Staff & Sync Login' : 'Add Staff & Create Login'}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-foreground sm:col-span-2 lg:col-span-3">Profile Photo
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
            <FormInput label="Phone / WhatsApp" type="tel" value={values.phone} required onChange={(value) => updateField('phone', value)} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2 lg:col-span-3">Temporary Password
              <div className="flex gap-2">
                <input type="text" value={values.temporaryPassword} onChange={(event) => updateField('temporaryPassword', event.target.value)} placeholder={initialValues ? 'Leave blank if password is not changing' : 'Required for new staff'} className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" />
                <Button type="button" variant="outline" onClick={() => updateField('temporaryPassword', makeTemporaryPassword())}>Generate</Button>
              </div>
              <span className="text-xs font-normal leading-5 text-muted-foreground">Used to create/update the Supabase Auth login for this staff email.</span>
            </label>
            <SelectInput label="Nationality" value={values.nationality} options={nationalityOptions} required onChange={(value) => updateField('nationality', value)} />
            <SelectInput label="Gender" value={values.gender} options={genderOptions} required onChange={(value) => updateField('gender', value)} />
            <FormInput label="Date of Birth" type="date" value={values.dateOfBirth} onChange={(value) => updateField('dateOfBirth', value)} />
            <FormInput label="Passport Number" value={values.passportNumber} onChange={(value) => updateField('passportNumber', value)} />
            <FormInput label="Passport Expiry" type="date" value={values.passportExpiryDate} onChange={(value) => updateField('passportExpiryDate', value)} />
            <FormInput label="Emirates ID / EID Number" value={values.emiratesId} onChange={(value) => updateField('emiratesId', value)} />
            <FormInput label="EID Expiry" type="date" value={values.emiratesIdExpiryDate} onChange={(value) => updateField('emiratesIdExpiryDate', value)} />
            <SelectInput label="Role" value={values.role} options={Object.keys(roleMap)} required onChange={(value) => updateField('role', value)} />
            <SelectInput label="Department" value={values.department} options={departments} onChange={(value) => updateField('department', value)} />
            <SelectInput label="Status" value={values.status} options={Object.keys(statusMap)} required onChange={(value) => updateField('status', value)} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2 lg:col-span-3">Notes<textarea value={values.notes} onChange={(event) => updateField('notes', event.target.value)} className="min-h-20 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label>
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

function SelectInput({ label, value, options, onChange, required = false }: { label: string; value: string; options: Array<string | SelectOption>; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"><option value="">Select {label}</option>{options.map((option) => { const optionValue = typeof option === 'string' ? option : option.value; const optionLabel = typeof option === 'string' ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option>; })}</select></label>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-2xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary"><option value="">All {label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}
