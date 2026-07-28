'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, RefreshCw, Ship, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import {
  type CompanyLedgerEntry, type OperationsBooking, b2bOutstanding, bookingCode, bookingDateKey,
  bookingStage, companyLedgerAmount, directOutstanding, dubaiTodayKey, earnedRevenue, isCancelled,
  isCompleted, isNoShow, isPendingRequest, managerOutstanding, packageName, reportText, sumAmounts
} from '@/lib/operations-reporting';
import { supabase } from '@/lib/supabase-client';
import { CompactKpiCard, CompactMetricStrip, CompactPageHeader } from './shared/compact-presentation';
import { DashboardActionList, DashboardActivityList, DashboardAreaChart, DashboardPanel, DashboardProgressList } from './shared/dashboard-visuals';

type DashboardData = {
  bookings: OperationsBooking[];
  ledger: CompanyLedgerEntry[];
  activeFleet: number;
  activePartners: number;
};

const niceDate = (value: string) => new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', timeZone: 'Asia/Dubai' }).format(new Date(`${value}T12:00:00`));

export function AdminDashboardReconciledPage() {
  const [data, setData] = useState<DashboardData>({ bookings: [], ledger: [], activeFleet: 0, activePartners: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const [bookingResult, ledgerResult, fleetResult, partnerResult] = await Promise.all([
      supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('payment_ledger_entries').select('id,receipt_id,booking_code,account_type,account_name,entry_type,amount,narration,created_at').eq('account_type', 'company').eq('entry_type', 'company_in').order('created_at', { ascending: false }).limit(5000),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_available', true).eq('is_archived', false),
      supabase.from('b2b_agents').select('id', { count: 'exact', head: true }).eq('status', 'Active')
    ]);
    const firstError = bookingResult.error || ledgerResult.error || fleetResult.error || partnerResult.error;
    if (firstError) { console.error('Dashboard load failed', firstError); setError('Unable to load dashboard information. Please try again.'); }
    setData({
      bookings: (bookingResult.data || []) as OperationsBooking[],
      ledger: (ledgerResult.data || []) as CompanyLedgerEntry[],
      activeFleet: fleetResult.count || 0,
      activePartners: partnerResult.count || 0
    });
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const today = dubaiTodayKey();
  const summary = useMemo(() => {
    const todayRows = data.bookings.filter((booking) => bookingDateKey(booking) === today);
    return {
      todayBookings: todayRows.filter((booking) => !isCancelled(booking) && !isNoShow(booking)).length,
      todayRevenue: sumAmounts(todayRows, earnedRevenue),
      outstanding: sumAmounts(data.bookings, (booking) => managerOutstanding(booking) + b2bOutstanding(booking) + directOutstanding(booking)),
      companyReceived: sumAmounts(data.ledger, companyLedgerAmount),
      pending: data.bookings.filter(isPendingRequest).length,
      unassigned: data.bookings.filter((booking) => ['Pending', 'Confirmed'].includes(bookingStage(booking)) && !reportText(booking.assigned_manager_id || booking.assigned_manager_name)).length
    };
  }, [data, today]);

  const daily = useMemo(() => {
    const rows = new Map<string, { bookings: number; revenue: number }>();
    data.bookings.forEach((booking) => {
      const key = bookingDateKey(booking);
      if (!key) return;
      const current = rows.get(key) || { bookings: 0, revenue: 0 };
      current.bookings += 1;
      current.revenue += earnedRevenue(booking);
      rows.set(key, current);
    });
    return Array.from(rows.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  }, [data.bookings]);

  const statuses = useMemo(() => {
    const values = new Map<string, number>();
    data.bookings.forEach((booking) => values.set(bookingStage(booking), (values.get(bookingStage(booking)) || 0) + 1));
    return Array.from(values.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [data.bookings]);

  const packages = useMemo(() => {
    const values = new Map<string, number>();
    data.bookings.forEach((booking) => values.set(packageName(booking), (values.get(packageName(booking)) || 0) + 1));
    return Array.from(values.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data.bookings]);

  const attention = [
    summary.pending ? { title: 'Booking requests awaiting confirmation', meta: 'Review new customer requests', value: String(summary.pending), href: '/admin/bookings', tone: 'warning' as const } : null,
    summary.unassigned ? { title: 'Bookings without a Ride Manager', meta: 'Assignment required before operations', value: String(summary.unassigned), href: '/admin/bookings', tone: 'critical' as const } : null,
    summary.outstanding > 0 ? { title: 'Collections outstanding', meta: 'Manager, B2B and direct balances', value: formatAed(summary.outstanding), href: '/admin/payments', tone: 'warning' as const } : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (loading) return <DashboardLoading />;

  return (
    <section className="space-y-3">
      <CompactPageHeader eyebrow="Command Center" title="Business Overview" description="Today’s bookings, revenue, fleet and operational priorities." actions={<><Button asChild size="sm"><Link href="/admin/bookings">Open Bookings</Link></Button><Button size="sm" variant="outline" onClick={load}><RefreshCw className="size-4" />Refresh</Button></>} />
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}<Button size="sm" variant="ghost" className="ml-2" onClick={load}>Retry</Button></div> : null}
      <CompactMetricStrip>
        <CompactKpiCard label="Today’s Bookings" value={String(summary.todayBookings)} icon={CalendarDays} detail="Active bookings scheduled today." className="ring-1 ring-primary/20" />
        <CompactKpiCard label="Today’s Revenue" value={formatAed(summary.todayRevenue)} icon={WalletCards} detail="Earned revenue from completed rides today." />
        <CompactKpiCard label="Outstanding" value={formatAed(summary.outstanding)} icon={WalletCards} detail="Manager, B2B and direct balances." />
        <CompactKpiCard label="Active Fleet" value={String(data.activeFleet)} icon={Ship} detail="Vehicles currently marked available." />
        <CompactKpiCard label="Active B2B" value={String(data.activePartners)} icon={Building2} detail="Active partner profiles." />
      </CompactMetricStrip>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <DashboardPanel title="Bookings & Revenue Trend" description="Recent scheduled bookings and earned revenue">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-border/60 md:border-b-0 md:border-r"><DashboardAreaChart labels={daily.map(([day]) => niceDate(day))} series={[{ name: 'Bookings', color: '#0891b2', values: daily.map(([, row]) => row.bookings) }]} ariaLabel="Recent booking count trend" /></div>
            <DashboardAreaChart labels={daily.map(([day]) => niceDate(day))} series={[{ name: 'Earned Revenue', color: '#0f8f91', values: daily.map(([, row]) => row.revenue) }]} formatValue={formatAed} ariaLabel="Recent earned revenue trend" />
          </div>
        </DashboardPanel>
        <DashboardPanel title="Needs Attention" description="Operational work requiring follow-up"><DashboardActionList items={attention} /></DashboardPanel>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardPanel title="Booking Status"><DashboardProgressList items={statuses.map(([label, value]) => ({ label, value }))} empty="No booking status data is available." /></DashboardPanel>
        <DashboardPanel title="Top Packages"><DashboardProgressList items={packages.map(([label, value]) => ({ label, value, color: '#0891b2' }))} empty="No package activity is available." /></DashboardPanel>
      </div>
      <DashboardPanel title="Recent Operational Activity">
        <DashboardActivityList items={data.bookings.slice(0, 7).map((booking) => ({
          title: `${bookingCode(booking)} · ${reportText(booking.customer_name, 'Guest')}`,
          meta: `${packageName(booking)} · ${bookingStage(booking)}`,
          time: bookingDateKey(booking) ? niceDate(bookingDateKey(booking)) : '',
          icon: isCompleted(booking) ? CheckCircle2 : CalendarDays,
          href: '/admin/bookings'
        }))} />
      </DashboardPanel>
    </section>
  );
}

function DashboardLoading() {
  return <section className="space-y-3 animate-pulse"><div className="h-12 w-72 rounded-xl bg-slate-200" /><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 rounded-xl bg-white" />)}</div><div className="grid gap-3 xl:grid-cols-[2fr_1fr]"><div className="h-72 rounded-2xl bg-white" /><div className="h-72 rounded-2xl bg-white" /></div></section>;
}
