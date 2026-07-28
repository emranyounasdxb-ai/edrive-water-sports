'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, CircleDollarSign, RefreshCw, RotateCcw, Search, WalletCards, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { adjustB2BWallet, decideB2BRefund, getB2BAgentDirectory, getB2BFinanceSummary, reverseB2BWalletEntry, type B2BFinanceSummary, type B2BRefundRequest, type B2BWalletLedgerEntry } from '@/services/b2b-finance';
import { usePortalAccess } from './portal-access';
import { AppDatePicker } from './shared/app-date-picker';

type Agent = { id: string; agent_code: string | null; company_name: string; status: string };
type Wallet = { b2b_agent_id: string; balance_aed: number };
type Booking = { id: string; b2b_agent_id: string | null; booking_code: string | null; customer_name: string | null; selected_package_name: string | null; base_amount_aed: number | null; vat_amount: number | null; total_amount: number | null; amount_received_aed: number | null };
type Ledger = B2BWalletLedgerEntry & { b2b_agent_id: string; idempotency_key: string | null; actor_admin_user_id: string | null };
type Refund = B2BRefundRequest & { agent_note?: string | null; operational_note?: string | null };
type WalletAction = 'fund' | 'credit' | 'debit';
const selectClass = 'h-11 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

export function AdminB2BFinancePage() {
  const { role } = usePortalAccess();
  const canWrite = role === 'super_admin';
  const canView = ['super_admin', 'admin', 'finance'].includes(role);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [summary, setSummary] = useState<B2BFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [walletAction, setWalletAction] = useState<WalletAction | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [reverseEntry, setReverseEntry] = useState<Ledger | null>(null);
  const [decision, setDecision] = useState<{ request: Refund; value: 'Approved' | 'Rejected' } | null>(null);

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const [agentResult, walletResult, ledgerResult, refundResult, bookingResult] = await Promise.all([
        getB2BAgentDirectory(),
        canView ? supabase.from('b2b_wallets').select('b2b_agent_id,balance_aed') : Promise.resolve({ data: [], error: null }),
        canView ? supabase.from('b2b_wallet_ledger').select('id,b2b_agent_id,direction,transaction_type,amount_aed,balance_after_aed,booking_request_id,refund_request_id,reversal_of_entry_id,description,idempotency_key,actor_admin_user_id,created_at').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
        supabase.from('b2b_refund_requests').select('*').order('requested_at', { ascending: false }),
        supabase.from('booking_requests').select('id,b2b_agent_id,booking_code,customer_name,selected_package_name,base_amount_aed,vat_amount,total_amount,amount_received_aed').not('b2b_agent_id', 'is', null)
      ]);
      const failure = walletResult.error || ledgerResult.error || refundResult.error || bookingResult.error;
      if (failure) throw new Error(failure.message);
      const nextAgents = agentResult as Agent[];
      setAgents(nextAgents); setWallets((walletResult.data || []) as Wallet[]); setLedger((ledgerResult.data || []) as Ledger[]); setRefunds((refundResult.data || []) as Refund[]); setBookings((bookingResult.data || []) as Booking[]);
    } catch (loadError) { console.error('B2B finance load failed', loadError); setError('Unable to load B2B finance information. Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!selectedId || !canView) { setSummary(null); return; }
    let active = true; setSummaryLoading(true);
    getB2BFinanceSummary(selectedId).then((value) => { if (active) setSummary(value); }).catch((summaryError) => { console.error('B2B finance summary load failed', summaryError); if (active) setError('Unable to load the finance summary. Please try again.'); }).finally(() => { if (active) setSummaryLoading(false); });
    return () => { active = false; };
  }, [selectedId, canView, ledger, refunds]);

  const selectedAgent = agents.find((agent) => agent.id === selectedId) || null;
  const selectedWallet = Number(wallets.find((wallet) => wallet.b2b_agent_id === selectedId)?.balance_aed || summary?.wallet_balance_aed || 0);
  const selectedLedger = ledger.filter((entry) => entry.b2b_agent_id === selectedId);
  const selectedRefunds = refunds.filter((request) => request.b2b_agent_id === selectedId);
  const bookingMap = Object.fromEntries(bookings.map((booking) => [booking.id, booking]));
  const agentMap = Object.fromEntries(agents.map((agent) => [agent.id, agent]));
  const walletMap = Object.fromEntries(wallets.map((wallet) => [wallet.b2b_agent_id, Number(wallet.balance_aed || 0)]));
  const normalizedAgentSearch = agentSearch.trim().toLowerCase();
  const visibleAgents = agents.filter((agent) => `${agent.company_name} ${agent.agent_code || ''}`.toLowerCase().includes(normalizedAgentSearch));
  const agentOptions = agents.filter((agent) => agent.id === selectedId || `${agent.company_name} ${agent.agent_code || ''}`.toLowerCase().includes(normalizedAgentSearch));
  const combinedWalletBalance = wallets.reduce((total, wallet) => total + Number(wallet.balance_aed || 0), 0);
  const totalBookingDebits = ledger.filter((entry) => entry.transaction_type === 'booking_debit' && entry.direction === 'debit').reduce((total, entry) => total + Number(entry.amount_aed || 0), 0);
  const pendingRequestCount = refunds.filter((request) => request.status === 'Pending').length;
  const decisionAgent = decision ? agentMap[decision.request.b2b_agent_id] || null : null;
  const visibleLedger = useMemo(() => selectedLedger.filter((entry) => {
    const booking = entry.booking_request_id ? bookingMap[entry.booking_request_id] : null;
    const text = `${entry.description} ${entry.idempotency_key} ${booking?.booking_code}`.toLowerCase();
    return text.includes(ledgerSearch.toLowerCase()) && (typeFilter === 'All' || entry.transaction_type === typeFilter || (typeFilter === 'adjustment' && entry.transaction_type.startsWith('adjustment_'))) && (!dateFilter || entry.created_at.slice(0, 10) === dateFilter);
  }), [selectedLedger, ledgerSearch, typeFilter, dateFilter, bookings]);

  function openAction(action: WalletAction) { setWalletAction(action); setAmount(''); setMethod('Bank Transfer'); setReference(''); setReason(''); setNote(''); setError(''); setSuccess(''); }
  function operationKey(prefix: string) { return `${prefix}-${selectedId}-${reference.trim() || Date.now().toString(36)}`; }
  async function submitWalletAction() {
    if (!selectedAgent || !walletAction || saving) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError('Enter a valid amount greater than zero.'); return; }
    if (walletAction !== 'fund' && !reason.trim()) { setError('A clear adjustment reason is required.'); return; }
    if (walletAction === 'debit' && numericAmount > selectedWallet) { setError('This debit would make the wallet negative.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const direction = walletAction === 'debit' ? 'debit' : 'credit';
      const description = walletAction === 'fund' ? `Wallet funding via ${method}${note.trim() ? ` - ${note.trim()}` : ''}` : `${reason.trim()}${note.trim() ? ` - ${note.trim()}` : ''}`;
      await adjustB2BWallet(selectedAgent.id, direction, numericAmount, description, operationKey(walletAction === 'fund' ? 'funding' : 'manual'));
      setSuccess(walletAction === 'fund' ? 'Wallet funds added successfully.' : 'Manual adjustment completed.'); setWalletAction(null); await load(true);
    } catch (actionError) { console.error('Wallet update failed', actionError); setError('The wallet could not be updated. Please try again.'); }
    finally { setSaving(false); }
  }
  async function submitReversal() {
    if (!reverseEntry || !reason.trim() || saving) { if (!reason.trim()) setError('A reversal reason is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try { await reverseB2BWalletEntry(reverseEntry.id, `${reason.trim()}${note.trim() ? ` - ${note.trim()}` : ''}`, operationKey('ledger')); setSuccess('Eligible wallet entry reversed.'); setReverseEntry(null); await load(true); }
    catch (reversalError) { console.error('Wallet reversal failed', reversalError); setError('The wallet entry could not be reversed. Please try again.'); }
    finally { setSaving(false); }
  }
  async function submitDecision() {
    if (!decision || !note.trim() || saving) { if (!note.trim()) setError('A Super Admin note is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try { await decideB2BRefund(decision.request.id, decision.value, note.trim()); setSuccess(`Request ${decision.value.toLowerCase()} successfully.`); setDecision(null); await load(true); }
    catch (decisionError) { console.error('Refund decision failed', decisionError); setError('The refund decision could not be saved. Please try again.'); }
    finally { setSaving(false); }
  }
  const isReversible = (entry: Ledger) => canWrite && ['wallet_top_up', 'adjustment_credit', 'adjustment_debit'].includes(entry.transaction_type) && !entry.reversal_of_entry_id && !ledger.some((candidate) => candidate.reversal_of_entry_id === entry.id);

  return <section className="w-full px-4 py-5 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">B2B Finance</p><h1 className="mt-2 font-heading text-3xl font-semibold">B2B Wallets and Refunds</h1><p className="mt-2 text-sm text-muted-foreground">Manage partner wallet funding, ledger activity, adjustments and refund requests.</p></div><Button variant="outline" disabled={refreshing} onClick={() => load(true)}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button></div>
    {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}{success ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</p> : null}
    <Card className="mt-5 rounded-2xl border-border/80"><CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_1.4fr]"><label className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search partner accounts" value={agentSearch} onChange={(event) => setAgentSearch(event.target.value)} /></label><select className={selectClass} aria-label="Selected B2B Agent" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">All Agents Overview</option>{agentOptions.map((agent) => <option key={agent.id} value={agent.id}>{agent.company_name} | {agent.agent_code || 'No code'} | {agent.status} | {formatAed(walletMap[agent.id] || 0)}</option>)}</select></CardContent></Card>
    {!canView ? <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">This role does not have access to B2B financial information.</div> : null}
    {canView && !selectedAgent ? <>
      <div className="mt-5"><h2 className="font-heading text-2xl font-semibold">All Agents Overview</h2><p className="mt-1 text-sm text-muted-foreground">Portfolio balances, partner activity and the global cancellation and refund queue.</p></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total Agents" value={String(agents.length)} loading={loading} />
        <Metric label="Active Agents" value={String(agents.filter((agent) => agent.status.toLowerCase() === 'active').length)} loading={loading} />
        <Metric label="Combined Wallet Balance" value={formatAed(combinedWalletBalance)} loading={loading} />
        <Metric label="Total Booking Debits" value={formatAed(totalBookingDebits)} loading={loading} />
        <Metric label="Pending Requests" value={String(pendingRequestCount)} loading={loading} />
      </div>
      <Card className="mt-5 overflow-hidden rounded-2xl border-border/80"><CardHeader><CardTitle>Partner Accounts</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Company Name</TableHead><TableHead>Agent Code</TableHead><TableHead>Status</TableHead><TableHead>Wallet Balance</TableHead><TableHead>Pending Requests</TableHead><TableHead>Last Wallet Activity</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={7} className="py-10 text-center">Loading partner accounts...</TableCell></TableRow> : null}{!loading && !visibleAgents.length ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No partner accounts match the current search.</TableCell></TableRow> : visibleAgents.map((agent) => { const pending = refunds.filter((request) => request.b2b_agent_id === agent.id && request.status === 'Pending').length; const lastActivity = ledger.find((entry) => entry.b2b_agent_id === agent.id); return <TableRow key={agent.id}><TableCell><button type="button" onClick={() => setSelectedId(agent.id)} className="text-left font-semibold text-primary hover:underline">{agent.company_name}</button></TableCell><TableCell className="font-mono text-xs">{agent.agent_code || '-'}</TableCell><TableCell><Badge variant={agent.status.toLowerCase() === 'active' ? 'success' : 'secondary'}>{agent.status}</Badge></TableCell><TableCell className="font-semibold">{formatAed(walletMap[agent.id] || 0)}</TableCell><TableCell>{pending ? <Badge variant="warning">{pending}</Badge> : '0'}</TableCell><TableCell className="whitespace-nowrap text-xs">{lastActivity ? formatDate(lastActivity.created_at) : 'No activity'}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => setSelectedId(agent.id)}>View Account</Button></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>
      <Card className="mt-5 overflow-hidden rounded-2xl border-border/80"><CardHeader><CardTitle>Cancellation and Refund Requests</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Requested Date</TableHead><TableHead>Booking Code</TableHead><TableHead>Agent Company</TableHead><TableHead>Agent Code</TableHead><TableHead>Request Type</TableHead><TableHead>Reason</TableHead><TableHead>Original Debit</TableHead><TableHead>Eligible Refund</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={11} className="py-10 text-center">Loading requests...</TableCell></TableRow> : null}{!loading && !refunds.length ? <TableRow><TableCell colSpan={11} className="py-10 text-center text-muted-foreground">No cancellation or refund requests.</TableCell></TableRow> : refunds.map((request) => { const booking = bookingMap[request.booking_request_id]; const agent = agentMap[request.b2b_agent_id]; const pending = request.status === 'Pending'; return <TableRow key={request.id} className={pending ? 'bg-amber-50/70' : undefined}><TableCell className="whitespace-nowrap text-xs">{formatDate(request.requested_at)}</TableCell><TableCell className="font-mono text-xs">{booking?.booking_code || '-'}</TableCell><TableCell><button type="button" onClick={() => agent && setSelectedId(agent.id)} className="text-left font-semibold text-primary hover:underline">{agent?.company_name || '-'}</button></TableCell><TableCell className="font-mono text-xs">{agent?.agent_code || '-'}</TableCell><TableCell className="whitespace-nowrap font-semibold">{request.request_type === 'no_show_refund' ? 'No Show Refund' : 'Cancellation'}</TableCell><TableCell className="max-w-56">{request.reason}</TableCell><TableCell>{formatAed(booking?.amount_received_aed || booking?.total_amount || 0)}</TableCell><TableCell>{formatAed(request.requested_amount_aed)}</TableCell><TableCell><RequestStatus status={request.status} /></TableCell><TableCell className="max-w-56 text-xs">{request.agent_note || '-'}{request.decision_note ? <p className="mt-1 text-muted-foreground">{request.decision_note}</p> : null}</TableCell><TableCell>{canWrite && pending ? <div className="flex gap-1"><Button size="sm" onClick={() => { setDecision({ request, value: 'Approved' }); setNote(''); }}><CheckCircle2 className="size-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => { setDecision({ request, value: 'Rejected' }); setNote(''); }}><XCircle className="size-4" />Reject</Button></div> : <span className="text-xs text-muted-foreground">Read-only</span>}</TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>
    </> : null}
    {canView && selectedAgent ? <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><p className="font-heading text-xl font-semibold">{selectedAgent.company_name}</p><p className="text-xs text-muted-foreground">{selectedAgent.agent_code} · {selectedAgent.status}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setSelectedId('')}>Back to All Agents</Button>{canWrite ? <><Button onClick={() => openAction('fund')}>Add Wallet Funds</Button><Button variant="outline" onClick={() => openAction('credit')}>Manual Credit</Button><Button variant="outline" onClick={() => openAction('debit')}>Manual Debit</Button></> : <Badge variant="secondary">Finance Read-only</Badge>}</div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Available Balance" value={formatAed(summary?.wallet_balance_aed || selectedWallet)} loading={summaryLoading} /><Metric label="Total Credits" value={formatAed(summary?.wallet_credits_aed || 0)} loading={summaryLoading} /><Metric label="Booking Debits" value={formatAed(summary?.wallet_debits_aed || 0)} loading={summaryLoading} /><Metric label="Refund Credits" value={formatAed(summary?.approved_refunds_aed || 0)} loading={summaryLoading} /><Metric label="Pending Requests" value={String(summary?.pending_refunds || 0)} loading={summaryLoading} /></div>
      <Card className="mt-5 overflow-hidden rounded-2xl border-border/80"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Wallet Ledger</CardTitle><div className="flex flex-wrap gap-2"><Input className="w-56" placeholder="Search ledger" value={ledgerSearch} onChange={(event) => setLedgerSearch(event.target.value)} /><select className={`${selectClass} w-44`} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option><option value="wallet_top_up">Wallet Top-up</option><option value="booking_debit">Booking Debit</option><option value="refund_credit">Refund Credit</option><option value="adjustment">Adjustments</option><option value="reversal">Reversal</option></select><AppDatePicker label="Ledger date" value={dateFilter} placeholder="Select date" onChange={setDateFilter} triggerClassName="w-40" /></div></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date & Time</TableHead><TableHead>Type</TableHead><TableHead>Booking</TableHead><TableHead>Description</TableHead><TableHead>Credit</TableHead><TableHead>Debit</TableHead><TableHead>Balance</TableHead><TableHead>Created By</TableHead><TableHead>Reference</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={10} className="py-10 text-center">Loading ledger...</TableCell></TableRow> : null}{!loading && !visibleLedger.length ? <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No wallet ledger entries match the selected filters.</TableCell></TableRow> : visibleLedger.map((entry) => <TableRow key={entry.id}><TableCell className="whitespace-nowrap text-xs">{formatDate(entry.created_at)}</TableCell><TableCell><TransactionLabel type={entry.transaction_type} /></TableCell><TableCell className="font-mono text-xs">{entry.booking_request_id ? bookingMap[entry.booking_request_id]?.booking_code || '-' : '-'}</TableCell><TableCell className="max-w-64"><p className="truncate">{entry.description}</p></TableCell><TableCell className="font-semibold text-emerald-700">{entry.direction === 'credit' ? formatAed(entry.amount_aed) : '-'}</TableCell><TableCell className="font-semibold text-red-700">{entry.direction === 'debit' ? formatAed(entry.amount_aed) : '-'}</TableCell><TableCell>{formatAed(entry.balance_after_aed)}</TableCell><TableCell className="font-mono text-xs">{entry.actor_admin_user_id ? entry.actor_admin_user_id.slice(0, 8) : 'System'}</TableCell><TableCell className="max-w-48 truncate font-mono text-xs">{entry.idempotency_key || '-'}</TableCell><TableCell>{isReversible(entry) ? <Button size="sm" variant="outline" onClick={() => { setReverseEntry(entry); setReason(''); setNote(''); setReference(''); }}>Reverse</Button> : <span className="text-xs text-muted-foreground">—</span>}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
      <Card className="mt-5 overflow-hidden rounded-2xl border-border/80"><CardHeader><CardTitle>Cancellation and Refund Requests</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Requested</TableHead><TableHead>Booking</TableHead><TableHead>Agent</TableHead><TableHead>Type / Reason</TableHead><TableHead>Original Debit</TableHead><TableHead>Eligible Refund</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{!selectedRefunds.length ? <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No cancellation or refund requests for this partner.</TableCell></TableRow> : selectedRefunds.map((request) => { const booking = bookingMap[request.booking_request_id]; return <TableRow key={request.id}><TableCell className="text-xs">{formatDate(request.requested_at)}</TableCell><TableCell className="font-mono text-xs">{booking?.booking_code || '-'}</TableCell><TableCell>{selectedAgent.company_name}</TableCell><TableCell><p className="font-semibold">{request.request_type === 'no_show_refund' ? 'No Show Refund' : 'Cancellation'}</p><p className="text-xs text-muted-foreground">{request.reason}</p></TableCell><TableCell>{formatAed(booking?.amount_received_aed || booking?.total_amount || 0)}</TableCell><TableCell>{formatAed(request.requested_amount_aed)}</TableCell><TableCell><RequestStatus status={request.status} /></TableCell><TableCell className="max-w-56 text-xs">{request.agent_note || '-'}{request.decision_note ? <p className="mt-1 text-muted-foreground">{request.decision_note}</p> : null}</TableCell><TableCell>{canWrite && request.status === 'Pending' ? <div className="flex gap-1"><Button size="sm" onClick={() => { setDecision({ request, value: 'Approved' }); setNote(''); }}><CheckCircle2 className="size-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => { setDecision({ request, value: 'Rejected' }); setNote(''); }}><XCircle className="size-4" />Reject</Button></div> : <span className="text-xs text-muted-foreground">Read-only</span>}</TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>
    </> : null}
    <WalletActionSheet open={Boolean(walletAction)} onOpenChange={(open) => !open && setWalletAction(null)} action={walletAction} agent={selectedAgent} currentBalance={selectedWallet} amount={amount} setAmount={setAmount} method={method} setMethod={setMethod} reference={reference} setReference={setReference} reason={reason} setReason={setReason} note={note} setNote={setNote} saving={saving} onSubmit={submitWalletAction} />
    <ReversalSheet entry={reverseEntry} booking={reverseEntry?.booking_request_id ? bookingMap[reverseEntry.booking_request_id] : null} reason={reason} setReason={setReason} note={note} setNote={setNote} reference={reference} setReference={setReference} saving={saving} onClose={() => setReverseEntry(null)} onSubmit={submitReversal} />
    <DecisionSheet decision={decision} booking={decision ? bookingMap[decision.request.booking_request_id] : null} agent={decisionAgent} note={note} setNote={setNote} saving={saving} onClose={() => setDecision(null)} onSubmit={submitDecision} />
  </section>;
}

function WalletActionSheet({ open, onOpenChange, action, agent, currentBalance, amount, setAmount, method, setMethod, reference, setReference, reason, setReason, note, setNote, saving, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; action: WalletAction | null; agent: Agent | null; currentBalance: number; amount: string; setAmount: (value: string) => void; method: string; setMethod: (value: string) => void; reference: string; setReference: (value: string) => void; reason: string; setReason: (value: string) => void; note: string; setNote: (value: string) => void; saving: boolean; onSubmit: () => void }) {
  const numeric = Number(amount) || 0; const debit = action === 'debit'; const expected = currentBalance + (debit ? -numeric : numeric); const title = action === 'fund' ? 'Add Wallet Funds' : 'Manual Adjustment';
  return <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}><SheetContent><SheetHeader><SheetTitle>{action === 'credit' ? 'Manual Credit Adjustment' : action === 'debit' ? 'Manual Debit Adjustment' : title}</SheetTitle><SheetDescription>{agent?.company_name} · {agent?.agent_code}</SheetDescription></SheetHeader><div className="flex-1 space-y-4 overflow-y-auto p-5"><Field label="Amount in AED" type="number" min="0.01" step="0.01" value={amount} onChange={setAmount} />{action === 'fund' ? <Select label="Payment / Funding Method" value={method} options={['Bank Transfer', 'Card', 'Cash', 'Cheque', 'Other']} onChange={setMethod} /> : <Field label="Reason" value={reason} onChange={setReason} />}<Field label="External Reference (optional)" value={reference} onChange={setReference} /><label className="grid gap-2 text-sm font-semibold">Internal Admin Note<Textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>{debit ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><strong>Warning:</strong> This adjustment reduces the partner wallet and cannot make it negative.</div> : null}<div className="rounded-xl bg-muted p-4"><Summary label="Current Balance" value={formatAed(currentBalance)} /><Summary label={debit ? 'Debit Amount' : 'Credit Amount'} value={formatAed(numeric)} /><Summary label="Expected Balance After" value={formatAed(Math.max(expected, 0))} strong /></div></div><SheetFooter><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={saving || numeric <= 0 || expected < 0} onClick={onSubmit}>{saving ? 'Processing...' : title}</Button></SheetFooter></SheetContent></Sheet>;
}
function ReversalSheet({ entry, booking, reason, setReason, note, setNote, reference, setReference, saving, onClose, onSubmit }: { entry: Ledger | null; booking: Booking | null; reason: string; setReason: (value: string) => void; note: string; setNote: (value: string) => void; reference: string; setReference: (value: string) => void; saving: boolean; onClose: () => void; onSubmit: () => void }) { return <Sheet open={Boolean(entry)} onOpenChange={(open) => !open && !saving && onClose()}><SheetContent><SheetHeader><SheetTitle>Reverse Eligible Entry</SheetTitle><SheetDescription>This creates one traceable balancing entry.</SheetDescription></SheetHeader>{entry ? <div className="flex-1 space-y-4 overflow-y-auto p-5"><div className="rounded-xl bg-muted p-4"><Summary label="Transaction" value={transactionLabel(entry.transaction_type)} /><Summary label="Amount" value={formatAed(entry.amount_aed)} /><Summary label="Booking" value={booking?.booking_code || '-'} /><Summary label="Original Reference" value={entry.idempotency_key || '-'} /></div><Field label="Required Reason" value={reason} onChange={setReason} /><Field label="Stable Reversal Reference" value={reference} onChange={setReference} /><label className="grid gap-2 text-sm font-semibold">Internal Note<Textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Confirm the original transaction is incorrect. Each eligible entry can be reversed only once.</div></div> : null}<SheetFooter><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving || !reason.trim()} onClick={onSubmit}>{saving ? 'Reversing...' : 'Confirm Reversal'}</Button></SheetFooter></SheetContent></Sheet>; }
function DecisionSheet({ decision, booking, agent, note, setNote, saving, onClose, onSubmit }: { decision: { request: Refund; value: 'Approved' | 'Rejected' } | null; booking: Booking | null; agent: Agent | null; note: string; setNote: (value: string) => void; saving: boolean; onClose: () => void; onSubmit: () => void }) { return <Sheet open={Boolean(decision)} onOpenChange={(open) => !open && !saving && onClose()}><SheetContent><SheetHeader><SheetTitle>{decision?.value} Request</SheetTitle><SheetDescription>{booking?.booking_code} · {agent?.company_name}</SheetDescription></SheetHeader>{decision ? <div className="flex-1 space-y-4 overflow-y-auto p-5"><div className="rounded-xl bg-muted p-4"><Summary label="Customer" value={booking?.customer_name || '-'} /><Summary label="Package" value={booking?.selected_package_name || '-'} /><Summary label="Eligible Refund" value={formatAed(decision.request.requested_amount_aed)} /><Summary label="Agent Reason" value={decision.request.reason} /></div><label className="grid gap-2 text-sm font-semibold">Super Admin Note<Textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} placeholder={decision.value === 'Rejected' ? 'A rejection reason is required.' : 'Explain the approval decision.'} /></label>{decision.value === 'Approved' ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Approval invokes the secured backend workflow, which validates eligibility and creates the wallet refund credit exactly once.</div> : null}</div> : null}<SheetFooter><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving || !note.trim()} onClick={onSubmit}>{saving ? 'Submitting...' : `${decision?.value} Request`}</Button></SheetFooter></SheetContent></Sheet>; }
function Metric({ label, value, loading }: { label: string; value: string; loading: boolean }) { return <Card className="rounded-2xl border-border/80"><CardContent className="flex items-center gap-3 p-4"><WalletCards className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-heading text-xl font-semibold">{loading ? '—' : value}</p></div></CardContent></Card>; }
function transactionLabel(type: string) { return ({ wallet_top_up: 'Wallet Top-up', adjustment_credit: 'Manual Credit', adjustment_debit: 'Manual Debit', booking_debit: 'Booking Debit', refund_credit: 'Refund Credit', reversal: 'Reversal' } as Record<string, string>)[type] || type.replaceAll('_', ' '); }
function TransactionLabel({ type }: { type: string }) { return <span className="whitespace-nowrap text-sm font-semibold">{transactionLabel(type)}</span>; }
function RequestStatus({ status }: { status: string }) { return <Badge variant={status === 'Approved' ? 'success' : status === 'Rejected' ? 'destructive' : 'warning'}>{status}</Badge>; }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) { return <label className="grid gap-2 text-sm font-semibold">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} {...props} /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-semibold">{label}<select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Summary({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className={`flex justify-between gap-4 py-2 text-sm ${strong ? 'border-t font-bold' : ''}`}><span className="text-muted-foreground">{label}</span><span className="text-right">{value}</span></div>; }
