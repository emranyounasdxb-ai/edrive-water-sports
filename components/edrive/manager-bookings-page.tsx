'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, RefreshCw, Search, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type ManagerBooking = {
  id: string;
  booking_code: string;
  status: string | null;
  selected_package_name?: string | null;
  selected_package_capacity?: number | null;
  experience_type: string | null;
  service_type: string | null;
  duration_minutes?: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number | null;
  payment_status: string | null;
  payment_method?: string | null;
};

function niceDate(value: string | null) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function packageLabel(booking: ManagerBooking) {
  return booking.selected_package_name || booking.experience_type || '-';
}

function serviceDetail(booking: ManagerBooking) {
  const parts = [booking.service_type || 'website'];
  if (booking.selected_package_capacity) parts.push(`${booking.selected_package_capacity} seater`);
  if (booking.duration_minutes) parts.push(`${booking.duration_minutes} min`);
  return parts.join(' · ');
}

function statusClass(status: string | null) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'No Show') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-primary-50 text-primary-900 border-primary/20';
}

export function ManagerBookingsPage() {
  const [items, setItems] = useState<ManagerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function loadBookings() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from(bookingRequestsTable)
      .select('*')
      .in('status', ['Confirmed', 'Completed', 'No Show'])
      .order('preferred_date', { ascending: true })
      .order('preferred_time', { ascending: true })
      .limit(200);

    if (queryError) {
      setError(queryError.message);
      setItems([]);
    } else {
      setItems((data || []) as ManagerBooking[]);
    }
    setLoading(false);
  }

  async function quickUpdate(booking: ManagerBooking, status: string) {
    const payload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'Completed') payload.completed_at = new Date().toISOString();
    if (status === 'No Show') payload.no_show_at = new Date().toISOString();
    const result = booking.id
      ? await supabase.from(bookingRequestsTable).update(payload).eq('id', booking.id)
      : await supabase.from(bookingRequestsTable).update(payload).eq('booking_code', booking.booking_code);
    if (result.error) setError(result.error.message);
    else await loadBookings();
  }

  useEffect(() => { void loadBookings(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((booking) => [booking.booking_code, booking.customer_name, booking.customer_phone, packageLabel(booking), booking.status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [items, query]);

  const confirmed = items.filter((item) => item.status === 'Confirmed').length;
  const completed = items.filter((item) => item.status === 'Completed').length;
  const unpaidTotal = items.filter((item) => item.payment_status !== 'Paid').reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  return (
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Manager Operations</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Confirmed bookings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Only admin-confirmed bookings appear here. Manager can complete rides or mark no-show.</p>
          </div>
          <Button type="button" onClick={loadBookings} variant="outline"><RefreshCw data-icon aria-hidden="true" />Refresh</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric title="Ready for Manager" value={String(confirmed)} icon={CalendarDays} />
          <Metric title="Completed" value={String(completed)} icon={CheckCircle2} />
          <Metric title="Pending Payment" value={formatAed(unpaidTotal)} icon={WalletCards} />
        </div>

        <Card className="mt-6 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-heading text-xl font-semibold">Manager booking list</CardTitle>
            <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings..." className="h-10 rounded-full pl-9" /></div>
          </CardHeader>
          <CardContent className="p-0">
            {error ? <p className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Booking</TableHead><TableHead>Customer</TableHead><TableHead>Package</TableHead><TableHead>Date / Time</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading confirmed bookings...</TableCell></TableRow> : null}
                  {!loading && filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No confirmed bookings found.</TableCell></TableRow> : null}
                  {filtered.map((booking, index) => <TableRow key={booking.id || `${booking.booking_code}-${index}`}><TableCell className="font-bold text-primary-900">{booking.booking_code}</TableCell><TableCell><div className="font-semibold text-foreground">{booking.customer_name || '-'}</div><div className="text-xs text-muted-foreground">{booking.customer_phone || '-'}</div></TableCell><TableCell><div className="font-semibold text-foreground">{packageLabel(booking)}</div><div className="text-xs text-muted-foreground">{serviceDetail(booking)}</div></TableCell><TableCell>{niceDate(booking.preferred_date)}<div className="text-xs text-muted-foreground">{booking.preferred_time || '-'}</div></TableCell><TableCell>{formatAed(Number(booking.total_amount || 0))}</TableCell><TableCell><div className="font-semibold text-foreground">{booking.payment_status || 'Not Paid'}</div><div className="text-xs text-muted-foreground">{booking.payment_method || '-'}</div></TableCell><TableCell><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status || 'Confirmed'}</span></TableCell><TableCell><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => quickUpdate(booking, 'Completed')}>Complete</Button><Button type="button" size="sm" variant="subtle" onClick={() => quickUpdate(booking, 'No Show')}>No Show</Button></div></TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
  return <Card className="rounded-[1.35rem]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" /></span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}
