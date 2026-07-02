'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck2, CircleDollarSign, Download, ShieldCheck, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { collectionStatuses, formatAed, paymentMethods, type BookingStatus, type CollectionStatus, type PaymentMethod } from './operations-data';
import { useOperations } from './operations-store';
import { PageHeader, SummaryTile } from './shared';

const revenueSeries = [5400, 6800, 12100, 14700, 9200, 8700, 10400, 6900, 8200, 11700, 16800, 11300, 12100, 8740];

export function AdminReportsPage() {
  const { bookings, vehicles } = useOperations();
  const [period, setPeriod] = useState<'Today' | 'Week' | 'Month'>('Month');
  const received = bookings.reduce((sum, booking) => sum + booking.amountReceived, 0);
  const pending = bookings.reduce((sum, booking) => sum + booking.amountPending, 0);
  const completed = bookings.filter((booking) => booking.bookingStatus === 'Completed');
  const todayRevenue = bookings.filter((booking) => booking.preferredDate === '2026-07-02').reduce((sum, booking) => sum + booking.amountReceived, 0);
  const cashPending = bookings.filter((booking) => ['With Manager', 'With Captain', 'With Driver'].includes(booking.collectionStatus)).reduce((sum, booking) => sum + booking.amountReceived, 0);

  const paymentBreakdown = useMemo(() => paymentMethods.map((method) => ({ label: method, value: bookings.filter((booking) => booking.paymentMethod === method).reduce((sum, booking) => sum + booking.amountReceived, 0) })).filter((item) => item.value > 0), [bookings]);
  const collectionBreakdown = useMemo(() => collectionStatuses.map((status) => ({ label: status, value: bookings.filter((booking) => booking.collectionStatus === status).reduce((sum, booking) => sum + booking.amountReceived, 0) })).filter((item) => item.value > 0), [bookings]);
  const earningsByVehicle = useMemo(() => vehicles.map((vehicle) => ({ ...vehicle, earnings: bookings.filter((booking) => booking.assignedVehicleId === vehicle.id).reduce((sum, booking) => sum + booking.amountReceived, 0), rides: bookings.filter((booking) => booking.assignedVehicleId === vehicle.id).length })).sort((a, b) => b.earnings - a.earnings), [bookings, vehicles]);

  return (
    <div className="flex flex-col gap-6" data-testid="admin-reports-page">
      <PageHeader title="Operational reports" description="Revenue, payment custody, fleet earnings, ride outcomes, and team performance update from the shared booking workflow." actions={<Button variant="outline" size="sm"><Download data-icon="inline-start" aria-hidden="true" />Export CSV</Button>} />

      <Card><CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">Report period</span>{(['Today', 'Week', 'Month'] as const).map((item) => <Button key={item} type="button" size="sm" variant={period === item ? 'default' : 'outline'} onClick={() => setPeriod(item)}>{item}</Button>)}</div><p className="text-xs text-muted-foreground">Showing live workflow data · {period}</p></CardContent></Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <SummaryTile label="Today Revenue" value={formatAed(todayRevenue)} detail="Received today" icon={CircleDollarSign} />
        <SummaryTile label="Total Received" value={formatAed(received)} detail="Across all bookings" icon={WalletCards} />
        <SummaryTile label="Pending Payments" value={formatAed(pending)} detail="Balance outstanding" icon={WalletCards} tone="gold" />
        <SummaryTile label="Cash Pending Collection" value={formatAed(cashPending)} detail="Held by operations" icon={CircleDollarSign} tone="gold" />
        <SummaryTile label="Completed Rides" value={`${completed.length}`} detail="Closed operations" icon={CalendarCheck2} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr_0.65fr]">
        <Card><CardHeader><CardTitle>Revenue overview</CardTitle><CardDescription>Daily received amount in AED.</CardDescription></CardHeader><CardContent><RevenueChart /></CardContent></Card>
        <BreakdownCard title="Payment methods" items={paymentBreakdown} total={received} />
        <BreakdownCard title="Collection status" items={collectionBreakdown} total={received} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr_1fr]">
        <Card><CardHeader><CardTitle>Earnings by vehicle</CardTitle><CardDescription>Received revenue attributed to assigned fleet.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Rides</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader><TableBody>{earningsByVehicle.map((vehicle) => <TableRow key={vehicle.id}><TableCell><span className="font-semibold text-foreground">{vehicle.name}</span><span className="mt-1 block text-xs">{vehicle.type}</span></TableCell><TableCell>{vehicle.rides}</TableCell><TableCell><span className={cn('rounded-md px-2 py-1 text-xs font-semibold', vehicle.status === 'Available' && 'bg-emerald-50 text-emerald-700', ['Assigned', 'In Ride'].includes(vehicle.status) && 'bg-primary-50 text-primary-800', ['Damaged', 'Maintenance'].includes(vehicle.status) && 'bg-red-50 text-red-700')}>{vehicle.status}</span></TableCell><TableCell className="text-right font-semibold text-foreground">{formatAed(vehicle.earnings)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>Operations summary</CardTitle><CardDescription>Ride outcomes and current fleet.</CardDescription></CardHeader><CardContent className="flex flex-col gap-2">{(['Completed', 'Cancelled', 'No Show', 'Rescheduled'] as BookingStatus[]).map((status) => <ReportRow key={status} label={status} value={bookings.filter((booking) => booking.bookingStatus === status).length} />)}<div className="my-2 border-t border-border" />{(['Available', 'Assigned', 'In Ride', 'Damaged', 'Maintenance'] as const).map((status) => <ReportRow key={status} label={status} value={vehicles.filter((vehicle) => vehicle.status === status).length} />)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Captain / driver performance</CardTitle><CardDescription>Rides and attributed received revenue.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{teamPerformance(bookings).map((member) => <div key={member.name} className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 p-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{member.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><div><p className="text-sm font-semibold text-foreground">{member.name}</p><p className="text-xs text-muted-foreground">{member.rides} rides · {member.role}</p></div></div><p className="text-sm font-semibold text-foreground">{formatAed(member.revenue)}</p></div>)}<div className="mt-2 grid grid-cols-2 gap-3"><MiniMetric label="Avg ride" value={`${averageRideMinutes(bookings)} min`} /><MiniMetric label="Avg extra time" value={`${averageExtraMinutes(bookings)} min`} /></div></CardContent></Card>
      </div>

      <Card><CardContent className="flex items-center gap-3 p-4"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /><p className="text-sm text-muted-foreground">Collection custody is visible until Finance marks the payment <span className="font-semibold text-foreground">Verified by Finance</span>.</p></CardContent></Card>
    </div>
  );
}

function RevenueChart() {
  const max = Math.max(...revenueSeries);
  const points = revenueSeries.map((value, index) => `${(index / (revenueSeries.length - 1)) * 100},${88 - (value / max) * 72}`).join(' ');
  return <div className="h-64 w-full"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full overflow-visible text-primary" role="img" aria-label="Daily revenue line chart"><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.22" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>{[20, 40, 60, 80].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.09" strokeWidth="0.5" />)}<polygon points={`0,92 ${points} 100,92`} fill="url(#revenue-fill)" /><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg></div>;
}

function BreakdownCard({ title, items, total }: { title: string; items: Array<{ label: PaymentMethod | CollectionStatus; value: number }>; total: number }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>Received amount breakdown.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4">{items.map((item) => <div key={item.label}><div className="flex justify-between gap-3 text-xs"><span className="font-medium text-foreground">{item.label}</span><span className="text-muted-foreground">{formatAed(item.value)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${total ? Math.max((item.value / total) * 100, 4) : 0}%` }} /></div></div>)}<div className="mt-auto flex justify-between border-t border-border pt-3 text-sm"><span className="font-semibold text-muted-foreground">Total</span><span className="font-semibold text-primary">{formatAed(total)}</span></div></CardContent></Card>;
}

function ReportRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-muted/50"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-white p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-heading text-xl font-semibold text-foreground">{value}</p></div>;
}

function teamPerformance(bookings: ReturnType<typeof useOperations>['bookings']) {
  const totals = new Map<string, { name: string; role: string; rides: number; revenue: number }>();
  bookings.forEach((booking) => {
    const people = [{ name: booking.captainName, role: 'Captain' }, { name: booking.driverName, role: 'Driver' }].filter((person) => person.name);
    people.forEach((person) => {
      const current = totals.get(person.name) ?? { ...person, rides: 0, revenue: 0 };
      current.rides += 1;
      current.revenue += booking.amountReceived;
      totals.set(person.name, current);
    });
  });
  return [...totals.values()].sort((a, b) => b.revenue - a.revenue);
}

function averageRideMinutes(bookings: ReturnType<typeof useOperations>['bookings']) {
  const completed = bookings.filter((booking) => booking.rideStartTime && booking.rideEndTime);
  if (!completed.length) return 0;
  return Math.round(completed.reduce((sum, booking) => sum + (new Date(booking.rideEndTime).getTime() - new Date(booking.rideStartTime).getTime()) / 60000, 0) / completed.length);
}

function averageExtraMinutes(bookings: ReturnType<typeof useOperations>['bookings']) {
  const withExtra = bookings.filter((booking) => booking.extraTimeMinutes > 0);
  return withExtra.length ? Math.round(withExtra.reduce((sum, booking) => sum + booking.extraTimeMinutes, 0) / withExtra.length) : 0;
}
