'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, RefreshCw, Save, Search, WalletCards, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type ManagerBooking = {
  id: string;
  booking_code: string;
  status: string | null;
  selected_package_name?: string | null;
  selected_package_capacity?: number | null;
  experience_type: string | null;
  service_type: string | null;
  duration_minutes?: number | null;
  vehicle_quantity?: number | null;
  guest_count?: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_notes?: string | null;
  total_amount: number | null;
  payment_status: string | null;
  payment_method?: string | null;
  payment_received_amount?: number | null;
  cash_handover_status?: string | null;
};

type PaymentForm = { rideStatus: string; paymentStatus: string; paymentMethod: string; receivedAmount: string };
const rideStatuses = ['Confirmed', 'Completed', 'No Show'];
const paymentStatuses = ['Not Paid', 'Partial', 'Paid', 'Refunded'];
const paymentMethods = ['', 'Cash', 'Card', 'B2B Invoice', 'Bank Transfer', 'Online Link'];

function niceDate(value: string | null) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function packageLabel(booking: ManagerBooking) {
  return booking.selected_package_name || booking.experience_type || '-';
}

function serviceDetail(booking: ManagerBooking) {
  const parts = [booking.service_type || 'website'];
  if (booking.selected_package_capacity) parts.push(`${booking.selected_package_capacity} seater`);
  if (booking.duration_minutes) parts.push(`${booking.duration_minutes} min`);
  return parts.join(' · ');
}

function statusClass(status: string | null) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'No Show') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-primary-50 text-primary-900 border-primary/20';
}

function isCashWithManager(booking: ManagerBooking) {
  return booking.payment_method === 'Cash' && booking.cash_handover_status !== 'received' && Number(booking.payment_received_amount || 0) > 0;
}

export function ManagerBookingsPage() {
  const [items, setItems] = useState<ManagerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ManagerBooking | null>(null);

  async function loadBookings() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from(bookingRequestsTable)
      .select('*')
      .in('status', ['Confirmed', 'Completed', 'No Show'])
      .order('preferred_date', { ascending: true })
      .order('preferred_time', { ascending: true })
      .limit(200);

    if (queryError) {
      setError(queryError.message);
      setItems([]);
    } else {
      setItems((data || []) as ManagerBooking[]);
    }
    setLoading(false);
  }

  async function savePayment(booking: ManagerBooking, form: PaymentForm) {
    const now = new Date().toISOString();
    const amount = Number(form.receivedAmount || 0);
    const payload: Record<string, unknown> = {
      status: form.rideStatus,
      payment_status: form.paymentStatus,
      payment_method: form.paymentMethod || null,
      payment_received_amount: amount,
      payment_received_at: amount > 0 ? now : null,
      cash_handover_status: form.paymentMethod === 'Cash' && amount > 0 ? 'pending_handover' : 'not_applicable',
      updated_at: now
    };
    if (form.rideStatus === 'Completed') payload.completed_at = now;
    if (form.rideStatus === 'No Show') payload.no_show_at = now;

    const result = booking.id
      ? await supabase.from(bookingRequestsTable).update(payload).eq('id', booking.id)
      : await supabase.from(bookingRequestsTable).update(payload).eq('booking_code', booking.booking_code);

    if (result.error) throw new Error(result.error.message);
    await loadBookings();
    setSelected(null);
  }

  useEffect(() => { void loadBookings(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((booking) => [booking.booking_code, booking.customer_name, booking.customer_phone, packageLabel(booking), booking.status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [items, query]);

  const confirmed = items.filter((item) => item.status === 'Confirmed').length;
  const completed = items.filter((item) => item.status === 'Completed').length;
  const managerCash = items.filter(isCashWithManager).reduce((sum, item) => sum + Number(item.payment_received_amount || 0), 0);

  return (
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Manager Operations</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Confirmed bookings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Only admin-confirmed bookings appear here. Manager can update ride result and payment collection.</p>
          </div>
          <Button type="button" onClick={loadBookings} variant="outline"><RefreshCw data-icon aria-hidden="true" />Refresh</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric title="Ready for Manager" value={String(confirmed)} icon={CalendarDays} />
          <Metric title="Completed" value={String(completed)} icon={CheckCircle2} />
          <Metric title="Cash With Manager" value={formatAed(managerCash)} icon={WalletCards} />
        </div>

        <Card className="mt-6 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-heading text-xl font-semibold">Manager booking list</CardTitle>
            <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings..." className="h-10 rounded-full pl-9" /></div>
          </CardHeader>
          <CardContent className="p-0">
            {error ? <p className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Booking</TableHead><TableHead>Customer</TableHead><TableHead>Package</TableHead><TableHead>Date / Time</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading confirmed bookings...</TableCell></TableRow> : null}
                  {!loading && filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No confirmed bookings found.</TableCell></TableRow> : null}
                  {filtered.map((booking, index) => <TableRow key={booking.id || `${booking.booking_code}-${index}`}><TableCell className="font-bold text-primary-900">{booking.booking_code}</TableCell><TableCell><div className="font-semibold text-foreground">{booking.customer_name || '-'}</div><div className="text-xs text-muted-foreground">{booking.customer_phone || '-'}</div></TableCell><TableCell><div className="font-semibold text-foreground">{packageLabel(booking)}</div><div className="text-xs text-muted-foreground">{serviceDetail(booking)}</div></TableCell><TableCell>{niceDate(booking.preferred_date)}<div className="text-xs text-muted-foreground">{booking.preferred_time || '-'}</div></TableCell><TableCell>{formatAed(Number(booking.total_amount || 0))}</TableCell><TableCell><div className="font-semibold text-foreground">{booking.payment_status || 'Not Paid'}</div><div className="text-xs text-muted-foreground">{booking.payment_method || '-'}</div></TableCell><TableCell><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status || 'Confirmed'}</span></TableCell><TableCell><Button type="button" size="sm" variant="outline" onClick={() => setSelected(booking)}>Handle Payment</Button></TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {selected ? <PaymentModal booking={selected} onClose={() => setSelected(null)} onSave={savePayment} /> : null}
    </section>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
  return <Card className="rounded-[1.35rem]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" /></span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}

function PaymentModal({ booking, onClose, onSave }: { booking: ManagerBooking; onClose: () => void; onSave: (booking: ManagerBooking, form: PaymentForm) => Promise<void> }) {
  const [form, setForm] = useState<PaymentForm>({ rideStatus: booking.status || 'Confirmed', paymentStatus: booking.payment_status || 'Not Paid', paymentMethod: booking.payment_method || '', receivedAmount: String(booking.payment_received_amount || booking.total_amount || '') });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSaving(true);
    setError('');
    try { await onSave(booking, form); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Failed to save payment.'); } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm"><div className="w-full max-w-3xl rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]"><div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Manager Payment</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{booking.booking_code}</h2></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" /></button></div><div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.9fr]">{error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 lg:col-span-2">{error}</p> : null}<div className="grid gap-3"><InfoLine label="Customer" value={booking.customer_name || '-'} /><InfoLine label="Package" value={packageLabel(booking)} /><InfoLine label="Date / Time" value={`${niceDate(booking.preferred_date)} · ${booking.preferred_time || '-'}`} /><InfoLine label="Charge Amount" value={formatAed(Number(booking.total_amount || 0))} /></div><div className="grid gap-3 rounded-[1.25rem] border border-border bg-[#F7FAFA] p-4"><SelectField label="Ride Status" value={form.rideStatus} options={rideStatuses} onChange={(rideStatus) => setForm((current) => ({ ...current, rideStatus }))} /><SelectField label="Payment Status" value={form.paymentStatus} options={paymentStatuses} onChange={(paymentStatus) => setForm((current) => ({ ...current, paymentStatus }))} /><SelectField label="Payment Method" value={form.paymentMethod} options={paymentMethods} onChange={(paymentMethod) => setForm((current) => ({ ...current, paymentMethod }))} /><label className="grid gap-1.5 text-sm font-semibold text-foreground">Received Amount<input value={form.receivedAmount} onChange={(event) => setForm((current) => ({ ...current, receivedAmount: event.target.value }))} type="number" min="0" step="0.01" className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>{form.paymentMethod === 'Cash' ? <p className="rounded-xl bg-gold/10 px-3 py-2 text-xs font-semibold leading-5 text-primary-900">Cash will stay in manager balance until admin marks it received.</p> : null}<Button type="button" onClick={submit} disabled={saving}><Save data-icon />{saving ? 'Saving...' : 'Save Payment'}</Button></div></div></div></div>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border/70 bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold leading-5 text-foreground">{value}</p></div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option} value={option}>{option || 'None'}</option>)}</select></label>;
}
