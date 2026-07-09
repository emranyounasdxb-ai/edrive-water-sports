'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarPlus, FileClock, LogOut, RefreshCw, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BrandMark } from '@/components/edrive/brand';
import { bookingRequestsTable } from '@/lib/booking-records';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';

type AgentProfile = {
  id: string;
  agent_code: string | null;
  company_name: string;
  login_email: string | null;
  email: string | null;
  status: string;
};

type BookingRow = {
  id: string;
  booking_code: string | null;
  selected_package_name: string | null;
  selected_package_category: string | null;
  duration_minutes: number | null;
  vehicle_quantity: number | null;
  guest_count: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number | null;
  amount_received_aed: number | null;
  amount_pending_aed: number | null;
  payment_status: string | null;
  payment_workflow_status: string | null;
  status: string | null;
  admin_status: string | null;
  created_at: string | null;
};

function isActiveStatus(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase() === 'active';
}

function niceDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function niceCreatedAt(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function categoryLabel(value: string | null) {
  if (value === 'jet_car_rental') return 'Jet Car';
  if (value === 'jet_ski_rental') return 'Jet Ski';
  return String(value || '-').replace(/_/g, ' ');
}

export default function B2BBookingsPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadBookings() {
    setLoading(true);
    setError('');

    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) {
      router.replace('/admin/login');
      return;
    }

    const { data: agentData, error: agentError } = await supabase
      .from('b2b_agents')
      .select('id,agent_code,company_name,login_email,email,status')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    const nextAgent = agentData as AgentProfile | null;
    if (agentError || !nextAgent || !isActiveStatus(nextAgent.status)) {
      setError(agentError?.message || 'Active B2B agent profile nahi mila.');
      setLoading(false);
      return;
    }

    const agentEmail = nextAgent.login_email || nextAgent.email || '';
    const { data, error: bookingError } = await supabase
      .from(bookingRequestsTable)
      .select('id,booking_code,selected_package_name,selected_package_category,duration_minutes,vehicle_quantity,guest_count,preferred_date,preferred_time,customer_name,customer_phone,total_amount,amount_received_aed,amount_pending_aed,payment_status,payment_workflow_status,status,admin_status,created_at')
      .or(`b2b_agent_id.eq.${nextAgent.id},b2b_agent_email.eq.${agentEmail}`)
      .order('created_at', { ascending: false });

    if (bookingError) {
      setError(bookingError.message);
      setBookings([]);
    } else {
      setAgent(nextAgent);
      setBookings((data || []) as BookingRow[]);
    }

    setLoading(false);
  }

  useEffect(() => { void loadBookings(); }, []);

  const totals = useMemo(() => {
    const total = bookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);
    const received = bookings.reduce((sum, booking) => sum + Number(booking.amount_received_aed || 0), 0);
    const pending = bookings.reduce((sum, booking) => sum + Number(booking.amount_pending_aed ?? Math.max(Number(booking.total_amount || 0) - Number(booking.amount_received_aed || 0), 0)), 0);
    return { total, received, pending };
  }, [bookings]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#F5F8F8_0%,#EEF7F7_52%,#F8F2E8_100%)] px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.7rem] border border-white/85 bg-white/82 px-5 py-4 shadow-[0_18px_55px_rgba(8,37,50,0.08)] backdrop-blur-xl sm:px-7">
          <Link href="/agent" className="w-fit"><BrandMark /></Link>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="rounded-full bg-white/90"><Link href="/agent"><ArrowLeft className="size-4" aria-hidden="true" />Dashboard</Link></Button>
            <Button asChild className="rounded-full bg-primary-900 hover:bg-primary-800"><Link href="/agent/new-booking"><CalendarPlus className="size-4" aria-hidden="true" />New Booking</Link></Button>
            <Button type="button" onClick={handleLogout} className="rounded-full bg-primary-900 hover:bg-primary-800"><LogOut className="size-4" aria-hidden="true" />Logout</Button>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/85 bg-white/80 p-6 shadow-[0_24px_70px_rgba(8,37,50,0.10)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-primary/20 bg-primary-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">B2B Bookings</span>
              <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.04em] text-primary-900">My bookings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{agent?.company_name || 'B2B Agent'} ki submitted bookings, payment status aur pending balance.</p>
            </div>
            <Button type="button" variant="outline" onClick={loadBookings}><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
          </div>
        </section>

        {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric title="Bookings" value={String(bookings.length)} icon={<FileClock className="size-5" />} />
          <Metric title="Total Value" value={formatAed(totals.total)} icon={<WalletCards className="size-5" />} />
          <Metric title="Pending Balance" value={formatAed(totals.pending)} icon={<WalletCards className="size-5" />} />
        </div>

        <Card className="mt-6 overflow-hidden rounded-[2rem] border-white/85 bg-white/88 shadow-[0_24px_70px_rgba(8,37,50,0.10)]">
          <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
            <CardTitle className="font-heading text-xl font-semibold">Booking list</CardTitle>
            <CardDescription>{loading ? 'Loading...' : `${bookings.length} B2B booking records`}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center">Loading bookings...</TableCell></TableRow> : null}
                {!loading && bookings.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center">No B2B bookings yet.</TableCell></TableRow> : null}
                {bookings.map((booking) => {
                  const pending = Number(booking.amount_pending_aed ?? Math.max(Number(booking.total_amount || 0) - Number(booking.amount_received_aed || 0), 0));
                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-bold text-primary-900">{booking.booking_code || '-'}</div>
                        <div className="text-xs text-muted-foreground">{niceCreatedAt(booking.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{booking.customer_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{booking.customer_phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{booking.selected_package_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{categoryLabel(booking.selected_package_category)} · {booking.duration_minutes || '-'} min</div>
                      </TableCell>
                      <TableCell>{niceDate(booking.preferred_date)}<div className="text-xs text-muted-foreground">{booking.preferred_time || '-'}</div></TableCell>
                      <TableCell>{formatAed(Number(booking.total_amount || 0))}<div className="text-xs text-muted-foreground">Pending {formatAed(pending)}</div></TableCell>
                      <TableCell><div className="font-semibold text-foreground">{booking.payment_status || 'Not Paid'}</div><div className="text-xs text-muted-foreground">{String(booking.payment_workflow_status || 'pending').replace(/_/g, ' ')}</div></TableCell>
                      <TableCell><Badge variant={booking.status === 'Confirmed' ? 'success' : 'secondary'}>{booking.status || 'Pending'}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <Card className="rounded-[1.35rem]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">{icon}</span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}
