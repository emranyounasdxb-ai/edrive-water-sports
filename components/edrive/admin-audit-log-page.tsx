'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign, CalendarPlus, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  ClipboardCheck, Eye, FileDown, Pencil, PlayCircle, ReceiptText, RefreshCw, Search,
  ShieldCheck, UserCheck, UserPlus, WalletCards, type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';
import { safeUiError, uiLabel } from '@/lib/ui-labels';
import { ContentAreaSkeleton } from './route-content-transition';
import { usePortalAccess } from './portal-access';
import { AppDatePicker } from './shared/app-date-picker';
import {
  AppInspectorBody, AppInspectorFooter, AppInspectorHeader, AppInspectorRow,
  AppInspectorSection, AppInspectorSheet, AppInspectorTechnicalDetails,
  AppInspectorTimeline, CopyInspectorButton
} from './shared/app-inspector-sheet';
import { OverflowText } from './shared/overflow-text';

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
    finance: 'Finance'
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

function formatCompactDateTime(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatFullDateTime(value: string) {
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

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border/80 bg-white px-2.5 text-[11px] font-semibold text-muted-foreground">
      <span>{label}</span>
      <strong className="font-heading text-sm font-semibold text-foreground">{value}</strong>
    </span>
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
    const previous = groups[groups.length - 1];
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

function eventIcon(row: AuditRow): LucideIcon {
  const value = `${row.module} ${row.action}`.toLowerCase();
  if (value.includes('no show')) return CircleAlert;
  if (value.includes('ride started')) return PlayCircle;
  if (value.includes('completed') || value.includes('confirmed')) return CircleCheck;
  if (value.includes('manager') && value.includes('assign')) return UserCheck;
  if (value.includes('payment')) return BadgeDollarSign;
  if (value.includes('receipt')) return ReceiptText;
  if (value.includes('wallet')) return WalletCards;
  if (value.includes('export')) return FileDown;
  if (value.includes('provision') || value.includes('user created')) return UserPlus;
  if (value.includes('access') || value.includes('security') || value.includes('auth')) return ShieldCheck;
  if (value.includes('booking') && value.includes('created')) return CalendarPlus;
  return Pencil;
}

function metadataLabel(key: string) {
  const labels: Record<string, string> = {
    format: 'Format',
    row_count: 'Rows Exported',
    report_type: 'Report',
    applied_filter_names: 'Filters'
  };
  return labels[key] || titleCase(key);
}

function metadataValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '' || value === '-') return 'Not specified';
  if (key === 'format') return String(value).toUpperCase();
  if (Array.isArray(value)) return value.length ? value.map((item) => uiLabel(String(item))).join(', ') : 'No filters applied';
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([name, item]) => `${uiLabel(name)}: ${metadataValue(name, item)}`).join(' · ') || 'Not specified';
  return key.includes('type') || key.includes('status') ? uiLabel(String(value)) : String(value);
}

function humanMetadata(row: AuditRow) {
  const metadata = row.metadata || {};
  const entries = Object.entries(metadata).filter(([key]) => !['date_from', 'date_to'].includes(key)).map(([key, value]) => ({ label: metadataLabel(key), value: metadataValue(key, value) }));
  if ('date_from' in metadata || 'date_to' in metadata) {
    const from = clean(metadata.date_from, '');
    const to = clean(metadata.date_to, '');
    entries.splice(Math.min(2, entries.length), 0, { label: 'Date Range', value: from || to ? `${from || 'Start'} to ${to || 'Present'}` : 'All dates' });
  }
  return entries;
}

function DetailsDrawer({ group, onClose }: { group: GroupedAuditRow; onClose: () => void }) {
  const row = group.primary;
  const entries = humanMetadata(row);
  const Icon = eventIcon(row);
  const record = clean(row.entity_label || row.entity_id);
  const copyText = `Event: ${uiLabel(row.action)}\nActor: ${clean(row.actor_name)}\nRecord: ${record}\nTime: ${formatFullDateTime(row.created_at)}\nSummary: ${row.summary}`;

  return (
    <AppInspectorSheet open size="md" onOpenChange={(open) => { if (!open) onClose(); }}>
      <AppInspectorHeader eyebrow={uiLabel(row.module)} title={uiLabel(row.action)} description={`${record} · ${formatFullDateTime(row.created_at)}`} icon={Icon} badges={group.count > 1 ? <span className="rounded-full bg-primary-900 px-2 py-0.5 text-[9px] font-bold text-white">Repeated {group.count} times</span> : null} />
      <AppInspectorBody>
        <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary-50/70 p-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary"><Icon className="size-4" /></span><p className="text-sm font-semibold leading-6 text-foreground">{row.summary}</p></div>
        <AppInspectorSection title="Event Details">
          <AppInspectorRow label="Actor" value={clean(row.actor_name)} />
          <AppInspectorRow label="Email" value={clean(row.actor_email, 'Not specified')} copyable />
          <AppInspectorRow label="Role" value={roleLabel(row.actor_role)} />
          <AppInspectorRow label="Record" value={record} copyable />
          <AppInspectorRow label="Time" value={formatFullDateTime(row.created_at)} />
        </AppInspectorSection>
        <AppInspectorSection title="Event Data">
          {entries.length ? entries.map((entry) => <AppInspectorRow key={entry.label} label={entry.label} value={entry.value} />) : <p className="px-3 py-4 text-xs text-muted-foreground">No additional data recorded.</p>}
        </AppInspectorSection>
        {group.count > 1 ? <AppInspectorSection title={`Repeated ${group.count} times`}><AppInspectorTimeline items={group.rows.map((event, index) => ({ label: `Occurrence ${group.count - index}`, time: formatFullDateTime(event.created_at) }))} /></AppInspectorSection> : null}
        <AppInspectorTechnicalDetails>
          <AppInspectorRow label="Event ID" value={row.id} copyable mono />
          <AppInspectorRow label="Entity Type" value={clean(row.entity_type, 'Not specified')} />
          <AppInspectorRow label="Entity ID" value={clean(row.entity_id, 'Not specified')} copyable mono />
          <AppInspectorRow label="Raw Timestamp" value={row.created_at} copyable mono />
          {row.metadata ? <AppInspectorRow label="Raw Metadata" value={JSON.stringify(row.metadata)} copyable mono /> : null}
        </AppInspectorTechnicalDetails>
      </AppInspectorBody>
      <AppInspectorFooter><CopyInspectorButton text={copyText} /><Button type="button" size="sm" onClick={onClose}>Close</Button></AppInspectorFooter>
    </AppInspectorSheet>
  );
}

function ActivityLine({ row, count }: { row: AuditRow; count: number }) {
  const label = `${uiLabel(row.module)} | ${uiLabel(row.action)}`;
  const Icon = eventIcon(row);
  return (
    <div className="flex min-w-0 items-center gap-1.5" title={label}>
      <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-lg border ${moduleTone(row.module)}`}><Icon className="size-3" aria-hidden="true" /></span>
      <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">{uiLabel(row.module)}</span>
      <span className="truncate text-xs font-bold text-foreground">{uiLabel(row.action)}</span>
      {count > 1 ? <span className="shrink-0 rounded-full bg-primary-900 px-1.5 py-0.5 text-[9px] font-bold text-white">×{count}</span> : null}
    </div>
  );
}

export function AdminAuditLogPage() {
  const { loading: accessLoading, role, status } = usePortalAccess();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [quickRange, setQuickRange] = useState<QuickRange>('all');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<GroupedAuditRow | null>(null);

  const allowed = String(status).toLowerCase() === 'active' && allowedRoles.has(String(role).toLowerCase());

  async function loadLogs() {
    setLoading(true);
    setError('');
    if (!allowed) {
      setLoading(false);
      return;
    }
    const result = role === 'finance'
      ? await supabase.rpc('get_finance_audit_logs', { p_limit: 1000 })
      : await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(1000);
    const { data, error: loadError } = result;
    if (loadError) {
      setRows([]);
      console.error('Audit activity load failed', loadError);
      setError(safeUiError(loadError, 'load'));
    } else {
      setRows((data || []) as AuditRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { if (!accessLoading) void loadLogs(); }, [accessLoading, allowed]);

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

  if (accessLoading && loading) return <ContentAreaSkeleton label="Loading audit access" />;

  if (!accessLoading && !allowed) {
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
    <section className="w-full overflow-hidden px-2 py-2 sm:px-3 lg:px-4 xl:px-5">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">Team & System</p>
            <h1 className="font-heading text-2xl font-semibold leading-none text-foreground">Audit Log</h1>
            <p className="truncate text-xs font-semibold text-muted-foreground">Track operational actions, access changes and security events.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <MetricPill label="Today" value={todayCount} />
          <MetricPill label="Bookings" value={bookingCount} />
          <MetricPill label="Payments" value={paymentCount} />
          <MetricPill label="Users" value={actorCount} />
          <Button type="button" variant="outline" onClick={loadLogs} className="h-8 rounded-full bg-white px-3 text-[11px]"><RefreshCw className="size-3.5" aria-hidden="true" />Refresh</Button>
        </div>
      </div>

      {error ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}

      <Card className="mt-2 overflow-hidden rounded-[1.1rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.05)]">
        <div className="border-b border-border/70 bg-[#F7FAFA] px-2.5 py-2">
          <div className="grid gap-1.5 xl:grid-cols-[150px_minmax(220px,1fr)_118px_118px_142px_125px_58px] xl:items-center">
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold text-foreground">Activity History</p>
              <p className="truncate text-[9px] font-semibold text-muted-foreground">{groupedRows.length} grouped / {filteredRows.length} records</p>
            </div>

            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity..." className="h-8 rounded-lg bg-white pl-8 text-xs" />
            </div>

            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-8 min-w-0 rounded-lg border border-border bg-white px-2 text-[11px] font-semibold text-foreground">
              <option value="all">All modules</option>
              {modules.map((moduleName) => <option key={moduleName} value={moduleName}>{titleCase(moduleName)}</option>)}
            </select>

            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-8 min-w-0 rounded-lg border border-border bg-white px-2 text-[11px] font-semibold text-foreground">
              <option value="all">All actions</option>
              {actions.map((action) => <option key={action} value={action}>{titleCase(action)}</option>)}
            </select>

            <AppDatePicker label="Audit date" value={dateFilter} placeholder="Select date" onChange={(value) => { setDateFilter(value); setQuickRange('all'); }} triggerClassName="h-8 min-w-40 rounded-lg text-[11px]" />

            <select value={quickRange} onChange={(event) => { setQuickRange(event.target.value as QuickRange); setDateFilter(''); }} className="h-8 min-w-0 rounded-lg border border-border bg-white px-2 text-[11px] font-semibold text-foreground">
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>

            <Button type="button" variant="outline" onClick={clearFilters} className="h-8 rounded-lg bg-white px-2 text-[10px]">Clear</Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="hidden max-h-[calc(100vh-13.5rem)] overflow-auto md:block">
            <Table className="w-full min-w-[900px] table-fixed">
              <TableHeader>
                <TableRow className="sticky top-0 z-10 h-8 bg-white shadow-[0_1px_0_rgba(8,37,50,0.08)] hover:bg-white">
                  <TableHead className="w-[132px] px-3 text-[10px]">Time</TableHead>
                  <TableHead className="w-[170px] px-3 text-[10px]">Actor</TableHead>
                  <TableHead className="w-[220px] px-3 text-[10px]">Event</TableHead>
                  <TableHead className="w-[205px] px-3 text-[10px]">Record</TableHead>
                  <TableHead className="px-3 text-[10px]">Summary</TableHead>
                  <TableHead className="w-[48px] px-2 text-right text-[10px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="h-20 text-center text-xs font-semibold text-muted-foreground">Loading audit history...</TableCell></TableRow> : null}
                {!loading && groupedRows.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center"><ClipboardCheck className="mx-auto size-6 text-muted-foreground" aria-hidden="true" /><p className="mt-1 text-sm font-semibold text-foreground">No audit events found</p></TableCell></TableRow> : null}
                {!loading && visibleRows.map((group) => {
                  const row = group.primary;
                  const actorName = clean(row.actor_name);
                  const actorTooltip = [actorName, clean(row.actor_email, ''), roleLabel(row.actor_role)].filter(Boolean).join(' | ');
                  const record = clean(row.entity_label || row.entity_id);
                  const recordTooltip = `${record} | ${titleCase(row.entity_type)}`;

                  return (
                    <TableRow key={row.id} className="h-11 align-middle hover:bg-[#F7FAFA]">
                      <TableCell className="truncate whitespace-nowrap px-3 py-1.5 text-[10px] font-semibold text-muted-foreground" title={formatFullDateTime(row.created_at)}>{formatCompactDateTime(row.created_at)}</TableCell>
                      <TableCell className="px-3 py-1.5" title={actorTooltip}>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-xs font-bold text-foreground">{actorName}</span>
                          <span className="shrink-0 rounded-full bg-[#F0F4F5] px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">{roleLabel(row.actor_role)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-1.5"><ActivityLine row={row} count={group.count} /></TableCell>
                      <TableCell className="px-3 py-1.5 text-xs font-bold text-foreground" title={recordTooltip}><OverflowText value={record} maxWidth="max-w-full" /></TableCell>
                      <TableCell className="px-3 py-1.5 text-xs font-semibold text-foreground"><OverflowText value={row.summary} maxWidth="max-w-full" maxCharacters={90} /></TableCell>
                      <TableCell className="px-2 py-1.5 text-right"><button type="button" onClick={() => setSelected(group)} className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:border-primary/30 hover:text-primary" aria-label="View audit details"><Eye className="size-3" aria-hidden="true" /></button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border/70 md:hidden">
            {loading ? <p className="p-5 text-center text-xs font-semibold text-muted-foreground">Loading audit history...</p> : null}
            {!loading && groupedRows.length === 0 ? <div className="p-7 text-center"><ClipboardCheck className="mx-auto size-7 text-muted-foreground" aria-hidden="true" /><p className="mt-1 font-semibold text-foreground">No audit events found</p></div> : null}
            {!loading && visibleRows.map((group) => {
              const row = group.primary;
              return (
                <button key={row.id} type="button" onClick={() => setSelected(group)} className="block w-full px-3 py-2.5 text-left transition hover:bg-[#F7FAFA]">
                  <div className="flex items-center justify-between gap-2">
                    <ActivityLine row={row} count={group.count} />
                    <Eye className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-foreground">{row.summary}</p>
                  <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">{clean(row.actor_name)} | {formatCompactDateTime(row.created_at)}</p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border/70 bg-[#F7FAFA] px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1.5">
              <span>Rows</span>
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-7 rounded-md border border-border bg-white px-1.5 font-bold text-foreground">
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="truncate">{groupedRows.length ? `${pageStart + 1}-${Math.min(pageStart + pageSize, groupedRows.length)} of ${groupedRows.length}` : '0 results'}</span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1} className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="size-3.5" aria-hidden="true" /></button>
              <span className="min-w-[4.5rem] text-center font-bold text-foreground">{currentPage} / {pageCount}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage >= pageCount} className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page"><ChevronRight className="size-3.5" aria-hidden="true" /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selected ? <DetailsDrawer group={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
