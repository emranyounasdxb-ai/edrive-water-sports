'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, RefreshCw, RotateCcw, Search, WalletCards, X } from 'lucide-react';
import { AgentDateFilterPicker } from '@/components/edrive/agent/agent-date-filter-picker';
import { AgentMetricCard } from '@/components/edrive/agent/agent-metric-card';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { useAgentPortal } from '@/components/edrive/agent/agent-portal-provider';
import { AgentWalletLedger } from '@/components/edrive/agent/agent-wallet-ledger';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { safeUiError } from '@/lib/ui-labels';
import type { B2BWalletLedgerEntry } from '@/services/b2b-finance';

const filters = [
  ['All', 'all'], ['Top-ups', 'wallet_top_up'], ['Booking Debits', 'booking_debit'],
  ['Refund Credits', 'refund_credit'], ['Adjustments', 'adjustment'], ['Reversals', 'reversal']
] as const;

export default function AgentWalletPage() {
  const { agentId, financeSummary: summary, refreshPortal } = useAgentPortal();
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
      const [ledgerResult, bookingResult] = await Promise.all([
        supabase.from('b2b_wallet_ledger').select('id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,reversal_of_entry_id,description,created_at').eq('b2b_agent_id', agentId).order('created_at', { ascending: false }),
        supabase.from('booking_requests').select('id,booking_code').eq('b2b_agent_id', agentId)
      ]);
      if (ledgerResult.error || bookingResult.error) throw new Error(ledgerResult.error?.message || bookingResult.error?.message);
      setEntries((ledgerResult.data || []) as B2BWalletLedgerEntry[]); setBookingCodes(Object.fromEntries((bookingResult.data || []).map((row: { id: string; booking_code: string }) => [row.id, row.booking_code])));
      if (refresh) await refreshPortal();
    } catch (loadError) { console.error('Wallet activity load failed', loadError); setError(safeUiError(loadError, 'load')); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, [agentId]);

  const visible = useMemo(() => entries.filter((entry) => {
    const typeMatch = filter === 'all' || entry.transaction_type === filter || (filter === 'adjustment' && entry.transaction_type.startsWith('adjustment_'));
    const query = `${entry.description} ${bookingCodes[entry.booking_request_id || ''] || ''}`.toLowerCase();
    const day = entry.created_at.slice(0, 10);
    return typeMatch && query.includes(search.toLowerCase()) && (!from || day >= from) && (!to || day <= to);
  }), [entries, filter, search, from, to, bookingCodes]);
  const bookingDebits = entries.filter((entry) => entry.transaction_type === 'booking_debit' && entry.direction === 'debit').reduce((sum, entry) => sum + Number(entry.amount_aed), 0);
  const refundCredits = entries.filter((entry) => entry.transaction_type === 'refund_credit' && entry.direction === 'credit').reduce((sum, entry) => sum + Number(entry.amount_aed), 0);
  const filtersActive = Boolean(search || from || to || filter !== 'all');
  const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); setFilter('all'); };
  const changeFrom = (value: string) => {
    setFrom(value);
    if (value && to && value > to) setTo('');
  };
  const changeTo = (value: string) => {
    if (value && from && value < from) return;
    setTo(value);
  };

  if (loading) return <><AgentPageHeader eyebrow="Wallet & ledger" title="Financial activity" description="A read-only record of wallet credits, booking debits, refund credits and corrections." /><WalletSkeleton /></>;

  return <>
    <AgentPageHeader eyebrow="Wallet & ledger" title="Financial activity" description="A read-only record of wallet credits, booking debits, refund credits and corrections." actions={<Button variant="outline" disabled={refreshing} onClick={() => load(true)}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>} />
    {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <AgentMetricCard label="Current Balance" value={formatAed(summary?.wallet_balance_aed || 0)} icon={WalletCards} tone="teal" />
      <AgentMetricCard label="Total Credits" value={formatAed(summary?.wallet_credits_aed || 0)} icon={CircleDollarSign} tone="green" />
      <AgentMetricCard label="Booking Debits" value={formatAed(bookingDebits)} icon={CircleDollarSign} tone="red" />
      <AgentMetricCard label="Refund Credits" value={formatAed(refundCredits)} icon={RotateCcw} tone="green" />
      <AgentMetricCard label="Pending Refunds" value={String(summary?.pending_refunds || 0)} icon={RotateCcw} tone="gold" />
    </section>
    <Card className="mt-4 rounded-xl border-slate-200 shadow-sm"><CardContent className="p-4"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_auto_auto_auto] lg:items-end"><label className="grid gap-1.5 text-xs font-semibold text-slate-600"><span>Search</span><span className="relative"><Search className="absolute left-3 top-3 size-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Booking reference or description" className="h-10 pl-9" /></span></label><AgentDateFilterPicker label="From Date" value={from} placeholder="Select start date" maxDate={to || undefined} onChange={changeFrom} /><AgentDateFilterPicker label="To Date" value={to} placeholder="Select end date" minDate={from || undefined} onChange={changeTo} /><Button type="button" size="sm" variant="ghost" className="h-10 justify-self-start lg:justify-self-auto" onClick={clearFilters} disabled={!filtersActive}><X className="size-4" />Clear Filters</Button></div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{filters.map(([label, value]) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)} className="shrink-0">{label}</Button>)}</div></CardContent></Card>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white"><AgentWalletLedger entries={visible} bookingCodes={bookingCodes} /></div>
    <p className="mt-4 text-xs leading-5 text-slate-500">Wallet entries are immutable and read-only. For top-up assistance, call eDrive on <a className="font-semibold text-teal-700" href="tel:+971568282268">+971 56 828 2268</a>.</p>
  </>;
}

function WalletSkeleton() { return <div className="mt-4 animate-pulse space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 rounded-xl bg-white shadow-sm" />)}</div><div className="h-28 rounded-xl bg-white" /><div className="h-72 rounded-xl bg-white" /></div>; }
