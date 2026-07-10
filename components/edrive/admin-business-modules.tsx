'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, CalendarDays, CheckCircle2, CreditCard, Mail, MapPin, MessageCircle, Phone, RefreshCw, Search, Settings, Ship, UsersRound, WalletCards, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { companyInfo } from '@/lib/company-info';
import { supabase } from '@/lib/supabase-client';

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  service_type?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  payment_source?: string | null;
  b2b_agent_name?: string | null;
  created_at?: string | null;
};

type VehicleRow = Record<string, unknown> & {
  id?: string | null;
  vehicle_code?: string | null;
  vehicle_name?: string | null;
  vehicle_type?: string | null;
  reg_no?: string | null;
  device_imei?: string | null;
  expiry_date?: string | null;
  status?: string | null;
  notes?: string | null;
};

type CustomerRecord = { key: string; name: string; phone: string; email: string; bookings: BookingRow[]; total: number; pending: number; lastDate: string };
type Metric = { title: string; value: string; icon: LucideIcon };
type ReportFilter = 'all' | 'b2b' | 'direct' | 'pending' | 'confirmed';

const vehicleStatuses = [
  { label: 'Available', value: 'available' },
  { label: 'Booked', value: 'booked' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'For Sale', value: 'for_sale' }
];

function asText(value: unknown, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function niceDate(value: unknown) {
  const text = asText(value, '');
  if (!text) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(text.includes('T') ? text : `${text}T12:00:00`));
}

function bookingTotal(booking: BookingRow) {
  return asNumber(booking.total_amount);
}

function bookingPending(booking: BookingRow) {
  const pending = asNumber(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(bookingTotal(booking) - asNumber(booking.amount_received_aed), 0);
}

function bookingReceived(booking: BookingRow) {
  const received = asNumber(booking.amount_received_aed);
  if (received > 0) return received;
  return Math.max(bookingTotal(booking) - bookingPending(booking), 0);
}

function packageLabel(booking: BookingRow) {
  return asText(booking.selected_package_name || booking.selected_package_category || booking.service_type, 'Package');
}

function isB2B(booking: BookingRow) {
  return String(booking.payment_source || '').toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name);
}

function statusTone(value: unknown) {
  const status = asText(value, '').toLowerCase();
  if (status.includes('complete') || status.includes('paid') || status.includes('available') || status.includes('active') || status.includes('repeat')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status.includes('cancel') || status.includes('refund') || status.includes('maintenance') || status.includes('inactive')) return 'border-red-200 bg-red-50 text-red-700';
  if (status.includes('confirm') || status.includes('progress') || status.includes('booked')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function prettyStatus(value: unknown) {
  return asText(value, 'Pending').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function whatsappPhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  return digits;
}

function customerWhatsAppHref(customer: CustomerRecord) {
  const phone = whatsappPhone(customer.phone);
  if (!phone) return '';
  const message = encodeURIComponent(`Hello ${customer.name}, this is eDrive Water Sports. Thank you for booking with us. Please let us know if you need any support.`);
  return `https://web.whatsapp.com/send?phone=${phone}&text=${message}&app_absent=0`;
}

function customerKey(booking: BookingRow) {
  return asText(booking.customer_phone || booking.customer_email || booking.customer_name || booking.id, '').toLowerCase();
}

function buildCustomers(bookings: BookingRow[]) {
  const map = new Map<string, CustomerRecord>();
  bookings.forEach((booking) => {
    const key = customerKey(booking);
    if (!key) return;
    const current = map.get(key) || { key, name: asText(booking.customer_name, 'Guest'), phone: asText(booking.customer_phone, ''), email: asText(booking.customer_email, ''), bookings: [], total: 0, pending: 0, lastDate: '' };
    current.bookings.push(booking);
    current.total += bookingTotal(booking);
    current.pending += bookingPending(booking);
    const dateValue = asText(booking.preferred_date || booking.created_at, '');
    if (dateValue && (!current.lastDate || new Date(dateValue) > new Date(current.lastDate))) current.lastDate = dateValue;
    if (!current.phone) current.phone = asText(booking.customer_phone, '');
    if (!current.email) current.email = asText(booking.customer_email, '');
    map.set(key, current);
  });
  return Array.from(map.values()).sort((a, b) => b.bookings.length - a.bookings.length);
}

async function fetchBookings() {
  const { data, error } = await supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(700);
  if (error) throw new Error(error.message);
  return (data || []) as BookingRow[];
}

async function fetchVehicles() {
  const { data, error } = await supabase.from('vehicles').select('*').order('vehicle_code', { ascending: true }).limit(300);
  if (error) throw new Error(error.message);
  return (data || []) as VehicleRow[];
}

function useBookingsData() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      setBookings(await fetchBookings());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load records.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);
  return { bookings, loading, error, refresh };
}

function PageHeader({ label, title, text, onRefresh }: { label: string; title: string; text: string; onRefresh?: () => void }) {
  return <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{label}</p><h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p></div>{onRefresh ? <Button type="button" variant="outline" onClick={onRefresh} className="w-fit rounded-full bg-white"><RefreshCw data-icon aria-hidden="true" />Refresh</Button> : null}</div>;
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Card key={metric.title} className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.055)]"><CardContent className="flex min-w-0 items-center gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><metric.icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-muted-foreground">{metric.title}</p><p className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{metric.value}</p></div></CardContent></Card>)}</div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative w-full md:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-full bg-white pl-9 text-sm font-semibold" /></div>;
}

function StatusBadge({ status }: { status: unknown }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(status)}`}>{prettyStatus(status)}</span>;
}

function InfoBlock({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">{title}</p><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>;
}

function ErrorBox({ message }: { message: string }) {
  return message ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p> : null;
}

export function AdminCustomersLivePage() {
  const { bookings, loading, error, refresh } = useBookingsData();
  const [query, setQuery] = useState('');
  const customers = useMemo(() => buildCustomers(bookings), [bookings]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) => [customer.name, customer.phone, customer.email].some((value) => value.toLowerCase().includes(term)));
  }, [customers, query]);
  const repeatCustomers = customers.filter((customer) => customer.bookings.length > 1).length;
  const totalValue = customers.reduce((sum, customer) => sum + customer.total, 0);
  const pendingValue = customers.reduce((sum, customer) => sum + customer.pending, 0);

  return <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10"><PageHeader label="Customers" title="Customer directory" text="Customer contacts, booking history, repeat guests, and support actions in one place." onRefresh={refresh} /><ErrorBox message={error} /><MetricGrid metrics={[{ title: 'Customers', value: String(customers.length), icon: UsersRound }, { title: 'Repeat Guests', value: String(repeatCustomers), icon: CheckCircle2 }, { title: 'Total Value', value: formatAed(totalValue), icon: WalletCards }, { title: 'Pending', value: formatAed(pendingValue), icon: CreditCard }]} /><Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between"><div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Customer list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `Showing ${filtered.length} of ${customers.length}`}</p></div><SearchBox value={query} onChange={setQuery} placeholder="Search customers..." /></CardHeader><CardContent className="grid gap-3 p-3 sm:p-4">{loading ? <EmptyState title="Loading customers" text="Please wait while customer records are loading." /> : null}{!loading && filtered.length === 0 ? <EmptyState title="No customers found" text="Customer records will appear after bookings are created." /> : null}{filtered.map((customer) => { const whatsapp = customerWhatsAppHref(customer); return <div key={customer.key} className="rounded-[1.2rem] border border-border bg-white p-4 shadow-[0_10px_28px_rgba(8,37,50,0.055)]"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Customer</p><h3 className="mt-1 break-words font-heading text-lg font-semibold text-foreground">{customer.name}</h3><p className="mt-1 break-words text-sm text-muted-foreground">{customer.phone || customer.email || 'Contact missing'}</p></div><div className="flex flex-wrap gap-2 lg:justify-end"><StatusBadge status={customer.bookings.length > 1 ? 'Repeat Guest' : 'New Guest'} />{whatsapp ? <Button asChild size="sm" className="rounded-full border-[#25D366] bg-[#25D366] text-white hover:bg-[#1EBE5D] hover:text-white"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp</a></Button> : null}</div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5"><InfoBlock label="Phone" value={customer.phone || '-'} /><InfoBlock label="Email" value={customer.email || '-'} /><InfoBlock label="Bookings" value={String(customer.bookings.length)} sub={`Last ${niceDate(customer.lastDate)}`} /><InfoBlock label="Total Value" value={formatAed(customer.total)} /><InfoBlock label="Pending" value={formatAed(customer.pending)} /></div></div>; })}</CardContent></Card></section>;
}

export function AdminMaintenanceLivePage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() { setLoading(true); setError(''); try { setVehicles(await fetchVehicles()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load vehicles.'); setVehicles([]); } finally { setLoading(false); } }
  async function updateStatus(vehicle: VehicleRow, status: string) { const key = asText(vehicle.id || vehicle.vehicle_code || vehicle.vehicle_name, ''); if (!key) return; setSaving(key); setError(''); try { const queryBuilder = supabase.from('vehicles').update({ status, updated_at: new Date().toISOString() }); const result = vehicle.id ? await queryBuilder.eq('id', vehicle.id) : await queryBuilder.eq('vehicle_code', vehicle.vehicle_code); if (result.error) throw new Error(result.error.message); await refresh(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to update vehicle status.'); } finally { setSaving(''); } }
  useEffect(() => { void refresh(); }, []);
  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); if (!term) return vehicles; return vehicles.filter((vehicle) => [vehicle.vehicle_code, vehicle.vehicle_name, vehicle.vehicle_type, vehicle.reg_no, vehicle.status].some((value) => asText(value, '').toLowerCase().includes(term))); }, [query, vehicles]);
  const maintenance = vehicles.filter((vehicle) => asText(vehicle.status, '').toLowerCase().includes('maintenance')).length;
  const available = vehicles.filter((vehicle) => asText(vehicle.status, '').toLowerCase().includes('available')).length;
  const booked = vehicles.filter((vehicle) => asText(vehicle.status, '').toLowerCase().includes('booked')).length;
  return <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10"><PageHeader label="Maintenance" title="Fleet maintenance" text="Track vehicle status, service attention, expiry dates, and quick availability updates." onRefresh={refresh} /><ErrorBox message={error} /><MetricGrid metrics={[{ title: 'Vehicles', value: String(vehicles.length), icon: Ship }, { title: 'Available', value: String(available), icon: CheckCircle2 }, { title: 'In Maintenance', value: String(maintenance), icon: Wrench }, { title: 'Booked', value: String(booked), icon: CalendarDays }]} /><Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between"><div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Vehicle service list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading vehicles...' : `Showing ${filtered.length} of ${vehicles.length}`}</p></div><SearchBox value={query} onChange={setQuery} placeholder="Search fleet..." /></CardHeader><CardContent className="grid gap-3 p-3 sm:p-4">{loading ? <EmptyState title="Loading vehicles" text="Please wait while fleet records are loading." /> : null}{!loading && filtered.length === 0 ? <EmptyState title="No vehicles found" text="Vehicle records will appear after fleet setup." /> : null}{filtered.map((vehicle) => { const key = asText(vehicle.id || vehicle.vehicle_code || vehicle.vehicle_name); return <div key={key} className="rounded-[1.2rem] border border-border bg-white p-4 shadow-[0_10px_28px_rgba(8,37,50,0.055)]"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{asText(vehicle.vehicle_code, 'Vehicle')}</p><h3 className="mt-1 break-words font-heading text-lg font-semibold text-foreground">{asText(vehicle.vehicle_name, 'Unnamed Vehicle')}</h3><p className="mt-1 text-sm text-muted-foreground">{asText(vehicle.vehicle_type, 'Type')} · REG {asText(vehicle.reg_no, '-')}</p></div><StatusBadge status={vehicle.status || 'Available'} /></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><InfoBlock label="Tracker" value={asText(vehicle.device_imei, '-')} /><InfoBlock label="Expiry" value={niceDate(vehicle.expiry_date)} /><InfoBlock label="Current Status" value={prettyStatus(vehicle.status || 'Available')} /><InfoBlock label="Notes" value={asText(vehicle.notes, '-')} /></div><div className="mt-4 flex flex-wrap gap-2">{vehicleStatuses.map((option) => <Button key={option.value} type="button" size="sm" variant="outline" disabled={saving === key} onClick={() => updateStatus(vehicle, option.value)} className="rounded-full bg-white">{option.label}</Button>)}</div></div>; })}</CardContent></Card></section>;
}

export function AdminReportsLivePage() {
  const { bookings, loading, error, refresh } = useBookingsData();
  const [filter, setFilter] = useState<ReportFilter>('all');
  const filtered = useMemo(() => bookings.filter((booking) => { if (filter === 'b2b') return isB2B(booking); if (filter === 'direct') return !isB2B(booking); if (filter === 'pending') return bookingPending(booking) > 0; if (filter === 'confirmed') return String(booking.status || '').toLowerCase().includes('confirm') || String(booking.status || '').toLowerCase().includes('complete'); return true; }), [bookings, filter]);
  const revenue = filtered.reduce((sum, booking) => sum + bookingTotal(booking), 0);
  const received = filtered.reduce((sum, booking) => sum + bookingReceived(booking), 0);
  const pending = filtered.reduce((sum, booking) => sum + bookingPending(booking), 0);
  const b2bCount = filtered.filter(isB2B).length;
  const topPackages = useMemo(() => { const map = new Map<string, { title: string; count: number; total: number }>(); filtered.forEach((booking) => { const title = packageLabel(booking); const current = map.get(title) || { title, count: 0, total: 0 }; current.count += 1; current.total += bookingTotal(booking); map.set(title, current); }); return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8); }, [filtered]);
  const dailyRows = useMemo(() => { const map = new Map<string, { date: string; count: number; total: number; pending: number }>(); filtered.forEach((booking) => { const date = asText(booking.preferred_date || booking.created_at, 'No date').slice(0, 10); const current = map.get(date) || { date, count: 0, total: 0, pending: 0 }; current.count += 1; current.total += bookingTotal(booking); current.pending += bookingPending(booking); map.set(date, current); }); return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10); }, [filtered]);
  const maxPackageCount = Math.max(...topPackages.map((item) => item.count), 1);
  return <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10"><PageHeader label="Reports" title="Business reports" text="Booking value, collection, B2B/direct split, package performance, and daily activity." onRefresh={refresh} /><ErrorBox message={error} /><MetricGrid metrics={[{ title: 'Total Value', value: formatAed(revenue), icon: BarChart3 }, { title: 'Received', value: formatAed(received), icon: WalletCards }, { title: 'Pending', value: formatAed(pending), icon: CreditCard }, { title: 'B2B Bookings', value: String(b2bCount), icon: UsersRound }]} /><div className="mt-5 flex gap-2 overflow-x-auto pb-1">{[['all', 'All'], ['b2b', 'B2B'], ['direct', 'Direct'], ['pending', 'Pending'], ['confirmed', 'Confirmed / Completed']].map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id as ReportFilter)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{label}</button>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]"><Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Top packages</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{loading ? <EmptyState title="Loading report" text="Please wait while report data is loading." /> : null}{!loading && topPackages.length === 0 ? <EmptyState title="No package data" text="Package performance will appear after bookings are created." /> : null}{topPackages.map((item) => <div key={item.title} className="rounded-2xl border border-border bg-white p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.count} bookings · {formatAed(item.total)}</p></div><span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary">{item.count}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EAF3F4]"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((item.count / maxPackageCount) * 100, 8)}%` }} /></div></div>)}</CardContent></Card><Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Daily activity</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{!loading && dailyRows.length === 0 ? <EmptyState title="No daily records" text="Daily report will appear after bookings are created." /> : null}{dailyRows.map((row) => <div key={row.date} className="grid gap-2 rounded-2xl border border-border bg-white p-3 sm:grid-cols-4 sm:items-center"><InfoBlock label="Date" value={niceDate(row.date)} /><InfoBlock label="Bookings" value={String(row.count)} /><InfoBlock label="Value" value={formatAed(row.total)} /><InfoBlock label="Pending" value={formatAed(row.pending)} /></div>)}</CardContent></Card></div></section>;
}

export function AdminSettingsLivePage() {
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; async function loadRole() { const { data: sessionData } = await supabase.auth.getSession(); const user = sessionData.session?.user; if (!user) { if (active) { setRole('admin'); setLoading(false); } return; } const email = user.email || ''; const filter = email ? `auth_user_id.eq.${user.id},email.eq.${email}` : `auth_user_id.eq.${user.id}`; const { data } = await supabase.from('admin_users').select('role,status').or(filter).limit(1); if (active) { setRole(String(data?.[0]?.role || 'admin')); setLoading(false); } } void loadRole(); return () => { active = false; }; }, []);
  const isSuperAdmin = role === 'super_admin';
  return <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10"><PageHeader label="Settings" title="Company and booking settings" text="Operational settings for company contact, booking rules, payment options, and customer messages." /><MetricGrid metrics={[{ title: 'Access', value: loading ? 'Loading' : isSuperAdmin ? 'Owner' : 'Read Only', icon: Settings }, { title: 'Phone', value: companyInfo.landlineDisplay, icon: Phone }, { title: 'WhatsApp', value: companyInfo.whatsappDisplay, icon: MessageCircle }, { title: 'Location', value: companyInfo.locationName, icon: MapPin }]} />{!isSuperAdmin && !loading ? <p className="mt-5 rounded-xl bg-gold/10 px-4 py-3 text-sm font-semibold text-gold">Settings changes are owner level. Current account can view operational settings only.</p> : null}<div className="mt-5 grid gap-5 xl:grid-cols-2"><SettingsCard title="Company contact" icon={Phone}><InfoBlock label="Booking Email" value={companyInfo.bookingEmail} /><InfoBlock label="Support Email" value={companyInfo.supportEmail} /><InfoBlock label="Landline" value={companyInfo.landlineDisplay} /><InfoBlock label="WhatsApp" value={companyInfo.whatsappDisplay} /></SettingsCard><SettingsCard title="Location" icon={MapPin}><InfoBlock label="Meeting Point" value={companyInfo.locationName} /><InfoBlock label="Address" value={companyInfo.locationAddress} /><InfoBlock label="Map" value="Map link configured" /><InfoBlock label="Area" value="Dubai Islands" /></SettingsCard><SettingsCard title="Booking rules" icon={CalendarDays}><InfoBlock label="Availability Flow" value="Request first, confirm by team" /><InfoBlock label="Payment Flow" value="Direct sale or B2B invoice" /><InfoBlock label="Manager Assignment" value="Admin confirms and assigns manager" /><InfoBlock label="Customer Update" value="WhatsApp confirmation supported" /></SettingsCard><SettingsCard title="Payment methods" icon={CreditCard}><InfoBlock label="Cash" value="Enabled" /><InfoBlock label="Card" value="Enabled" /><InfoBlock label="Bank Transfer" value="Enabled" /><InfoBlock label="B2B Invoice" value="Enabled" /></SettingsCard><div className="xl:col-span-2"><SettingsCard title="Message templates" icon={Mail}><InfoBlock label="Booking Confirmation" value="Team confirms booking details with customer." /><InfoBlock label="Payment Follow-up" value="Payment status follow-up for pending bookings." /><InfoBlock label="B2B Partner" value="Partner booking and ledger communication via WhatsApp." /><InfoBlock label="Support" value="Customer support message templates for operations." /></SettingsCard></div></div><p className="mt-5 rounded-xl bg-primary-50 px-4 py-3 text-xs font-semibold leading-5 text-primary-900">Security note: API keys, FTP details, and private deployment secrets are not shown on this page.</p></section>;
}

function SettingsCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return <Card className="overflow-hidden rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="flex items-center gap-3 font-heading text-lg font-semibold"><span className="flex size-9 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span>{title}</CardTitle></CardHeader><CardContent className="grid gap-3 p-4 sm:grid-cols-2">{children}</CardContent></Card>;
}
