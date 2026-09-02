'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookCheck, CalendarPlus, CircleAlert, Clock3, Headphones, ReceiptText, RefreshCw, WalletCards } from 'lucide-react';
import { AgentMetricCard } from '@/components/edrive/agent/agent-metric-card';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { useAgentPortal } from '@/components/edrive/agent/agent-portal-provider';
import { Button } from '@/components/ui/button';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { safeUiError } from '@/lib/ui-labels';
import { DashboardActionList, DashboardActivityList, DashboardAreaChart, DashboardPanel, DashboardProgressList } from '@/components/edrive/shared/dashboard-visuals';
import type { B2BRefundRequest, B2BWalletLedgerEntry } from '@/services/b2b-finance';

type Booking = { id: string; booking_code: string | null; customer_name: string | null; selected_package_name: string | null; preferred_date: string | null; preferred_time: string | null; status: string | null; created_at: string | null };

const niceDate = (value?: string | null) => value ? new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', timeZone: 'Asia/Dubai' }).format(new Date(value.includes('T') ? value : `${value}T12:00:00`)) : '';
const agentDashboardPanelClass = 'border-slate-200/70 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] [&>header]:border-slate-200/60';

export default function AgentDashboardPage() {
  const { profile, agentId, walletBalance, financeSummary: summary, refreshPortal } = useAgentPortal();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<B2BRefundRequest[]>([]);
  const [ledger, setLedger] = useState<B2BWalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [bookingResult, requestResult, ledgerResult] = await Promise.all([
        supabase.from('booking_requests').select('id,booking_code,customer_name,selected_package_name,preferred_date,preferred_time,status,created_at').eq('b2b_agent_id', agentId).order('created_at', { ascending: false }),
        supabase.from('b2b_refund_requests').select('id,booking_request_id,b2b_agent_id,request_type,status,reason,requested_amount_aed,approved_amount_aed,decision_note,requested_at,decided_at').eq('b2b_agent_id', agentId).order('requested_at', { ascending: false }),
        supabase.from('b2b_wallet_ledger').select('id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,reversal_of_entry_id,description,created_at').eq('b2b_agent_id', agentId).order('created_at', { ascending: false }).limit(20)
      ]);
      if (bookingResult.error || requestResult.error || ledgerResult.error) throw new Error(bookingResult.error?.message || requestResult.error?.message || ledgerResult.error?.message);
      setBookings((bookingResult.data || []) as Booking[]);
      setRequests((requestResult.data || []) as B2BRefundRequest[]);
      setLedger((ledgerResult.data || []) as B2BWalletLedgerEntry[]);
      if (refresh) await refreshPortal();
    } catch (loadError) {
      console.error('Partner dashboard load failed', loadError);
      setError(safeUiError(loadError, 'load'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, [agentId]);

  const now = new Date();
  const monthKey = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Dubai' }).format(now);
  const active = bookings.filter((booking) => !['completed', 'cancelled', 'no show', 'no_show'].includes(String(booking.status || '').toLowerCase()));
  const monthBookings = bookings.filter((booking) => String(booking.created_at || booking.preferred_date || '').startsWith(monthKey));
  const pending = requests.filter((request) => request.status === 'Pending');
  const approvedRefunds = summary?.approved_refunds_aed || 0;
  const walletFunded = walletBalance > 0;

  const monthly = useMemo(() => {
    const values = new Map<string, number>();
    bookings.forEach((booking) => {
      const key = String(booking.created_at || booking.preferred_date || '').slice(0, 7);
      if (key) values.set(key, (values.get(key) || 0) + 1);
    });
    return Array.from(values.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [bookings]);

  const packages = useMemo(() => {
    const values = new Map<string, number>();
    bookings.forEach((booking) => {
      const label = booking.selected_package_name || 'Package';
      values.set(label, (values.get(label) || 0) + 1);
    });
    return Array.from(values.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [bookings]);

  const attention = [
    walletBalance < 1000 ? { title: 'Wallet balance is low', meta: 'Contact eDrive before your next booking', value: formatAed(walletBalance), href: '/agent/wallet', tone: 'warning' as const } : null,
    pending.length ? { title: 'Requests awaiting review', meta: 'Cancellation or refund decisions pending', value: String(pending.length), href: '/agent/requests', tone: 'warning' as const } : null,
    active.length ? { title: 'Active partner bookings', meta: 'Review upcoming guest arrangements', value: String(active.length), href: '/agent/bookings', tone: 'info' as const } : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (loading) return <><AgentPageHeader eyebrow="Partner dashboard" title={`Welcome back, ${profile.contact_person || profile.company_name}`} description="Bookings, wallet activity and partner requests." /><DashboardSkeleton /></>;

  return (
    <>
      <AgentPageHeader eyebrow="Partner Command Center" title={`Welcome back, ${profile.contact_person || profile.company_name}`} description="Bookings, wallet activity and partner requests." actions={<><Button asChild size="sm" disabled={!walletFunded}><Link href="/agent/new-booking"><CalendarPlus className="size-4" />New Booking</Link></Button><Button size="sm" variant="outline" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button></>} />
      {error ? <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}<Button size="sm" variant="ghost" className="ml-2" onClick={() => load(true)}>Retry</Button></div> : null}
      <section className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <AgentMetricCard label="Wallet Balance" value={formatAed(walletBalance)} detail="Available partner wallet funds." icon={WalletCards} tone="teal" primary />
        <AgentMetricCard label="Wallet Credits" value={formatAed(summary?.wallet_credits_aed || 0)} detail="Credits posted to the partner wallet." icon={WalletCards} tone="navy" />
        <AgentMetricCard label="Month Bookings" value={String(monthBookings.length)} detail="Bookings created this month." icon={CalendarPlus} tone="teal" />
        <AgentMetricCard label="Pending Requests" value={String(pending.length)} detail="Requests awaiting a decision." icon={Clock3} tone="gold" />
        <AgentMetricCard label="Refund Credits" value={formatAed(approvedRefunds)} detail="Approved wallet refund credits." icon={ReceiptText} tone="green" />
      </section>
      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <DashboardPanel title="Booking Activity" description="Partner bookings created over recent months" className={agentDashboardPanelClass}>
          <DashboardAreaChart labels={monthly.map(([month]) => month)} series={[{ name: 'Bookings', color: '#0f8f91', values: monthly.map(([, value]) => value) }]} ariaLabel="Monthly B2B Agent booking activity" />
        </DashboardPanel>
        <DashboardPanel title="Needs Attention" description="Partner actions and account notices" className={agentDashboardPanelClass}><DashboardActionList items={attention} /></DashboardPanel>
      </section>
      <section className="mt-3 grid gap-3 lg:grid-cols-2">
        <DashboardPanel title="Top Booked Packages" className={agentDashboardPanelClass}><DashboardProgressList items={packages.map(([label, value]) => ({ label, value }))} empty="No package activity is available." /></DashboardPanel>
        <DashboardPanel title="Recent Wallet Activity" className={agentDashboardPanelClass}>
          <DashboardActivityList items={ledger.slice(0, 6).map((entry) => ({ title: entry.description || (entry.direction === 'credit' ? 'Wallet credit' : 'Wallet debit'), meta: `${entry.direction === 'credit' ? '+' : '-'} ${formatAed(Number(entry.amount_aed || 0))}`, time: niceDate(entry.created_at), icon: WalletCards, href: '/agent/wallet' }))} empty="No wallet transactions are available." />
        </DashboardPanel>
      </section>
      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <DashboardPanel title="Upcoming & Recent Bookings" className={agentDashboardPanelClass}>
          <DashboardActivityList items={bookings.slice(0, 7).map((booking) => ({ title: `${booking.booking_code || 'Booking'} · ${booking.customer_name || 'Guest'}`, meta: `${booking.selected_package_name || 'Package'} · ${booking.status || 'Pending'}`, time: niceDate(booking.preferred_date), icon: BookCheck, href: '/agent/bookings' }))} empty="No partner bookings are available." />
        </DashboardPanel>
        <DashboardPanel title="Partner Support" className={agentDashboardPanelClass}>
          <div className="flex min-h-36 flex-col p-4"><div className="flex items-center gap-2 text-sm font-bold"><Headphones className="size-4 text-primary" />eDrive Partner Team</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Get help with bookings or arrange wallet top-up assistance.</p><a href="tel:+971568282268" className="mt-2 text-base font-bold text-primary">+971 56 828 2268</a>{!walletFunded ? <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-800"><CircleAlert className="size-4" />Top-up required before booking.</div> : null}</div>
        </DashboardPanel>
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return <div className="mt-3 animate-pulse space-y-3"><div className="grid grid-cols-2 gap-2 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 rounded-xl bg-white" />)}</div><div className="grid gap-3 lg:grid-cols-[2fr_1fr]"><div className="h-72 rounded-2xl bg-white" /><div className="h-72 rounded-2xl bg-white" /></div></div>;
}
