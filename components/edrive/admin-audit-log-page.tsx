'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Eye, RefreshCw, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';

const allowedRoles = new Set(['super_admin', 'admin', 'finance']);

 type AuditRow = {
  id: string;
  module: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type ProfileRow = {
  role: string | null;
  status: string | null;
};

function clean(value: unknown, fallback = '-') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function titleCase(value: unknown) {
  return clean(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function formatDateTime(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function todayDubaiKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function tone(moduleName: string) {
  const value = moduleName.toLowerCase();
  if (value.includes('payment')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('booking')) return 'border-primary/25 bg-primary-50 text-primary';
  if (value.includes('manager') || value.includes('ride')) return 'border-sky-200 bg-sky-50 text-sky-700';
  if (value.includes('settings') || value.includes('access')) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-border bg-[#F7FAFA] text-muted-foreground';
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_28px_rgba(8,37,50,0.05)]">
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function MetadataModal({ row, onClose }: { row: AuditRow; onClose: () => void }) {
  const entries = Object.entries(row.metadata || {});
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Audit details</p>
            <h2 className="mt-1 break-words font-heading text-xl font-semibold text-foreground">{row.summary}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(row.created_at)}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid max-h-[calc(86vh-7rem)] gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          <Detail label="Actor" value={clean(row.actor_name)} helper={clean(row.actor_email)} />
          <Detail label="Role" value={titleCase(row.actor_role)} />
          <Detail label="Module" value={titleCase(row.module)} />
          <Detail label="Action" value={titleCase(row.action)} />
          <Detail label="Record" value={clean(row.entity_label || row.entity_id)} helper={titleCase(row.entity_type)} />
          <Detail label="Event ID" value={row.id} />
          <div className="sm:col-span-2 rounded-xl bg-[#F7FAFA] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Event data</p>
            {entries.length ? (
              <div className="mt-2 grid gap-2">
                {entries.map(([key, value]) => (
                  <div key={key} className="grid gap-1 rounded-xl border border-border/70 bg-white px-3 py-2 sm:grid-cols-[10rem_1fr]">
                    <span className="text-xs font-bold text-muted-foreground">{titleCase(key)}</span>
                    <span className="break-words text-sm font-semibold text-foreground">{typeof value === 'object' ? JSON.stringify(value) : clean(value)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">No additional data recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
      {helper ? <p className="mt-0.5 break-words text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function AdminAuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessReady, setAccessReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState<AuditRow | null>(null);

  async function checkAccess() {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) {
      setAllowed(false);
      setAccessReady(true);
      return false;
    }
    const authEmail = authUser.email || '';
    const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
    const { data } = await supabase.from('admin_users').select('role,status').or(filter).limit(1);
    const profile = (data?.[0] || null) as ProfileRow | null;
    const canRead = Boolean(profile && String(profile.status || '').toLowerCase() === 'active' && allowedRoles.has(String(profile.role || '').toLowerCase()));
    setAllowed(canRead);
    setAccessReady(true);
    return canRead;
  }

  async function loadLogs() {
    setLoading(true);
    setError('');
    const canRead = accessReady ? allowed : await checkAccess();
    if (!canRead) {
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(1000);
    if (loadError) {
      setRows([]);
      setError(loadError.message.includes('audit_logs') ? 'Audit Log table is not ready. Run supabase/audit-log.sql in Supabase.' : loadError.message);
    } else {
      setRows((data || []) as AuditRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { void loadLogs(); }, []);

  const modules = useMemo(() => Array.from(new Set(rows.map((row) => row.module).filter(Boolean))).sort(), [rows]);
  const actions = useMemo(() => Array.from(new Set(rows.map((row) => row.action).filter(Boolean))).sort(), [rows]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (moduleFilter !== 'all' && row.module !== moduleFilter) return false;
      if (actionFilter !== 'all' && row.action !== actionFilter) return false;
      if (dateFilter && dateKey(row.created_at) !== dateFilter) return false;
      if (!term) return true;
      return [row.summary, row.actor_name, row.actor_email, row.actor_role, row.module, row.action, row.entity_type, row.entity_id, row.entity_label]
        .some((value) => clean(value, '').toLowerCase().includes(term));
    });
  }, [actionFilter, dateFilter, moduleFilter, query, rows]);

  const today = todayDubaiKey();
  const todayCount = rows.filter((row) => dateKey(row.created_at) === today).length;
  const bookingCount = rows.filter((row) => row.module.toLowerCase().includes('booking')).length;
  const paymentCount = rows.filter((row) => row.module.toLowerCase().includes('payment')).length;
  const actorCount = new Set(rows.map((row) => row.actor_email || row.actor_name).filter(Boolean)).size;

  if (!accessReady && loading) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading audit access...</div>;

  if (accessReady && !allowed) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl rounded-[1.5rem] border-border bg-white text-center shadow-[0_18px_45px_rgba(8,37,50,0.07)]">
          <CardContent className="p-7">
            <ShieldCheck className="mx-auto size-10 text-primary" aria-hidden="true" />
            <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Restricted audit history</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Audit history is available to Super Admin, Admin and Finance roles.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Team & System</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">Audit log</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Read-only history of booking, ride, payment, access and system activities.</p>
        </div>
        <Button type="button" variant="outline" onClick={loadLogs} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Today" value={String(todayCount)} helper="Events recorded today" />
        <Metric label="Booking Events" value={String(bookingCount)} helper="Booking workflow activity" />
        <Metric label="Payment Events" value={String(paymentCount)} helper="Receipts and settlements" />
        <Metric label="Active Actors" value={String(actorCount)} helper="Users found in history" />
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white shadow-[0_18px_45px_rgba(8,37,50,0.06)]">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div><CardTitle className="font-heading text-xl font-semibold">Activity history</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">Showing {filtered.length} of {rows.length} events</p></div>
            <div className="relative w-full xl:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actor, booking, action..." className="h-10 rounded-full bg-white pl-9" /></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground"><option value="all">All modules</option>{modules.map((moduleName) => <option key={moduleName} value={moduleName}>{titleCase(moduleName)}</option>)}</select>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground"><option value="all">All actions</option>{actions.map((action) => <option key={action} value={action}>{titleCase(action)}</option>)}</select>
            <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-10 rounded-xl bg-white" />
            <Button type="button" variant="outline" onClick={() => { setQuery(''); setModuleFilter('all'); setActionFilter('all'); setDateFilter(''); }} className="rounded-xl bg-white">Clear filters</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1120px]">
              <TableHeader><TableRow className="bg-[#F7FAFA]"><TableHead className="w-[170px]">Dubai Time</TableHead><TableHead className="w-[190px]">Actor</TableHead><TableHead className="w-[150px]">Module</TableHead><TableHead className="w-[160px]">Action</TableHead><TableHead className="w-[190px]">Record</TableHead><TableHead>Summary</TableHead><TableHead className="w-[90px] text-right">Details</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm font-semibold text-muted-foreground">Loading audit history...</TableCell></TableRow> : null}
                {!loading && filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center"><ClipboardCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" /><p className="mt-2 font-heading text-base font-semibold text-foreground">No audit events found</p><p className="mt-1 text-sm text-muted-foreground">New workflow activities will appear here.</p></TableCell></TableRow> : null}
                {!loading && filtered.map((row) => (
                  <TableRow key={row.id} className="align-top hover:bg-[#F7FAFA]">
                    <TableCell className="whitespace-nowrap py-4 text-xs font-semibold text-muted-foreground">{formatDateTime(row.created_at)}</TableCell>
                    <TableCell className="py-4"><div className="flex items-start gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary"><UserRound className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="break-words text-sm font-bold text-foreground">{clean(row.actor_name)}</p><p className="break-words text-xs text-muted-foreground">{clean(row.actor_email)}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{titleCase(row.actor_role)}</p></div></div></TableCell>
                    <TableCell className="py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone(row.module)}`}>{titleCase(row.module)}</span></TableCell>
                    <TableCell className="py-4 text-sm font-bold text-foreground">{titleCase(row.action)}</TableCell>
                    <TableCell className="py-4"><p className="break-words text-sm font-bold text-foreground">{clean(row.entity_label || row.entity_id)}</p><p className="text-xs text-muted-foreground">{titleCase(row.entity_type)}</p></TableCell>
                    <TableCell className="py-4 text-sm font-semibold leading-6 text-foreground">{row.summary}</TableCell>
                    <TableCell className="py-4 text-right"><Button type="button" size="sm" variant="outline" onClick={() => setSelected(row)} className="rounded-full bg-white"><Eye className="size-4" aria-hidden="true" />View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {selected ? <MetadataModal row={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
