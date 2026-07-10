'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, CreditCard, Eye, FileText, RefreshCw, Save, Search, WalletCards, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type PaymentFilter = 'all' | 'pending' | 'collected' | 'cash' | 'card' | 'b2b' | 'direct' | 'no_collection';

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

type PaymentForm = { amount: string; method: string; note: string };

function asText(value: unknown, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function niceDate(value: unknown) {
  const text = asText(value);
  if (!text) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(text.includes('T') ? text : `${text}T12:00:00`));
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

function paymentStatusLabel(booking: BookingRow) {
  if (isNoShow(booking)) return 'No Collection';
  if (isB2B(booking) && bookingPending(booking) > 0) return 'B2B Pending';
  if (bookingPending(booking) <= 0 && bookingTotal(booking) > 0) return 'Collected';
  return asText(booking.payment_status, 'Pending');
}

function isManagerHandled(booking: BookingRow) {
  return Boolean(booking.assigned_manager_name) || Boolean(booking.assigned_vehicle_name) || ['ride in progress', 'collected by manager'].some((value) => asText(booking.payment_workflow_status).toLowerCase().includes(value));
}

function isEditableByAdmin(booking: BookingRow) {
  if (isNoShow(booking)) return false;
  if (isCompleted(booking)) return false;
  if (isB2B(booking)) return false;
  if (isManagerHandled(booking)) return false;
  return bookingTotal(booking) > 0;
}

function lockReason(booking: BookingRow) {
  if (isNoShow(booking)) return 'No collection';
  if (isB2B(booking)) return 'B2B ledger';
  if (isCompleted(booking)) return 'Completed';
  if (isManagerHandled(booking)) return 'Waiting for ride completion';
  return 'Editable';
}

function statusTone(label: string) {
  const value = label.toLowerCase();
  if (value.includes('collected') || value.includes('paid') || value.includes('completed')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('no collection') || value.includes('no show')) return 'border-red-200 bg-red-50 text-red-700';
  if (value.includes('b2b')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone || statusTone(String(children))}`}>{children}</span>;
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.055)]">
      <CardContent className="flex min-w-0 items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="truncate text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{value}</p></div>
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
          <Detail label="Type" value={isB2B(booking) ? 'B2B Invoice' : 'Direct Sale'} sub={asText(booking.b2b_agent_name, '')} />
          <Detail label="Total" value={formatAed(bookingTotal(booking))} />
          <Detail label="Received" value={formatAed(bookingReceived(booking))} />
          <Detail label="Balance" value={formatAed(bookingPending(booking))} />
          <Detail label="Method" value={paymentMethodLabel(booking)} />
          <Detail label="Status" value={paymentStatusLabel(booking)} />
          <Detail label="Admin Lock" value={lockReason(booking)} />
          <div className="sm:col-span-2 lg:col-span-4"><Detail label="Note" value={asText(booking.internal_note, 'No note added.')} /></div>
        </div>
      </div>
    </div>
  );
}

function PaymentUpdateModal({ booking, onClose, onSaved }: { booking: BookingRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<PaymentForm>({ amount: String(bookingPending(booking) || bookingTotal(booking)), method: 'Cash', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const amount = Number(form.amount || 0);
    const total = bookingTotal(booking);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Valid received amount required.');
      return;
    }
    if (!form.method) {
      setError('Payment method required.');
      return;
    }

    const received = Math.min(amount, total);
    const pending = Math.max(total - received, 0);
    const noteParts = [booking.internal_note, form.note].filter(Boolean).map(String);
    const payload: Record<string, unknown> = {
      amount_received_aed: received,
      amount_pending_aed: pending,
      payment_method: form.method,
      payment_status: pending <= 0 ? 'Paid' : received > 0 ? 'Partial Paid' : 'Not Paid',
      collection_status: pending <= 0 ? 'collected' : received > 0 ? 'partial_collection' : 'pending_collection',
      payment_workflow_status: 'Admin Payment Updated',
      internal_note: noteParts.join('\n'),
      updated_at: new Date().toISOString()
    };

    setSaving(true);
    setError('');
    const query = supabase.from(bookingRequestsTable).update(payload);
    const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Update Payment</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{bookingCode(booking)}</h2><p className="mt-1 text-sm text-muted-foreground">Balance {formatAed(bookingPending(booking))}</p></div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="grid gap-4 p-5">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Amount Received<Input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} type="number" min="0" step="0.01" className="h-10 rounded-xl bg-white" /></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Payment Method<select value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"><option value="Cash">Cash</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option><option value="Online Link">Online Link</option></select></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Note<Input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional note" className="h-10 rounded-xl bg-white" /></label>
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border/70 p-5"><Button type="button" variant="outline" onClick={onClose} className="rounded-full bg-white">Cancel</Button><Button type="button" onClick={submit} disabled={saving} className="rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Payment'}</Button></div>
      </div>
    </div>
  );
}

function PaymentRow({ booking, onView, onUpdate }: { booking: BookingRow; onView: () => void; onUpdate: () => void }) {
  const editable = isEditableByAdmin(booking);
  return (
    <div className="grid gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 lg:grid-cols-[1.15fr_1fr_0.8fr_0.85fr_0.85fr_0.85fr_0.85fr_0.95fr_1fr] lg:items-center">
      <div className="min-w-0"><p className="break-words text-xs font-bold uppercase tracking-[0.12em] text-primary">{bookingCode(booking)}</p><p className="mt-1 break-words font-heading text-sm font-semibold text-foreground">{packageLabel(booking)}</p><p className="mt-0.5 text-xs text-muted-foreground">{niceDate(booking.preferred_date)} · {asText(booking.preferred_time, '-')}</p></div>
      <div className="min-w-0"><p className="break-words text-sm font-bold text-foreground">{asText(booking.customer_name, 'Guest')}</p><p className="break-words text-xs text-muted-foreground">{asText(booking.customer_phone || booking.customer_email, '-')}</p></div>
      <div><Badge>{isB2B(booking) ? 'B2B Invoice' : 'Direct Sale'}</Badge></div>
      <div className="text-sm font-bold text-foreground">{formatAed(bookingTotal(booking))}</div>
      <div className="text-sm font-bold text-emerald-700">{formatAed(bookingReceived(booking))}</div>
      <div className={`text-sm font-bold ${bookingPending(booking) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatAed(bookingPending(booking))}</div>
      <div className="text-sm font-semibold text-foreground">{paymentMethodLabel(booking)}</div>
      <div><Badge>{paymentStatusLabel(booking)}</Badge><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{lockReason(booking)}</p></div>
      <div className="flex flex-wrap gap-2 lg:justify-end"><Button type="button" size="sm" variant="outline" onClick={onView} className="rounded-full bg-white"><Eye className="size-4" aria-hidden="true" />View</Button>{editable ? <Button type="button" size="sm" onClick={onUpdate} className="rounded-full"><Save className="size-4" aria-hidden="true" />Update</Button> : null}</div>
    </div>
  );
}

export function AdminPaymentsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [viewBooking, setViewBooking] = useState<BookingRow | null>(null);
  const [updateBooking, setUpdateBooking] = useState<BookingRow | null>(null);

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
      if (filter === 'pending' && bookingPending(booking) <= 0) return false;
      if (filter === 'collected' && !(bookingReceived(booking) > 0 && bookingPending(booking) <= 0)) return false;
      if (filter === 'cash' && paymentMethodLabel(booking).toLowerCase() !== 'cash') return false;
      if (filter === 'card' && paymentMethodLabel(booking).toLowerCase() !== 'card') return false;
      if (filter === 'b2b' && !isB2B(booking)) return false;
      if (filter === 'direct' && isB2B(booking)) return false;
      if (filter === 'no_collection' && !isNoShow(booking)) return false;
      if (!term) return true;
      return [bookingCode(booking), booking.customer_name, booking.customer_phone, booking.customer_email, packageLabel(booking), paymentMethodLabel(booking), paymentStatusLabel(booking), booking.b2b_agent_name].some((value) => asText(value).toLowerCase().includes(term));
    });
  }, [bookings, filter, query]);

  const cash = bookings.filter((booking) => !isNoShow(booking) && paymentMethodLabel(booking).toLowerCase() === 'cash').reduce((sum, booking) => sum + bookingReceived(booking), 0);
  const card = bookings.filter((booking) => !isNoShow(booking) && paymentMethodLabel(booking).toLowerCase() === 'card').reduce((sum, booking) => sum + bookingReceived(booking), 0);
  const b2bPending = bookings.filter((booking) => isB2B(booking) && !isNoShow(booking)).reduce((sum, booking) => sum + bookingPending(booking), 0);
  const totalPending = bookings.filter((booking) => !isNoShow(booking)).reduce((sum, booking) => sum + bookingPending(booking), 0);

  const filterOptions: Array<{ id: PaymentFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: bookings.length },
    { id: 'pending', label: 'Pending', count: bookings.filter((booking) => bookingPending(booking) > 0).length },
    { id: 'collected', label: 'Collected', count: bookings.filter((booking) => bookingReceived(booking) > 0 && bookingPending(booking) <= 0).length },
    { id: 'cash', label: 'Cash', count: bookings.filter((booking) => paymentMethodLabel(booking).toLowerCase() === 'cash').length },
    { id: 'card', label: 'Card', count: bookings.filter((booking) => paymentMethodLabel(booking).toLowerCase() === 'card').length },
    { id: 'b2b', label: 'B2B Invoice', count: bookings.filter(isB2B).length },
    { id: 'direct', label: 'Direct', count: bookings.filter((booking) => !isB2B(booking)).length },
    { id: 'no_collection', label: 'No Collection', count: bookings.filter(isNoShow).length }
  ];

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Payments</p><h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Payment control center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Cash, card, B2B invoice and pending collection in one clean view.</p></div><Button type="button" variant="outline" onClick={refresh} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button></div>
      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Cash in Hand" value={formatAed(cash)} icon={WalletCards} /><MetricCard title="Card Collected" value={formatAed(card)} icon={CreditCard} /><MetricCard title="B2B Pending" value={formatAed(b2bPending)} icon={FileText} /><MetricCard title="Total Pending" value={formatAed(totalPending)} icon={CheckCircle2} /></div>
      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Payment records</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `Showing ${filtered.length} of ${bookings.length}`}</p></div><div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search payment, customer, booking..." className="h-10 rounded-full bg-white pl-9 text-sm font-semibold" /></div></CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">{filterOptions.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{item.label} <span className={filter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span></button>)}</div>
        <CardContent className="p-0">
          {loading ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">Loading payments...</div></div> : null}
          {!loading && filtered.length === 0 ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No payment records found</p><p className="mt-2 text-sm text-muted-foreground">Try another search or filter.</p></div></div> : null}
          {!loading && filtered.length > 0 ? <><div className="hidden border-b border-border/70 bg-[#F7FAFA] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground lg:grid lg:grid-cols-[1.15fr_1fr_0.8fr_0.85fr_0.85fr_0.85fr_0.85fr_0.95fr_1fr]"><span>Booking</span><span>Customer</span><span>Type</span><span>Total</span><span>Received</span><span>Balance</span><span>Method</span><span>Status</span><span className="text-right">Action</span></div><div>{filtered.map((booking) => <PaymentRow key={String(booking.id || bookingCode(booking))} booking={booking} onView={() => setViewBooking(booking)} onUpdate={() => setUpdateBooking(booking)} />)}</div></> : null}
        </CardContent>
      </Card>
      {viewBooking ? <PaymentDetailsModal booking={viewBooking} onClose={() => setViewBooking(null)} /> : null}
      {updateBooking ? <PaymentUpdateModal booking={updateBooking} onClose={() => setUpdateBooking(null)} onSaved={refresh} /> : null}
    </section>
  );
}
