'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { getB2BFinanceSummary, type B2BFinanceSummary, type B2BWalletLedgerEntry } from '@/services/b2b-finance';

export default function B2BWalletPage() {
  const [summary, setSummary] = useState<B2BFinanceSummary | null>(null);
  const [entries, setEntries] = useState<B2BWalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [nextSummary, ledgerResult] = await Promise.all([
        getB2BFinanceSummary(),
        supabase.from('b2b_wallet_ledger').select('id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,description,created_at').order('created_at', { ascending: false }).limit(100)
      ]);
      if (ledgerResult.error) throw new Error(ledgerResult.error.message);
      setSummary(nextSummary);
      setEntries((ledgerResult.data || []) as B2BWalletLedgerEntry[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load wallet.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <main className="min-h-screen bg-[#F4F7F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="outline" className="rounded-full bg-white"><Link href="/agent"><ArrowLeft className="size-4" />Dashboard</Link></Button><Button type="button" variant="outline" onClick={load} className="rounded-full bg-white"><RefreshCw className="size-4" />Refresh</Button></div>
        <div className="mt-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">B2B Wallet</p><h1 className="mt-2 font-heading text-3xl font-semibold">Balance and transactions</h1><p className="mt-2 text-sm text-muted-foreground">Your wallet is protected by database ownership rules. Adjustments and refund approvals require Super Admin action.</p></div>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Current Balance" value={formatAed(summary?.wallet_balance_aed || 0)} />
          <Metric label="Total Credits" value={formatAed(summary?.wallet_credits_aed || 0)} />
          <Metric label="Total Debits" value={formatAed(summary?.wallet_debits_aed || 0)} />
          <Metric label="Pending Refunds" value={String(summary?.pending_refunds || 0)} />
        </div>
        <Card className="mt-5 overflow-hidden rounded-[1.5rem]"><CardHeader><CardTitle>Immutable wallet ledger</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Direction</TableHead><TableHead>Amount</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center">Loading transactions...</TableCell></TableRow> : null}{!loading && !entries.length ? <TableRow><TableCell colSpan={6} className="py-8 text-center">No wallet transactions yet.</TableCell></TableRow> : entries.map((entry) => <TableRow key={entry.id}><TableCell>{new Date(entry.created_at).toLocaleDateString('en-AE')}</TableCell><TableCell>{entry.transaction_type.replace(/_/g, ' ')}</TableCell><TableCell>{entry.description}</TableCell><TableCell className={entry.direction === 'credit' ? 'font-bold text-emerald-700' : 'font-bold text-red-700'}>{entry.direction}</TableCell><TableCell>{formatAed(entry.amount_aed)}</TableCell><TableCell>{formatAed(entry.balance_after_aed)}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="rounded-[1.25rem]"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary"><WalletCards className="size-5" /></span><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 font-heading text-xl font-semibold">{value}</p></div></CardContent></Card>;
}
