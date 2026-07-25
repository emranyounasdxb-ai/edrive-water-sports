'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, WalletCards, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { adjustB2BWallet, decideB2BRefund, getB2BAgentDirectory, getB2BFinanceSummary, reverseB2BWalletEntry, type B2BFinanceSummary, type B2BRefundRequest, type B2BWalletLedgerEntry } from '@/services/b2b-finance';
import { usePortalAccess } from './portal-access';

type Agent = { id: string; agent_code: string | null; company_name: string; status: string };
type BookingFinance = { id: string; booking_code: string | null; base_amount_aed: number | null; vat_amount: number | null; total_amount: number | null };
type Wallet = { b2b_agent_id: string; balance_aed: number };

export function AdminB2BFinancePage() {
  const { role } = usePortalAccess();
  const canWrite = role === 'super_admin';
  const canViewWallets = ['super_admin', 'admin', 'finance'].includes(role);
  const [summary, setSummary] = useState<B2BFinanceSummary | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [refunds, setRefunds] = useState<B2BRefundRequest[]>([]);
  const [bookings, setBookings] = useState<BookingFinance[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [ledger, setLedger] = useState<B2BWalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  async function load() {
    setError('');
    setLoading(true);
    const [nextSummary, agentResult, refundResult, walletResult, ledgerResult] = await Promise.all([
      canViewWallets ? getB2BFinanceSummary() : Promise.resolve(null),
      getB2BAgentDirectory(),
      supabase.from('b2b_refund_requests').select('*').order('requested_at', { ascending: false }).limit(500),
      canViewWallets ? supabase.from('b2b_wallets').select('b2b_agent_id,balance_aed') : Promise.resolve({ data: [], error: null }),
      canViewWallets ? supabase.from('b2b_wallet_ledger').select('id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,reversal_of_entry_id,description,created_at').order('created_at', { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null })
    ]);
    if (refundResult.error) throw new Error(refundResult.error.message);
    if (walletResult.error) throw new Error(walletResult.error.message);
    if (ledgerResult.error) throw new Error(ledgerResult.error.message);
    const nextRefunds = (refundResult.data || []) as B2BRefundRequest[];
    const bookingIds = [...new Set(nextRefunds.map((request) => request.booking_request_id))];
    const bookingResult = bookingIds.length
      ? await supabase.from('booking_requests').select('id,booking_code,base_amount_aed,vat_amount,total_amount').in('id', bookingIds)
      : { data: [], error: null };
    if (bookingResult.error) throw new Error(bookingResult.error.message);
    setSummary(nextSummary);
    setAgents(agentResult as Agent[]);
    setRefunds(nextRefunds);
    setBookings((bookingResult.data || []) as BookingFinance[]);
    setWallets((walletResult.data || []) as Wallet[]);
    setLedger((ledgerResult.data || []) as B2BWalletLedgerEntry[]);
    setLoading(false);
  }

  useEffect(() => { void load().catch((loadError) => { setError(loadError instanceof Error ? loadError.message : 'Unable to load B2B finance.'); setLoading(false); }); }, []);

  async function decide(request: B2BRefundRequest, decision: 'Approved' | 'Rejected') {
    const note = window.prompt(`${decision} note:`)?.trim();
    if (!note) return;
    if (!window.confirm(`${decision} this refund request for ${formatAed(request.requested_amount_aed)}?`)) return;
    setSavingId(request.id);
    setError('');
    try {
      await decideB2BRefund(request.id, decision, note);
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Unable to decide refund.');
      setLoading(false);
    } finally {
      setSavingId('');
    }
  }

  async function adjust(agent: Agent) {
    const direction = window.prompt('Enter credit or debit:')?.trim().toLowerCase();
    if (direction !== 'credit' && direction !== 'debit') return;
    const amount = Number(window.prompt('Enter AED amount:') || 0);
    const description = window.prompt('Enter adjustment reason:')?.trim() || '';
    const operationKey = window.prompt('Enter a stable operation reference (reuse it if retrying):')?.trim() || '';
    if (!Number.isFinite(amount) || amount <= 0 || !description || !operationKey) return;
    if (!window.confirm(`${direction} ${formatAed(amount)} for ${agent.company_name}?`)) return;
    setSavingId(agent.id);
    setError('');
    try {
      await adjustB2BWallet(agent.id, direction, amount, description, operationKey);
      await load();
    } catch (adjustError) {
      setError(adjustError instanceof Error ? adjustError.message : 'Unable to adjust wallet.');
      setLoading(false);
    } finally {
      setSavingId('');
    }
  }

  async function reverse(entry: B2BWalletLedgerEntry) {
    const reason = window.prompt('Enter the wallet reversal reason:')?.trim() || '';
    const operationKey = window.prompt('Enter a stable reversal reference (reuse it if retrying):')?.trim() || '';
    if (!reason || !operationKey) return;
    if (!window.confirm(`Create an opposite ${entry.direction === 'credit' ? 'debit' : 'credit'} entry for ${formatAed(entry.amount_aed)}?`)) return;
    setSavingId(entry.id);
    setError('');
    try {
      await reverseB2BWalletEntry(entry.id, reason, operationKey);
      await load();
    } catch (reversalError) {
      setError(reversalError instanceof Error ? reversalError.message : 'Unable to reverse wallet entry.');
      setLoading(false);
    } finally {
      setSavingId('');
    }
  }

  return (
    <section className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">B2B Finance</p><h1 className="mt-2 font-heading text-3xl font-semibold">Wallets and refunds</h1><p className="mt-2 text-sm text-muted-foreground">{canWrite ? 'Controlled wallet adjustments and refund decisions.' : 'Read-only financial view.'}</p></div><Button variant="outline" onClick={() => load().catch((loadError) => { setError(loadError.message); setLoading(false); })}><RefreshCw className="size-4" />Refresh</Button></div>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {canViewWallets ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Wallet Balance" value={formatAed(summary?.wallet_balance_aed || 0)} /><Metric label="Wallet Credits" value={formatAed(summary?.wallet_credits_aed || 0)} /><Metric label="Wallet Debits" value={formatAed(summary?.wallet_debits_aed || 0)} /><Metric label="Pending Refunds" value={String(summary?.pending_refunds || 0)} /></div> : null}
      <Card className="mt-5 overflow-hidden rounded-[1.5rem]"><CardHeader><CardTitle>Cancellation and refund requests</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Requested</TableHead><TableHead>Booking</TableHead><TableHead>Agent</TableHead><TableHead>Type / Reason</TableHead><TableHead>Financials</TableHead><TableHead>Status / Note</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center">Loading requests...</TableCell></TableRow> : null}{!loading && !refunds.length ? <TableRow><TableCell colSpan={7} className="py-8 text-center">No cancellation or refund requests.</TableCell></TableRow> : refunds.map((request) => { const booking = bookings.find((row) => row.id === request.booking_request_id); return <TableRow key={request.id}><TableCell>{new Date(request.requested_at).toLocaleDateString('en-AE')}</TableCell><TableCell className="font-mono text-xs">{booking?.booking_code || 'Booking'}</TableCell><TableCell>{agents.find((agent) => agent.id === request.b2b_agent_id)?.company_name || 'B2B Agent'}{canViewWallets ? <div className="text-xs text-muted-foreground">Wallet {formatAed(wallets.find((wallet) => wallet.b2b_agent_id === request.b2b_agent_id)?.balance_aed || 0)}</div> : null}</TableCell><TableCell>{request.request_type === 'no_show_refund' ? 'No Show refund' : 'Cancellation'}<div className="text-xs text-muted-foreground">{request.reason}</div></TableCell><TableCell>{formatAed(request.requested_amount_aed)}<div className="text-xs text-muted-foreground">Base {formatAed(booking?.base_amount_aed || 0)} | VAT {formatAed(booking?.vat_amount || 0)}</div></TableCell><TableCell>{request.status}{request.decision_note ? <div className="text-xs text-muted-foreground">{request.decision_note}</div> : null}</TableCell><TableCell><div className="flex gap-2">{canWrite && request.status === 'Pending' ? <><Button size="sm" onClick={() => decide(request, 'Approved')} disabled={savingId === request.id}><CheckCircle2 className="size-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => decide(request, 'Rejected')} disabled={savingId === request.id}><XCircle className="size-4" />Reject</Button></> : <span className="text-xs text-muted-foreground">Read only</span>}</div></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>
      {canViewWallets ? <Card className="mt-5 overflow-hidden rounded-[1.5rem]"><CardHeader><CardTitle>Wallet ledger history</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Direction</TableHead><TableHead>Amount</TableHead><TableHead>Balance</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{!loading && !ledger.length ? <TableRow><TableCell colSpan={7} className="py-8 text-center">No wallet ledger entries.</TableCell></TableRow> : ledger.map((entry) => { const reversible = canWrite && ['wallet_top_up', 'adjustment_credit', 'adjustment_debit'].includes(entry.transaction_type) && !entry.reversal_of_entry_id && !ledger.some((candidate) => candidate.reversal_of_entry_id === entry.id); return <TableRow key={entry.id}><TableCell>{new Date(entry.created_at).toLocaleDateString('en-AE')}</TableCell><TableCell>{entry.transaction_type.replaceAll('_', ' ')}</TableCell><TableCell>{entry.description}</TableCell><TableCell>{entry.direction}</TableCell><TableCell>{formatAed(entry.amount_aed)}</TableCell><TableCell>{formatAed(entry.balance_after_aed)}</TableCell><TableCell>{reversible ? <Button size="sm" variant="outline" disabled={savingId === entry.id} onClick={() => reverse(entry)}>{savingId === entry.id ? 'Reversing...' : 'Reverse'}</Button> : <span className="text-xs text-muted-foreground">Read only</span>}</TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card> : null}
      {canWrite ? <Card className="mt-5 rounded-[1.5rem]"><CardHeader><CardTitle>Wallet adjustments</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{agents.map((agent) => <div key={agent.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><div><p className="font-semibold">{agent.company_name}</p><p className="text-xs text-muted-foreground">{agent.agent_code || agent.status}</p></div><Button size="sm" variant="outline" onClick={() => adjust(agent)} disabled={savingId === agent.id}>Adjust</Button></div>)}</CardContent></Card> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="rounded-[1.25rem]"><CardContent className="flex items-center gap-3 p-4"><WalletCards className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-heading text-xl font-semibold">{value}</p></div></CardContent></Card>;
}
