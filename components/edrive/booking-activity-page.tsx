'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardCheck, RefreshCw, Search, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-client';

type ActivityRow = {
  id: string;
  module: string;
  action: string;
  entity_label: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type ActivityFilter = 'all' | 'booking' | 'assignment' | 'ride' | 'cancelled';

function niceDateTime(value: string) {
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function prettyAction(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function tone(action: string) {
  const value = action.toLowerCase();
  if (value.includes('completed') || value.includes('confirmed')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('started') || value.includes('assigned')) return 'border-sky-200 bg-sky-50 text-sky-700';
  if (value.includes('cancel') || value.includes('no_show') || value.includes('unassigned')) return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function matchesFilter(row: ActivityRow, filter: ActivityFilter) {
  if (filter === 'booking') return row.module === 'bookings';
  if (filter === 'assignment') return row.action.includes('manager_');
  if (filter === 'ride') return row.module === 'rides';
  if (filter === 'cancelled') return row.action.includes('cancel') || row.action.includes('no_show');
  return true;
}

export function BookingActivityPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase
      .from('audit_logs')
      .select('id,module,action,entity_label,actor_name,actor_email,actor_role,summary,metadata,created_at')
      .in('module', ['bookings', 'rides'])
      .order('created_at', { ascending: false })
      .limit(1000);
    if (loadError) {
      setError(loadError.message);
      setRows([]);
    } else setRows((data || []) as ActivityRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => matchesFilter(row, filter)).filter((row) => !term || [row.entity_label, row.summary, row.action, row.actor_name, row.actor_email].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [filter, query, rows]);

  const filters: Array<{ id: ActivityFilter; label: string }> = [
    { id: 'all', label: 'All Activity' },
    { id: 'booking', label: 'Bookings' },
    { id: 'assignment', label: 'Assignments' },
    { id: 'ride', label: 'Ride Progress' },
    { id: 'cancelled', label: 'Cancelled / No Show' }
  ];

  return (
    <section className="w-full overflow-hidden px-1 py-1 sm:px-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Booking Operations</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Booking activity</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Read-only operational timeline for booking confirmations, manager assignments, ride progress, cancellations and no shows.</p></div>
        <Button type="button" variant="outline" onClick={load} className="w-fit rounded-full bg-white" data-readonly-allow="true"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.2rem] border-border/80 bg-white"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ClipboardCheck className="size-5" /></span><div><p className="text-xs text-muted-foreground">Events</p><p className="font-heading text-2xl font-semibold">{rows.length}</p></div></CardContent></Card>
        <Card className="rounded-[1.2rem] border-border/80 bg-white"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary"><CalendarDays className="size-5" /></span><div><p className="text-xs text-muted-foreground">Confirmed</p><p className="font-heading text-2xl font-semibold">{rows.filter((row) => row.action === 'booking_confirmed').length}</p></div></CardContent></Card>
        <Card className="rounded-[1.2rem] border-border/80 bg-white"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary"><UserCheck className="size-5" /></span><div><p className="text-xs text-muted-foreground">Assignments</p><p className="font-heading text-2xl font-semibold">{rows.filter((row) => row.action === 'manager_assigned').length}</p></div></CardContent></Card>
        <Card className="rounded-[1.2rem] border-border/80 bg-white"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ClipboardCheck className="size-5" /></span><div><p className="text-xs text-muted-foreground">Completed</p><p className="font-heading text-2xl font-semibold">{rows.filter((row) => row.action === 'ride_completed').length}</p></div></CardContent></Card>
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="font-heading text-xl font-semibold">Operational timeline</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading activity...' : `${visible.length} events`}</p></div><label className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking, action or user..." className="h-10 rounded-full bg-white pl-9" /></label></CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 px-4 py-3">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} data-readonly-allow="true" className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground'}`}>{item.label}</button>)}</div>
        <CardContent className="grid gap-3 p-4">{!loading && !visible.length ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No booking activity found.</div> : visible.map((row) => <div key={row.id} className="grid gap-3 rounded-2xl border border-border/70 bg-white p-4 lg:grid-cols-[1.2fr_1.5fr_1fr_auto] lg:items-center"><div><p className="text-xs font-bold text-primary">{row.entity_label || 'Booking'}</p><p className="mt-1 text-xs text-muted-foreground">{niceDateTime(row.created_at)}</p></div><div><p className="text-sm font-semibold leading-6 text-foreground">{row.summary}</p><p className="mt-1 text-xs text-muted-foreground">{row.module === 'rides' ? 'Ride operations' : 'Booking operations'}</p></div><div><p className="text-xs font-semibold text-foreground">{row.actor_name || row.actor_email || 'System'}</p><p className="mt-1 text-[11px] text-muted-foreground">{row.actor_role || 'system'}</p></div><span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${tone(row.action)}`}>{prettyAction(row.action)}</span></div>)}</CardContent>
      </Card>
    </section>
  );
}
