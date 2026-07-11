'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, CreditCard, RefreshCw, Search, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

 type ManagerBooking = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
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
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  payment_method?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
};

type ManagerProfile = { full_name: string | null; email: string | null; role: string | null; status: string | null };
type Metric = { title: string; value: string; icon: LucideIcon; tone?: 'default' | 'success' | 'warning' };

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

function shortDate(value: unknown) {
  const text = asText(value, '');
  if (!text) return 'Today';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short' }).format(new Date(text.includes('T') ? text : `${text}T12:00:00`));
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function bookingCode(booking: ManagerBooking) {
  return asText(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function packageLabel(booking: ManagerBooking) {
  return asText(booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type, 'Package');
}

function serviceDetail(booking: ManagerBooking) {
  const parts = [booking.service_type, booking.selected_package_capacity ? `${booking.selected_package_capacity} seater` : '', booking.duration_minutes ? `${booking.duration_minutes} min` : ''].filter(Boolean).map(String);
  return parts.length ? parts.join(' · ') : 'Ride details pending';
}

function totalAmount(booking: ManagerBooking) {
  return asNumber(booking.total_amount || booking.selected_package_price || booking.selected_package_b2b_price);
}

function receivedAmount(booking: ManagerBooking) {
  const received = asNumber(booking.amount_received_aed);
  if (received > 0) return received;
  const pending = asNumber(booking.amount_pending_aed);
  return Math.max(totalAmount(booking) - pending, 0);
}

function managerStage(booking: ManagerBooking) {
  const raw = asText(booking.manager_status, 'Pending');
  return raw === 'Assigned' ? 'Pending' : raw;
}

function rideStatus(booking: ManagerBooking) {
  const status = asText(booking.status, 'Confirmed');
  const stage = managerStage(booking);
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

function isB2B(booking: ManagerBooking) {
  return String(booking.payment_source || '').toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name);
}

function sourceLabel(booking: ManagerBooking) {
  return isB2B(booking) ? `B2B${booking.b2b_agent_name ? ` · ${booking.b2b_agent_name}` : ''}` : 'Direct Sale';
}

function isManagerProfile(profile: ManagerProfile | null) {
  return String(profile?.role || '').trim().toLowerCase() === 'manager';
}

function managerName(profile: ManagerProfile | null) {
  return profile?.full_name || profile?.email || '';
}

function firstName(profile: ManagerProfile | null) {
  return asText(managerName(profile), 'Manager').split(' ')[0] || 'Manager';
}

function matchesManager(booking: ManagerBooking, profile: ManagerProfile | null) {
  if (!isManagerProfile(profile)) return true;
  const assigned = String(booking.assigned_manager_name || '').trim().toLowerCase();
  const name = String(managerName(profile)).trim().toLowerCase();
  const email = String(profile?.email || '').trim().toLowerCase();
  return Boolean(assigned && (assigned === name || assigned === email));
}

function scheduleSortValue(booking: ManagerBooking) {
  const date = dateKey(booking.preferred_date) || '9999-12-31';
  const time = asText(booking.preferred_time, '23:59');
  return `${date} ${time}`;
}

function MetricCard({ title, value, icon: Icon, tone = 'default' }: Metric) {
  const toneClass = tone === 'success' ? 'bg-emerald-50 text-emerald-700' : tone === 'warning' ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary';
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_10px_24px_rgba(8,37,50,0.055)]">
      <CardContent className="flex min-w-0 items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${toneClass} sm:size-10`}><Icon className="size-4 sm:size-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="truncate text-[11px] font-bold text-muted-foreground sm:text-xs">{title}</p><p className="mt-0.5 break-words font-heading text-lg font-semibold leading-tight text-foreground sm:text-xl xl:text-2xl">{value}</p></div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function RideSummaryCard({ booking }: { booking: ManagerBooking }) {
  const status = rideStatus(booking);
  return (
    <div className="rounded-[1.15rem] border border-border bg-white p-3 shadow-[0_10px_24px_rgba(8,37,50,0.05)] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary">{asText(booking.preferred_time, 'Time pending')}</p>
          <h3 className="mt-1 break-words font-heading text-base font-semibold leading-tight text-foreground">{packageLabel(booking)}</h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{asText(booking.customer_name, 'Guest')}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(status)}`}>{status}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Detail label="Ride" value={serviceDetail(booking)} sub={asText(booking.customer_phone || booking.customer_email, '')} />
        <Detail label="Payment" value={formatAed(totalAmount(booking))} sub={status === 'Completed' ? `Received ${formatAed(receivedAmount(booking))}` : status === 'No Show' ? 'No collection' : 'Pending'} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{sourceLabel(booking)}</Badge>
        <Badge variant="outline">{asText(booking.assigned_vehicle_name, 'Vehicle not selected')}</Badge>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{bookingCode(booking)}</span>
      </div>
    </div>
  );
}

export function ManagerBookingsPage() {
  const [items, setItems] = useState<ManagerBooking[]>([]);
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function loadCurrentProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) return null;
    const authEmail = authUser.email || '';
    const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
    const { data } = await supabase.from('admin_users').select('full_name,email,role,status').or(filter).limit(1);
    const nextProfile = ((data || [])[0] || null) as ManagerProfile | null;
    setProfile(nextProfile);
    return nextProfile;
  }

  async function loadBookings(managerProfile: ManagerProfile | null) {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from(bookingRequestsTable).select('*').in('status', ['Confirmed', 'Completed', 'No Show']).order('preferred_date', { ascending: true }).order('preferred_time', { ascending: true }).limit(500);
    if (queryError) {
      setError(queryError.message);
      setItems([]);
    } else {
      setItems(((data || []) as ManagerBooking[]).filter((booking) => matchesManager(booking, managerProfile)));
    }
    setLoading(false);
  }

  async function refreshAll() {
    const currentProfile = await loadCurrentProfile();
    await loadBookings(currentProfile);
  }

  useEffect(() => { void refreshAll(); }, []);

  const today = localDateKey();
  const todayItems = useMemo(() => items.filter((booking) => dateKey(booking.preferred_date) === today), [items, today]);
  const visibleToday = useMemo(() => {
    const term = query.trim().toLowerCase();
    return todayItems
      .filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_vehicle_name, booking.payment_method].some((value) => String(value || '').toLowerCase().includes(term)))
      .sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b)));
  }, [query, todayItems]);

  const metrics = useMemo(() => {
    const inProgress = todayItems.filter((booking) => rideStatus(booking) === 'In Progress').length;
    const completedToday = todayItems.filter((booking) => rideStatus(booking) === 'Completed').length;
    const noShowToday = todayItems.filter((booking) => rideStatus(booking) === 'No Show').length;
    const cash = items.filter((booking) => rideStatus(booking) === 'Completed' && asText(booking.payment_method, '').toLowerCase() === 'cash').reduce((sum, booking) => sum + receivedAmount(booking), 0);
    const card = items.filter((booking) => rideStatus(booking) === 'Completed' && asText(booking.payment_method, '').toLowerCase() === 'card').reduce((sum, booking) => sum + receivedAmount(booking), 0);
    return { today: todayItems.length, inProgress, completedToday, noShowToday, cash, card };
  }, [items, todayItems]);

  return (
    <section className="w-full overflow-hidden px-1 py-1 sm:px-4 sm:py-4 lg:px-8 lg:py-8">
      <div className="flex items-start justify-between gap-3 rounded-[1.35rem] border border-white/70 bg-white/72 p-4 shadow-[0_14px_32px_rgba(8,37,50,0.055)] backdrop-blur-xl sm:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Today · {shortDate(today)}</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{greeting()}, {firstName(profile)}</h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{metrics.today} rides today</p>
        </div>
        <button type="button" onClick={refreshAll} className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-primary shadow-sm" aria-label="Refresh today overview"><RefreshCw className="size-4" aria-hidden="true" /></button>
      </div>

      {error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Today" value={String(metrics.today)} icon={CalendarDays} />
        <MetricCard title="Progress" value={String(metrics.inProgress)} icon={Clock3} />
        <MetricCard title="Done" value={String(metrics.completedToday)} icon={CheckCircle2} tone="success" />
        <MetricCard title="No Show" value={String(metrics.noShowToday)} icon={AlertCircle} tone="warning" />
        <MetricCard title="Cash" value={formatAed(metrics.cash)} icon={WalletCards} tone="success" />
        <MetricCard title="Card" value={formatAed(metrics.card)} icon={CreditCard} />
      </div>

      <Card className="mt-3 overflow-hidden rounded-[1.35rem] border-border/80 bg-white shadow-[0_12px_28px_rgba(8,37,50,0.05)]">
        <CardHeader className="gap-3 border-b border-border/70 bg-[#F7FAFA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle className="font-heading text-xl font-semibold sm:text-2xl">Today rides</CardTitle><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{loading ? 'Loading...' : `${visibleToday.length} rides · ${niceDate(today)}`}</p></div>
          {todayItems.length > 0 ? <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rides..." className="h-10 rounded-full bg-white pl-9" /></div> : null}
        </CardHeader>
        <CardContent className="grid gap-3 p-3 sm:p-4 xl:grid-cols-2">
          {loading ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-6 text-center text-sm font-semibold text-muted-foreground">Loading today rides...</div> : null}
          {!loading && visibleToday.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-6 text-center"><p className="font-heading text-lg font-semibold text-foreground">No rides today</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Future rides My Rides ke Upcoming tab me milengi.</p></div> : null}
          {visibleToday.map((booking, index) => <RideSummaryCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} />)}
        </CardContent>
      </Card>
    </section>
  );
}
