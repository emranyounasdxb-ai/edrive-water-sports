'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingRequestsTable } from '@/lib/booking-records';
import { bookingCode, bookingDateKey, bookingStage, dubaiTodayKey, packageName, reportText, type OperationsBooking } from '@/lib/operations-reporting';
import { supabase } from '@/lib/supabase-client';
import { CompactKpiCard, CompactMetricStrip, CompactPageHeader } from './shared/compact-presentation';
import { DashboardActionList, DashboardActivityList, DashboardPanel, DashboardProgressList } from './shared/dashboard-visuals';

function dateOffset(base: string, days: number) {
  const date = new Date(`${base}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function timeMinutes(value: unknown) {
  const text = reportText(value);
  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return 9999;
  let hour = Number(match[1]);
  if (match[3]?.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (match[3]?.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return hour * 60 + Number(match[2]);
}

export function BookingManagerDashboardPage() {
  const [bookings, setBookings] = useState<OperationsBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const result = await supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(2000);
    if (result.error) { console.error('Booking Manager dashboard load failed', result.error); setError('Unable to load dashboard information. Please try again.'); }
    setBookings((result.data || []) as OperationsBooking[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const today = dubaiTodayKey();
  const tomorrow = dateOffset(today, 1);
  const active = (booking: OperationsBooking) => !['Cancelled', 'No Show'].includes(bookingStage(booking));
  const todayRows = bookings.filter((booking) => bookingDateKey(booking) === today && active(booking)).sort((a, b) => timeMinutes(a.preferred_time) - timeMinutes(b.preferred_time));
  const upcoming = bookings.filter((booking) => bookingDateKey(booking) > today && active(booking));
  const pending = bookings.filter((booking) => bookingStage(booking) === 'Pending');
  const completed = bookings.filter((booking) => bookingStage(booking) === 'Completed');
  const exceptions = bookings.filter((booking) => ['No Show', 'Cancelled'].includes(bookingStage(booking)));
  const unassigned = bookings.filter((booking) => ['Pending', 'Confirmed'].includes(bookingStage(booking)) && !reportText(booking.assigned_manager_id || booking.assigned_manager_name));
  const actionRows = [...pending, ...unassigned.filter((booking) => !pending.includes(booking))].slice(0, 8);
  const statusCounts = useMemo(() => {
    const values = new Map<string, number>();
    bookings.forEach((booking) => values.set(bookingStage(booking), (values.get(bookingStage(booking)) || 0) + 1));
    return Array.from(values.entries()).sort((a, b) => b[1] - a[1]);
  }, [bookings]);
  const packageCounts = useMemo(() => {
    const values = new Map<string, number>();
    bookings.forEach((booking) => values.set(packageName(booking), (values.get(packageName(booking)) || 0) + 1));
    return Array.from(values.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [bookings]);

  if (loading) return <DashboardLoading />;

  return (
    <section className="space-y-3">
      <CompactPageHeader eyebrow="Booking Manager" title="Booking Operations" description="Confirm requests, coordinate Ride Managers and keep today’s schedule moving." actions={<><Button asChild size="sm"><Link href="/admin/bookings">Open Bookings</Link></Button><Button size="sm" variant="outline" onClick={load}><RefreshCw className="size-4" />Refresh</Button></>} />
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}<Button size="sm" variant="ghost" className="ml-2" onClick={load}>Retry</Button></div> : null}
      <CompactMetricStrip>
        <CompactKpiCard label="Today" value={String(todayRows.length)} icon={CalendarDays} detail="Active rides scheduled today." className="ring-1 ring-primary/20" />
        <CompactKpiCard label="Upcoming" value={String(upcoming.length)} icon={Clock3} detail="Future active bookings." />
        <CompactKpiCard label="Awaiting Confirmation" value={String(pending.length)} icon={UserCheck} detail="New booking requests requiring review." />
        <CompactKpiCard label="Completed" value={String(completed.length)} icon={CheckCircle2} detail="Completed booking records." />
        <CompactKpiCard label="No Show / Cancelled" value={String(exceptions.length)} icon={AlertTriangle} detail="Operational exceptions." />
      </CompactMetricStrip>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <DashboardPanel title="Today’s Schedule" description={`${todayRows.length} active rides on the Dubai calendar`}>
          {todayRows.length ? <div className="divide-y divide-border/60">{todayRows.slice(0, 10).map((booking) => <Link href="/admin/bookings" key={bookingCode(booking)} className="grid min-h-14 gap-1 px-4 py-2.5 outline-none hover:bg-primary-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center"><span className="text-sm font-bold tabular-nums text-primary">{reportText(booking.preferred_time, 'TBC')}</span><span className="min-w-0"><span className="block truncate text-xs font-bold">{bookingCode(booking)} · {reportText(booking.customer_name, 'Guest')}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{packageName(booking)} · {reportText(booking.assigned_manager_name, 'Ride Manager required')}</span></span><span className="text-[11px] font-bold text-muted-foreground">{bookingStage(booking)}</span></Link>)}</div> : <div className="px-4 py-8 text-center text-xs font-semibold text-muted-foreground">No active rides are scheduled today.</div>}
        </DashboardPanel>
        <DashboardPanel title="Needs Attention" description="Bookings requiring Booking Manager action">
          <DashboardActionList items={actionRows.map((booking) => ({
            title: bookingStage(booking) === 'Pending' ? `Confirm ${bookingCode(booking)}` : `Assign Ride Manager · ${bookingCode(booking)}`,
            meta: `${reportText(booking.customer_name, 'Guest')} · ${bookingDateKey(booking) || 'Date pending'} ${reportText(booking.preferred_time)}`,
            value: 'Review',
            href: '/admin/bookings',
            tone: bookingStage(booking) === 'Pending' ? 'warning' : 'critical'
          }))} />
        </DashboardPanel>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardPanel title="Booking Status"><DashboardProgressList items={statusCounts.map(([label, value]) => ({ label, value }))} empty="No booking status data is available." /></DashboardPanel>
        <DashboardPanel title="Popular Services"><DashboardProgressList items={packageCounts.map(([label, value]) => ({ label, value, color: '#0891b2' }))} empty="No package activity is available." /></DashboardPanel>
      </div>
      <DashboardPanel title="Recent Booking Activity">
        <DashboardActivityList items={bookings.slice(0, 7).map((booking) => ({ title: `${bookingCode(booking)} · ${reportText(booking.customer_name, 'Guest')}`, meta: `${packageName(booking)} · ${bookingStage(booking)}`, time: bookingDateKey(booking), icon: CalendarDays, href: '/admin/bookings' }))} />
      </DashboardPanel>
    </section>
  );
}

function DashboardLoading() {
  return <section className="space-y-3 animate-pulse"><div className="h-12 w-72 rounded-xl bg-slate-200" /><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 rounded-xl bg-white" />)}</div><div className="grid gap-3 xl:grid-cols-[2fr_1fr]"><div className="h-72 rounded-2xl bg-white" /><div className="h-72 rounded-2xl bg-white" /></div></section>;
}
