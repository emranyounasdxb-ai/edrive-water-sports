'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, RefreshCw, RotateCcw, Search, WalletCards } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AgentMetricCard } from '@/components/edrive/agent/agent-metric-card';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { AgentPortalShell, type AgentPortalProfile } from '@/components/edrive/agent/agent-portal-shell';
import { AgentWalletLedger } from '@/components/edrive/agent/agent-wallet-ledger';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { getB2BFinanceSummary, type B2BFinanceSummary, type B2BWalletLedgerEntry } from '@/services/b2b-finance';

const filters = [
  ['All', 'all'], ['Top-ups', 'wallet_top_up'], ['Booking Debits', 'booking_debit'],
  ['Refund Credits', 'refund_credit'], ['Adjustments', 'adjustment'], ['Reversals', 'reversal']
] as const;

export default function AgentWalletPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentPortalProfile | null>(null);
  const [summary, setSummary] = useState<B2BFinanceSummary | null>(null);
  const [entries, setEntries] = useState<B2BWalletLedgerEntry[]>([]);
  const [bookingCodes, setBookingCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) { router.replace('/admin/login'); return; }
      const profileResult = await supabase.from('b2b_agents').select('id,agent_code,company_name,contact_person,status').eq('auth_user_id', session.session.user.id).maybeSingle();
      if (profileResult.error) throw new Error(profileResult.error.message);
      const next = profileResult.data as AgentPortalProfile | null;
      if (!next || String(next.status).toLowerCase() !== 'active') throw new Error('An active B2B Agent profile is required.');
      const [nextSummary, ledgerResult, bookingResult] = await Promise.all([
        getB2BFinanceSummary(),
        supabase.from('b2b_wallet_ledger').select('id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,reversal_of_entry_id,description,created_at').eq('b2b_agent_id', next.id).order('created_at', { ascending: false }),
        supabase.from('booking_requests').select('id,booking_code').eq('b2b_agent_id', next.id)
      ]);
      if (ledgerResult.error || bookingResult.error) throw new Error(ledgerResult.error?.message || bookingResult.error?.message);
      setProfile(next); setSummary(nextSummary); setEntries((ledgerResult.data || []) as B2BWalletLedgerEntry[]); setBookingCodes(Object.fromEntries((bookingResult.data || []).map((row: { id: string; booking_code: string }) => [row.id, row.booking_code])));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load wallet activity.'); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => entries.filter((entry) => {
    const typeMatch = filter === 'all' || entry.transaction_type === filter || (filter === 'adjustment' && entry.transaction_type.startsWith('adjustment_'));
    const query = `${entry.description} ${bookingCodes[entry.booking_request_id || ''] || ''}`.toLowerCase();
    const day = entry.created_at.slice(0, 10);
    return typeMatch && query.includes(search.toLowerCase()) && (!from || day >= from) && (!to || day <= to);
  }), [entries, filter, search, from, to, bookingCodes]);
  const bookingDebits = entries.filter((entry) => entry.transaction_type === 'booking_debit' && entry.direction === 'debit').reduce((sum, entry) => sum + Number(entry.amount_aed), 0);
  const refundCredits = entries.filter((entry) => entry.transaction_type === 'refund_credit' && entry.direction === 'credit').reduce((sum, entry) => sum + Number(entry.amount_aed), 0);

  if (loading) return <div className="min-h-screen animate-pulse bg-slate-50 p-6"><div className="mx-auto h-96 max-w-6xl rounded-2xl bg-slate-200" /></div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-red-700">{error || 'Wallet access unavailable.'}</div>;

  return <AgentPortalShell profile={profile} walletBalance={summary?.wallet_balance_aed}>
    <AgentPageHeader eyebrow="Wallet & ledger" title="Financial activity" description="A read-only record of wallet credits, booking debits, refund credits and corrections." actions={<Button variant="outline" disabled={refreshing} onClick={() => load(true)}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>} />
    {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <AgentMetricCard label="Current Balance" value={formatAed(summary?.wallet_balance_aed || 0)} icon={WalletCards} tone="teal" />
      <AgentMetricCard label="Total Credits" value={formatAed(summary?.wallet_credits_aed || 0)} icon={CircleDollarSign} tone="green" />
      <AgentMetricCard label="Booking Debits" value={formatAed(bookingDebits)} icon={CircleDollarSign} tone="red" />
      <AgentMetricCard label="Refund Credits" value={formatAed(refundCredits)} icon={RotateCcw} tone="green" />
      <AgentMetricCard label="Pending Refunds" value={String(summary?.pending_refunds || 0)} icon={RotateCcw} tone="gold" />
    </section>
    <Card className="mt-4 rounded-xl border-slate-200"><CardContent className="p-4"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]"><label className="relative"><Search className="absolute left-3 top-3.5 size-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search booking reference or description" className="pl-9" /></label><Input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1">{filters.map(([label, value]) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)} className="shrink-0">{label}</Button>)}</div></CardContent></Card>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white"><AgentWalletLedger entries={visible} bookingCodes={bookingCodes} /></div>
    <p className="mt-4 text-xs leading-5 text-slate-500">Wallet entries are immutable and read-only. For top-up assistance, call eDrive on <a className="font-semibold text-teal-700" href="tel:+97146113114">+971 4 611 3114</a>.</p>
  </AgentPortalShell>;
}
