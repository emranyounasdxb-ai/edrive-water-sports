'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Building2, CheckCircle2, CreditCard, Eye, FileText, RefreshCw, Save, Search, UserRound, WalletCards, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type PaymentFilter = 'all' | 'manager_cash' | 'manager_card' | 'b2b_due' | 'direct_due' | 'not_due' | 'collected' | 'no_collection';
type SourceType = 'manager' | 'b2b_agent' | 'direct_customer';

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
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  selected_package_price?: number | string | null;
  selected_package_b2b_price?: number | string | null;
  service_type?: string | null;
  duration_minutes?: number | string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
  internal_note?: string | null;
  created_at?: string | null;
};

type GroupSummary = { name: string; bookings: number; cash: number; card: number; due: number; total: number };
type ReceiveTarget = { type: SourceType; title: string; name: string; bookings: BookingRow[] };

function asText(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function asNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(value: unknown) {
  return asText(value).slice(0, 10);
}

function niceDate(value: unknown) {
  const clean = asText(value);
  if (!clean) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00`));
}

function bookingCode(booking: BookingRow) {
  return asText(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function packageLabel(booking: BookingRow) {
  return asText(booking.selected_package_name || booking.selected_package_category || booking.service_type, 'Package');
}

function isNoShow(booking: BookingRow) {
  return asText(booking.status).toLowerCase() === 'no show' || asText(booking.payment_status).toLowerCase() === 'no show' || asText(booking.collection_status).toLowerCase() === 'no_collection';
}

function isCompleted(booking: BookingRow) {
  return asText(booking.status).toLowerCase() === 'completed' || asText(booking.manager_status).toLowerCase() === 'completed';
}

function isB2B(booking: BookingRow) {
  return asText(booking.payment_source).toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name) || asText(booking.payment_method).toLowerCase() === 'b2b invoice';
}

function isAdminReceived(booking: BookingRow) {
  const status = asText(booking.collection_status).toLowerCase();
  const workflow = asText(booking.payment_workflow_status).toLowerCase();
  return status === 'company_received' || workflow.includes('received by admin') || workflow.includes('company received');
}

function isManagerHandled(booking: BookingRow) {
  return Boolean(booking.assigned_manager_name) || Boolean(booking.assigned_vehicle_name) || ['ride in progress', 'collected by manager'].some((value) => asText(booking.payment_workflow_status).toLowerCase().includes(value));
}

function managerName(booking: BookingRow) {
  return asText(booking.assigned_manager_name, 'Unassigned Manager');
}

function b2bAgentName(booking: BookingRow) {
  return asText(booking.b2b_agent_name, 'B2B Agent');
}

function bookingTotal(booking: BookingRow) {
  return isNoShow(booking) ? 0 : asNumber(booking.total_amount || booking.selected_package_price || booking.selected_package_b2b_price);
}

function bookingReceived(booking: BookingRow) {
  if (isNoShow(booking)) return 0;
  return asNumber(booking.amount_received_aed);
}

function bookingPending(booking: BookingRow) {
  if (isNoShow(booking)) return 0;
  const savedPending = asNumber(booking.amount_pending_aed);
  if (savedPending > 0) return savedPending;
  return Math.max(bookingTotal(booking) - bookingReceived(booking), 0);
}

function paymentMethodLabel(booking: BookingRow) {
  if (isNoShow(booking)) return 'No Collection';
  if (isB2B(booking)) return 'B2B Invoice';
  return asText(booking.payment_method, 'Not selected');
}

function isManagerCash(booking: BookingRow) {
  return !isAdminReceived(booking) && !isNoShow(booking) && isCompleted(booking) && isManagerHandled(booking) && paymentMethodLabel(booking).toLowerCase() === 'cash' && bookingReceived(booking) > 0;
}

function isManagerCard(booking: BookingRow) {
  return !isAdminReceived(booking) && !isNoShow(booking) && isCompleted(booking) && isManagerHandled(booking) && paymentMethodLabel(booking).toLowerCase() === 'card' && bookingReceived(booking) > 0;
}

function isB2BDue(booking: BookingRow) {
  return !isNoShow(booking) && isB2B(booking) && bookingPending(booking) > 0 && (isCompleted(booking) || asText(booking.payment_workflow_status).toLowerCase().includes('b2b invoice'));
}

function isDirectDue(booking: BookingRow) {
  return !isNoShow(booking) && !isB2B(booking) && isCompleted(booking) && bookingPending(booking) > 0 && !isManagerCash(booking) && !isManagerCard(booking);
}

function isNotDue(booking: BookingRow) {
  return !isNoShow(booking) && !isCompleted(booking) && bookingTotal(booking) > 0;
}

function isFullyCollected(booking: BookingRow) {
  return !isNoShow(booking) && bookingTotal(booking) > 0 && bookingPending(booking) <= 0 && !isManagerCash(booking) && !isManagerCard(booking);
}

function collectionStage(booking: BookingRow) {
  if (isNoShow(booking)) return 'No Collection';
  if (isManagerCash(booking)) return 'Cash With Manager';
  if (isManagerCard(booking)) return 'Card Collected';
  if (isB2BDue(booking)) return 'B2B Agent Due';
  if (isDirectDue(booking)) return 'Direct Customer Due';
  if (isNotDue(booking)) return 'Upcoming / Not Due';
  if (isFullyCollected(booking)) return 'Company Received';
  if (isB2B(booking) && bookingPending(booking) <= 0 && bookingTotal(booking) > 0) return 'B2B Paid';
  return asText(booking.payment_status, 'Pending Review');
}

function collectFrom(booking: BookingRow) {
  if (isNoShow(booking)) return 'No collection';
  if (isManagerCash(booking) || isManagerCard(booking)) return managerName(booking);
  if (isB2B(booking)) return b2bAgentName(booking);
  if (isDirectDue(booking)) return asText(booking.customer_name, 'Customer');
  if (isNotDue(booking)) return 'Not due yet';
  return 'Company account';
}

function handledBy(booking: BookingRow) {
  if (isB2B(booking)) return 'B2B ledger';
  if (isManagerHandled(booking)) return managerName(booking);
  return 'Admin / direct';
}

function lockReason(booking: BookingRow) {
  if (isNoShow(booking)) return 'No collection required';
  if (isB2B(booking)) return isB2BDue(booking) ? 'Collect from B2B agent' : 'B2B ledger';
  if (isManagerCash(booking)) return 'Receive cash from manager';
  if (isManagerCard(booking)) return 'Verify card reference';
  if (isNotDue(booking)) return 'Ride not completed';
  if (isDirectDue(booking)) return 'Collect from customer';
  return 'Closed';
}

function canReceive(booking: BookingRow) {
  return isManagerCash(booking) || isManagerCard(booking) || isB2BDue(booking) || isDirectDue(booking);
}

function receiveTypeForBooking(booking: BookingRow): SourceType {
  if (isB2BDue(booking)) return 'b2b_agent';
  if (isDirectDue(booking)) return 'direct_customer';
  return 'manager';
}

function receivableAmount(booking: BookingRow, type: SourceType) {
  if (type === 'manager') return bookingReceived(booking);
  return bookingPending(booking);
}

function sourceLabel(type: SourceType) {
  if (type === 'b2b_agent') return 'B2B Agent';
  if (type === 'direct_customer') return 'Customer';
  return 'Manager';
}

function appendNote(existing: unknown, line: string) {
  return [asText(existing), line].filter(Boolean).join('\n');
}

function statusTone(label: string) {
  const value = label.toLowerCase();
  if (value.includes('cash with manager') || value.includes('due')) return 'border-red-200 bg-red-50 text-red-700';
  if (value.includes('card')) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (value.includes('b2b')) return 'border-primary/25 bg-primary-50 text-primary';
  if (value.includes('company') || value.includes('collected') || value.includes('paid')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('no collection') || value.includes('no show')) return 'border-slate-200 bg-slate-50 text-slate-600';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone || statusTone(String(children))}`}>{children}</span>;
}

function MetricCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: LucideIcon }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.055)]">
      <CardContent className="flex min-w-0 items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="truncate text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{value}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-muted-foreground">{helper}</p></div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function PaymentDetailsModal({ booking, onClose }: { booking: BookingRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[86vh] w-full max-w-4xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5">
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Payment Record</p><h2 className="mt-1 break-words font-heading text-2xl font-semibold text-foreground">{bookingCode(booking)}</h2><p className="mt-1 text-sm text-muted-foreground">{asText(booking.customer_name, 'Guest')} · {packageLabel(booking)}</p></div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="grid max-h-[calc(86vh-5.5rem)] gap-3 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Date / Time" value={niceDate(booking.preferred_date)} sub={asText(booking.preferred_time, '-')} />
          <Detail label="Customer" value={asText(booking.customer_name, 'Guest')} sub={asText(booking.customer_phone || booking.customer_email, '-')} />
          <Detail label="Collect From" value={collectFrom(booking)} sub={collectionStage(booking)} />
          <Detail label="Handled By" value={handledBy(booking)} sub={lockReason(booking)} />
          <Detail label="Total" value={formatAed(bookingTotal(booking))} />
          <Detail label="Received" value={formatAed(bookingReceived(booking))} />
          <Detail label="Balance" value={formatAed(bookingPending(booking))} />
          <Detail label="Method" value={paymentMethodLabel(booking)} />
          <Detail label="Status" value={<Badge>{collectionStage(booking)}</Badge>} />
          <Detail label="Vehicle" value={asText(booking.assigned_vehicle_name, '-')} sub={asText(booking.selected_package_category, '')} />
          <div className="sm:col-span-2 lg:col-span-4"><Detail label="Note" value={asText(booking.internal_note, 'No note added.')} /></div>
        </div>
      </div>
    </div>
  );
}

function generateReceiptNumber() {
  const date = localDateValue(new Date()).replaceAll('-', '');
  return `RC-${date}-${String(Date.now()).slice(-6)}`;
}

function defaultReceiptMethod(target: ReceiveTarget) {
  if (target.type === 'b2b_agent') return 'Bank Transfer';
  if (target.type === 'direct_customer') return 'Cash';
  const hasCash = target.bookings.some(isManagerCash);
  const hasCard = target.bookings.some(isManagerCard);
  if (hasCash && hasCard) return 'Mixed Handover';
  if (hasCard) return 'Card Settlement';
  return 'Cash Handover';
}

function PaymentReceiveModal({ target, onClose, onSaved }: { target: ReceiveTarget; onClose: () => void; onSaved: () => Promise<void> }) {
  const totalDue = target.bookings.reduce((sum, booking) => sum + receivableAmount(booking, target.type), 0);
  const [amount, setAmount] = useState(String(totalDue));
  const [method, setMethod] = useState(defaultReceiptMethod(target));
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const amountNumber = Number(amount || 0);

  async function submit() {
    setError('');
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError('Enter valid received amount.');
      return;
    }
    if (amountNumber > totalDue) {
      setError('Received amount cannot be higher than due amount.');
      return;
    }
    if (target.type === 'manager' && Math.round(amountNumber * 100) !== Math.round(totalDue * 100)) {
      setError('Manager handover must be received in full for selected records. Receive individual records if needed.');
      return;
    }

    setSaving(true);
    try {
      const receiptNumber = generateReceiptNumber();
      const { data: sessionData } = await supabase.auth.getSession();
      const receivedBy = sessionData.session?.user?.email || 'Admin';
      const receiptPayload = {
        receipt_number: receiptNumber,
        source_type: target.type,
        source_name: target.name,
        received_amount: amountNumber,
        payment_method: method,
        reference_no: reference.trim() || null,
        note: note.trim() || null,
        received_by: receivedBy,
        received_at: new Date().toISOString()
      };
      const receiptResult = await supabase.from('payment_receipts').insert(receiptPayload).select('id').single();
      if (receiptResult.error) throw receiptResult.error;
      const receiptId = receiptResult.data?.id as string;
      let remaining = amountNumber;
      const allocations = target.bookings.map((booking) => {
        const before = receivableAmount(booking, target.type);
        const allocated = Math.min(before, remaining);
        remaining = Math.max(remaining - allocated, 0);
        return { booking, before, allocated, after: Math.max(before - allocated, 0) };
      }).filter((item) => item.allocated > 0);
      const allocationPayload = allocations.map((item) => ({
        receipt_id: receiptId,
        booking_request_id: asText(item.booking.id) || null,
        booking_code: bookingCode(item.booking),
        allocated_amount: item.allocated,
        balance_before: item.before,
        balance_after: item.after
      }));
      const allocationResult = await supabase.from('payment_receipt_allocations').insert(allocationPayload).select('id,booking_code');
      if (allocationResult.error) throw allocationResult.error;
      const ledgerRows = allocations.flatMap((item) => {
        const allocationId = (allocationResult.data || []).find((row: { id: string; booking_code: string }) => row.booking_code === bookingCode(item.booking))?.id || null;
        const base = {
          receipt_id: receiptId,
          allocation_id: allocationId,
          booking_request_id: asText(item.booking.id) || null,
          booking_code: bookingCode(item.booking),
          amount: item.allocated,
          narration: `${receiptNumber} · ${sourceLabel(target.type)} payment received`
        };
        return [
          { ...base, account_type: target.type, account_name: target.name, entry_type: 'source_out' },
          { ...base, account_type: 'company', account_name: 'Company Account', entry_type: 'company_in' }
        ];
      });
      const ledgerResult = await supabase.from('payment_ledger_entries').insert(ledgerRows);
      if (ledgerResult.error) throw ledgerResult.error;

      for (const item of allocations) {
        const booking = item.booking;
        const existingNote = appendNote(booking.internal_note, `${receiptNumber}: ${formatAed(item.allocated)} received by admin from ${target.name}.`);
        let payload: Record<string, unknown>;
        if (target.type === 'manager') {
          payload = {
            payment_status: 'Paid',
            collection_status: 'company_received',
            payment_workflow_status: 'Received By Admin',
            internal_note: existingNote,
            updated_at: new Date().toISOString()
          };
        } else {
          const newReceived = bookingReceived(booking) + item.allocated;
          const newPending = Math.max(bookingPending(booking) - item.allocated, 0);
          payload = {
            amount_received_aed: newReceived,
            amount_pending_aed: newPending,
            payment_status: newPending <= 0 ? 'Paid' : 'Partial Paid',
            collection_status: newPending <= 0 ? 'collected' : 'partial_collection',
            payment_workflow_status: target.type === 'b2b_agent' ? (newPending <= 0 ? 'B2B Paid' : 'B2B Payment Received') : (newPending <= 0 ? 'Direct Payment Collected' : 'Direct Partial Payment'),
            internal_note: existingNote,
            updated_at: new Date().toISOString()
          };
        }
        const updateQuery = supabase.from(bookingRequestsTable).update(payload);
        const updateResult = booking.id ? await updateQuery.eq('id', booking.id) : await updateQuery.eq('booking_code', bookingCode(booking));
        if (updateResult.error) throw updateResult.error;
      }

      await onSaved();
      onClose();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to receive payment.';
      setError(message.includes('payment_receipts') || message.includes('payment_receipt_allocations') || message.includes('payment_ledger_entries') ? 'Payment receiving tables are missing. Run supabase/payment-receiving.sql in Supabase first.' : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Receive Payment</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{target.title}</h2><p className="mt-1 text-sm text-muted-foreground">{target.bookings.length} booking{target.bookings.length === 1 ? '' : 's'} · Due {formatAed(totalDue)}</p></div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="grid max-h-[calc(88vh-9rem)] gap-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2"><Detail label="Receive From" value={target.name} sub={sourceLabel(target.type)} /><Detail label="Amount Due" value={formatAed(totalDue)} sub={target.type === 'manager' ? 'Manager handover is full amount.' : 'Partial payment allowed.'} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Amount Received<Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" max={totalDue} step="0.01" className="h-10 rounded-xl bg-white" /></label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Payment Method<select value={method} onChange={(event) => setMethod(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground"><option value="Cash Handover">Cash Handover</option><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Card Settlement">Card Settlement</option><option value="Mixed Handover">Mixed Handover</option><option value="Cheque">Cheque</option></select></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Reference No<Input value={reference} onChange={(event) => setReference(event.target.value)} className="h-10 rounded-xl bg-white" placeholder="Transfer, cheque, card ref" /></label><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Admin Note<Input value={note} onChange={(event) => setNote(event.target.value)} className="h-10 rounded-xl bg-white" /></label></div>
          <div className="rounded-[1.15rem] border border-border bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Allocation preview</p><div className="mt-2 grid gap-2">{target.bookings.slice(0, 6).map((booking) => <div key={bookingCode(booking)} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7FAFA] px-3 py-2 text-xs"><span className="min-w-0 break-words font-semibold text-foreground">{bookingCode(booking)}</span><span className="shrink-0 font-bold text-primary">{formatAed(receivableAmount(booking, target.type))}</span></div>)}</div>{target.bookings.length > 6 ? <p className="mt-2 text-xs font-semibold text-muted-foreground">+ {target.bookings.length - 6} more records</p> : null}</div>
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
        <div className="flex flex-col-reverse justify-end gap-2 border-t border-border/70 p-5 sm:flex-row"><Button type="button" variant="outline" onClick={onClose} className="rounded-full bg-white">Cancel</Button><Button type="button" onClick={submit} disabled={saving || !amountNumber || amountNumber <= 0} className="rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Receipt & Receive'}</Button></div>
      </div>
    </div>
  );
}

function targetForBooking(booking: BookingRow): ReceiveTarget {
  const type = receiveTypeForBooking(booking);
  const name = type === 'b2b_agent' ? b2bAgentName(booking) : type === 'direct_customer' ? asText(booking.customer_name, 'Customer') : managerName(booking);
  return { type, name, title: `${sourceLabel(type)} · ${name}`, bookings: [booking] };
}

function PaymentRow({ booking, onView, onReceive }: { booking: BookingRow; onView: () => void; onReceive: () => void }) {
  const stage = collectionStage(booking);
  return (
    <div className="grid gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 lg:grid-cols-[1.1fr_0.9fr_1fr_0.9fr_0.75fr_0.75fr_0.75fr_1fr_0.9fr] lg:items-center">
      <div className="min-w-0"><p className="break-words text-xs font-bold uppercase tracking-[0.12em] text-primary">{bookingCode(booking)}</p><p className="mt-1 break-words font-heading text-sm font-semibold text-foreground">{packageLabel(booking)}</p><p className="mt-0.5 text-xs text-muted-foreground">{niceDate(booking.preferred_date)} · {asText(booking.preferred_time, '-')}</p></div>
      <div className="min-w-0"><p className="break-words text-sm font-bold text-foreground">{asText(booking.customer_name, 'Guest')}</p><p className="break-words text-xs text-muted-foreground">{asText(booking.customer_phone || booking.customer_email, '-')}</p></div>
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Collect from</p><p className="mt-1 break-words text-sm font-bold text-foreground">{collectFrom(booking)}</p><Badge>{isB2B(booking) ? 'B2B' : isManagerHandled(booking) ? 'Manager' : 'Direct'}</Badge></div>
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Handled by</p><p className="mt-1 break-words text-sm font-bold text-foreground">{handledBy(booking)}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{lockReason(booking)}</p></div>
      <div className="text-sm font-bold text-foreground">{formatAed(bookingTotal(booking))}</div>
      <div className="text-sm font-bold text-emerald-700">{formatAed(bookingReceived(booking))}</div>
      <div className={`text-sm font-bold ${bookingPending(booking) > 0 && !isNotDue(booking) ? 'text-red-700' : 'text-emerald-700'}`}>{formatAed(bookingPending(booking))}</div>
      <div><Badge>{stage}</Badge><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{paymentMethodLabel(booking)}</p></div>
      <div className="flex flex-wrap gap-2 lg:justify-end"><Button type="button" size="sm" variant="outline" onClick={onView} className="rounded-full bg-white"><Eye className="size-4" aria-hidden="true" />View</Button>{canReceive(booking) ? <Button type="button" size="sm" onClick={onReceive} className="rounded-full"><Save className="size-4" aria-hidden="true" />Receive</Button> : null}</div>
    </div>
  );
}

function buildManagerGroups(bookings: BookingRow[]) {
  const groups = new Map<string, GroupSummary>();
  bookings.filter((booking) => isManagerCash(booking) || isManagerCard(booking)).forEach((booking) => {
    const name = managerName(booking);
    const current = groups.get(name) || { name, bookings: 0, cash: 0, card: 0, due: 0, total: 0 };
    current.bookings += 1;
    current.cash += isManagerCash(booking) ? bookingReceived(booking) : 0;
    current.card += isManagerCard(booking) ? bookingReceived(booking) : 0;
    current.total += bookingReceived(booking);
    groups.set(name, current);
  });
  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}

function buildB2BGroups(bookings: BookingRow[]) {
  const groups = new Map<string, GroupSummary>();
  bookings.filter(isB2BDue).forEach((booking) => {
    const name = b2bAgentName(booking);
    const current = groups.get(name) || { name, bookings: 0, cash: 0, card: 0, due: 0, total: 0 };
    current.bookings += 1;
    current.due += bookingPending(booking);
    current.total += bookingTotal(booking);
    groups.set(name, current);
  });
  return Array.from(groups.values()).sort((a, b) => b.due - a.due);
}

function MiniGroupCard({ title, empty, groups, type, onReceive }: { title: string; empty: string; groups: GroupSummary[]; type: 'manager' | 'b2b'; onReceive: (group: GroupSummary) => void }) {
  return (
    <Card className="overflow-hidden rounded-[1.35rem] border-border/80 bg-white shadow-[0_12px_28px_rgba(8,37,50,0.045)]">
      <CardHeader className="border-b border-border/70 bg-[#F7FAFA] px-4 py-3"><CardTitle className="font-heading text-base font-semibold">{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-2 p-3">
        {!groups.length ? <div className="rounded-xl border border-dashed border-border bg-[#F7FAFA] px-3 py-4 text-center text-xs font-semibold text-muted-foreground">{empty}</div> : groups.slice(0, 5).map((group) => (
          <div key={group.name} className="rounded-xl border border-border/70 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-foreground">{group.name}</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{group.bookings} booking{group.bookings === 1 ? '' : 's'}</p></div><p className="shrink-0 text-sm font-bold text-primary">{formatAed(type === 'manager' ? group.total : group.due)}</p></div>
            {type === 'manager' ? <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Cash {formatAed(group.cash)} · Card {formatAed(group.card)}</p> : <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Invoice total {formatAed(group.total)}</p>}
            <Button type="button" size="sm" onClick={() => onReceive(group)} className="mt-2 w-full rounded-full"><Save className="size-4" aria-hidden="true" />Receive Payment</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminPaymentsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [viewBooking, setViewBooking] = useState<BookingRow | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<ReceiveTarget | null>(null);

  async function refresh() {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from(bookingRequestsTable).select('*').order('preferred_date', { ascending: false }).limit(1500);
    if (loadError) {
      setError(loadError.message);
      setBookings([]);
    } else {
      setBookings((data || []) as BookingRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (filter === 'manager_cash' && !isManagerCash(booking)) return false;
      if (filter === 'manager_card' && !isManagerCard(booking)) return false;
      if (filter === 'b2b_due' && !isB2BDue(booking)) return false;
      if (filter === 'direct_due' && !isDirectDue(booking)) return false;
      if (filter === 'not_due' && !isNotDue(booking)) return false;
      if (filter === 'collected' && !isFullyCollected(booking)) return false;
      if (filter === 'no_collection' && !isNoShow(booking)) return false;
      if (!term) return true;
      return [bookingCode(booking), booking.customer_name, booking.customer_phone, booking.customer_email, packageLabel(booking), paymentMethodLabel(booking), collectionStage(booking), collectFrom(booking), handledBy(booking), booking.b2b_agent_name].some((value) => asText(value).toLowerCase().includes(term));
    });
  }, [bookings, filter, query]);

  const cashWithManagers = bookings.filter(isManagerCash).reduce((sum, booking) => sum + bookingReceived(booking), 0);
  const managerCard = bookings.filter(isManagerCard).reduce((sum, booking) => sum + bookingReceived(booking), 0);
  const b2bDue = bookings.filter(isB2BDue).reduce((sum, booking) => sum + bookingPending(booking), 0);
  const directDue = bookings.filter(isDirectDue).reduce((sum, booking) => sum + bookingPending(booking), 0);
  const notDue = bookings.filter(isNotDue).reduce((sum, booking) => sum + bookingPending(booking), 0);
  const noCollectionCount = bookings.filter(isNoShow).length;
  const readyToCollect = cashWithManagers + b2bDue + directDue;
  const managerGroups = buildManagerGroups(bookings);
  const b2bGroups = buildB2BGroups(bookings);

  function openManagerGroup(group: GroupSummary) {
    const groupBookings = bookings.filter((booking) => managerName(booking) === group.name && (isManagerCash(booking) || isManagerCard(booking)));
    setReceiveTarget({ type: 'manager', name: group.name, title: `Manager · ${group.name}`, bookings: groupBookings });
  }

  function openB2BGroup(group: GroupSummary) {
    const groupBookings = bookings.filter((booking) => b2bAgentName(booking) === group.name && isB2BDue(booking));
    setReceiveTarget({ type: 'b2b_agent', name: group.name, title: `B2B Agent · ${group.name}`, bookings: groupBookings });
  }

  const filterOptions: Array<{ id: PaymentFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: bookings.length },
    { id: 'manager_cash', label: 'Manager Cash', count: bookings.filter(isManagerCash).length },
    { id: 'manager_card', label: 'Manager Card', count: bookings.filter(isManagerCard).length },
    { id: 'b2b_due', label: 'B2B Due', count: bookings.filter(isB2BDue).length },
    { id: 'direct_due', label: 'Direct Due', count: bookings.filter(isDirectDue).length },
    { id: 'not_due', label: 'Upcoming / Not Due', count: bookings.filter(isNotDue).length },
    { id: 'collected', label: 'Company Received', count: bookings.filter(isFullyCollected).length },
    { id: 'no_collection', label: 'No Collection', count: bookings.filter(isNoShow).length }
  ];

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Payments</p><h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Payment control center</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Receive manager handovers, B2B agent payments, and direct customer balances into the company account.</p></div><Button type="button" variant="outline" onClick={refresh} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button></div>
      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard title="Ready To Collect" value={formatAed(readyToCollect)} helper="Manager cash + B2B due + direct due" icon={CheckCircle2} />
        <MetricCard title="Cash With Managers" value={formatAed(cashWithManagers)} helper="Receive handover from managers" icon={WalletCards} />
        <MetricCard title="B2B Agent Due" value={formatAed(b2bDue)} helper="Receivable from B2B agents" icon={Building2} />
        <MetricCard title="Direct Customer Due" value={formatAed(directDue)} helper="Completed direct rides with balance" icon={UserRound} />
        <MetricCard title="Card Collected" value={formatAed(managerCard)} helper="Verify card/reference payments" icon={CreditCard} />
        <MetricCard title="Upcoming / Not Due" value={formatAed(notDue)} helper={`${noCollectionCount} no-collection records`} icon={FileText} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <MiniGroupCard title="Collect from managers" empty="No manager cash/card collections right now." groups={managerGroups} type="manager" onReceive={openManagerGroup} />
        <MiniGroupCard title="Collect from B2B agents" empty="No B2B agent balance due right now." groups={b2bGroups} type="b2b" onReceive={openB2BGroup} />
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Payment records</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `Showing ${filtered.length} of ${bookings.length}`}</p></div><div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search manager, agent, customer, booking..." className="h-10 rounded-full bg-white pl-9 text-sm font-semibold" /></div></CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">{filterOptions.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{item.label} <span className={filter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span></button>)}</div>
        <CardContent className="p-0">
          {loading ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">Loading payments...</div></div> : null}
          {!loading && filtered.length === 0 ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No payment records found</p><p className="mt-2 text-sm text-muted-foreground">Try another search or filter.</p></div></div> : null}
          {!loading && filtered.length > 0 ? <><div className="hidden border-b border-border/70 bg-[#F7FAFA] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground lg:grid lg:grid-cols-[1.1fr_0.9fr_1fr_0.9fr_0.75fr_0.75fr_0.75fr_1fr_0.9fr]"><span>Booking</span><span>Customer</span><span>Collect From</span><span>Handled By</span><span>Total</span><span>Received</span><span>Balance</span><span>Stage</span><span className="text-right">Action</span></div><div>{filtered.map((booking) => <PaymentRow key={String(booking.id || bookingCode(booking))} booking={booking} onView={() => setViewBooking(booking)} onReceive={() => setReceiveTarget(targetForBooking(booking))} />)}</div></> : null}
        </CardContent>
      </Card>
      {viewBooking ? <PaymentDetailsModal booking={viewBooking} onClose={() => setViewBooking(null)} /> : null}
      {receiveTarget ? <PaymentReceiveModal target={receiveTarget} onClose={() => setReceiveTarget(null)} onSaved={refresh} /> : null}
    </section>
  );
}
