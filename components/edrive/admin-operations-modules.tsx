'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, CreditCard, FileClock, RefreshCw, Search, Ship, UserCog, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  admin_status?: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  selected_package_capacity?: number | string | null;
  experience_type?: string | null;
  service_type?: string | null;
  duration_minutes?: number | string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_source?: string | null;
  collection_status?: string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
  internal_note?: string | null;
  created_at?: string | null;
};

type ManagerOption = { name: string; email: string };
type VehicleOption = { name: string; code: string; type: string; status: string };
type Metric = { title: string; value: string; icon: LucideIcon };
type LoadState = { bookings: BookingRow[]; managers: ManagerOption[]; vehicles: VehicleOption[]; loading: boolean; error: string };

const selectClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10';
const inputClass = 'h-10 rounded-xl bg-white text-sm font-semibold';
const managerStatuses = ['Pending', 'Assigned', 'Checked-In', 'In Progress', 'Completed', 'No Show', 'Cancelled'];
const paymentStatuses = ['Not Paid', 'Partial Paid', 'Paid', 'Refunded'];
const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'Online Link', 'B2B Invoice'];

function asText(value: unknown, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function niceDate(value: unknown) {
  const text = asText(value, '');
  if (!text) return 'No date';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(text.includes('T') ? text : `${text}T12:00:00`));
}

function bookingCode(booking: BookingRow) {
  return asText(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function packageLabel(booking: BookingRow) {
  return asText(booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type, 'Package not selected');
}

function serviceLabel(booking: BookingRow) {
  const parts = [booking.service_type, booking.selected_package_capacity ? `${booking.selected_package_capacity} seater` : '', booking.duration_minutes ? `${booking.duration_minutes} min` : ''].filter(Boolean).map(String);
  return parts.length ? parts.join(' · ') : 'Ride details pending';
}

function bookingTotal(booking: BookingRow) {
  return asNumber(booking.total_amount || booking.selected_package_price || booking.selected_package_b2b_price);
}

function bookingReceived(booking: BookingRow) {
  const received = asNumber(booking.amount_received_aed);
  if (received > 0) return received;
  const pending = asNumber(booking.amount_pending_aed);
  return Math.max(bookingTotal(booking) - pending, 0);
}

function bookingPending(booking: BookingRow) {
  const pending = asNumber(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(bookingTotal(booking) - bookingReceived(booking), 0);
}

function isB2B(booking: BookingRow) {
  return String(booking.payment_source || '').toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name);
}

function sourceLabel(booking: BookingRow) {
  return isB2B(booking) ? `B2B${booking.b2b_agent_name ? ` · ${booking.b2b_agent_name}` : ''}` : 'Direct Sale';
}

function statusTone(status: unknown) {
  const value = asText(status, 'Pending').toLowerCase();
  if (value.includes('confirm') || value.includes('assigned') || value.includes('paid') || value.includes('complete')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('cancel') || value.includes('no show') || value.includes('refund')) return 'border-red-200 bg-red-50 text-red-700';
  if (value.includes('progress') || value.includes('check')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function scheduleSortValue(booking: BookingRow) {
  const date = asText(booking.preferred_date, '9999-12-31');
  const time = asText(booking.preferred_time, '23:59');
  return `${date} ${time}`;
}

function isActiveManager(row: Record<string, unknown>) {
  return String(row.role || '').toLowerCase() === 'manager' && String(row.status || '').toLowerCase() === 'active';
}

async function loadOperationsData(): Promise<Omit<LoadState, 'loading' | 'error'>> {
  const [bookingResult, managerResult, vehicleResult] = await Promise.all([
    supabase.from(bookingRequestsTable).select('*').order('preferred_date', { ascending: true }).limit(500),
    supabase.from('admin_users').select('full_name,email,role,status').order('full_name', { ascending: true }).limit(200),
    supabase.from('vehicles').select('vehicle_code,vehicle_name,vehicle_type,status').order('vehicle_code', { ascending: true }).limit(200)
  ]);

  if (bookingResult.error) throw new Error(bookingResult.error.message);

  const managers = ((managerResult.data || []) as Record<string, unknown>[])
    .filter(isActiveManager)
    .map((row) => ({ name: asText(row.full_name || row.email, 'Manager'), email: asText(row.email, '') }));

  const vehicles = ((vehicleResult.data || []) as Record<string, unknown>[])
    .map((row) => ({
      code: asText(row.vehicle_code, ''),
      name: asText(row.vehicle_name || row.vehicle_code, 'Vehicle'),
      type: asText(row.vehicle_type, ''),
      status: asText(row.status, '')
    }));

  return { bookings: (bookingResult.data || []) as BookingRow[], managers, vehicles };
}

async function updateBooking(booking: BookingRow, payload: Record<string, unknown>) {
  const data = { ...payload, updated_at: new Date().toISOString() };
  const query = supabase.from(bookingRequestsTable).update(data);
  const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
  if (result.error) throw new Error(result.error.message);
}

function useOperationsData() {
  const [state, setState] = useState<LoadState>({ bookings: [], managers: [], vehicles: [], loading: true, error: '' });
  async function refresh() {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await loadOperationsData();
      setState({ ...data, loading: false, error: '' });
    } catch (error) {
      setState({ bookings: [], managers: [], vehicles: [], loading: false, error: error instanceof Error ? error.message : 'Unable to load records.' });
    }
  }
  useEffect(() => { void refresh(); }, []);
  return { ...state, refresh };
}

function PageHeader({ label, title, text, onRefresh }: { label: string; title: string; text: string; onRefresh: () => void }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{label}</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      <Button type="button" variant="outline" onClick={onRefresh} className="w-fit rounded-full bg-white"><RefreshCw data-icon aria-hidden="true" />Refresh</Button>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}</div>;
}

function MetricCard({ title, value, icon: Icon }: Metric) {
  return <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.055)]"><CardContent className="flex min-w-0 items-center gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{value}</p></div></CardContent></Card>;
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p>;
}

function StatusBadge({ status }: { status: unknown }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(status)}`}>{asText(status, 'Pending')}</span>;
}

function DetailBlock({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function BookingCardShell({ booking, children }: { booking: BookingRow; children: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(8,37,50,0.055)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{bookingCode(booking)}</p>
          <h3 className="mt-1 break-words font-heading text-base font-semibold text-foreground">{asText(booking.customer_name, 'Guest')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{packageLabel(booking)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end"><StatusBadge status={booking.status} /><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${isB2B(booking) ? 'border-primary/25 bg-primary-50 text-primary' : 'border-border bg-[#F4F7F8] text-muted-foreground'}`}>{sourceLabel(booking)}</span></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <DetailBlock label="Schedule" value={niceDate(booking.preferred_date)} sub={asText(booking.preferred_time, 'Time pending')} />
        <DetailBlock label="Ride" value={serviceLabel(booking)} sub={asText(booking.customer_phone || booking.customer_email, '')} />
        <DetailBlock label="Manager" value={asText(booking.assigned_manager_name, 'Unassigned')} sub={asText(booking.manager_status, 'Pending')} />
        <DetailBlock label="Payment" value={formatAed(bookingTotal(booking))} sub={`Pending ${formatAed(bookingPending(booking))}`} />
      </div>
      {children}
    </div>
  );
}

export function AdminOperationsSchedulePage() {
  const { bookings, loading, error, refresh } = useOperationsData();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [query, setQuery] = useState('');

  const activeBookings = useMemo(() => bookings.filter((booking) => !['Cancelled', 'No Show'].includes(asText(booking.status, 'Pending'))), [bookings]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return activeBookings
      .filter((booking) => !selectedDate || asText(booking.preferred_date, '') === selectedDate)
      .filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_manager_name, booking.assigned_vehicle_name].some((value) => String(value || '').toLowerCase().includes(term)))
      .sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b)));
  }, [activeBookings, query, selectedDate]);

  const metrics = useMemo<Metric[]>(() => {
    const today = todayKey();
    const todayRecords = activeBookings.filter((booking) => asText(booking.preferred_date, '') === today).length;
    const upcoming = activeBookings.filter((booking) => asText(booking.preferred_date, '') >= today).length;
    const assigned = activeBookings.filter((booking) => booking.assigned_manager_name || booking.assigned_vehicle_name).length;
    const pending = activeBookings.reduce((sum, booking) => sum + bookingPending(booking), 0);
    return [
      { title: 'Today Rides', value: String(todayRecords), icon: CalendarDays },
      { title: 'Upcoming', value: String(upcoming), icon: FileClock },
      { title: 'Assigned', value: String(assigned), icon: ClipboardCheck },
      { title: 'Pending Collection', value: formatAed(pending), icon: WalletCards }
    ];
  }, [activeBookings]);

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <PageHeader label="Schedule" title="Daily operations schedule" text="Date-wise ride plan with booking time, manager, vehicle and payment status." onRefresh={refresh} />
      <ErrorBox message={error} />
      <MetricGrid metrics={metrics} />

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Schedule board</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `${visible.length} bookings`}</p></div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:max-w-2xl">
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className={inputClass} />
            <div className="relative w-full"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search schedule..." className="h-10 rounded-xl bg-white pl-9" /></div>
            <Button type="button" variant="outline" className="rounded-xl bg-white" onClick={() => setSelectedDate('')}>All dates</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-2 2xl:grid-cols-3">
          {loading ? <EmptyState title="Loading schedule" text="Please wait while records are loading." /> : null}
          {!loading && visible.length === 0 ? <EmptyState title="No rides found" text="Try another date or search term." /> : null}
          {visible.map((booking, index) => <BookingCardShell key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking}><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" variant="outline" className="rounded-full bg-white"><Link href="/admin/vehicle-assignment">Manage assignment</Link></Button><Button asChild size="sm" variant="outline" className="rounded-full bg-white"><Link href="/admin/payments">Payment</Link></Button></div></BookingCardShell>)}
        </CardContent>
      </Card>
    </section>
  );
}

export function AdminOperationsAssignmentsPage() {
  const { bookings, managers, vehicles, loading, error, refresh } = useOperationsData();
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned' | 'active'>('all');
  const [query, setQuery] = useState('');

  const eligible = useMemo(() => bookings.filter((booking) => !['Cancelled', 'No Show'].includes(asText(booking.status, 'Pending'))), [bookings]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return eligible.filter((booking) => {
      const matches = !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_manager_name, booking.assigned_vehicle_name].some((value) => String(value || '').toLowerCase().includes(term));
      if (!matches) return false;
      if (filter === 'unassigned') return !booking.assigned_manager_name || !booking.assigned_vehicle_name;
      if (filter === 'assigned') return Boolean(booking.assigned_manager_name || booking.assigned_vehicle_name);
      if (filter === 'active') return ['Checked-In', 'In Progress'].includes(asText(booking.manager_status, 'Pending'));
      return true;
    }).sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b)));
  }, [eligible, filter, query]);

  const metrics = useMemo<Metric[]>(() => {
    const pending = eligible.filter((booking) => !booking.assigned_manager_name || !booking.assigned_vehicle_name).length;
    const assignedToday = eligible.filter((booking) => asText(booking.preferred_date, '') === todayKey() && (booking.assigned_manager_name || booking.assigned_vehicle_name)).length;
    const active = eligible.filter((booking) => ['Checked-In', 'In Progress'].includes(asText(booking.manager_status, 'Pending'))).length;
    const completed = bookings.filter((booking) => asText(booking.status, '') === 'Completed' || asText(booking.manager_status, '') === 'Completed').length;
    return [
      { title: 'Pending Assignment', value: String(pending), icon: ClipboardCheck },
      { title: 'Assigned Today', value: String(assignedToday), icon: Ship },
      { title: 'Active Rides', value: String(active), icon: Clock3 },
      { title: 'Completed', value: String(completed), icon: CheckCircle2 }
    ];
  }, [bookings, eligible]);

  async function saveAssignment(booking: BookingRow, values: { manager: string; vehicle: string; managerStatus: string }) {
    const payload: Record<string, unknown> = {
      assigned_manager_name: values.manager || null,
      assigned_vehicle_name: values.vehicle || null,
      manager_status: values.managerStatus
    };
    if (values.managerStatus === 'Completed') payload.status = 'Completed';
    if (values.managerStatus === 'No Show') payload.status = 'No Show';
    if (values.managerStatus === 'Cancelled') payload.status = 'Cancelled';
    await updateBooking(booking, payload);
    await refresh();
  }

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <PageHeader label="Assignments" title="Manager and vehicle assignment" text="Assign confirmed rides to managers and vehicles, then track ride stages." onRefresh={refresh} />
      <ErrorBox message={error} />
      <MetricGrid metrics={metrics} />

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Assignment list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `${visible.length} bookings`}</p></div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking, manager, vehicle..." className="h-10 rounded-full bg-white pl-9" /></div>
        </CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">
          {[
            ['all', 'All', eligible.length],
            ['unassigned', 'Unassigned', eligible.filter((booking) => !booking.assigned_manager_name || !booking.assigned_vehicle_name).length],
            ['assigned', 'Assigned', eligible.filter((booking) => booking.assigned_manager_name || booking.assigned_vehicle_name).length],
            ['active', 'Active', eligible.filter((booking) => ['Checked-In', 'In Progress'].includes(asText(booking.manager_status, 'Pending'))).length]
          ].map(([id, label, count]) => <button key={String(id)} type="button" onClick={() => setFilter(id as typeof filter)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{label} <span className={filter === id ? 'text-white/75' : 'text-muted-foreground'}>{count}</span></button>)}
        </div>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-2">
          {loading ? <EmptyState title="Loading assignments" text="Please wait while records are loading." /> : null}
          {!loading && visible.length === 0 ? <EmptyState title="No assignments found" text="Confirmed and pending rides will appear here." /> : null}
          {visible.map((booking, index) => <AssignmentCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} managers={managers} vehicles={vehicles} onSave={saveAssignment} />)}
        </CardContent>
      </Card>
    </section>
  );
}

function AssignmentCard({ booking, managers, vehicles, onSave }: { booking: BookingRow; managers: ManagerOption[]; vehicles: VehicleOption[]; onSave: (booking: BookingRow, values: { manager: string; vehicle: string; managerStatus: string }) => Promise<void> }) {
  const [manager, setManager] = useState(asText(booking.assigned_manager_name, ''));
  const [vehicle, setVehicle] = useState(asText(booking.assigned_vehicle_name, ''));
  const [managerStatus, setManagerStatus] = useState(asText(booking.manager_status, 'Pending'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const managerOptions = Array.from(new Set([manager, ...managers.map((item) => item.name)].filter(Boolean)));
  const vehicleOptions = Array.from(new Set([vehicle, ...vehicles.map((item) => item.name || item.code)].filter(Boolean)));

  async function submit() {
    setSaving(true);
    setError('');
    try {
      await onSave(booking, { manager, vehicle, managerStatus });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save assignment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BookingCardShell booking={booking}>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Manager<select value={manager} onChange={(event) => setManager(event.target.value)} className={selectClass}><option value="">Select manager</option>{managerOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value)} className={selectClass}><option value="">Select vehicle</option>{vehicleOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Stage<select value={managerStatus} onChange={(event) => setManagerStatus(event.target.value)} className={selectClass}>{managerStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <div className="mt-4 flex justify-end"><Button type="button" onClick={submit} disabled={saving} className="rounded-full"><ClipboardCheck className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Assignment'}</Button></div>
    </BookingCardShell>
  );
}

export function AdminOperationsPaymentsPage() {
  const { bookings, loading, error, refresh } = useOperationsData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'b2b' | 'direct'>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matches = !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.payment_status, booking.b2b_agent_name].some((value) => String(value || '').toLowerCase().includes(term));
      if (!matches) return false;
      if (filter === 'pending') return bookingPending(booking) > 0;
      if (filter === 'paid') return bookingPending(booking) <= 0 && bookingTotal(booking) > 0;
      if (filter === 'b2b') return isB2B(booking);
      if (filter === 'direct') return !isB2B(booking);
      return true;
    }).sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b)));
  }, [bookings, filter, query]);

  const metrics = useMemo<Metric[]>(() => {
    const collected = bookings.reduce((sum, booking) => sum + bookingReceived(booking), 0);
    const pending = bookings.reduce((sum, booking) => sum + bookingPending(booking), 0);
    const b2bPending = bookings.filter(isB2B).reduce((sum, booking) => sum + bookingPending(booking), 0);
    const directPending = bookings.filter((booking) => !isB2B(booking)).reduce((sum, booking) => sum + bookingPending(booking), 0);
    return [
      { title: 'Collected', value: formatAed(collected), icon: WalletCards },
      { title: 'Pending', value: formatAed(pending), icon: FileClock },
      { title: 'B2B Pending', value: formatAed(b2bPending), icon: UserCog },
      { title: 'Direct Pending', value: formatAed(directPending), icon: CreditCard }
    ];
  }, [bookings]);

  async function savePayment(booking: BookingRow, values: { amountReceived: number; paymentStatus: string; paymentMethod: string; note: string }) {
    const total = bookingTotal(booking);
    const pending = Math.max(total - values.amountReceived, 0);
    const payload: Record<string, unknown> = {
      amount_received_aed: values.amountReceived,
      amount_pending_aed: pending,
      payment_status: values.paymentStatus,
      payment_method: values.paymentMethod,
      collection_status: pending <= 0 ? 'collected' : values.amountReceived > 0 ? 'partial_collection' : 'pending_collection'
    };
    if (values.note.trim()) payload.internal_note = values.note.trim();
    await updateBooking(booking, payload);
    await refresh();
  }

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <PageHeader label="Payments" title="Payment collection tracking" text="Track direct sale and B2B invoices, received amount, pending balance and method." onRefresh={refresh} />
      <ErrorBox message={error} />
      <MetricGrid metrics={metrics} />

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Payment records</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `${visible.length} bookings`}</p></div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search payment..." className="h-10 rounded-full bg-white pl-9" /></div>
        </CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">
          {[
            ['all', 'All', bookings.length],
            ['pending', 'Pending', bookings.filter((booking) => bookingPending(booking) > 0).length],
            ['paid', 'Paid', bookings.filter((booking) => bookingPending(booking) <= 0 && bookingTotal(booking) > 0).length],
            ['b2b', 'B2B', bookings.filter(isB2B).length],
            ['direct', 'Direct', bookings.filter((booking) => !isB2B(booking)).length]
          ].map(([id, label, count]) => <button key={String(id)} type="button" onClick={() => setFilter(id as typeof filter)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{label} <span className={filter === id ? 'text-white/75' : 'text-muted-foreground'}>{count}</span></button>)}
        </div>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-2">
          {loading ? <EmptyState title="Loading payments" text="Please wait while records are loading." /> : null}
          {!loading && visible.length === 0 ? <EmptyState title="No payment records found" text="Try another filter or search term." /> : null}
          {visible.map((booking, index) => <PaymentCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} onSave={savePayment} />)}
        </CardContent>
      </Card>
    </section>
  );
}

function PaymentCard({ booking, onSave }: { booking: BookingRow; onSave: (booking: BookingRow, values: { amountReceived: number; paymentStatus: string; paymentMethod: string; note: string }) => Promise<void> }) {
  const total = bookingTotal(booking);
  const [amountReceived, setAmountReceived] = useState(String(bookingReceived(booking)));
  const [paymentStatus, setPaymentStatus] = useState(asText(booking.payment_status, bookingPending(booking) > 0 ? 'Not Paid' : 'Paid'));
  const [paymentMethod, setPaymentMethod] = useState(asText(booking.payment_method, isB2B(booking) ? 'B2B Invoice' : 'Cash'));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const received = asNumber(amountReceived);
  const pending = Math.max(total - received, 0);

  async function submit() {
    setSaving(true);
    setError('');
    try {
      await onSave(booking, { amountReceived: received, paymentStatus, paymentMethod, note });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save payment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BookingCardShell booking={booking}>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <DetailBlock label="Total" value={formatAed(total)} />
        <DetailBlock label="Received" value={formatAed(received)} />
        <DetailBlock label="Balance" value={formatAed(pending)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Amount received<Input type="number" min="0" value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Payment status<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className={selectClass}>{paymentStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={selectClass}>{paymentMethods.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Note<Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" className={inputClass} /></label>
      </div>
      <div className="mt-4 flex justify-end"><Button type="button" onClick={submit} disabled={saving} className="rounded-full"><WalletCards className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Payment'}</Button></div>
    </BookingCardShell>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] p-8 text-center"><AlertCircle className="mx-auto size-8 text-muted-foreground" aria-hidden="true" /><p className="mt-3 font-heading text-lg font-semibold text-foreground">{title}</p><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>;
}
