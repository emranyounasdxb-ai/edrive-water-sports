'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, RefreshCw, UserCheck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bookingRequestsTable } from '@/lib/booking-records';
import { bookingCode, bookingDateKey, bookingStage, dubaiTodayKey, packageName, reportText, type OperationsBooking } from '@/lib/operations-reporting';
import { supabase } from '@/lib/supabase-client';

type ManagerRow = { full_name: string | null; email: string | null; status: string | null; role: string | null };
type Workload = { name: string; today: number; upcoming: number; active: number };

function dateOffset(base: string, days: number) {
  const date = new Date(`${base}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function metricTone(value: number, warning = false) {
  if (warning && value > 0) return 'text-red-700';
  return 'text-foreground';
}

function Metric({ label, value, helper, icon: Icon, warning = false }: { label: string; value: number; helper: string; icon: LucideIcon; warning?: boolean }) {
  return <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_30px_rgba(8,37,50,0.05)]"><CardContent className="flex items-start gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className={`mt-1 font-heading text-2xl font-semibold ${metricTone(value, warning)}`}>{value}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-muted-foreground">{helper}</p></div></CardContent></Card>;
}

function stageTone(stage: string) {
  const value = stage.toLowerCase();
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'in progress') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (value === 'assigned' || value === 'confirmed') return 'border-primary/25 bg-primary-50 text-primary';
  if (value === 'no show' || value === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

export function BookingManagerDashboardPage() {
  const [bookings, setBookings] = useState<OperationsBooking[]>([]);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const [bookingResult, managerResult] = await Promise.all([
      supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('admin_users').select('full_name,email,status,role').eq('role', 'manager').eq('status', 'active').order('full_name', { ascending: true }).limit(200)
    ]);
    const firstError = bookingResult.error || managerResult.error;
    if (firstError) setError(firstError.message);
    setBookings((bookingResult.data || []) as OperationsBooking[]);
    setManagers((managerResult.data || []) as ManagerRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const today = dubaiTodayKey();
  const tomorrow = dateOffset(today, 1);
  const activeStatuses = new Set(['Pending', 'Confirmed', 'Assigned', 'In Progress']);

  const summary = useMemo(() => {
    const newRequests = bookings.filter((booking) => bookingStage(booking) === 'Pending').length;
    const unassigned = bookings.filter((booking) => ['Pending', 'Confirmed'].includes(bookingStage(booking)) && !reportText(booking.assigned_manager_name)).length;
    const todayBookings = bookings.filter((booking) => bookingDateKey(booking) === today && !['Cancelled', 'No Show'].includes(bookingStage(booking))).length;
    const tomorrowBookings = bookings.filter((booking) => bookingDateKey(booking) === tomorrow && !['Cancelled', 'No Show'].includes(bookingStage(booking))).length;
    const conflicts = new Map<string, number>();
    bookings.filter((booking) => activeStatuses.has(bookingStage(booking))).forEach((booking) => {
      const key = `${bookingDateKey(booking)}|${reportText(booking.preferred_time)}|${reportText(booking.assigned_manager_name)}`;
      if (!reportText(booking.assigned_manager_name) || !bookingDateKey(booking) || !reportText(booking.preferred_time)) return;
      conflicts.set(key, (conflicts.get(key) || 0) + 1);
    });
    const conflictCount = Array.from(conflicts.values()).filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
    return { newRequests, unassigned, todayBookings, tomorrowBookings, conflictCount };
  }, [bookings, today, tomorrow]);

  const workload = useMemo(() => managers.map((manager) => {
    const name = reportText(manager.full_name || manager.email, 'Manager');
    const rows = bookings.filter((booking) => reportText(booking.assigned_manager_name).toLowerCase() === name.toLowerCase());
    return {
      name,
      today: rows.filter((booking) => bookingDateKey(booking) === today && activeStatuses.has(bookingStage(booking))).length,
      upcoming: rows.filter((booking) => bookingDateKey(booking) > today && ['Assigned', 'Confirmed'].includes(bookingStage(booking))).length,
      active: rows.filter((booking) => bookingStage(booking) === 'In Progress').length
    } as Workload;
  }).sort((a, b) => (b.today + b.active) - (a.today + a.active)), [bookings, managers, today]);

  const actionRows = bookings.filter((booking) => bookingStage(booking) === 'Pending' || (bookingStage(booking) === 'Confirmed' && !reportText(booking.assigned_manager_name))).slice(0, 10);

  return (
    <section className="w-full overflow-hidden px-1 py-1 sm:px-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Booking Manager</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Booking operations</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Review requests, confirm customer details, assign ride managers and monitor booking progress without financial or fleet-editing access.</p></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={load} className="rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button><Button asChild className="rounded-full"><Link href="/admin/bookings">Open Bookings</Link></Button></div>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="New Requests" value={summary.newRequests} helper="Awaiting review" icon={CalendarDays} />
        <Metric label="Unassigned" value={summary.unassigned} helper="Manager required" icon={UserCheck} warning />
        <Metric label="Today" value={summary.todayBookings} helper="Active scheduled rides" icon={Clock3} />
        <Metric label="Tomorrow" value={summary.tomorrowBookings} helper="Upcoming bookings" icon={CheckCircle2} />
        <Metric label="Schedule Conflicts" value={summary.conflictCount} helper="Same manager/date/time" icon={AlertTriangle} warning />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Bookings needing action</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{loading ? <p className="py-8 text-center text-sm font-semibold text-muted-foreground">Loading bookings...</p> : null}{!loading && !actionRows.length ? <p className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No bookings need action.</p> : actionRows.map((booking) => { const stage = bookingStage(booking); return <div key={bookingCode(booking)} className="grid gap-3 rounded-2xl border border-border p-3 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center"><div><p className="text-xs font-bold text-primary">{bookingCode(booking)}</p><p className="mt-1 font-heading text-base font-semibold text-foreground">{reportText(booking.customer_name, 'Guest')}</p><p className="mt-1 text-xs text-muted-foreground">{packageName(booking)}</p></div><div><p className="text-sm font-semibold text-foreground">{bookingDateKey(booking) || 'Date pending'} · {reportText(booking.preferred_time, 'Time pending')}</p><p className="mt-1 text-xs text-muted-foreground">{reportText(booking.customer_phone || booking.customer_email, 'No contact')}</p></div><div className="flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${stageTone(stage)}`}>{stage}</span><Button asChild size="sm" className="rounded-full"><Link href="/admin/bookings">Review</Link></Button></div></div>; })}</CardContent></Card>

        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Ride manager workload</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{!workload.length ? <p className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No active ride managers.</p> : workload.map((row) => <div key={row.name} className="rounded-2xl border border-border p-3"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-2xl bg-primary-50 text-primary"><UsersRound className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-bold text-foreground">{row.name}</p><p className="text-xs text-muted-foreground">{row.today} today · {row.upcoming} upcoming</p></div></div>{row.active > 0 ? <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{row.active} active</span> : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Available</span>}</div></div>)}</CardContent></Card>
      </div>
    </section>
  );
}
