'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, CreditCard, RefreshCw, Save, Search, WalletCards, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';
import { AdminOperationsAssignmentsPage } from './admin-operations-modules';

type PortalProfile = {
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
};

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  selected_package_capacity?: number | string | null;
  service_type?: string | null;
  experience_type?: string | null;
  duration_minutes?: number | string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  collection_status?: string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
  internal_note?: string | null;
};

type VehicleOption = { name: string; code: string; type: string; status: string };
type ManagerProfile = { name: string; email: string; role: string; ready: boolean };
type CompletionValues = { method: 'Cash' | 'Card' | 'B2B Invoice'; amount: number; reference: string; note: string };
type RideFilter = 'today' | 'tomorrow' | 'upcoming' | 'overdue' | 'completed' | 'no-show' | 'all';

const selectClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10';
const filterLabels: Record<RideFilter, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  completed: 'Completed',
  'no-show': 'No Show',
  all: 'All'
};

function text(value: unknown, fallback = '-') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function numberValue(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function localDateKey(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(value: unknown) {
  return text(value, '').slice(0, 10);
}

function dateLabel(value: unknown) {
  const clean = text(value, '');
  if (!clean) return 'No date';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00`));
}

function bookingCode(booking: BookingRow) {
  return text(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function packageLabel(booking: BookingRow) {
  return text(booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type, 'Package');
}

function rideDetails(booking: BookingRow) {
  const parts = [booking.service_type, booking.selected_package_capacity ? `${booking.selected_package_capacity} seater` : '', booking.duration_minutes ? `${booking.duration_minutes} min` : ''].filter(Boolean).map(String);
  return parts.length ? parts.join(' · ') : 'Ride details pending';
}

function totalAmount(booking: BookingRow) {
  return numberValue(booking.total_amount || booking.selected_package_price || booking.selected_package_b2b_price);
}

function receivedAmount(booking: BookingRow) {
  const received = numberValue(booking.amount_received_aed);
  if (received > 0) return received;
  const pending = numberValue(booking.amount_pending_aed);
  return Math.max(totalAmount(booking) - pending, 0);
}

function managerStage(booking: BookingRow) {
  const raw = text(booking.manager_status, 'Pending');
  return raw === 'Assigned' ? 'Pending' : raw;
}

function cardStatus(booking: BookingRow) {
  const status = text(booking.status, 'Confirmed');
  const stage = managerStage(booking);
  const workflow = text(booking.payment_workflow_status, '').toLowerCase();
  if (status === 'Completed' || stage === 'Completed') return 'Completed';
  if (status === 'No Show' || stage === 'No Show') return 'No Show';
  if (workflow.includes('ride in progress')) return 'In Progress';
  if (stage === 'Checked-In') return 'Checked-In';
  if (status === 'Confirmed') return 'Confirmed';
  return status || 'Confirmed';
}

function pendingAmount(booking: BookingRow) {
  if (cardStatus(booking) === 'No Show') return 0;
  const pending = numberValue(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(totalAmount(booking) - receivedAmount(booking), 0);
}

function isB2BBooking(booking: BookingRow) {
  return String(booking.payment_source || '').toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name);
}

function paymentSubText(booking: BookingRow) {
  const status = cardStatus(booking);
  if (status === 'No Show') return 'No collection';
  if (status === 'Completed') {
    if (text(booking.payment_method, '') === 'B2B Invoice') return `B2B pending ${formatAed(pendingAmount(booking))}`;
    return `Received ${formatAed(receivedAmount(booking))}`;
  }
  return `Pending ${formatAed(pendingAmount(booking))}`;
}

function statusTone(status: unknown) {
  const value = text(status, 'Confirmed').toLowerCase();
  if (value.includes('complete') || value.includes('paid')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('no show') || value.includes('cancel')) return 'border-red-200 bg-red-50 text-red-700';
  if (value.includes('progress') || value.includes('check')) return 'border-primary/25 bg-primary-50 text-primary';
  if (value.includes('confirm')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function matchesManager(booking: BookingRow, manager: ManagerProfile) {
  const assigned = String(booking.assigned_manager_name || '').trim().toLowerCase();
  const name = manager.name.trim().toLowerCase();
  const email = manager.email.trim().toLowerCase();
  return Boolean(assigned && (assigned === name || assigned === email));
}

function isVisibleBooking(booking: BookingRow) {
  const status = text(booking.status, '').toLowerCase();
  return ['confirmed', 'completed', 'no show'].includes(status);
}

function scheduleSortValue(booking: BookingRow) {
  const date = dateKey(booking.preferred_date) || '9999-12-31';
  const time = text(booking.preferred_time, '23:59');
  return `${date} ${time}`;
}

function isFutureBooking(booking: BookingRow) {
  const rideDate = dateKey(booking.preferred_date);
  return Boolean(rideDate && rideDate > localDateKey());
}

function canOperateBooking(booking: BookingRow) {
  const status = cardStatus(booking);
  if (status === 'Completed' || status === 'No Show') return false;
  return !isFutureBooking(booking);
}

function matchesFilter(booking: BookingRow, filter: RideFilter) {
  const status = cardStatus(booking);
  const rideDate = dateKey(booking.preferred_date);
  const today = localDateKey();
  const tomorrow = localDateKey(1);
  const active = status !== 'Completed' && status !== 'No Show';

  if (filter === 'today') return active && rideDate === today;
  if (filter === 'tomorrow') return active && rideDate === tomorrow;
  if (filter === 'upcoming') return active && Boolean(rideDate) && rideDate > tomorrow;
  if (filter === 'overdue') return active && Boolean(rideDate) && rideDate < today;
  if (filter === 'completed') return status === 'Completed';
  if (filter === 'no-show') return status === 'No Show';
  return true;
}

async function loadManagerProfile(): Promise<ManagerProfile> {
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  const authEmail = authUser?.email || '';
  if (!authUser) return { name: '', email: '', role: 'admin', ready: true };

  const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
  const { data } = await supabase.from('admin_users').select('full_name,email,role,status').or(filter).limit(1);
  const profile = (data || [])[0] as PortalProfile | undefined;

  return {
    name: profile?.full_name || authEmail,
    email: profile?.email || authEmail,
    role: profile?.role || 'admin',
    ready: true
  };
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

function PaymentModal({ booking, onClose, onComplete }: { booking: BookingRow; onClose: () => void; onComplete: (values: CompletionValues) => Promise<void> }) {
  const isB2B = isB2BBooking(booking);
  const total = totalAmount(booking);
  const defaultAmount = isB2B ? 0 : pendingAmount(booking) || total;
  const [method, setMethod] = useState<CompletionValues['method']>(isB2B ? 'B2B Invoice' : 'Cash');
  const [amount, setAmount] = useState(String(defaultAmount));
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const numericAmount = Number(amount || 0);
    if (!isB2B && (!Number.isFinite(numericAmount) || numericAmount <= 0)) {
      setError('Received amount required.');
      return;
    }
    if (method === 'Card' && !reference.trim()) {
      setError('Card reference number required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onComplete({ method, amount: isB2B ? 0 : numericAmount, reference: reference.trim(), note: note.trim() });
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Unable to complete ride.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.22)]">
        <div className="flex items-start justify-between border-b border-border/70 bg-[#F7FAFA] p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Complete Ride</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{bookingCode(booking)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{packageLabel(booking)} · {formatAed(total)}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="space-y-4 p-5">
          {isB2B ? (
            <div className="rounded-2xl border border-primary/15 bg-primary-50 p-4">
              <p className="text-sm font-bold text-primary-900">B2B invoice will be generated</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Payment will stay pending with {text(booking.b2b_agent_name, 'B2B agent')} and appear in B2B ledger.</p>
            </div>
          ) : (
            <>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Payment Method<select value={method} onChange={(event) => setMethod(event.target.value as CompletionValues['method'])} className={selectClass}><option value="Cash">Cash</option><option value="Card">Card</option></select></label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Amount Received<Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" step="0.01" className="h-10 rounded-xl bg-white" /></label>
              {method === 'Card' ? <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Card Reference Number<Input value={reference} onChange={(event) => setReference(event.target.value)} className="h-10 rounded-xl bg-white" placeholder="Card approval / reference" /></label> : null}
            </>
          )}
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Manager Note<textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" placeholder="Optional completion note" /></label>
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
        <div className="flex flex-col gap-2 border-t border-border/70 p-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full bg-white">Cancel</Button>
          <Button type="button" onClick={submit} disabled={saving} className="rounded-full"><CheckCircle2 className="size-4" aria-hidden="true" />{saving ? 'Completing...' : isB2B ? 'Generate Invoice' : 'Complete Payment'}</Button>
        </div>
      </div>
    </div>
  );
}

function RideCard({ booking, vehicles, onSaved }: { booking: BookingRow; vehicles: VehicleOption[]; onSaved: () => Promise<void> }) {
  const [vehicle, setVehicle] = useState(text(booking.assigned_vehicle_name, ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [completionOpen, setCompletionOpen] = useState(false);
  const vehicleOptions = Array.from(new Set([vehicle, ...vehicles.map((item) => item.name || item.code)].filter(Boolean)));
  const displayStatus = cardStatus(booking);
  const inProgress = displayStatus === 'In Progress';
  const completed = displayStatus === 'Completed';
  const noShow = displayStatus === 'No Show';
  const actionAllowed = canOperateBooking(booking);
  const future = isFutureBooking(booking);

  async function startRide() {
    if (!vehicle.trim()) {
      setError('Please select vehicle first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        assigned_vehicle_name: vehicle,
        payment_workflow_status: 'Ride In Progress',
        updated_at: new Date().toISOString()
      };
      const query = supabase.from(bookingRequestsTable).update(payload);
      const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
      if (result.error) throw new Error(result.error.message);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to start ride.');
    } finally {
      setSaving(false);
    }
  }

  async function markNoShow() {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        status: 'No Show',
        manager_status: 'No Show',
        amount_received_aed: 0,
        amount_pending_aed: 0,
        payment_status: 'No Show',
        collection_status: 'no_collection',
        payment_workflow_status: 'No Show',
        updated_at: new Date().toISOString()
      };
      const query = supabase.from(bookingRequestsTable).update(payload);
      const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
      if (result.error) throw new Error(result.error.message);
      await onSaved();
    } catch (showError) {
      setError(showError instanceof Error ? showError.message : 'Unable to mark no show.');
    } finally {
      setSaving(false);
    }
  }

  async function completeRide(values: CompletionValues) {
    const total = totalAmount(booking);
    const received = values.method === 'B2B Invoice' ? 0 : values.amount;
    const pending = values.method === 'B2B Invoice' ? total : Math.max(total - received, 0);
    const noteParts = [booking.internal_note, values.method === 'Card' && values.reference ? `Card ref: ${values.reference}` : '', values.note].filter(Boolean).map(String);
    const payload: Record<string, unknown> = {
      status: 'Completed',
      manager_status: 'Completed',
      payment_method: values.method,
      amount_received_aed: received,
      amount_pending_aed: pending,
      payment_status: values.method === 'B2B Invoice' ? 'Not Paid' : pending <= 0 ? 'Paid' : 'Partial Paid',
      collection_status: values.method === 'B2B Invoice' ? 'pending_collection' : pending <= 0 ? 'collected' : 'partial_collection',
      payment_workflow_status: values.method === 'B2B Invoice' ? 'B2B Invoice Generated' : 'Collected By Manager',
      internal_note: noteParts.join('\n'),
      updated_at: new Date().toISOString()
    };
    if (values.method === 'B2B Invoice') payload.payment_source = 'b2b';
    const query = supabase.from(bookingRequestsTable).update(payload);
    const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
    if (result.error) throw new Error(result.error.message);
    setCompletionOpen(false);
    await onSaved();
  }

  return (
    <div className="rounded-[1.25rem] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(8,37,50,0.055)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{bookingCode(booking)}</p>
          <h3 className="mt-1 break-words font-heading text-base font-semibold text-foreground">{text(booking.customer_name, 'Guest')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{packageLabel(booking)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(displayStatus)}`}>{displayStatus}</span>{future && actionAllowed ? <Badge variant="secondary">Upcoming</Badge> : null}{isB2BBooking(booking) ? <Badge variant="secondary">B2B · {text(booking.b2b_agent_name, 'Agent')}</Badge> : <Badge variant="secondary">Direct Sale</Badge>}</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Schedule" value={dateLabel(booking.preferred_date)} sub={text(booking.preferred_time, 'Time pending')} />
        <Detail label="Ride" value={rideDetails(booking)} sub={text(booking.customer_phone || booking.customer_email, '')} />
        <Detail label="Vehicle" value={vehicle || 'Not selected'} sub={inProgress || completed ? 'Assigned vehicle' : future ? 'Upcoming ride' : 'Select before ride'} />
        <Detail label="Payment" value={formatAed(totalAmount(booking))} sub={paymentSubText(booking)} />
      </div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value)} disabled={!actionAllowed || inProgress} className={selectClass}><option value="">Select vehicle</option>{vehicleOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {actionAllowed && !inProgress ? <Button type="button" onClick={startRide} disabled={saving} className="rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Starting...' : 'Start Ride'}</Button> : null}
          {inProgress ? <Button type="button" onClick={() => setCompletionOpen(true)} className="rounded-full bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="size-4" aria-hidden="true" />Complete Ride</Button> : null}
          {actionAllowed ? <Button type="button" variant="outline" onClick={markNoShow} disabled={saving} className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100"><AlertCircle className="size-4" aria-hidden="true" />No Show</Button> : null}
          {!actionAllowed && future ? <Button type="button" disabled variant="outline" className="rounded-full bg-white">Upcoming</Button> : null}
          {completed ? <Button type="button" disabled className="rounded-full bg-emerald-600"><CheckCircle2 className="size-4" aria-hidden="true" />Completed</Button> : null}
          {noShow ? <Button type="button" disabled variant="outline" className="rounded-full border-red-200 bg-red-50 text-red-700"><AlertCircle className="size-4" aria-hidden="true" />No Show</Button> : null}
        </div>
      </div>
      {completionOpen ? <PaymentModal booking={booking} onClose={() => setCompletionOpen(false)} onComplete={completeRide} /> : null}
    </div>
  );
}

function DateGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-primary/15 bg-primary-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary-900">{label}</div>
      <div className="grid gap-3 xl:grid-cols-2">{children}</div>
    </div>
  );
}

function ManagerAssignedRidesPage({ manager }: { manager: ManagerProfile }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RideFilter>('today');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [bookingResult, vehicleResult] = await Promise.all([
        supabase.from(bookingRequestsTable).select('*').order('preferred_date', { ascending: true }).limit(500),
        supabase.from('vehicles').select('vehicle_code,vehicle_name,vehicle_type,status').order('vehicle_code', { ascending: true }).limit(200)
      ]);
      if (bookingResult.error) throw new Error(bookingResult.error.message);
      setBookings((bookingResult.data || []) as BookingRow[]);
      setVehicles(((vehicleResult.data || []) as Record<string, unknown>[]).map((row) => ({ name: text(row.vehicle_name || row.vehicle_code, 'Vehicle'), code: text(row.vehicle_code, ''), type: text(row.vehicle_type, ''), status: text(row.status, '') })));
    } catch (loadError) {
      setBookings([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load assigned rides.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const scopedBookings = useMemo(() => bookings.filter((booking) => isVisibleBooking(booking) && matchesManager(booking, manager)), [bookings, manager]);
  const counts = useMemo(() => ({
    today: scopedBookings.filter((booking) => matchesFilter(booking, 'today')).length,
    tomorrow: scopedBookings.filter((booking) => matchesFilter(booking, 'tomorrow')).length,
    upcoming: scopedBookings.filter((booking) => matchesFilter(booking, 'upcoming')).length,
    overdue: scopedBookings.filter((booking) => matchesFilter(booking, 'overdue')).length,
    completed: scopedBookings.filter((booking) => matchesFilter(booking, 'completed')).length,
    'no-show': scopedBookings.filter((booking) => matchesFilter(booking, 'no-show')).length,
    all: scopedBookings.length
  }), [scopedBookings]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return scopedBookings
      .filter((booking) => matchesFilter(booking, filter))
      .filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_vehicle_name, booking.manager_status, booking.payment_method].some((value) => String(value || '').toLowerCase().includes(term)))
      .sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b)));
  }, [filter, query, scopedBookings]);

  const groups = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    visible.forEach((booking) => {
      const key = dateKey(booking.preferred_date) || 'No date';
      map.set(key, [...(map.get(key) || []), booking]);
    });
    return Array.from(map.entries()).map(([key, records]) => ({ key, label: key === 'No date' ? 'No date selected' : dateLabel(key), records }));
  }, [visible]);

  const metrics = useMemo(() => {
    const active = scopedBookings.filter((booking) => ['Confirmed', 'Checked-In', 'In Progress'].includes(cardStatus(booking))).length;
    const inProgress = scopedBookings.filter((booking) => cardStatus(booking) === 'In Progress').length;
    const completed = scopedBookings.filter((booking) => cardStatus(booking) === 'Completed').length;
    const completedBookings = scopedBookings.filter((booking) => cardStatus(booking) === 'Completed');
    const cash = completedBookings.filter((booking) => text(booking.payment_method, '').toLowerCase() === 'cash').reduce((sum, booking) => sum + receivedAmount(booking), 0);
    const card = completedBookings.filter((booking) => text(booking.payment_method, '').toLowerCase() === 'card').reduce((sum, booking) => sum + receivedAmount(booking), 0);
    return { active, inProgress, completed, cash, card };
  }, [scopedBookings]);

  const filterList: RideFilter[] = ['today', 'tomorrow', 'upcoming', 'overdue', 'completed', 'no-show', 'all'];

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">My Rides</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Assigned rides by date</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Default view shows today only. Future rides stay in upcoming tabs until their booking date.</p>
        </div>
        <Button type="button" variant="outline" onClick={loadData} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Assigned Rides" value={String(metrics.active)} icon={ClipboardCheck} />
        <MetricCard title="In Progress" value={String(metrics.inProgress)} icon={Clock3} />
        <MetricCard title="Completed" value={String(metrics.completed)} icon={CheckCircle2} />
        <MetricCard title="Cash in Hand" value={formatAed(metrics.cash)} icon={WalletCards} />
        <MetricCard title="Card Payments" value={formatAed(metrics.card)} icon={CreditCard} />
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">{filterLabels[filter]} ride list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `${visible.length} rides`}</p></div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, ride, vehicle..." className="h-10 rounded-full bg-white pl-9" /></div>
        </CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">
          {filterList.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === item ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{filterLabels[item]} <span className={filter === item ? 'text-white/75' : 'text-muted-foreground'}>{counts[item]}</span></button>)}
        </div>
        <CardContent className="grid gap-5 p-4">
          {loading ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center text-sm font-semibold text-muted-foreground">Loading assigned rides...</div> : null}
          {!loading && visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No rides in {filterLabels[filter]}</p><p className="mt-2 text-sm text-muted-foreground">Booking date ke hisab se rides yahan show hongi.</p></div> : null}
          {groups.map((group) => <DateGroup key={group.key} label={group.label}>{group.records.map((booking, index) => <RideCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} vehicles={vehicles} onSaved={loadData} />)}</DateGroup>)}
        </CardContent>
      </Card>
    </section>
  );
}

export function ManagerScopedAssignmentsPage() {
  const [manager, setManager] = useState<ManagerProfile>({ name: '', email: '', role: 'admin', ready: false });

  useEffect(() => {
    let active = true;
    void loadManagerProfile().then((profile) => {
      if (active) setManager(profile);
    });
    return () => { active = false; };
  }, []);

  if (!manager.ready) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading access...</div>;
  if (manager.role === 'manager') return <ManagerAssignedRidesPage manager={manager} />;
  return <AdminOperationsAssignmentsPage />;
}
