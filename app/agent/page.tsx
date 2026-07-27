'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookCheck, CalendarPlus, CircleAlert, CircleDollarSign, Clock3, Headphones, ReceiptText, RefreshCw, ShipWheel, WalletCards } from 'lucide-react';
import { AgentEmptyState } from '@/components/edrive/agent/agent-empty-state';
import { AgentMetricCard } from '@/components/edrive/agent/agent-metric-card';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { useAgentPortal } from '@/components/edrive/agent/agent-portal-provider';
import { AgentStatusBadge } from '@/components/edrive/agent/agent-status-badge';
import { AgentWalletLedger } from '@/components/edrive/agent/agent-wallet-ledger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import type { B2BRefundRequest, B2BWalletLedgerEntry } from '@/services/b2b-finance';

type Booking = { id: string; booking_code: string | null; customer_name: string | null; selected_package_name: string | null; preferred_date: string | null; preferred_time: string | null; status: string | null; created_at: string | null };

export default function AgentDashboardPage() {
  const { profile, agentId, walletBalance, financeSummary: summary, refreshPortal } = useAgentPortal();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<B2BRefundRequest[]>([]);
  const [ledger, setLedger] = useState<B2BWalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const [bookingResult, requestResult, ledgerResult] = await Promise.all([
        supabase.from('booking_requests').select('id,booking_code,customer_name,selected_package_name,preferred_date,preferred_time,status,created_at').eq('b2b_agent_id', agentId).order('created_at', { ascending: false }),
        supabase.from('b2b_refund_requests').select('id,booking_request_id,b2b_agent_id,request_type,status,reason,requested_amount_aed,approved_amount_aed,decision_note,requested_at,decided_at').eq('b2b_agent_id', agentId).order('requested_at', { ascending: false }),
        supabase.from('b2b_wallet_ledger').select('id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,reversal_of_entry_id,description,created_at').eq('b2b_agent_id', agentId).order('created_at', { ascending: false }).limit(6)
      ]);
      if (bookingResult.error || requestResult.error || ledgerResult.error) throw new Error(bookingResult.error?.message || requestResult.error?.message || ledgerResult.error?.message);
      setBookings((bookingResult.data || []) as Booking[]); setRequests((requestResult.data || []) as B2BRefundRequest[]); setLedger((ledgerResult.data || []) as B2BWalletLedgerEntry[]);
      if (refresh) await refreshPortal();
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load the partner dashboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, [agentId]);

  const stats = useMemo(() => ({
    active: bookings.filter((b) => !['completed', 'cancelled', 'no show', 'no_show'].includes(String(b.status || '').toLowerCase())).length,
    completed: bookings.filter((b) => String(b.status || '').toLowerCase() === 'completed').length,
    pending: requests.filter((r) => r.status === 'Pending').length,
  }), [bookings, requests, ledger]);
  const bookingCodes = Object.fromEntries(bookings.map((b) => [b.id, b.booking_code || b.id]));

  const walletFunded = walletBalance > 0;

  if (loading) return <><AgentPageHeader eyebrow="Partner dashboard" title={`Welcome back, ${profile.contact_person || profile.company_name}`} description="A live view of bookings, wallet activity and partner requests." /><DashboardSkeleton /></>;

  return <>
    <AgentPageHeader eyebrow="Partner dashboard" title={`Welcome back, ${profile.contact_person || profile.company_name}`} description="A live view of bookings, wallet activity and partner requests." actions={<Button variant="outline" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>} />
    {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <section className="mt-4 rounded-xl bg-[linear-gradient(120deg,#082f49_0%,#0f4c5c_52%,#0f766e_100%)] p-4 text-white shadow-[0_12px_28px_rgba(15,76,92,0.18)] sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">eDrive B2B Partner</p><h2 className="mt-2 max-w-3xl font-heading text-xl font-semibold sm:text-2xl">Create secure partner bookings with live wallet settlement.</h2><p className="mt-1 text-sm leading-6 text-slate-300">Book at approved B2B rates with VAT and wallet settlement handled automatically.</p></div>
      <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">{walletFunded ? <Button asChild className="bg-white text-slate-950 hover:bg-teal-50"><Link href="/agent/new-booking"><CalendarPlus className="size-4" />Create Booking</Link></Button> : <><Button disabled className="bg-slate-700 text-white">Top-up Required</Button><Button asChild variant="outline" className="border-teal-300 bg-transparent text-teal-200 hover:bg-teal-950 hover:text-white"><a href="tel:+97146113114"><Headphones className="size-4" />Contact for Top-up</a></Button></>}</div>
    </section>
    {(summary?.wallet_balance_aed || 0) < 1000 ? <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="size-5 shrink-0" /><div><p className="font-bold">Low wallet balance</p><p className="mt-1">Contact eDrive on +971 4 611 3114 for top-up assistance before creating your next booking.</p></div></div> : null}
    <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <AgentMetricCard label="Wallet Balance" value={formatAed(walletBalance)} icon={WalletCards} tone="teal" primary />
      <AgentMetricCard label="Active Bookings" value={String(stats.active)} icon={ShipWheel} tone="navy" />
      <AgentMetricCard label="Pending Requests" value={String(stats.pending)} icon={Clock3} tone="gold" />
      <AgentMetricCard label="Wallet Debits" value={formatAed(summary?.wallet_debits_aed || 0)} icon={CircleDollarSign} tone="red" />
      <AgentMetricCard label="Refund Credits" value={formatAed(summary?.approved_refunds_aed || 0)} icon={ReceiptText} tone="green" />
      <AgentMetricCard label="Completed" value={String(stats.completed)} icon={BookCheck} tone="teal" />
    </section>
    <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardHeader className="flex flex-row items-center justify-between p-4"><CardTitle>Recent bookings</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/agent/bookings">View all <ArrowRight className="size-4" /></Link></Button></CardHeader><CardContent className="p-0">{bookings.length ? <div className="divide-y divide-slate-100">{bookings.slice(0, 5).map((booking) => <Link href="/agent/bookings" key={booking.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"><div className="min-w-0"><p className="font-mono text-xs font-bold text-teal-700">{booking.booking_code}</p><p className="mt-1 truncate text-sm font-semibold">{booking.customer_name} · {booking.selected_package_name}</p><p className="mt-1 text-xs text-slate-500">{booking.preferred_date} · {booking.preferred_time}</p></div><AgentStatusBadge status={booking.status} /></Link>)}</div> : <AgentEmptyState compact icon={CalendarPlus} title="No bookings yet" description="Create your first partner booking to get started." action={walletFunded ? <Button asChild size="sm"><Link href="/agent/new-booking">Create First Booking</Link></Button> : undefined} />}</CardContent></Card>
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardHeader className="flex flex-row items-center justify-between p-4"><CardTitle>Recent wallet activity</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/agent/wallet">View all <ArrowRight className="size-4" /></Link></Button></CardHeader><CardContent className="p-0">{ledger.length ? <AgentWalletLedger entries={ledger.slice(0, 5)} bookingCodes={bookingCodes} compact /> : <AgentEmptyState compact icon={WalletCards} title="No wallet transactions" description="Top-ups, booking debits and refund credits will appear here." />}</CardContent></Card>
    </section>
    <section className="mt-4 grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]"><Card className="h-full rounded-2xl border-slate-200 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardHeader className="flex flex-row items-center justify-between p-4"><CardTitle>Pending requests</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/agent/requests">View requests <ArrowRight className="size-4" /></Link></Button></CardHeader><CardContent>{requests.filter((r) => r.status === 'Pending').length ? <div className="space-y-3">{requests.filter((r) => r.status === 'Pending').slice(0, 3).map((r) => <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold">{r.request_type === 'no_show_refund' ? 'Refund request' : 'Cancellation request'}</p><p className="text-xs text-slate-500">Submitted {new Date(r.requested_at).toLocaleDateString('en-AE')}</p></div><AgentStatusBadge status={r.status} /></div>)}</div> : <AgentEmptyState compact icon={Clock3} title="No pending requests" description="Cancellation and refund requests awaiting review will appear here." action={<Button asChild size="sm" variant="outline"><Link href="/agent/requests">View All Requests</Link></Button>} />}</CardContent></Card><Card className="h-full rounded-2xl border-teal-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardContent className="flex h-full flex-col p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Headphones className="size-5" /></span><h3 className="mt-4 font-heading text-lg font-semibold text-slate-950">Partner Support</h3><p className="mt-2 text-sm leading-6 text-slate-600">Get help with partner bookings or arrange wallet top-up assistance with the eDrive team.</p><a href="tel:+97146113114" className="mt-4 text-lg font-bold text-teal-700">+971 4 611 3114</a><div className="mt-auto pt-4"><Button asChild variant="outline" className="w-full border-teal-200 text-teal-800 hover:bg-teal-50"><Link href="/contact">Contact eDrive</Link></Button></div></CardContent></Card></section>
  </>;
}

function DashboardSkeleton() { return <div className="mt-4 animate-pulse space-y-4"><div className="h-28 rounded-xl bg-slate-200" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-white shadow-sm" />)}</div><div className="grid gap-4 lg:grid-cols-2"><div className="h-52 rounded-xl bg-white" /><div className="h-52 rounded-xl bg-white" /></div></div>; }
