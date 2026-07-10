'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, ClipboardCheck, Clock3, CreditCard, RefreshCw, Save, Search, Ship, WalletCards } from 'lucide-react';
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
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
  internal_note?: string | null;
};

type VehicleOption = { name: string; code: string; type: string; status: string };
type ManagerProfile = { name: string; email: string; role: string; ready: boolean };

const stageOptions = ['Assigned', 'Checked-In', 'In Progress', 'Completed', 'No Show'];
const vehicleSelectClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10';

function text(value: unknown, fallback = '-') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function numberValue(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
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

function pendingAmount(booking: BookingRow) {
  const pending = numberValue(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(totalAmount(booking) - receivedAmount(booking), 0);
}

function statusTone(status: unknown) {
  const value = text(status, 'Assigned').toLowerCase();
  if (value.includes('complete') || value.includes('paid')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('no show') || value.includes('cancel')) return 'border-red-200 bg-red-50 text-red-700';
  if (value.includes('progress') || value.includes('check')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function matchesManager(booking: BookingRow, manager: ManagerProfile) {
  const assigned = String(booking.assigned_manager_name || '').trim().toLowerCase();
  const name = manager.name.trim().toLowerCase();
  const email = manager.email.trim().toLowerCase();
  return Boolean(assigned && (assigned === name || assigned === email));
}

function isConfirmedBooking(booking: BookingRow) {
  return text(booking.status, '').toLowerCase() === 'confirmed';
}

function sortSchedule(a: BookingRow, b: BookingRow) {
  return `${text(a.preferred_date, '9999-12-31')} ${text(a.preferred_time, '23:59')}`.localeCompare(`${text(b.preferred_date, '9999-12-31')} ${text(b.preferred_time, '23:59')}`);
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

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.055)]">
      <CardContent className="flex min-w-0 items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="truncate text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{value}</p></div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function ManagerRideCard({ booking, vehicles, onSaved }: { booking: BookingRow; vehicles: VehicleOption[]; onSaved: () => Promise<void> }) {
  const [vehicle, setVehicle] = useState(text(booking.assigned_vehicle_name, ''));
  const [stage, setStage] = useState(text(booking.manager_status, 'Assigned'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const vehicleOptions = Array.from(new Set([vehicle, ...vehicles.map((item) => item.name || item.code)].filter(Boolean)));

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        assigned_vehicle_name: vehicle || null,
        manager_status: stage,
        updated_at: new Date().toISOString()
      };
      if (stage === 'Completed') payload.status = 'Completed';
      if (stage === 'No Show') payload.status = 'No Show';
      const query = supabase.from(bookingRequestsTable).update(payload);
      const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
      if (result.error) throw new Error(result.error.message);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save ride update.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[1.25rem] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(8,37,50,0.055)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{bookingCode(booking)}</p>
          <h3 className="mt-1 break-words font-heading text-base font-semibold text-foreground">{text(booking.customer_name, 'Guest')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{packageLabel(booking)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(stage)}`}>{stage}</span>{booking.b2b_agent_name ? <Badge variant="secondary">B2B · {booking.b2b_agent_name}</Badge> : <Badge variant="outline">Direct Sale</Badge>}</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Schedule" value={dateLabel(booking.preferred_date)} sub={text(booking.preferred_time, 'Time pending')} />
        <Detail label="Ride" value={rideDetails(booking)} sub={text(booking.customer_phone || booking.customer_email, '')} />
        <Detail label="Vehicle" value={vehicle || 'Not selected'} sub="Assigned vehicle" />
        <Detail label="Payment" value={formatAed(totalAmount(booking))} sub={`Pending ${formatAed(pendingAmount(booking))}`} />
      </div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value)} className={vehicleSelectClass}><option value="">Select vehicle</option>{vehicleOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Ride Stage<select value={stage} onChange={(event) => setStage(event.target.value)} className={vehicleSelectClass}>{stageOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <Button type="button" onClick={save} disabled={saving} className="rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Update'}</Button>
      </div>
    </div>
  );
}

function ManagerAssignedRidesPage({ manager }: { manager: ManagerProfile }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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

  const scopedBookings = useMemo(() => bookings.filter((booking) => isConfirmedBooking(booking) && matchesManager(booking, manager)), [bookings, manager]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return scopedBookings.filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_vehicle_name, booking.manager_status].some((value) => String(value || '').toLowerCase().includes(term))).sort(sortSchedule);
  }, [query, scopedBookings]);

  const metrics = useMemo(() => {
    const active = scopedBookings.filter((booking) => ['Assigned', 'Checked-In', 'In Progress'].includes(text(booking.manager_status, 'Assigned'))).length;
    const completed = scopedBookings.filter((booking) => text(booking.manager_status, '') === 'Completed').length;
    const pending = scopedBookings.reduce((sum, booking) => sum + pendingAmount(booking), 0);
    return { total: scopedBookings.length, active, completed, pending };
  }, [scopedBookings]);

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">My Rides</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Assigned confirmed rides</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Sirf woh confirmed bookings yahan show hoti hain jo admin ne {manager.name || manager.email} ko assign ki hain.</p>
        </div>
        <Button type="button" variant="outline" onClick={loadData} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Assigned Rides" value={String(metrics.total)} icon={ClipboardCheck} />
        <MetricCard title="Active Rides" value={String(metrics.active)} icon={Clock3} />
        <MetricCard title="Completed" value={String(metrics.completed)} icon={CheckCircle2} />
        <MetricCard title="Pending Collection" value={formatAed(metrics.pending)} icon={CreditCard} />
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">My assigned ride list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `${visible.length} confirmed rides`}</p></div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, ride, vehicle..." className="h-10 rounded-full bg-white pl-9" /></div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-2">
          {loading ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center text-sm font-semibold text-muted-foreground">Loading assigned rides...</div> : null}
          {!loading && visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No assigned confirmed rides</p><p className="mt-2 text-sm text-muted-foreground">Admin confirmed booking assign karega to yahan show hogi.</p></div> : null}
          {visible.map((booking, index) => <ManagerRideCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} vehicles={vehicles} onSaved={loadData} />)}
        </CardContent>
      </Card>
    </section>
  );
}

export function ManagerScopedAssignmentsPage() {
  const [manager, setManager] = useState<ManagerProfile>({ name: '', email: '', role: 'admin', ready: false });

  useEffect(() => {
    let active = true;
    loadManagerProfile().then((profile) => {
      if (active) setManager(profile);
    });
    return () => { active = false; };
  }, []);

  if (!manager.ready) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading access...</div>;
  if (manager.role === 'manager') return <ManagerAssignedRidesPage manager={manager} />;
  return <AdminOperationsAssignmentsPage />;
}
