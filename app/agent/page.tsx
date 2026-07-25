'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookCheck, CalendarPlus, CircleAlert, CircleDollarSign, Clock3, Headphones, ReceiptText, RefreshCw, ShipWheel, WalletCards } from 'lucide-react';
import { AgentEmptyState } from '@/components/edrive/agent/agent-empty-state';
import { AgentMetricCard } from '@/components/edrive/agent/agent-metric-card';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { AgentPortalShell, type AgentPortalProfile } from '@/components/edrive/agent/agent-portal-shell';
import { AgentStatusBadge } from '@/components/edrive/agent/agent-status-badge';
import { AgentWalletLedger } from '@/components/edrive/agent/agent-wallet-ledger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { getB2BFinanceSummary, type B2BFinanceSummary, type B2BRefundRequest, type B2BWalletLedgerEntry } from '@/services/b2b-finance';

type Booking = { id: string; booking_code: string | null; customer_name: string | null; selected_package_name: string | null; preferred_date: string | null; preferred_time: string | null; status: string | null; created_at: string | null };

export default function AgentDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentPortalProfile | null>(null);
  const [summary, setSummary] = useState<B2BFinanceSummary | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<B2BRefundRequest[]>([]);
  const [ledger, setLedger] = useState<B2BWalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) { router.replace('/admin/login'); return; }
      const profileResult = await supabase.from('b2b_agents').select('id,agent_code,company_name,contact_person,login_email,email,phone,status').eq('auth_user_id', session.session.user.id).maybeSingle();
      if (profileResult.error) throw new Error(profileResult.error.message);
      const nextProfile = profileResult.data as AgentPortalProfile | null;
      if (!nextProfile || String(nextProfile.status).toLowerCase() !== 'active') throw new Error('An active B2B Agent profile is required to access this portal.');
      const [nextSummary, bookingResult, requestResult, ledgerResult] = await Promise.all([
        getB2BFinanceSummary(),
        supabase.from('booking_requests').select('id,booking_code,customer_name,selected_package_name,preferred_date,preferred_time,status,created_at').eq('b2b_agent_id', nextProfile.id).order('created_at', { ascending: false }),
        supabase.from('b2b_refund_requests').select('id,booking_request_id,b2b_agent_id,request_type,status,reason,requested_amount_aed,approved_amount_aed,decision_note,requested_at,decided_at').eq('b2b_agent_id', nextProfile.id).order('requested_at', { ascending: false }),
        supabase.from('b2b_wallet_ledger').select('id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,reversal_of_entry_id,description,created_at').eq('b2b_agent_id', nextProfile.id).order('created_at', { ascending: false }).limit(6)
      ]);
      if (bookingResult.error || requestResult.error || ledgerResult.error) throw new Error(bookingResult.error?.message || requestResult.error?.message || ledgerResult.error?.message);
      setProfile(nextProfile); setSummary(nextSummary); setBookings((bookingResult.data || []) as Booking[]); setRequests((requestResult.data || []) as B2BRefundRequest[]); setLedger((ledgerResult.data || []) as B2BWalletLedgerEntry[]);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load the partner dashboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => ({
    active: bookings.filter((b) => !['completed', 'cancelled', 'no show', 'no_show'].includes(String(b.status || '').toLowerCase())).length,
    completed: bookings.filter((b) => String(b.status || '').toLowerCase() === 'completed').length,
    pending: requests.filter((r) => r.status === 'Pending').length,
  }), [bookings, requests, ledger]);
  const bookingCodes = Object.fromEntries(bookings.map((b) => [b.id, b.booking_code || b.id]));

  if (loading) return <DashboardSkeleton />;
  if (!profile) return <AccessError message={error} />;
  const walletBalance = summary?.wallet_balance_aed || 0;
  const walletFunded = walletBalance > 0;

  return <AgentPortalShell profile={profile} walletBalance={summary?.wallet_balance_aed}>
    <AgentPageHeader eyebrow="Partner dashboard" title={`Welcome back, ${profile.contact_person || profile.company_name}`} description="A live view of bookings, wallet activity and partner requests." actions={<Button variant="outline" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>} />
    {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <section className="mt-5 rounded-2xl bg-[linear-gradient(120deg,#082f49_0%,#0f4c5c_52%,#0f766e_100%)] p-5 text-white shadow-[0_14px_35px_rgba(15,76,92,0.18)] sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">eDrive B2B Partner</p><h2 className="mt-2 max-w-3xl font-heading text-xl font-semibold sm:text-2xl">Create secure partner bookings with live wallet settlement.</h2><p className="mt-1 text-sm leading-6 text-slate-300">Book at approved B2B rates with VAT and wallet settlement handled automatically.</p></div>
      <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">{walletFunded ? <Button asChild className="bg-white text-slate-950 hover:bg-teal-50"><Link href="/agent/new-booking"><CalendarPlus className="size-4" />Create Booking</Link></Button> : <><Button disabled className="bg-slate-700 text-white">Top-up Required</Button><Button asChild variant="outline" className="border-teal-300 bg-transparent text-teal-200 hover:bg-teal-950 hover:text-white"><a href="tel:+97146113114"><Headphones className="size-4" />Contact for Top-up</a></Button></>}</div>
    </section>
    {(summary?.wallet_balance_aed || 0) < 1000 ? <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="size-5 shrink-0" /><div><p className="font-bold">Low wallet balance</p><p className="mt-1">Contact eDrive on +971 4 611 3114 for top-up assistance before creating your next booking.</p></div></div> : null}
    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <AgentMetricCard label="Wallet Balance" value={formatAed(walletBalance)} icon={WalletCards} tone="teal" primary />
      <AgentMetricCard label="Active Bookings" value={String(stats.active)} icon={ShipWheel} tone="navy" />
      <AgentMetricCard label="Pending Requests" value={String(stats.pending)} icon={Clock3} tone="gold" />
      <AgentMetricCard label="Wallet Debits" value={formatAed(summary?.wallet_debits_aed || 0)} icon={CircleDollarSign} tone="red" />
      <AgentMetricCard label="Refund Credits" value={formatAed(summary?.approved_refunds_aed || 0)} icon={ReceiptText} tone="green" />
      <AgentMetricCard label="Completed" value={String(stats.completed)} icon={BookCheck} tone="teal" />
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Recent bookings</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/agent/bookings">View all <ArrowRight className="size-4" /></Link></Button></CardHeader><CardContent className="p-0">{bookings.length ? <div className="divide-y divide-slate-100">{bookings.slice(0, 5).map((booking) => <Link href="/agent/bookings" key={booking.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"><div className="min-w-0"><p className="font-mono text-xs font-bold text-teal-700">{booking.booking_code}</p><p className="mt-1 truncate text-sm font-semibold">{booking.customer_name} · {booking.selected_package_name}</p><p className="mt-1 text-xs text-slate-500">{booking.preferred_date} · {booking.preferred_time}</p></div><AgentStatusBadge status={booking.status} /></Link>)}</div> : <AgentEmptyState compact icon={CalendarPlus} title="No bookings yet" description="Your recent partner bookings will appear here." action={walletFunded ? <Button asChild size="sm"><Link href="/agent/new-booking">Create First Booking</Link></Button> : undefined} />}</CardContent></Card>
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Recent wallet activity</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/agent/wallet">View all <ArrowRight className="size-4" /></Link></Button></CardHeader><CardContent className="p-0">{ledger.length ? <AgentWalletLedger entries={ledger.slice(0, 5)} bookingCodes={bookingCodes} compact /> : <AgentEmptyState compact icon={WalletCards} title="No wallet transactions" description="Top-ups, booking debits and refund credits will appear here." />}</CardContent></Card>
    </section>
    <section className="mt-5 grid items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><Card className="h-full rounded-2xl border-slate-200 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Pending requests</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/agent/requests">View requests <ArrowRight className="size-4" /></Link></Button></CardHeader><CardContent>{requests.filter((r) => r.status === 'Pending').length ? <div className="space-y-3">{requests.filter((r) => r.status === 'Pending').slice(0, 3).map((r) => <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold">{r.request_type === 'no_show_refund' ? 'Refund request' : 'Cancellation request'}</p><p className="text-xs text-slate-500">Submitted {new Date(r.requested_at).toLocaleDateString('en-AE')}</p></div><AgentStatusBadge status={r.status} /></div>)}</div> : <AgentEmptyState compact icon={Clock3} title="No pending requests" description="Cancellation and refund requests awaiting review will appear here." action={<Button asChild size="sm" variant="outline"><Link href="/agent/requests">View All Requests</Link></Button>} />}</CardContent></Card><Card className="h-full rounded-2xl border-teal-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)]"><CardContent className="flex h-full flex-col p-5"><span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Headphones className="size-5" /></span><h3 className="mt-4 font-heading text-lg font-semibold text-slate-950">Partner Support</h3><p className="mt-2 text-sm leading-6 text-slate-600">Get help with partner bookings or arrange wallet top-up assistance with the eDrive team.</p><a href="tel:+97146113114" className="mt-4 text-lg font-bold text-teal-700">+971 4 611 3114</a><div className="mt-auto pt-5"><Button asChild variant="outline" className="w-full border-teal-200 text-teal-800 hover:bg-teal-50"><Link href="/contact">Contact eDrive</Link></Button></div></CardContent></Card></section>
  </AgentPortalShell>;
}

function DashboardSkeleton() { return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-16 rounded-2xl bg-slate-200" /><div className="h-32 rounded-2xl bg-slate-200" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}</div></div></div>; }
function AccessError({ message }: { message: string }) { return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl"><CircleAlert className="mx-auto size-8 text-red-600" /><h1 className="mt-4 font-heading text-xl font-semibold">Portal access unavailable</h1><p className="mt-2 text-sm text-slate-600">{message || 'Your B2B Agent profile could not be loaded.'}</p><Button asChild className="mt-5"><Link href="/admin/login">Return to login</Link></Button></div></main>; }
