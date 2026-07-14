'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';

const allowedRoles = new Set(['super_admin', 'admin', 'finance']);
const duplicateWindowMs = 10 * 60 * 1000;

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

type GroupedAuditRow = {
  primary: AuditRow;
  rows: AuditRow[];
  count: number;
};

type QuickRange = 'all' | 'today' | '7d' | '30d';

function clean(value: unknown, fallback = '-') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function titleCase(value: unknown) {
  return clean(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleLabel(value: unknown) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    booking_staff: 'Booking Manager',
    manager: 'Ride Manager',
    finance: 'Finance',
    maintenance_staff: 'Maintenance Staff'
  };
  const key = clean(value, '').toLowerCase();
  return labels[key] || titleCase(value);
}

function dubaiDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
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

function daysAgoDubaiKey(days: number) {
  return dubaiDateKey(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

function matchesQuickRange(value: string, range: QuickRange) {
  if (range === 'all') return true;
  const key = dubaiDateKey(value);
  if (range === 'today') return key === daysAgoDubaiKey(0);
  if (range === '7d') return key >= daysAgoDubaiKey(6);
  return key >= daysAgoDubaiKey(29);
}

function moduleTone(moduleName: string) {
  const value = moduleName.toLowerCase();
  if (value.includes('payment') || value.includes('receipt') || value.includes('ledger')) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (value.includes('booking')) return 'border-primary/25 bg-primary-50 text-primary';
  if (value.includes('manager') || value.includes('ride')) return 'border-sky-200 bg-sky-50 text-sky-700';
  if (value.includes('team') || value.includes('access') || value.includes('profile')) return 'border-violet-200 bg-violet-50 text-violet-700';
  if (value.includes('security') || value.includes('auth')) return 'border-red-200 bg-red-50 text-red-700';
  return 'border-border bg-[#F7FAFA] text-muted-foreground';
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1rem] border border-border/75 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(8,37,50,0.045)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="font-heading text-2xl font-semibold leading-none text-foreground">{value}</p>
        <p className="text-right text-[10px] font-semibold leading-4 text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}

function Detail({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-[#F7FAFA] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
      {helper ? <p className="mt-0.5 break-words text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function duplicateKey(row: AuditRow) {
  return [
    clean(row.actor_email || row.actor_name, ''),
    clean(row.module, ''),
    clean(row.action, ''),
    clean(row.entity_id || row.entity_label, ''),
    clean(row.summary, '')
  ].join('|').toLowerCase();
}

function groupDuplicateEvents(rows: AuditRow[]) {
  const groups: GroupedAuditRow[] = [];

  rows.forEach((row) => {
    const previous = groups.at(-1);
    const sameEvent = previous && duplicateKey(previous.primary) === duplicateKey(row);
    const closeInTime = previous && Math.abs(new Date(previous.primary.created_at).getTime() - new Date(row.created_at).getTime()) <= duplicateWindowMs;

    if (previous && sameEvent && closeInTime) {
      previous.rows.push(row);
      previous.count += 1;
      return;
    }

    groups.push({ primary: row, rows: [row], count: 1 });
  });

  return groups;
}

function DetailsDrawer({ group, onClose }: { group: GroupedAuditRow; onClose: () => void }) {
  const row = group.primary;
  const entries = Object.entries(row.metadata || {});

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/35 backdrop-blur-[2px]" onMouseDown={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-border bg-white shadow-[-24px_0_70px_rgba(8,37,50,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="Audit event details"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${moduleTone(row.module)}`}>{titleCase(row.module)}</span>
              {group.count > 1 ? <span className="rounded-full bg-primary-900 px-2.5 py-1 text-[10px] font-bold text-white">Repeated ×{group.count}</span> : null}
            </div>
            <h2 className="mt-3 break-words font-heading text-xl font-semibold leading-7 text-foreground">{titleCase(row.action)}</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Latest event: {formatDateTime(row.created_at)}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:text-primary" aria-label="Close details">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Actor" value={clean(row.actor_name)} helper={clean(row.actor_email)} />
            <Detail label="Role" value={roleLabel(row.actor_role)} />
            <Detail label="Record" value={clean(row.entity_label || row.entity_id)} helper={titleCase(row.entity_type)} />
            <Detail label="Event ID" value={row.id} />
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Summary</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{row.summary}</p>
          </div>

          {group.count > 1 ? (
            <div className="mt-4 rounded-xl border border-border/70 bg-[#F7FAFA] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Repeated occurrences</p>
              <div className="mt-2 grid gap-2">
                {group.rows.map((event, index) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 rounded-lg bg-white px-3 py-2 text-xs shadow-sm">
                    <span className="font-bold text-foreground">Occurrence {group.count - index}</span>
                    <span className="font-semibold text-muted-foreground">{formatDateTime(event.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-border/70 bg-[#F7FAFA] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Event data</p>
            {entries.length ? (
              <div className="mt-2 grid gap-2">
                {entries.map(([key, value]) => (
                  <div key={key} className="grid gap-1 rounded-lg border border-border/70 bg-white px-3 py-2 sm:grid-cols-[9rem_1fr]">
                    <span className="text-xs font-bold text-muted-foreground">{titleCase(key)}</span>
                    <span className="break-words text-sm font-semibold text-foreground">{typeof value === 'object' ? JSON.stringify(value) : clean(value)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">No additional data recorded.</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ActivityCell({ row, count }: { row: AuditRow; count: number }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${moduleTone(row.module)}`}>{titleCase(row.module)}</span>
        {count > 1 ? <span className="rounded-full bg-primary-900 px-2 py-0.5 text-[10px] font-bold text-white">×{count}</span> : null}
      </div>
      <p className="mt-1 text-sm font-bold text-foreground">{titleCase(row.action)}</p>
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
  const [quickRange, setQuickRange] = useState<QuickRange>('all');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<GroupedAuditRow | null>(null);

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

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (moduleFilter !== 'all' && row.module !== moduleFilter) return false;
      if (actionFilter !== 'all' && row.action !== actionFilter) return false;
      if (dateFilter && dubaiDateKey(row.created_at) !== dateFilter) return false;
      if (!dateFilter && !matchesQuickRange(row.created_at, quickRange)) return false;
      if (!term) return true;
      return [row.summary, row.actor_name, row.actor_email, row.actor_role, row.module, row.action, row.entity_type, row.entity_id, row.entity_label]
        .some((value) => clean(value, '').toLowerCase().includes(term));
    });
  }, [actionFilter, dateFilter, moduleFilter, query, quickRange, rows]);

  const groupedRows = useMemo(() => groupDuplicateEvents(filteredRows), [filteredRows]);
  const pageCount = Math.max(1, Math.ceil(groupedRows.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleRows = groupedRows.slice(pageStart, pageStart + pageSize);

  useEffect(() => { setCurrentPage(1); }, [actionFilter, dateFilter, moduleFilter, pageSize, query, quickRange]);
  useEffect(() => { if (currentPage > pageCount) setCurrentPage(pageCount); }, [currentPage, pageCount]);

  const todayCount = rows.filter((row) => dubaiDateKey(row.created_at) === daysAgoDubaiKey(0)).length;
  const bookingCount = rows.filter((row) => row.module.toLowerCase().includes('booking')).length;
  const paymentCount = rows.filter((row) => row.module.toLowerCase().includes('payment')).length;
  const actorCount = new Set(rows.map((row) => row.actor_email || row.actor_name).filter(Boolean)).size;

  function clearFilters() {
    setQuery('');
    setModuleFilter('all');
    setActionFilter('all');
    setDateFilter('');
    setQuickRange('all');
  }

  function selectQuickRange(range: QuickRange) {
    setQuickRange(range);
    setDateFilter('');
  }

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
    <section className="w-full overflow-hidden px-2 py-3 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Team & System</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-foreground">Audit log</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Operational activity, access changes and security history.</p>
        </div>
        <Button type="button" variant="outline" onClick={loadLogs} className="h-9 w-fit rounded-full bg-white px-4 text-xs"><RefreshCw className="size-3.5" aria-hidden="true" />Refresh</Button>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Today" value={String(todayCount)} helper="events recorded" />
        <Metric label="Bookings" value={String(bookingCount)} helper="workflow events" />
        <Metric label="Payments" value={String(paymentCount)} helper="finance events" />
        <Metric label="Active Users" value={String(actorCount)} helper="actors in history" />
      </div>

      <Card className="mt-4 overflow-hidden rounded-[1.25rem] border-border/80 bg-white shadow-[0_14px_38px_rgba(8,37,50,0.055)]">
        <div className="border-b border-border/70 bg-[#F7FAFA] px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
            <div className="min-w-[12rem]">
              <p className="font-heading text-lg font-semibold text-foreground">Activity history</p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{groupedRows.length} grouped events from {filteredRows.length} matching records</p>
            </div>

            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actor, record or action..." className="h-9 rounded-xl bg-white pl-9 text-sm" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:flex 2xl:shrink-0">
              <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-9 min-w-[9rem] rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground">
                <option value="all">All modules</option>
                {modules.map((moduleName) => <option key={moduleName} value={moduleName}>{titleCase(moduleName)}</option>)}
              </select>
              <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-9 min-w-[9rem] rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground">
                <option value="all">All actions</option>
                {actions.map((action) => <option key={action} value={action}>{titleCase(action)}</option>)}
              </select>
              <Input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setQuickRange('all'); }} className="h-9 min-w-[9.5rem] rounded-xl bg-white text-xs" />
              <Button type="button" variant="outline" onClick={clearFilters} className="h-9 rounded-xl bg-white px-3 text-xs">Clear</Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden="true" />Quick range</span>
            {([
              ['all', 'All time'],
              ['today', 'Today'],
              ['7d', 'Last 7 days'],
              ['30d', 'Last 30 days']
            ] as Array<[QuickRange, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => selectQuickRange(value)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${quickRange === value && !dateFilter ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:text-primary'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-[150px]">Dubai Time</TableHead>
                  <TableHead className="w-[190px]">Actor</TableHead>
                  <TableHead className="w-[180px]">Activity</TableHead>
                  <TableHead className="w-[180px]">Record</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[64px] text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm font-semibold text-muted-foreground">Loading audit history...</TableCell></TableRow> : null}
                {!loading && groupedRows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center"><ClipboardCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" /><p className="mt-2 font-heading text-base font-semibold text-foreground">No audit events found</p><p className="mt-1 text-sm text-muted-foreground">Try changing the filters.</p></TableCell></TableRow> : null}
                {!loading && visibleRows.map((group) => {
                  const row = group.primary;
                  return (
                    <TableRow key={row.id} className="align-middle hover:bg-[#F7FAFA]">
                      <TableCell className="whitespace-nowrap py-3 text-[11px] font-semibold text-muted-foreground">{formatDateTime(row.created_at)}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary"><UserRound className="size-4" aria-hidden="true" /></span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{clean(row.actor_name)}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{clean(row.actor_email)}</p>
                            <span className="mt-1 inline-flex rounded-full bg-[#F0F4F5] px-2 py-0.5 text-[9px] font-bold text-muted-foreground">{roleLabel(row.actor_role)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3"><ActivityCell row={row} count={group.count} /></TableCell>
                      <TableCell className="py-3"><p className="max-w-[12rem] truncate text-sm font-bold text-foreground">{clean(row.entity_label || row.entity_id)}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{titleCase(row.entity_type)}</p></TableCell>
                      <TableCell className="py-3"><p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{row.summary}</p></TableCell>
                      <TableCell className="py-3 text-right"><button type="button" onClick={() => setSelected(group)} className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:border-primary/30 hover:text-primary" aria-label="View audit details"><Eye className="size-3.5" aria-hidden="true" /></button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border/70 md:hidden">
            {loading ? <p className="p-6 text-center text-sm font-semibold text-muted-foreground">Loading audit history...</p> : null}
            {!loading && groupedRows.length === 0 ? <div className="p-8 text-center"><ClipboardCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" /><p className="mt-2 font-heading font-semibold text-foreground">No audit events found</p></div> : null}
            {!loading && visibleRows.map((group) => {
              const row = group.primary;
              return (
                <button key={row.id} type="button" onClick={() => setSelected(group)} className="block w-full p-4 text-left transition hover:bg-[#F7FAFA]">
                  <div className="flex items-start justify-between gap-3">
                    <ActivityCell row={row} count={group.count} />
                    <Eye className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-foreground">{row.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span>{clean(row.actor_name)} · {roleLabel(row.actor_role)}</span>
                    <span>{formatDateTime(row.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 bg-[#F7FAFA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>Rows</span>
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-8 rounded-lg border border-border bg-white px-2 font-bold text-foreground">
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>{groupedRows.length ? `${pageStart + 1}-${Math.min(pageStart + pageSize, groupedRows.length)} of ${groupedRows.length}` : '0 results'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1} className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="size-4" aria-hidden="true" /></button>
              <span className="min-w-[5rem] text-center text-xs font-bold text-foreground">Page {currentPage} of {pageCount}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage >= pageCount} className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page"><ChevronRight className="size-4" aria-hidden="true" /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selected ? <DetailsDrawer group={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
