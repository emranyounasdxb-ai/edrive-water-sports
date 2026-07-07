'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardCheck, FileClock, RefreshCw, Search, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type BookingRow = {
  id: string;
  booking_code: string;
  status: string | null;
  admin_status: string | null;
  selected_package_name: string | null;
  selected_package_category: string | null;
  experience_type: string | null;
  service_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number | null;
  payment_status: string | null;
  created_at: string | null;
};

type DebugState = {
  projectHost: string;
  table: string;
  count: number | null;
  receivedRows: number;
  lastError: string;
  lastLoadedAt: string;
};

const supabaseProjectHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host || 'missing-url';
  } catch {
    return 'invalid-url';
  }
})();

function niceDate(value: string | null) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function niceCreatedAt(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function statusClass(status: string | null) {
  if (status === 'Confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Cancelled') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'Completed') return 'bg-primary-50 text-primary-900 border-primary/20';
  return 'bg-gold/10 text-gold border-gold/35';
}

export function AdminBookingsLivePage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [debug, setDebug] = useState<DebugState>({
    projectHost: supabaseProjectHost,
    table: bookingRequestsTable,
    count: null,
    receivedRows: 0,
    lastError: '',
    lastLoadedAt: '-'
  });

  async function loadBookings() {
    setLoading(true);
    setError('');

    const { data, error: queryError, count } = await supabase
      .from(bookingRequestsTable)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100);

    const rows = (data || []) as BookingRow[];
    const message = queryError?.message || '';

    setDebug({
      projectHost: supabaseProjectHost,
      table: bookingRequestsTable,
      count: typeof count === 'number' ? count : null,
      receivedRows: rows.length,
      lastError: message,
      lastLoadedAt: new Date().toLocaleString('en-AE')
    });

    if (queryError) {
      setError(message);
      setBookings([]);
    } else {
      setBookings(rows);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((booking) => [booking.booking_code, booking.customer_name, booking.customer_phone, booking.customer_email, booking.selected_package_name, booking.status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [bookings, query]);

  const newCount = bookings.filter((booking) => (booking.admin_status || 'New') === 'New').length;
  const confirmedCount = bookings.filter((booking) => booking.status === 'Confirmed').length;
  const pendingPayment = bookings.filter((booking) => (booking.payment_status || 'Not Paid') !== 'Paid').reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);

  return (
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Bookings</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Website booking requests</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Live records saved from the public booking form in Supabase.</p>
          </div>
          <Button type="button" onClick={loadBookings} variant="outline"><RefreshCw data-icon aria-hidden="true" />Refresh</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric title="New Requests" value={String(newCount)} icon={CalendarDays} />
          <Metric title="Confirmed" value={String(confirmedCount)} icon={ClipboardCheck} />
          <Metric title="Pending Payments" value={formatAed(pendingPayment)} icon={WalletCards} />
        </div>

        <Card className="mt-5 rounded-[1.35rem] border-primary/15 bg-primary-50/55">
          <CardContent className="grid gap-2 p-4 text-xs text-primary-900 md:grid-cols-2 xl:grid-cols-5">
            <div><span className="font-bold">Project:</span> {debug.projectHost}</div>
            <div><span className="font-bold">Table:</span> {debug.table}</div>
            <div><span className="font-bold">Count:</span> {debug.count ?? '-'}</div>
            <div><span className="font-bold">Rows received:</span> {debug.receivedRows}</div>
            <div><span className="font-bold">Loaded:</span> {debug.lastLoadedAt}</div>
            {debug.lastError ? <div className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700 md:col-span-2 xl:col-span-5">Supabase error: {debug.lastError}</div> : null}
          </CardContent>
        </Card>

        <Card className="mt-6 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-heading text-xl font-semibold">Booking list</CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings..." className="h-10 rounded-full pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error ? <p className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Package / Service</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Loading bookings...</TableCell></TableRow> : null}
                  {!loading && filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No booking requests found.</TableCell></TableRow> : null}
                  {filtered.map((booking, index) => (
                    <TableRow key={booking.id || `${booking.booking_code}-${index}`}>
                      <TableCell className="font-bold text-primary-900">{booking.booking_code}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{booking.customer_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{booking.customer_phone || booking.customer_email || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{booking.selected_package_name || booking.selected_package_category || booking.experience_type || '-'}</div>
                        <div className="text-xs text-muted-foreground">{booking.service_type || 'website'}</div>
                      </TableCell>
                      <TableCell>{niceDate(booking.preferred_date)}<div className="text-xs text-muted-foreground">{booking.preferred_time || '-'}</div></TableCell>
                      <TableCell>{formatAed(Number(booking.total_amount || 0))}<div className="text-xs text-muted-foreground">{booking.payment_status || 'Not Paid'}</div></TableCell>
                      <TableCell><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status || 'Pending'}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{niceCreatedAt(booking.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 rounded-[1.25rem] border border-primary/15 bg-primary-50 px-4 py-3 text-sm leading-6 text-primary-900">
          <FileClock className="mr-2 inline size-4" aria-hidden="true" /> New bookings appear here after the public booking success page saves them to Supabase.
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
  return <Card className="rounded-[1.35rem]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}
