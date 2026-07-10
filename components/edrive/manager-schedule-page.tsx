'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, CheckCircle2, Clock3, RefreshCw, Search, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';
import { AdminOperationsSchedulePage } from './admin-operations-modules';

type ManagerProfile = { name: string; email: string; role: string; ready: boolean };

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
  payment_method?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
};

type PortalProfile = { full_name: string | null; email: string | null; role: string | null; status: string | null };
type Metric = { title: string; value: string; icon: LucideIcon };

type ScheduleFilter = 'today' | 'tomorrow' | 'week' | 'all';

function asText(value: unknown, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
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
  return asText(value, '').slice(0, 10);
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
  return asText(booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type, 'Package');
}

function rideDetails(booking: BookingRow) {
  const parts = [booking.service_type, booking.selected_package_capacity ? `${booking.selected_package_capacity} seater` : '', booking.duration_minutes ? `${booking.duration_minutes} min` : ''].filter(Boolean).map(String);
  return parts.length ? parts.join(' · ') : 'Ride details pending';
}

function totalAmount(booking: BookingRow) {
  return asNumber(booking.total_amount || booking.selected_package_price || booking.selected_package_b2b_price);
}

function receivedAmount(booking: BookingRow) {
  const received = asNumber(booking.amount_received_aed);
  if (received > 0) return received;
  const pending = asNumber(booking.amount_pending_aed);
  return Math.max(totalAmount(booking) - pending, 0);
}

function rideStatus(booking: BookingRow) {
  const status = asText(booking.status, 'Confirmed');
  const stage = asText(booking.manager_status, 'Pending');
  const workflow = asText(booking.payment_workflow_status, '').toLowerCase();
  if (status === 'Completed' || stage === 'Completed') return 'Completed';
  if (status === 'No Show' || stage === 'No Show') return 'No Show';
  if (workflow.includes('ride in progress')) return 'In Progress';
  if (status === 'Confirmed') return 'Confirmed';
  return status;
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes('complete')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('no show') || value.includes('cancel')) return 'border-red-200 bg-red-50 text-red-700';
  if (value.includes('progress')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function sourceLabel(booking: BookingRow) {
  return String(booking.payment_source || '').toLowerCase() === 'b2b' || booking.b2b_agent_name ? `B2B${booking.b2b_agent_name ? ` · ${booking.b2b_agent_name}` : ''}` : 'Direct Sale';
}

function scheduleSortValue(booking: BookingRow) {
  const date = dateKey(booking.preferred_date) || '9999-12-31';
  const time = asText(booking.preferred_time, '23:59');
  return `${date} ${time}`;
}

function matchesManager(booking: BookingRow, manager: ManagerProfile) {
  const assigned = String(booking.assigned_manager_name || '').trim().toLowerCase();
  const name = manager.name.trim().toLowerCase();
  const email = manager.email.trim().toLowerCase();
  return Boolean(assigned && (assigned === name || assigned === email));
}

function withinNextWeek(booking: BookingRow) {
  const rideDate = dateKey(booking.preferred_date);
  return Boolean(rideDate && rideDate >= localDateKey() && rideDate <= localDateKey(6));
}

async function loadManagerProfile(): Promise<ManagerProfile> {
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  const authEmail = authUser?.email || '';
  if (!authUser) return { name: '', email: '', role: 'admin', ready: true };
  const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
  const { data } = await supabase.from('admin_users').select('full_name,email,role,status').or(filter).limit(1);
  const profile = (data || [])[0] as PortalProfile | undefined;
  return { name: profile?.full_name || authEmail, email: profile?.email || authEmail, role: profile?.role || 'admin', ready: true };
}

function MetricCard({ title, value, icon: Icon }: Metric) {
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

function ScheduleCard({ booking }: { booking: BookingRow }) {
  const status = rideStatus(booking);
  return (
    <div className="rounded-[1.25rem] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(8,37,50,0.055)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{bookingCode(booking)}</p>
          <h3 className="mt-1 break-words font-heading text-base font-semibold text-foreground">{asText(booking.customer_name, 'Guest')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{packageLabel(booking)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(status)}`}>{status}</span><Badge variant="secondary">{sourceLabel(booking)}</Badge></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Date / Time" value={niceDate(booking.preferred_date)} sub={asText(booking.preferred_time, 'Time pending')} />
        <Detail label="Ride" value={rideDetails(booking)} sub={asText(booking.customer_phone || booking.customer_email, '')} />
        <Detail label="Vehicle" value={asText(booking.assigned_vehicle_name, 'Not selected')} sub="Schedule view" />
        <Detail label="Amount" value={formatAed(totalAmount(booking))} sub={status === 'Completed' ? `Received ${formatAed(receivedAmount(booking))}` : status === 'No Show' ? 'No collection' : 'Pending collection'} />
      </div>
    </div>
  );
}

function ManagerSchedule({ manager }: { manager: ManagerProfile }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [filter, setFilter] = useState<ScheduleFilter>('today');

  async function loadData() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from(bookingRequestsTable).select('*').in('status', ['Confirmed', 'Completed', 'No Show']).order('preferred_date', { ascending: true }).order('preferred_time', { ascending: true }).limit(500);
    if (queryError) {
      setError(queryError.message);
      setBookings([]);
    } else {
      setBookings(((data || []) as BookingRow[]).filter((booking) => matchesManager(booking, manager)));
    }
    setLoading(false);
  }

  useEffect(() => { void loadData(); }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings
      .filter((booking) => {
        const rideDate = dateKey(booking.preferred_date);
        if (filter === 'today') return rideDate === localDateKey();
        if (filter === 'tomorrow') return rideDate === localDateKey(1);
        if (filter === 'week') return withinNextWeek(booking);
        if (selectedDate) return rideDate === selectedDate;
        return true;
      })
      .filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_vehicle_name].some((value) => String(value || '').toLowerCase().includes(term)))
      .sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b)));
  }, [bookings, filter, query, selectedDate]);

  const metrics = useMemo(() => {
    const today = bookings.filter((booking) => dateKey(booking.preferred_date) === localDateKey()).length;
    const tomorrow = bookings.filter((booking) => dateKey(booking.preferred_date) === localDateKey(1)).length;
    const week = bookings.filter(withinNextWeek).length;
    const completed = bookings.filter((booking) => rideStatus(booking) === 'Completed').length;
    return { today, tomorrow, week, completed };
  }, [bookings]);

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Ride Schedule</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Schedule planning</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Read-only date and week view for rides assigned to {manager.name || manager.email}.</p>
        </div>
        <Button type="button" variant="outline" onClick={loadData} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Today" value={String(metrics.today)} icon={CalendarDays} />
        <MetricCard title="Tomorrow" value={String(metrics.tomorrow)} icon={Clock3} />
        <MetricCard title="This Week" value={String(metrics.week)} icon={WalletCards} />
        <MetricCard title="Completed" value={String(metrics.completed)} icon={CheckCircle2} />
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Schedule list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `${visible.length} rides`}</p></div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-3xl">
            <Input type="date" value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setFilter('all'); }} className="h-10 rounded-xl bg-white text-sm font-semibold" />
            <div className="relative w-full"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search schedule..." className="h-10 rounded-xl bg-white pl-9" /></div>
          </div>
        </CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">
          {[
            ['today', 'Today', metrics.today],
            ['tomorrow', 'Tomorrow', metrics.tomorrow],
            ['week', 'This Week', metrics.week],
            ['all', 'Selected Date', visible.length]
          ].map(([id, label, count]) => <button key={String(id)} type="button" onClick={() => setFilter(id as ScheduleFilter)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{label} <span className={filter === id ? 'text-white/75' : 'text-muted-foreground'}>{count}</span></button>)}
        </div>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-2">
          {loading ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center text-sm font-semibold text-muted-foreground">Loading schedule...</div> : null}
          {!loading && visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No rides found</p><p className="mt-2 text-sm text-muted-foreground">Try another date or filter.</p></div> : null}
          {visible.map((booking, index) => <ScheduleCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} />)}
        </CardContent>
      </Card>
    </section>
  );
}

export function ManagerScopedSchedulePage() {
  const [manager, setManager] = useState<ManagerProfile>({ name: '', email: '', role: 'admin', ready: false });

  useEffect(() => {
    let active = true;
    void loadManagerProfile().then((profile) => {
      if (active) setManager(profile);
    });
    return () => { active = false; };
  }, []);

  if (!manager.ready) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading access...</div>;
  if (manager.role === 'manager') return <ManagerSchedule manager={manager} />;
  return <AdminOperationsSchedulePage />;
}
