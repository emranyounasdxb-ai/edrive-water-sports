'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Building2, CreditCard, Download, FileDown, FileText, Landmark, LayoutDashboard, Printer, RefreshCw, Save, Search, WalletCards, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';
import { exportFinanceCsv, exportFinancePdf, type ExportColumn } from '@/lib/finance-report-export';
import { AdminPaymentsPage } from './admin-payments-page';
import { usePortalAccess } from './portal-access';

type PaymentTab = 'overview' | 'manager' | 'b2b' | 'receipts' | 'ledger';
type ReceivableKind = 'manager' | 'b2b_agent';

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  manager_status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  collection_status?: string | null;
  customer_name?: string | null;
  total_amount?: number | string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  assigned_manager_name?: string | null;
  assigned_manager_id?: string | null;
  b2b_agent_name?: string | null;
  b2b_agent_id?: string | null;
  internal_note?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
};

type ReceiptRow = {
  id: string;
  receipt_number: string;
  source_type: string;
  source_name: string;
  received_amount: number | string;
  payment_method: string;
  reference_no: string | null;
  note: string | null;
  received_by: string | null;
  received_at: string;
};

type AllocationRow = {
  id: string;
  receipt_id: string;
  booking_code: string;
  allocated_amount: number | string;
  balance_before: number | string;
  balance_after: number | string;
};

type LedgerRow = {
  id: string;
  receipt_id: string | null;
  booking_code: string | null;
  account_type: string;
  account_name: string;
  entry_type: string;
  amount: number | string;
  narration: string | null;
  created_at: string;
};

type ReceivableGroup = {
  kind: ReceivableKind;
  sourceId: string;
  name: string;
  bookings: BookingRow[];
  cash: number;
  card: number;
  due: number;
};

const tabItems: Array<{ id: PaymentTab; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'manager', label: 'Manager Settlements', icon: WalletCards },
  { id: 'b2b', label: 'B2B Receivables', icon: Building2 },
  { id: 'receipts', label: 'Receipts', icon: FileText },
  { id: 'ledger', label: 'Company Ledger', icon: Landmark }
];

function text(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function amount(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bookingCode(booking: BookingRow) {
  return text(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function niceDate(value: unknown) {
  const clean = text(value);
  if (!clean) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00`));
}

function niceDateTime(value: unknown) {
  const clean = text(value);
  if (!clean) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(clean));
}

function isNoShow(booking: BookingRow) {
  return [booking.status, booking.payment_status, booking.collection_status]
    .map((value) => text(value).toLowerCase())
    .some((value) => value === 'no show' || value === 'no_collection');
}

function isCompleted(booking: BookingRow) {
  return [booking.status, booking.manager_status].map((value) => text(value).toLowerCase()).includes('completed');
}

function isB2B(booking: BookingRow) {
  return text(booking.payment_source).toLowerCase() === 'b2b'
    || Boolean(text(booking.b2b_agent_name))
    || text(booking.payment_method).toLowerCase() === 'b2b invoice';
}

function companyReceived(booking: BookingRow) {
  const collection = text(booking.collection_status).toLowerCase();
  const workflow = text(booking.payment_workflow_status).toLowerCase();
  return collection === 'company_received' || workflow.includes('received by admin') || workflow.includes('company received');
}

function bookingTotal(booking: BookingRow) {
  return isNoShow(booking) ? 0 : amount(booking.total_amount);
}

function bookingReceived(booking: BookingRow) {
  return isNoShow(booking) ? 0 : amount(booking.amount_received_aed);
}

function bookingPending(booking: BookingRow) {
  if (isNoShow(booking)) return 0;
  const saved = amount(booking.amount_pending_aed);
  return saved > 0 ? saved : Math.max(bookingTotal(booking) - bookingReceived(booking), 0);
}

function isManagerDue(booking: BookingRow) {
  const method = text(booking.payment_method).toLowerCase();
  return !isNoShow(booking)
    && !companyReceived(booking)
    && isCompleted(booking)
    && Boolean(text(booking.assigned_manager_name))
    && ['cash', 'card'].includes(method)
    && bookingReceived(booking) > 0;
}

function isB2BDue(booking: BookingRow) {
  const workflow = text(booking.payment_workflow_status).toLowerCase();
  return !isNoShow(booking)
    && isB2B(booking)
    && bookingPending(booking) > 0
    && (isCompleted(booking) || workflow.includes('b2b invoice'));
}

function buildGroups(bookings: BookingRow[], kind: ReceivableKind) {
  const groups = new Map<string, ReceivableGroup>();
  bookings.filter((booking) => kind === 'manager' ? isManagerDue(booking) : isB2BDue(booking)).forEach((booking) => {
    const sourceId = text(kind === 'manager' ? booking.assigned_manager_id : booking.b2b_agent_id);
    if (!sourceId) return;
    const name = kind === 'manager' ? text(booking.assigned_manager_name, 'Unassigned Manager') : text(booking.b2b_agent_name, 'B2B Agent');
    const current = groups.get(sourceId) || { kind, sourceId, name, bookings: [], cash: 0, card: 0, due: 0 };
    current.bookings.push(booking);
    if (kind === 'manager') {
      if (text(booking.payment_method).toLowerCase() === 'cash') current.cash += bookingReceived(booking);
      if (text(booking.payment_method).toLowerCase() === 'card') current.card += bookingReceived(booking);
      current.due += bookingReceived(booking);
    } else {
      current.due += bookingPending(booking);
    }
    groups.set(sourceId, current);
  });
  return Array.from(groups.values()).sort((a, b) => b.due - a.due);
}

function Metric({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: LucideIcon }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_10px_28px_rgba(8,37,50,0.05)]">
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 font-heading text-xl font-semibold text-foreground sm:text-2xl">{value}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{helper}</p></div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function SettlementModal({ group, onClose, onSaved }: { group: ReceivableGroup; onClose: () => void; onSaved: () => Promise<void> }) {
  const totalDue = group.due;
  const [receivedAmount, setReceivedAmount] = useState(String(totalDue));
  const [method, setMethod] = useState(group.kind === 'manager' ? (group.cash > 0 && group.card > 0 ? 'Mixed Handover' : group.card > 0 ? 'Card Settlement' : 'Cash Handover') : 'Bank Transfer');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const operationKey = useRef('');
  if (!operationKey.current) operationKey.current = crypto.randomUUID();
  const numericAmount = Number(receivedAmount || 0);
  const paymentMethods = group.kind === 'manager'
    ? ['Cash Handover', 'Card Settlement', 'Mixed Handover']
    : ['Bank Transfer', 'Cash', 'Card Settlement', 'Cheque'];

  async function submit() {
    setError('');
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Enter a valid received amount.');
    if (numericAmount > totalDue) return setError('Received amount cannot be higher than the outstanding amount.');
    if (group.kind === 'manager' && Math.round(numericAmount * 100) !== Math.round(totalDue * 100)) return setError('Manager settlement must be received in full for these bookings.');

    setSaving(true);
    try {
      let remaining = numericAmount;
      const allocations = group.bookings.map((booking) => {
        const before = group.kind === 'manager' ? bookingReceived(booking) : bookingPending(booking);
        const allocated = Math.min(before, remaining);
        remaining = Math.max(remaining - allocated, 0);
        return {
          booking_request_id: text(booking.id),
          allocated_amount: allocated
        };
      }).filter((item) => item.allocated_amount > 0);
      if (allocations.some((item) => !item.booking_request_id)) throw new Error('A selected booking is missing its permanent ID.');
      const { error: rpcError } = await supabase.rpc('receive_finance_settlement', {
        p_operation_key: operationKey.current,
        p_source_type: group.kind,
        p_source_id: group.sourceId,
        p_received_amount: numericAmount,
        p_payment_method: method,
        p_reference_no: reference.trim() || null,
        p_note: note.trim() || null,
        p_allocations: allocations
      });
      if (rpcError) throw new Error(rpcError.message);

      await onSaved();
      onClose();
    } catch (saveError) {
      console.error('Settlement receipt failed', saveError);
      setError('The payment could not be recorded. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
        <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-[#F7FAFA] p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Receive Settlement</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{group.name}</h2><p className="mt-1 text-sm text-muted-foreground">{group.bookings.length} bookings | {formatAed(totalDue)} outstanding</p></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm"><X className="size-4" aria-hidden="true" /></button></div>
        <div className="grid max-h-[calc(88vh-9rem)] gap-4 overflow-y-auto p-5">
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2"><Detail label="Receive From" value={group.name} sub={group.kind === 'manager' ? 'Manager settlement' : 'B2B receivable'} /><Detail label="Outstanding" value={formatAed(totalDue)} sub={group.kind === 'manager' ? 'Full settlement required' : 'Partial payment allowed'} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Amount<Input value={receivedAmount} onChange={(event) => setReceivedAmount(event.target.value)} disabled={group.kind === 'manager'} type="number" min="0" max={totalDue} step="0.01" className="h-10 rounded-xl bg-white" /></label><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Method<select value={method} onChange={(event) => setMethod(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold">{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Reference<Input value={reference} onChange={(event) => setReference(event.target.value)} className="h-10 rounded-xl bg-white" placeholder="Transfer, cheque or card ref" /></label><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Note<Input value={note} onChange={(event) => setNote(event.target.value)} className="h-10 rounded-xl bg-white" /></label></div>
          <div className="rounded-[1.15rem] border border-border p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Booking allocation</p><div className="mt-2 grid gap-2">{group.bookings.map((booking) => <div key={bookingCode(booking)} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7FAFA] px-3 py-2 text-xs"><span className="font-semibold text-foreground">{bookingCode(booking)}</span><span className="font-bold text-primary">{formatAed(group.kind === 'manager' ? bookingReceived(booking) : bookingPending(booking))}</span></div>)}</div></div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border/70 p-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose} className="rounded-full bg-white">Cancel</Button><Button type="button" onClick={submit} disabled={saving || numericAmount <= 0} className="rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Receipt & Receive'}</Button></div>
      </div>
    </div>
  );
}

function ReceivableTab({ kind, groups, query, onQuery, onReceive }: { kind: ReceivableKind; groups: ReceivableGroup[]; query: string; onQuery: (value: string) => void; onReceive: (group: ReceivableGroup) => void }) {
  const visible = groups.filter((group) => !query.trim() || group.name.toLowerCase().includes(query.trim().toLowerCase()) || group.bookings.some((booking) => bookingCode(booking).toLowerCase().includes(query.trim().toLowerCase())));
  const totalDue = groups.reduce((sum, group) => sum + group.due, 0);
  const bookingCount = groups.reduce((sum, group) => sum + group.bookings.length, 0);
  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label={kind === 'manager' ? 'Manager Outstanding' : 'B2B Outstanding'} value={formatAed(totalDue)} helper={`${bookingCount} unsettled bookings`} icon={kind === 'manager' ? WalletCards : Building2} /><Metric label={kind === 'manager' ? 'Managers To Settle' : 'Agents To Collect'} value={String(groups.length)} helper="Grouped by responsible account" icon={kind === 'manager' ? CreditCard : Landmark} />{kind === 'manager' ? <><Metric label="Cash Handover" value={formatAed(groups.reduce((sum, group) => sum + group.cash, 0))} helper="Cash currently with managers" icon={WalletCards} /><Metric label="Card Settlement" value={formatAed(groups.reduce((sum, group) => sum + group.card, 0))} helper="Card payments pending verification" icon={CreditCard} /></> : <><Metric label="Open Invoices" value={String(bookingCount)} helper="Completed B2B bookings with balance" icon={FileText} /><Metric label="Average Due" value={formatAed(groups.length ? totalDue / groups.length : 0)} helper="Average outstanding per agent" icon={Building2} /></>}</div>
      <Card className="mt-4 overflow-hidden rounded-[1.35rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA] px-4 py-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="font-heading text-xl font-semibold">{kind === 'manager' ? 'Manager settlements' : 'B2B receivables'}</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{visible.length} accounts</p></div><label className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search account or booking..." className="h-10 rounded-full bg-white pl-9" /></label></div></CardHeader><CardContent className="grid gap-3 p-3 sm:p-4">{!visible.length ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No outstanding accounts.</div> : visible.map((group) => <div key={group.name} className="rounded-[1.15rem] border border-border/70 bg-white p-3 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-heading text-base font-semibold text-foreground">{group.name}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{group.bookings.length} booking{group.bookings.length === 1 ? '' : 's'}{kind === 'manager' ? ` | Cash ${formatAed(group.cash)} | Card ${formatAed(group.card)}` : ''}</p></div><div className="flex items-center gap-3"><p className="font-heading text-lg font-semibold text-primary">{formatAed(group.due)}</p><Button type="button" size="sm" onClick={() => onReceive(group)} className="rounded-full"><Save className="size-4" aria-hidden="true" />Receive</Button></div></div><div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{group.bookings.map((booking) => <div key={bookingCode(booking)} className="rounded-xl bg-[#F7FAFA] px-3 py-2"><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-primary">{bookingCode(booking)}</p><p className="mt-1 text-sm font-semibold text-foreground">{text(booking.customer_name, 'Guest')}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{niceDate(booking.preferred_date)} | {text(booking.preferred_time, '-')}</p></div><p className="shrink-0 text-sm font-bold text-foreground">{formatAed(kind === 'manager' ? bookingReceived(booking) : bookingPending(booking))}</p></div></div>)}</div></div>)}</CardContent></Card>
    </section>
  );
}

function ReceiptsTab({ receipts, allocations, query, onQuery }: { receipts: ReceiptRow[]; allocations: AllocationRow[]; query: string; onQuery: (value: string) => void }) {
  const allocationMap = useMemo(() => {
    const map = new Map<string, AllocationRow[]>();
    allocations.forEach((row) => map.set(row.receipt_id, [...(map.get(row.receipt_id) || []), row]));
    return map;
  }, [allocations]);
  const visible = receipts.filter((receipt) => !query.trim() || [receipt.receipt_number, receipt.source_name, receipt.payment_method, receipt.reference_no, receipt.received_by].some((value) => text(value).toLowerCase().includes(query.trim().toLowerCase())));
  const total = receipts.reduce((sum, receipt) => sum + amount(receipt.received_amount), 0);
  return <section className="px-4 py-5 sm:px-6 lg:px-8"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total Company Receipts" value={formatAed(total)} helper={`${receipts.length} saved receipts`} icon={FileText} /><Metric label="Manager Receipts" value={formatAed(receipts.filter((row) => row.source_type === 'manager').reduce((sum, row) => sum + amount(row.received_amount), 0))} helper="Cash and card handovers" icon={WalletCards} /><Metric label="B2B Receipts" value={formatAed(receipts.filter((row) => row.source_type === 'b2b_agent').reduce((sum, row) => sum + amount(row.received_amount), 0))} helper="Collections from B2B agents" icon={Building2} /><Metric label="Direct Receipts" value={formatAed(receipts.filter((row) => row.source_type === 'direct_customer').reduce((sum, row) => sum + amount(row.received_amount), 0))} helper="Direct customer balances" icon={CreditCard} /></div><Card className="mt-4 overflow-hidden rounded-[1.35rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA] px-4 py-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="font-heading text-xl font-semibold">Receipt history</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{visible.length} receipts</p></div><label className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search receipt, source, reference..." className="h-10 rounded-full bg-white pl-9" /></label></div></CardHeader><CardContent className="grid gap-3 p-3 sm:p-4">{!visible.length ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No receipts found.</div> : visible.map((receipt) => { const receiptAllocations = allocationMap.get(receipt.id) || []; return <div key={receipt.id} className="grid gap-3 rounded-[1.15rem] border border-border/70 bg-white p-3 shadow-sm lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-bold text-primary">{receipt.receipt_number}</p><p className="mt-1 font-semibold text-foreground">{receipt.source_name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{receipt.source_type.replaceAll('_', ' ')}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Method</p><p className="mt-1 text-sm font-bold text-foreground">{receipt.payment_method}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{receipt.reference_no || 'No reference'}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Received</p><p className="mt-1 font-heading text-lg font-semibold text-emerald-700">{formatAed(amount(receipt.received_amount))}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Date</p><p className="mt-1 text-sm font-semibold text-foreground">{niceDateTime(receipt.received_at)}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{receipt.received_by || 'Admin'}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Allocated Bookings</p><div className="mt-1 flex flex-wrap gap-1.5">{receiptAllocations.length ? receiptAllocations.slice(0, 4).map((allocation) => <span key={allocation.id} className="rounded-full bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary">{allocation.booking_code} | {formatAed(amount(allocation.allocated_amount))}</span>) : <span className="text-xs text-muted-foreground">No allocations</span>}{receiptAllocations.length > 4 ? <span className="text-xs font-semibold text-muted-foreground">+{receiptAllocations.length - 4}</span> : null}</div></div></div>; })}</CardContent></Card></section>;
}

function LedgerTab({ ledger, receipts, query, onQuery }: { ledger: LedgerRow[]; receipts: ReceiptRow[]; query: string; onQuery: (value: string) => void }) {
  const receiptMap = useMemo(() => new Map(receipts.map((row) => [row.id, row])), [receipts]);
  const companyEntries = ledger.filter((row) => row.entry_type === 'company_in');
  const visible = companyEntries.filter((entry) => { const receipt = entry.receipt_id ? receiptMap.get(entry.receipt_id) : undefined; return !query.trim() || [entry.booking_code, entry.narration, receipt?.receipt_number, receipt?.source_name, receipt?.payment_method].some((value) => text(value).toLowerCase().includes(query.trim().toLowerCase())); });
  const methodTotal = (term: string) => companyEntries.reduce((sum, entry) => { const method = text(entry.receipt_id ? receiptMap.get(entry.receipt_id)?.payment_method : '').toLowerCase(); return sum + (method.includes(term) ? amount(entry.amount) : 0); }, 0);
  const total = companyEntries.reduce((sum, entry) => sum + amount(entry.amount), 0);
  return <section className="px-4 py-5 sm:px-6 lg:px-8"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Company Collections" value={formatAed(total)} helper={`${companyEntries.length} ledger credits`} icon={Landmark} /><Metric label="Cash Received" value={formatAed(methodTotal('cash'))} helper="Cash and cash handovers" icon={WalletCards} /><Metric label="Bank / Cheque" value={formatAed(methodTotal('bank') + methodTotal('cheque'))} helper="Bank transfers and cheques" icon={Building2} /><Metric label="Card Settlements" value={formatAed(methodTotal('card'))} helper="Card settlement receipts" icon={CreditCard} /></div><Card className="mt-4 overflow-hidden rounded-[1.35rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA] px-4 py-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="font-heading text-xl font-semibold">Company account ledger</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">Read-only company credits from saved receipts</p></div><label className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search receipt, booking or source..." className="h-10 rounded-full bg-white pl-9" /></label></div></CardHeader><CardContent className="grid gap-2 p-3 sm:p-4">{!visible.length ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No company ledger entries.</div> : visible.map((entry) => { const receipt = entry.receipt_id ? receiptMap.get(entry.receipt_id) : undefined; return <div key={entry.id} className="grid gap-2 rounded-xl border border-border/70 bg-white px-3 py-3 shadow-sm sm:grid-cols-[1fr_1fr_0.8fr_0.9fr] sm:items-center"><div><p className="text-xs font-bold text-primary">{receipt?.receipt_number || 'Ledger Entry'}</p><p className="mt-1 text-sm font-semibold text-foreground">{receipt?.source_name || entry.account_name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{entry.booking_code || 'General receipt'}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Method</p><p className="mt-1 text-sm font-semibold text-foreground">{receipt?.payment_method || '-'}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{entry.narration || 'Company account credit'}</p></div><p className="font-heading text-lg font-semibold text-emerald-700">+ {formatAed(amount(entry.amount))}</p><p className="text-xs font-semibold text-muted-foreground sm:text-right">{niceDateTime(entry.created_at)}</p></div>; })}</CardContent></Card></section>;
}

export function AdminPaymentsControlCenter() {
  const { fullName, email, role } = usePortalAccess();
  const [activeTab, setActiveTab] = useState<PaymentTab>('overview');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [settlement, setSettlement] = useState<ReceivableGroup | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    const [bookingResult, receiptResult, allocationResult, ledgerResult] = await Promise.all([
      supabase.from(bookingRequestsTable).select('*').order('preferred_date', { ascending: false }).limit(1500),
      supabase.from('payment_receipts').select('*').order('received_at', { ascending: false }).limit(1000),
      supabase.from('payment_receipt_allocations').select('*').order('created_at', { ascending: false }).limit(3000),
      supabase.from('payment_ledger_entries').select('*').order('created_at', { ascending: false }).limit(3000)
    ]);
    const firstError = bookingResult.error || receiptResult.error || allocationResult.error || ledgerResult.error;
    if (firstError) { console.error('Payment information load failed', firstError); setError('Unable to load payment information. Please try again.'); }
    setBookings((bookingResult.data || []) as BookingRow[]);
    setReceipts((receiptResult.data || []) as ReceiptRow[]);
    setAllocations((allocationResult.data || []) as AllocationRow[]);
    setLedger((ledgerResult.data || []) as LedgerRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { setQuery(''); }, [activeTab]);

  const managerGroups = useMemo(() => buildGroups(bookings, 'manager'), [bookings]);
  const b2bGroups = useMemo(() => buildGroups(bookings, 'b2b_agent'), [bookings]);
  const tabCounts: Record<PaymentTab, number> = {
    overview: bookings.length,
    manager: managerGroups.reduce((sum, group) => sum + group.bookings.length, 0),
    b2b: b2bGroups.reduce((sum, group) => sum + group.bookings.length, 0),
    receipts: receipts.length,
    ledger: ledger.filter((row) => row.entry_type === 'company_in').length
  };

  const receiptColumns: ExportColumn<ReceiptRow>[] = [
    { heading: 'Receipt', value: (row) => row.receipt_number },
    { heading: 'Source', value: (row) => row.source_name },
    { heading: 'Amount AED', value: (row) => amount(row.received_amount) },
    { heading: 'Method', value: (row) => row.payment_method },
    { heading: 'Reference', value: (row) => row.reference_no || '-' },
    { heading: 'Received By', value: (row) => row.received_by || '-' },
    { heading: 'Received At', value: (row) => niceDateTime(row.received_at) }
  ];
  const ledgerColumns: ExportColumn<LedgerRow>[] = [
    { heading: 'Booking', value: (row) => row.booking_code || '-' },
    { heading: 'Account', value: (row) => row.account_name },
    { heading: 'Entry', value: (row) => row.entry_type },
    { heading: 'Amount AED', value: (row) => amount(row.amount) },
    { heading: 'Narration', value: (row) => row.narration || '-' },
    { heading: 'Date', value: (row) => niceDateTime(row.created_at) }
  ];
  const exportRows = activeTab === 'receipts'
    ? receipts.filter((row) => !query.trim() || Object.values(row).some((value) => text(value).toLowerCase().includes(query.trim().toLowerCase())))
    : ledger.filter((row) => row.entry_type === 'company_in' && (!query.trim() || Object.values(row).some((value) => text(value).toLowerCase().includes(query.trim().toLowerCase()))));
  const exportContext = activeTab === 'receipts'
    ? { reportType: 'Payment Receipts', dateFrom: '', dateTo: '', filters: { search: query }, rows: exportRows as ReceiptRow[], columns: receiptColumns, generatedBy: fullName || email }
    : { reportType: 'Company Ledger', dateFrom: '', dateTo: '', filters: { search: query }, rows: exportRows as LedgerRow[], columns: ledgerColumns, generatedBy: fullName || email };

  function printCurrentReceipts() {
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup || activeTab !== 'receipts') return;
    const lines = (exportRows as ReceiptRow[]).map((row) => `<tr><td>${text(row.receipt_number)}</td><td>${text(row.source_name)}</td><td>${formatAed(amount(row.received_amount))}</td><td>${text(row.payment_method)}</td><td>${text(row.reference_no, '-')}</td><td>${niceDateTime(row.received_at)}</td></tr>`).join('');
    popup.document.write(`<title>eDrive Payment Receipts</title><main style="font-family:Arial;padding:24px"><h1>eDrive Water Sports</h1><h2>Payment Receipts</h2><table border="1" cellspacing="0" cellpadding="7"><thead><tr><th>Receipt</th><th>Source</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th></tr></thead><tbody>${lines}</tbody></table></main>`);
    popup.document.close();
    popup.print();
  }

  return (
    <section className="w-full overflow-hidden">
      <div className="px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-[0_18px_45px_rgba(8,37,50,0.055)] lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Finance</p><h1 className="mt-2 font-heading text-2xl font-semibold text-foreground sm:text-3xl">Payment workspace</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Track outstanding accounts, receive settlements, review receipts and reconcile company collections.</p></div><Button type="button" variant="outline" onClick={load} disabled={loading} className="w-fit rounded-full bg-white"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Refresh</Button></div>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <div className="mt-4 flex gap-2 overflow-x-auto rounded-[1.15rem] border border-border/70 bg-white p-2 shadow-sm">{tabItems.map((item) => { const Icon = item.icon; const active = activeTab === item.id; return <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-primary-50 hover:text-primary-900'}`}><Icon className="size-4" aria-hidden="true" />{item.label}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? 'bg-white/15 text-white' : 'bg-[#F4F7F8] text-muted-foreground'}`}>{tabCounts[item.id]}</span></button>; })}</div>
        {activeTab === 'receipts' || activeTab === 'ledger' ? <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" disabled={!exportRows.length} onClick={() => void exportFinanceCsv(exportContext as never)}><Download className="size-4" />Export CSV</Button><Button variant="outline" disabled={!exportRows.length} onClick={() => void exportFinancePdf(exportContext as never)}><FileDown className="size-4" />Download PDF</Button>{activeTab === 'receipts' ? <Button variant="outline" disabled={!exportRows.length} onClick={printCurrentReceipts}><Printer className="size-4" />Print Receipts</Button> : null}</div> : null}
        {role === 'finance' ? <p className="mt-3 text-xs font-semibold text-muted-foreground">Finance access is limited to payment receipts, settlement allocations and company ledger collection fields.</p> : null}
      </div>

      {activeTab === 'overview' ? <AdminPaymentsPage /> : null}
      {activeTab === 'manager' ? <ReceivableTab kind="manager" groups={managerGroups} query={query} onQuery={setQuery} onReceive={setSettlement} /> : null}
      {activeTab === 'b2b' ? <ReceivableTab kind="b2b_agent" groups={b2bGroups} query={query} onQuery={setQuery} onReceive={setSettlement} /> : null}
      {activeTab === 'receipts' ? <ReceiptsTab receipts={receipts} allocations={allocations} query={query} onQuery={setQuery} /> : null}
      {activeTab === 'ledger' ? <LedgerTab ledger={ledger} receipts={receipts} query={query} onQuery={setQuery} /> : null}
      {settlement ? <SettlementModal group={settlement} onClose={() => setSettlement(null)} onSaved={load} /> : null}
    </section>
  );
}
