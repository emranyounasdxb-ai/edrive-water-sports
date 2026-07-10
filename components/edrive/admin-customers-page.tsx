'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, CreditCard, Eye, MessageCircle, RefreshCw, Search, UsersRound, WalletCards, X } from 'lucide-react';
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
  payment_method?: string | null;
  payment_status?: string | null;
  b2b_agent_name?: string | null;
  created_at?: string | null;
};

type CustomerFilter = 'all' | 'repeat' | 'pending' | 'b2b' | 'direct' | 'no_show';

type CustomerRecord = {
  key: string;
  name: string;
  phone: string;
  email: string;
  bookings: BookingRow[];
  total: number;
  received: number;
  pending: number;
  lastDate: string;
  completedCount: number;
  noShowCount: number;
  hasB2B: boolean;
  hasDirect: boolean;
};

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

function cleanEmail(value: unknown) {
  const email = asText(value).toLowerCase();
  return email.includes('@') ? email : '';
}

function rawDigits(value: unknown) {
  return asText(value).replace(/\D/g, '');
}

function isValidPhone(value: unknown) {
  const digits = rawDigits(value);
  return digits.length >= 7 && !/^0+$/.test(digits);
}

function displayPhone(value: unknown) {
  return isValidPhone(value) ? asText(value) : '';
}

function whatsappPhone(value: unknown) {
  let digits = rawDigits(value);
  if (!digits || digits.length < 7 || /^0+$/.test(digits)) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  return digits;
}

function normalizedName(value: unknown) {
  return asText(value, 'Guest').toLowerCase().replace(/\s+/g, ' ').trim();
}

function bookingCode(booking: BookingRow) {
  return asText(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function packageLabel(booking: BookingRow) {
  return asText(booking.selected_package_name || booking.selected_package_category || booking.service_type, 'Package');
}

function isNoShow(booking: BookingRow) {
  return asText(booking.status).toLowerCase() === 'no show' || asText(booking.payment_status).toLowerCase() === 'no show';
}

function isCompleted(booking: BookingRow) {
  return asText(booking.status).toLowerCase() === 'completed';
}

function bookingTotal(booking: BookingRow) {
  return isNoShow(booking) ? 0 : asNumber(booking.total_amount);
}

function bookingReceived(booking: BookingRow) {
  if (isNoShow(booking)) return 0;
  const received = asNumber(booking.amount_received_aed);
  if (received > 0) return received;
  const pending = asNumber(booking.amount_pending_aed);
  return Math.max(asNumber(booking.total_amount) - pending, 0);
}

function bookingPending(booking: BookingRow) {
  if (isNoShow(booking)) return 0;
  const pending = asNumber(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(asNumber(booking.total_amount) - bookingReceived(booking), 0);
}

function isB2B(booking: BookingRow) {
  return asText(booking.payment_source).toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name);
}

function customerKey(booking: BookingRow) {
  const phone = isValidPhone(booking.customer_phone) ? rawDigits(booking.customer_phone) : '';
  if (phone) return `phone:${phone}`;
  const email = cleanEmail(booking.customer_email);
  if (email) return `email:${email}`;
  return `name:${normalizedName(booking.customer_name)}`;
}

function buildCustomers(bookings: BookingRow[]) {
  const map = new Map<string, CustomerRecord>();
  bookings.forEach((booking) => {
    const key = customerKey(booking);
    const current = map.get(key) || {
      key,
      name: asText(booking.customer_name, 'Guest'),
      phone: displayPhone(booking.customer_phone),
      email: cleanEmail(booking.customer_email),
      bookings: [],
      total: 0,
      received: 0,
      pending: 0,
      lastDate: '',
      completedCount: 0,
      noShowCount: 0,
      hasB2B: false,
      hasDirect: false
    };

    current.bookings.push(booking);
    current.total += bookingTotal(booking);
    current.received += bookingReceived(booking);
    current.pending += bookingPending(booking);
    current.completedCount += isCompleted(booking) ? 1 : 0;
    current.noShowCount += isNoShow(booking) ? 1 : 0;
    current.hasB2B = current.hasB2B || isB2B(booking);
    current.hasDirect = current.hasDirect || !isB2B(booking);

    const dateValue = asText(booking.preferred_date || booking.created_at);
    if (dateValue && (!current.lastDate || new Date(dateValue) > new Date(current.lastDate))) current.lastDate = dateValue;
    if (!current.phone && displayPhone(booking.customer_phone)) current.phone = displayPhone(booking.customer_phone);
    if (!current.email && cleanEmail(booking.customer_email)) current.email = cleanEmail(booking.customer_email);
    if (current.name === 'Guest' && booking.customer_name) current.name = asText(booking.customer_name, 'Guest');
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => {
    if (b.bookings.length !== a.bookings.length) return b.bookings.length - a.bookings.length;
    return b.lastDate.localeCompare(a.lastDate);
  });
}

function customerWhatsAppHref(customer: CustomerRecord) {
  const phone = whatsappPhone(customer.phone);
  if (!phone) return '';
  const message = encodeURIComponent(`Hello ${customer.name}, this is eDrive Water Sports. Thank you for booking with us. Please let us know if you need any support.`);
  return `https://web.whatsapp.com/send?phone=${phone}&text=${message}&app_absent=0`;
}

function statusTone(value: unknown) {
  const status = asText(value).toLowerCase();
  if (status.includes('repeat') || status.includes('completed') || status.includes('paid')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status.includes('pending') || status.includes('no show')) return 'border-red-200 bg-red-50 text-red-700';
  if (status.includes('b2b')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone || statusTone(children)}`}>{children}</span>;
}

function InfoBlock({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof UsersRound }) {
  return <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.055)]"><CardContent className="flex min-w-0 items-center gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{value}</p></div></CardContent></Card>;
}

function CustomerProfileModal({ customer, onClose }: { customer: CustomerRecord; onClose: () => void }) {
  const whatsapp = customerWhatsAppHref(customer);
  const sortedBookings = [...customer.bookings].sort((a, b) => asText(b.preferred_date || b.created_at).localeCompare(asText(a.preferred_date || a.created_at)));

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]"><div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Customer Profile</p><h2 className="mt-1 break-words font-heading text-2xl font-semibold text-foreground">{customer.name}</h2><p className="mt-1 text-sm text-muted-foreground">{customer.phone || 'No valid phone'} · {customer.email || 'No email'}</p></div><button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close"><X className="size-4" aria-hidden="true" /></button></div><div className="max-h-[calc(86vh-5.5rem)] overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><InfoBlock label="Bookings" value={String(customer.bookings.length)} /><InfoBlock label="Completed" value={String(customer.completedCount)} /><InfoBlock label="No Show" value={String(customer.noShowCount)} /><InfoBlock label="Total Value" value={formatAed(customer.total)} /><InfoBlock label="Pending" value={formatAed(customer.pending)} /></div><div className="mt-4 flex flex-wrap gap-2"><Badge>{customer.bookings.length > 1 ? 'Repeat Guest' : 'New Guest'}</Badge>{customer.pending > 0 ? <Badge>Has Pending</Badge> : null}{customer.hasB2B ? <Badge>B2B Customer</Badge> : null}{customer.hasDirect ? <Badge>Direct Customer</Badge> : null}{customer.noShowCount > 0 ? <Badge>No Show History</Badge> : null}{whatsapp ? <Button asChild size="sm" className="rounded-full bg-[#25D366] text-white hover:bg-[#1EBE5D]"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp</a></Button> : null}</div><Card className="mt-5 overflow-hidden rounded-[1.25rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Booking history</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{sortedBookings.map((booking) => <div key={String(booking.id || bookingCode(booking))} className="grid gap-3 rounded-2xl border border-border bg-white p-3 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr] lg:items-center"><InfoBlock label="Booking" value={bookingCode(booking)} sub={asText(booking.status, 'Pending')} /><InfoBlock label="Package" value={packageLabel(booking)} sub={`${niceDate(booking.preferred_date)} · ${asText(booking.preferred_time, '-')}`} /><InfoBlock label="Type" value={isB2B(booking) ? 'B2B' : 'Direct'} sub={asText(booking.b2b_agent_name, '')} /><InfoBlock label="Total" value={formatAed(bookingTotal(booking))} /><InfoBlock label="Pending" value={formatAed(bookingPending(booking))} /></div>)}</CardContent></Card></div></div></div>;
}

function CustomerRow({ customer, onView }: { customer: CustomerRecord; onView: () => void }) {
  const whatsapp = customerWhatsAppHref(customer);
  return <div className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 lg:grid-cols-[1.25fr_1fr_1.3fr_0.8fr_1fr_1fr_1fr_1.1fr] lg:items-center"><div className="min-w-0"><p className="break-words font-heading text-base font-semibold text-foreground">{customer.name}</p><div className="mt-1 flex flex-wrap gap-1.5"><Badge>{customer.bookings.length > 1 ? 'Repeat Guest' : 'New Guest'}</Badge>{customer.pending > 0 ? <Badge>Has Pending</Badge> : null}{customer.hasB2B ? <Badge>B2B</Badge> : null}{customer.noShowCount > 0 ? <Badge>No Show</Badge> : null}</div></div><div className="text-sm font-semibold text-foreground">{customer.phone || '-'}</div><div className="break-words text-sm font-semibold text-foreground">{customer.email || '-'}</div><div><p className="font-bold text-foreground">{customer.bookings.length}</p><p className="text-xs text-muted-foreground">Last {niceDate(customer.lastDate)}</p></div><div className="font-bold text-foreground">{formatAed(customer.total)}</div><div className="font-bold text-foreground">{formatAed(customer.received)}</div><div className={`font-bold ${customer.pending > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatAed(customer.pending)}</div><div className="flex flex-wrap gap-2 lg:justify-end"><Button type="button" size="sm" variant="outline" onClick={onView} className="rounded-full bg-white"><Eye className="size-4" aria-hidden="true" />Profile</Button>{whatsapp ? <Button asChild size="sm" className="rounded-full bg-[#25D366] text-white hover:bg-[#1EBE5D]"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp</a></Button> : null}</div></div>;
}

export function AdminCustomersPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  async function refresh() {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(700);
    if (loadError) {
      setError(loadError.message);
      setBookings([]);
    } else {
      setBookings((data || []) as BookingRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  const customers = useMemo(() => buildCustomers(bookings), [bookings]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => {
      if (filter === 'repeat' && customer.bookings.length <= 1) return false;
      if (filter === 'pending' && customer.pending <= 0) return false;
      if (filter === 'b2b' && !customer.hasB2B) return false;
      if (filter === 'direct' && !customer.hasDirect) return false;
      if (filter === 'no_show' && customer.noShowCount <= 0) return false;
      if (!term) return true;
      return [customer.name, customer.phone, customer.email, ...customer.bookings.flatMap((booking) => [bookingCode(booking), packageLabel(booking), booking.status, booking.customer_phone, booking.customer_email])].some((value) => asText(value).toLowerCase().includes(term));
    });
  }, [customers, filter, query]);

  const repeatCustomers = customers.filter((customer) => customer.bookings.length > 1).length;
  const totalValue = customers.reduce((sum, customer) => sum + customer.total, 0);
  const pendingValue = customers.reduce((sum, customer) => sum + customer.pending, 0);

  const filterOptions: Array<{ id: CustomerFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: customers.length },
    { id: 'repeat', label: 'Repeat', count: repeatCustomers },
    { id: 'pending', label: 'Pending', count: customers.filter((customer) => customer.pending > 0).length },
    { id: 'b2b', label: 'B2B', count: customers.filter((customer) => customer.hasB2B).length },
    { id: 'direct', label: 'Direct', count: customers.filter((customer) => customer.hasDirect).length },
    { id: 'no_show', label: 'No Show', count: customers.filter((customer) => customer.noShowCount > 0).length }
  ];

  return <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Customers</p><h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Customer directory</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Merged customer contacts, booking history, payment status, and support actions in one place.</p></div><Button type="button" variant="outline" onClick={refresh} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button></div>{error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Customers" value={String(customers.length)} icon={UsersRound} /><MetricCard title="Repeat Guests" value={String(repeatCustomers)} icon={CheckCircle2} /><MetricCard title="Total Value" value={formatAed(totalValue)} icon={WalletCards} /><MetricCard title="Pending" value={formatAed(pendingValue)} icon={CreditCard} /></div><Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Customer CRM list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `Showing ${filtered.length} of ${customers.length}`}</p></div><div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, email, booking..." className="h-10 rounded-full bg-white pl-9 text-sm font-semibold" /></div></CardHeader><div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">{filterOptions.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{item.label} <span className={filter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span></button>)}</div><CardContent className="p-0">{loading ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">Loading customers...</div></div> : null}{!loading && filtered.length === 0 ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No customers found</p><p className="mt-2 text-sm text-muted-foreground">Try another search or filter.</p></div></div> : null}{!loading && filtered.length > 0 ? <><div className="hidden border-b border-border/70 bg-[#F7FAFA] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground lg:grid lg:grid-cols-[1.25fr_1fr_1.3fr_0.8fr_1fr_1fr_1fr_1.1fr]"><span>Customer</span><span>Phone</span><span>Email</span><span>Bookings</span><span>Total</span><span>Received</span><span>Pending</span><span className="text-right">Action</span></div><div>{filtered.map((customer) => <CustomerRow key={customer.key} customer={customer} onView={() => setSelectedCustomer(customer)} />)}</div></> : null}</CardContent></Card>{selectedCustomer ? <CustomerProfileModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} /> : null}</section>;
}
