'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';
import { AdminOperationsSchedulePage } from './admin-operations-modules';

type ManagerProfile = { name: string; email: string; role: string; ready: boolean };
type PortalProfile = { full_name: string | null; email: string | null; role: string | null; status: string | null };
type ScheduleFilter = 'today' | 'tomorrow' | 'week' | 'date';

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  selected_package_capacity?: number | string | null;
  selected_package_price?: number | string | null;
  selected_package_b2b_price?: number | string | null;
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

function asText(value: unknown, fallback = '-') { const text = String(value ?? '').trim(); return text || fallback; }
function asNumber(value: unknown) { const numberValue = Number(value || 0); return Number.isFinite(numberValue) ? numberValue : 0; }
function localDateKey(offsetDays = 0) { const date = new Date(); date.setDate(date.getDate() + offsetDays); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function dateKey(value: unknown) { return asText(value, '').slice(0, 10); }
function niceDate(value: unknown) { const text = asText(value, ''); if (!text) return 'No date'; return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(text.includes('T') ? text : `${text}T12:00:00`)); }
function bookingCode(booking: BookingRow) { return asText(booking.booking_code || booking.booking_number || booking.id, 'Booking'); }
function packageLabel(booking: BookingRow) { return asText(booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type, 'Package'); }
function rideDetails(booking: BookingRow) { const parts = [booking.service_type, booking.selected_package_capacity ? `${booking.selected_package_capacity} seater` : '', booking.duration_minutes ? `${booking.duration_minutes} min` : ''].filter(Boolean).map(String); return parts.length ? parts.join(' · ') : 'Ride details pending'; }
function totalAmount(booking: BookingRow) { return asNumber(booking.total_amount || booking.selected_package_price || booking.selected_package_b2b_price); }
function receivedAmount(booking: BookingRow) { const received = asNumber(booking.amount_received_aed); if (received > 0) return received; return Math.max(totalAmount(booking) - asNumber(booking.amount_pending_aed), 0); }
function rideStatus(booking: BookingRow) { const status = asText(booking.status, 'Confirmed'); const stage = asText(booking.manager_status, 'Pending'); const workflow = asText(booking.payment_workflow_status, '').toLowerCase(); if (status === 'Completed' || stage === 'Completed') return 'Completed'; if (status === 'No Show' || stage === 'No Show') return 'No Show'; if (workflow.includes('ride in progress')) return 'In Progress'; if (status === 'Confirmed') return 'Confirmed'; return status; }
function statusTone(status: string) { const value = status.toLowerCase(); if (value.includes('complete')) return 'border-emerald-200 bg-emerald-50 text-emerald-700'; if (value.includes('no show') || value.includes('cancel')) return 'border-red-200 bg-red-50 text-red-700'; if (value.includes('progress')) return 'border-primary/25 bg-primary-50 text-primary'; return 'border-gold/35 bg-gold/10 text-gold'; }
function sourceLabel(booking: BookingRow) { return String(booking.payment_source || '').toLowerCase() === 'b2b' || booking.b2b_agent_name ? `B2B${booking.b2b_agent_name ? ` · ${booking.b2b_agent_name}` : ''}` : 'Direct Sale'; }
function scheduleSortValue(booking: BookingRow) { return `${dateKey(booking.preferred_date) || '9999-12-31'} ${asText(booking.preferred_time, '23:59')}`; }
function matchesManager(booking: BookingRow, manager: ManagerProfile) { const assigned = String(booking.assigned_manager_name || '').trim().toLowerCase(); return Boolean(assigned && (assigned === manager.name.trim().toLowerCase() || assigned === manager.email.trim().toLowerCase())); }
function withinNextWeek(booking: BookingRow) { const rideDate = dateKey(booking.preferred_date); return Boolean(rideDate && rideDate >= localDateKey() && rideDate <= localDateKey(6)); }
async function loadManagerProfile(): Promise<ManagerProfile> { const { data: sessionData } = await supabase.auth.getSession(); const authUser = sessionData.session?.user; const authEmail = authUser?.email || ''; if (!authUser) return { name: '', email: '', role: 'admin', ready: true }; const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`; const { data } = await supabase.from('admin_users').select('full_name,email,role,status').or(filter).limit(1); const profile = (data || [])[0] as PortalProfile | undefined; return { name: profile?.full_name || authEmail, email: profile?.email || authEmail, role: profile?.role || 'admin', ready: true }; }
function CompactStat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' }) { return <span className="inline-flex items-baseline gap-1.5 text-xs font-bold text-muted-foreground"><span>{label}</span><span className={`font-heading text-base ${tone === 'good' ? 'text-emerald-700' : 'text-foreground'}`}>{value}</span></span>; }
function Detail({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) { return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>; }

function ScheduleCard({ booking }: { booking: BookingRow }) {
  const status = rideStatus(booking);
  return <div className="rounded-[1.15rem] border border-border bg-white p-3 shadow-[0_10px_24px_rgba(8,37,50,0.05)] sm:p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-primary">{niceDate(booking.preferred_date)} · {asText(booking.preferred_time, 'Time pending')}</p><h3 className="mt-1 break-words font-heading text-base font-semibold leading-tight text-foreground">{packageLabel(booking)}</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">{asText(booking.customer_name, 'Guest')}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(status)}`}>{status}</span></div><div className="mt-3 grid grid-cols-2 gap-2"><Detail label="Ride" value={rideDetails(booking)} sub={asText(booking.customer_phone || booking.customer_email, '')} /><Detail label="Vehicle" value={asText(booking.assigned_vehicle_name, 'Not selected')} sub="Schedule view" /><Detail label="Amount" value={formatAed(totalAmount(booking))} sub={status === 'Completed' ? `Received ${formatAed(receivedAmount(booking))}` : status === 'No Show' ? 'No collection' : 'Pending'} /><Detail label="Source" value={<Badge variant="secondary">{sourceLabel(booking)}</Badge>} /></div></div>;
}

function ManagerSchedule({ manager }: { manager: ManagerProfile }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [selectedDate, setSelectedDate] = useState(localDateKey()); const [filter, setFilter] = useState<ScheduleFilter>('today');
  async function loadData() { setLoading(true); setError(''); const { data, error: queryError } = await supabase.from(bookingRequestsTable).select('*').in('status', ['Confirmed', 'Completed', 'No Show']).order('preferred_date', { ascending: true }).order('preferred_time', { ascending: true }).limit(500); if (queryError) { setError(queryError.message); setBookings([]); } else { setBookings(((data || []) as BookingRow[]).filter((booking) => matchesManager(booking, manager))); } setLoading(false); }
  useEffect(() => { void loadData(); }, []);
  const visible = useMemo(() => { const term = query.trim().toLowerCase(); return bookings.filter((booking) => { const rideDate = dateKey(booking.preferred_date); if (filter === 'today') return rideDate === localDateKey(); if (filter === 'tomorrow') return rideDate === localDateKey(1); if (filter === 'week') return withinNextWeek(booking); return rideDate === selectedDate; }).filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_vehicle_name].some((value) => String(value || '').toLowerCase().includes(term))).sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b))); }, [bookings, filter, query, selectedDate]);
  const metrics = useMemo(() => { const today = bookings.filter((booking) => dateKey(booking.preferred_date) === localDateKey()).length; const tomorrow = bookings.filter((booking) => dateKey(booking.preferred_date) === localDateKey(1)).length; const week = bookings.filter(withinNextWeek).length; const completed = bookings.filter((booking) => rideStatus(booking) === 'Completed').length; return { today, tomorrow, week, completed }; }, [bookings]);
  const filters: Array<[ScheduleFilter, string, number]> = [['today', 'Today', metrics.today], ['tomorrow', 'Tomorrow', metrics.tomorrow], ['week', 'Week', metrics.week], ['date', 'Date', visible.length]];
  return <section className="w-full overflow-hidden px-1 py-1 pb-28 sm:px-4 sm:py-4 lg:px-8 lg:py-8"><div className="flex items-start justify-between gap-3 rounded-[1.2rem] border border-white/70 bg-white/72 p-3.5 shadow-[0_12px_28px_rgba(8,37,50,0.05)] backdrop-blur-xl sm:p-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Schedule</p><h1 className="mt-1 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl">Ride plan</h1><p className="mt-1 text-sm font-semibold text-muted-foreground">{metrics.today} today · {metrics.week} this week</p></div><button type="button" onClick={loadData} className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-primary shadow-sm" aria-label="Refresh schedule"><RefreshCw className="size-4" /></button></div>{error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}<div className="mt-3 rounded-[1.15rem] border border-border/70 bg-white/70 px-3 py-2.5 shadow-[0_8px_20px_rgba(8,37,50,0.035)]"><div className="flex flex-wrap gap-x-4 gap-y-1.5"><CompactStat label="Today" value={String(metrics.today)} /><CompactStat label="Tomorrow" value={String(metrics.tomorrow)} /><CompactStat label="Week" value={String(metrics.week)} /><CompactStat label="Done" value={String(metrics.completed)} tone="good" /></div></div><Card className="mt-3 overflow-hidden rounded-[1.35rem] border-border/80 bg-white shadow-[0_12px_28px_rgba(8,37,50,0.05)]"><CardHeader className="gap-3 border-b border-border/70 bg-[#F7FAFA] px-4 py-3"><div><CardTitle className="font-heading text-xl font-semibold sm:text-2xl">{filter === 'date' ? 'Selected date' : filter === 'week' ? 'This week' : filter === 'tomorrow' ? 'Tomorrow rides' : 'Today rides'}</CardTitle><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{loading ? 'Loading...' : `${visible.length} rides`}</p></div><div className="grid gap-2 sm:grid-cols-[180px_1fr]"><Input type="date" value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setFilter('date'); }} className="h-10 rounded-full bg-white text-sm font-semibold" />{bookings.length > 0 ? <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rides..." className="h-10 rounded-full bg-white pl-9" /></div> : null}</div></CardHeader><div className="flex flex-wrap gap-2 border-b border-border/70 bg-white px-4 py-3">{filters.map(([id, label, count]) => <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${filter === id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground'}`}>{label} <span className={filter === id ? 'text-white/80' : 'text-muted-foreground'}>{count}</span></button>)}</div><CardContent className="grid gap-3 p-3 sm:p-4 xl:grid-cols-2">{loading ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-5 text-center text-sm font-semibold text-muted-foreground">Loading schedule...</div> : null}{!loading && visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-5 text-center"><p className="font-heading text-base font-semibold text-foreground">No rides found</p><p className="mt-1 text-sm text-muted-foreground">Try another date or filter.</p></div> : null}{visible.map((booking, index) => <ScheduleCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} />)}</CardContent></Card></section>;
}

export function ManagerScopedSchedulePage() {
  const [manager, setManager] = useState<ManagerProfile>({ name: '', email: '', role: 'admin', ready: false });
  useEffect(() => { let active = true; void loadManagerProfile().then((profile) => { if (active) setManager(profile); }); return () => { active = false; }; }, []);
  if (!manager.ready) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading access...</div>;
  if (manager.role === 'manager') return <ManagerSchedule manager={manager} />;
  return <AdminOperationsSchedulePage />;
}
