'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, CheckCircle2, CreditCard, Eye, MessageCircle, RefreshCw, Search, UsersRound, WalletCards, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import {
  type OperationsBooking,
  bookingCode,
  bookingDateKey,
  bookingPending,
  bookingReceived,
  bookingStage,
  earnedRevenue,
  isB2BBooking,
  isCancelled,
  isCompleted,
  isNoShow,
  packageName,
  reportText
} from '@/lib/operations-reporting';
import { supabase } from '@/lib/supabase-client';

type CustomerFilter = 'all' | 'repeat' | 'outstanding' | 'b2b' | 'direct' | 'no_show' | 'cancelled';

type CustomerRecord = {
  key: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  email: string;
  bookings: OperationsBooking[];
  validBookings: number;
  completed: number;
  noShow: number;
  cancelled: number;
  value: number;
  paid: number;
  outstanding: number;
  lastDate: string;
  hasB2B: boolean;
  hasDirect: boolean;
};

function cleanEmail(value: unknown) {
  const email = reportText(value).toLowerCase();
  return email.includes('@') ? email : '';
}

function normalizePhone(value: unknown) {
  let digits = reportText(value).replace(/\D/g, '');
  if (!digits || digits.length < 7 || /^0+$/.test(digits)) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  return digits;
}

function customerIdentifiers(booking: OperationsBooking) {
  const email = cleanEmail(booking.customer_email);
  const phone = normalizePhone(booking.customer_phone);
  const values = [email ? `email:${email}` : '', phone ? `phone:${phone}` : ''].filter(Boolean);
  return values.length ? values : [`booking:${bookingCode(booking).toLowerCase()}`];
}

function emptyCustomer(key: string, booking: OperationsBooking): CustomerRecord {
  return {
    key,
    name: reportText(booking.customer_name, 'Guest'),
    phone: reportText(booking.customer_phone),
    normalizedPhone: normalizePhone(booking.customer_phone),
    email: cleanEmail(booking.customer_email),
    bookings: [],
    validBookings: 0,
    completed: 0,
    noShow: 0,
    cancelled: 0,
    value: 0,
    paid: 0,
    outstanding: 0,
    lastDate: '',
    hasB2B: false,
    hasDirect: false
  };
}

function buildCustomers(bookings: OperationsBooking[]) {
  const customers = new Map<string, CustomerRecord>();
  const identityIndex = new Map<string, string>();

  bookings.forEach((booking) => {
    const identifiers = customerIdentifiers(booking);
    const existingKey = identifiers.map((identifier) => identityIndex.get(identifier)).find(Boolean);
    const key = existingKey || identifiers[0];
    const customer = customers.get(key) || emptyCustomer(key, booking);

    identifiers.forEach((identifier) => identityIndex.set(identifier, key));
    customer.bookings.push(booking);
    customer.validBookings += !isCancelled(booking) && !isNoShow(booking) ? 1 : 0;
    customer.completed += isCompleted(booking) && !isCancelled(booking) && !isNoShow(booking) ? 1 : 0;
    customer.noShow += isNoShow(booking) ? 1 : 0;
    customer.cancelled += isCancelled(booking) ? 1 : 0;
    customer.value += earnedRevenue(booking);
    customer.paid += isCompleted(booking) && !isCancelled(booking) && !isNoShow(booking) ? bookingReceived(booking) : 0;
    customer.outstanding += bookingPending(booking);
    customer.hasB2B = customer.hasB2B || isB2BBooking(booking);
    customer.hasDirect = customer.hasDirect || !isB2BBooking(booking);

    const date = bookingDateKey(booking);
    if (date && date > customer.lastDate) customer.lastDate = date;
    if (!customer.normalizedPhone && normalizePhone(booking.customer_phone)) {
      customer.phone = reportText(booking.customer_phone);
      customer.normalizedPhone = normalizePhone(booking.customer_phone);
    }
    if (!customer.email && cleanEmail(booking.customer_email)) customer.email = cleanEmail(booking.customer_email);
    if ((customer.name === 'Guest' || customer.name.length < 2) && reportText(booking.customer_name)) customer.name = reportText(booking.customer_name, 'Guest');
    customers.set(key, customer);
  });

  return Array.from(customers.values()).sort((a, b) => {
    if (b.validBookings !== a.validBookings) return b.validBookings - a.validBookings;
    return b.lastDate.localeCompare(a.lastDate);
  });
}

function niceDate(value: unknown) {
  const clean = reportText(value);
  if (!clean) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00`));
}

function whatsappHref(customer: CustomerRecord) {
  if (!customer.normalizedPhone) return '';
  const message = encodeURIComponent(`Hello ${customer.name}, this is eDrive Water Sports. Please let us know if you need any support with your booking.`);
  return `https://web.whatsapp.com/send?phone=${customer.normalizedPhone}&text=${message}&app_absent=0`;
}

function stageTone(stage: string) {
  const value = stage.toLowerCase();
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'in progress') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (value === 'assigned' || value === 'confirmed') return 'border-primary/25 bg-primary-50 text-primary';
  if (value === 'no show' || value === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex h-6 items-center rounded-full border px-2 text-[10px] font-bold ${tone || 'border-border bg-[#F7FAFA] text-muted-foreground'}`}>{children}</span>;
}

function Info({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div>{sub ? <div className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</div> : null}</div>;
}

function Metric({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: LucideIcon }) {
  return <Card className="rounded-[1.15rem] border-border/80 bg-white shadow-[0_10px_24px_rgba(8,37,50,0.045)]"><CardContent className="flex min-w-0 items-start gap-3 p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold text-foreground">{value}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{helper}</p></div></CardContent></Card>;
}

function CustomerModal({ customer, onClose }: { customer: CustomerRecord; onClose: () => void }) {
  const whatsapp = whatsappHref(customer);
  const history = [...customer.bookings].sort((a, b) => bookingDateKey(b).localeCompare(bookingDateKey(a)));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5">
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Customer History</p><h2 className="mt-1 break-words font-heading text-2xl font-semibold text-foreground">{customer.name}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{customer.phone || 'No phone'} · {customer.email || 'No email'}</p></div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm" aria-label="Close"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Info label="Bookings" value={String(customer.bookings.length)} />
            <Info label="Valid Rides" value={String(customer.validBookings)} />
            <Info label="Completed" value={String(customer.completed)} />
            <Info label="No Show" value={String(customer.noShow)} />
            <Info label="Lifetime Value" value={formatAed(customer.value)} />
            <Info label="Outstanding" value={formatAed(customer.outstanding)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{customer.validBookings > 1 ? 'Repeat Guest' : 'New Guest'}</Badge>
            {customer.hasDirect ? <Badge>Direct</Badge> : null}
            {customer.hasB2B ? <Badge>B2B</Badge> : null}
            {customer.outstanding > 0 ? <Badge tone="border-red-200 bg-red-50 text-red-700">Outstanding</Badge> : <Badge tone="border-emerald-200 bg-emerald-50 text-emerald-700">No Due</Badge>}
            {whatsapp ? <Button asChild size="sm" className="rounded-full bg-[#25D366] text-white hover:bg-[#1EBE5D]"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp</a></Button> : null}
          </div>

          <Card className="mt-5 overflow-hidden rounded-[1.25rem] border-border/80 bg-white">
            <CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Complete booking history</CardTitle></CardHeader>
            <CardContent className="grid gap-3 p-3 sm:p-4">
              {history.map((booking) => {
                const stage = bookingStage(booking);
                const total = earnedRevenue(booking);
                const paid = isCompleted(booking) && !isCancelled(booking) && !isNoShow(booking) ? bookingReceived(booking) : 0;
                return <div key={reportText(booking.id || bookingCode(booking))} className="rounded-[1.15rem] border border-border/70 bg-white p-3 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><p className="text-xs font-bold text-primary">{bookingCode(booking)}</p><h3 className="mt-1 break-words font-heading text-base font-semibold text-foreground">{packageName(booking)}</h3><p className="mt-1 text-xs text-muted-foreground">{niceDate(booking.preferred_date)} · {reportText(booking.preferred_time, '-')} · {isB2BBooking(booking) ? 'B2B' : 'Direct'}</p></div><span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${stageTone(stage)}`}>{stage}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Info label="Booked Amount" value={formatAed(bookingTotalSafe(booking))} /><Info label="Revenue Value" value={formatAed(total)} sub="Completed rides only" /><Info label="Paid" value={formatAed(paid)} /><Info label="Balance" value={formatAed(bookingPending(booking))} /><Info label="Payment" value={reportText(booking.payment_status, 'Not Paid')} sub={reportText(booking.payment_method, isB2BBooking(booking) ? 'B2B Invoice' : '-')} /></div></div>;
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function bookingTotalSafe(booking: OperationsBooking) {
  const numeric = Number(booking.total_amount || 0);
  return Number.isFinite(numeric) ? Math.max(numeric, 0) : 0;
}

function CustomerRow({ customer, onView }: { customer: CustomerRecord; onView: () => void }) {
  const whatsapp = whatsappHref(customer);
  return <div className="grid gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 lg:grid-cols-[1.25fr_1fr_1.35fr_0.7fr_0.9fr_0.9fr_0.9fr_1fr] lg:items-center"><div className="min-w-0"><p className="truncate font-heading text-sm font-semibold text-foreground">{customer.name}</p><div className="mt-1 flex flex-wrap gap-1"><Badge>{customer.validBookings > 1 ? 'Repeat' : 'New'}</Badge>{customer.hasB2B ? <Badge>B2B</Badge> : null}{customer.noShow > 0 ? <Badge tone="border-red-200 bg-red-50 text-red-700">No Show</Badge> : null}</div></div><div className="truncate text-xs font-semibold text-foreground">{customer.phone || '-'}</div><div className="truncate text-xs font-semibold text-foreground">{customer.email || '-'}</div><div><p className="text-sm font-bold text-foreground">{customer.bookings.length}</p><p className="text-[11px] text-muted-foreground">{niceDate(customer.lastDate)}</p></div><div className="text-xs font-bold text-foreground">{formatAed(customer.value)}</div><div className="text-xs font-bold text-emerald-700">{formatAed(customer.paid)}</div><div className={`text-xs font-bold ${customer.outstanding > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatAed(customer.outstanding)}</div><div className="flex flex-wrap gap-1.5 lg:justify-end"><Button type="button" size="sm" variant="outline" onClick={onView} className="h-8 rounded-full bg-white px-3 text-xs"><Eye className="size-3.5" aria-hidden="true" />History</Button>{whatsapp ? <Button asChild size="sm" className="h-8 rounded-full bg-[#25D366] px-3 text-xs text-white hover:bg-[#1EBE5D]"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" aria-hidden="true" />WhatsApp</a></Button> : null}</div></div>;
}

export function AdminCustomerHistoryPage() {
  const [bookings, setBookings] = useState<OperationsBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [selected, setSelected] = useState<CustomerRecord | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(5000);
    if (loadError) {
      setError(loadError.message);
      setBookings([]);
    } else setBookings((data || []) as OperationsBooking[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const customers = useMemo(() => buildCustomers(bookings), [bookings]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => {
      if (filter === 'repeat' && customer.validBookings <= 1) return false;
      if (filter === 'outstanding' && customer.outstanding <= 0) return false;
      if (filter === 'b2b' && !customer.hasB2B) return false;
      if (filter === 'direct' && !customer.hasDirect) return false;
      if (filter === 'no_show' && customer.noShow <= 0) return false;
      if (filter === 'cancelled' && customer.cancelled <= 0) return false;
      if (!term) return true;
      return [customer.name, customer.phone, customer.email, ...customer.bookings.flatMap((booking) => [bookingCode(booking), packageName(booking), bookingStage(booking)])].some((value) => reportText(value).toLowerCase().includes(term));
    });
  }, [customers, filter, query]);

  const repeat = customers.filter((customer) => customer.validBookings > 1).length;
  const lifetime = customers.reduce((sum, customer) => sum + customer.value, 0);
  const paid = customers.reduce((sum, customer) => sum + customer.paid, 0);
  const outstanding = customers.reduce((sum, customer) => sum + customer.outstanding, 0);
  const filters: Array<{ id: CustomerFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: customers.length },
    { id: 'repeat', label: 'Repeat', count: repeat },
    { id: 'outstanding', label: 'Outstanding', count: customers.filter((customer) => customer.outstanding > 0).length },
    { id: 'b2b', label: 'B2B', count: customers.filter((customer) => customer.hasB2B).length },
    { id: 'direct', label: 'Direct', count: customers.filter((customer) => customer.hasDirect).length },
    { id: 'no_show', label: 'No Show', count: customers.filter((customer) => customer.noShow > 0).length },
    { id: 'cancelled', label: 'Cancelled', count: customers.filter((customer) => customer.cancelled > 0).length }
  ];

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Customers</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Customer history</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Merged customer contacts, complete ride history, completed value and outstanding balances using the same rules as Dashboard and Reports.</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="rounded-full bg-white"><Link href="/my-booking" target="_blank">Open Public Tracker</Link></Button><Button type="button" variant="outline" onClick={load} className="rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button></div></div>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric title="Customers" value={String(customers.length)} helper="Unique verified contacts" icon={UsersRound} /><Metric title="Repeat Guests" value={String(repeat)} helper="More than one valid booking" icon={CheckCircle2} /><Metric title="Lifetime Value" value={formatAed(lifetime)} helper="Completed rides only" icon={WalletCards} /><Metric title="Customer Paid" value={formatAed(paid)} helper="Recorded completed payments" icon={CreditCard} /><Metric title="Outstanding" value={formatAed(outstanding)} helper="Completed ride balances" icon={CalendarDays} /></div>
      <Card className="mt-5 overflow-hidden rounded-[1.35rem] border-border/80 bg-white"><CardHeader className="gap-3 border-b border-border/70 bg-[#F7FAFA] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="font-heading text-lg font-semibold">Customer directory</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading records...' : `Showing ${visible.length} of ${customers.length}`}</p></div><label className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, email, booking..." className="h-10 rounded-full bg-white pl-9 text-sm font-semibold" /></label></CardHeader><div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground'}`}>{item.label} <span className={filter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span></button>)}</div><CardContent className="p-0">{loading ? <div className="p-4"><div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">Loading customers...</div></div> : null}{!loading && !visible.length ? <div className="p-4"><div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No matching customers.</div></div> : null}{!loading && visible.length ? <><div className="hidden border-b border-border/70 bg-[#F7FAFA] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground lg:grid lg:grid-cols-[1.25fr_1fr_1.35fr_0.7fr_0.9fr_0.9fr_0.9fr_1fr]"><span>Customer</span><span>Phone</span><span>Email</span><span>Bookings</span><span>Value</span><span>Paid</span><span>Outstanding</span><span className="text-right">Action</span></div><div>{visible.map((customer) => <CustomerRow key={customer.key} customer={customer} onView={() => setSelected(customer)} />)}</div></> : null}</CardContent></Card>
      {selected ? <CustomerModal customer={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
