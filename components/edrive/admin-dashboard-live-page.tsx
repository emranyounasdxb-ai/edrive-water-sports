'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ClipboardCheck, FileClock, Ship, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type DashboardBooking = {
  id: string;
  booking_code: string;
  status: string | null;
  admin_status: string | null;
  customer_name: string | null;
  selected_package_name: string | null;
  selected_package_category: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  total_amount: number | null;
  payment_status: string | null;
  created_at: string | null;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function niceDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

export function AdminDashboardLivePage() {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from(bookingRequestsTable)
      .select('id, booking_code, status, admin_status, customer_name, selected_package_name, selected_package_category, preferred_date, preferred_time, total_amount, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(8);

    if (queryError) setError(queryError.message);
    else setBookings((data || []) as DashboardBooking[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const today = todayIso();
    const newRequests = bookings.filter((booking) => (booking.admin_status || 'New') === 'New').length;
    const todayRides = bookings.filter((booking) => booking.preferred_date === today).length;
    const pendingPayments = bookings.filter((booking) => (booking.payment_status || 'Not Paid') !== 'Paid').reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);
    const confirmed = bookings.filter((booking) => booking.status === 'Confirmed').length;
    return { newRequests, todayRides, pendingPayments, confirmed };
  }, [bookings]);

  return (
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Dashboard</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Operations overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Live booking, payment, vehicle, staff, and revenue data from Supabase.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={loadDashboard}>Refresh</Button>
            <Button asChild><Link href="/admin/bookings">View Bookings</Link></Button>
          </div>
        </div>

        {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric title="New Bookings" value={String(metrics.newRequests)} icon={CalendarDays} />
          <Metric title="Today Rides" value={String(metrics.todayRides)} icon={ClipboardCheck} />
          <Metric title="Pending Payments" value={formatAed(metrics.pendingPayments)} icon={WalletCards} />
          <Metric title="Confirmed" value={String(metrics.confirmed)} icon={Ship} />
        </div>

        <Card className="mt-6 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
            <CardTitle className="font-heading text-xl font-semibold">Recent booking requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading dashboard...</TableCell></TableRow> : null}
                  {!loading && bookings.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No booking requests yet.</TableCell></TableRow> : null}
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-bold text-primary-900">{booking.booking_code}</TableCell>
                      <TableCell>{booking.customer_name || '-'}</TableCell>
                      <TableCell>{booking.selected_package_name || booking.selected_package_category || '-'}</TableCell>
                      <TableCell>{niceDate(booking.preferred_date)}<div className="text-xs text-muted-foreground">{booking.preferred_time || '-'}</div></TableCell>
                      <TableCell>{formatAed(Number(booking.total_amount || 0))}<div className="text-xs text-muted-foreground">{booking.payment_status || 'Not Paid'}</div></TableCell>
                      <TableCell><span className="inline-flex rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold">{booking.status || 'Pending'}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 rounded-[1.25rem] border border-primary/15 bg-primary-50 px-4 py-3 text-sm leading-6 text-primary-900">
          <FileClock className="mr-2 inline size-4" aria-hidden="true" /> This overview reads from the same booking_requests table used by the public booking form.
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
  return <Card className="rounded-[1.35rem]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}
