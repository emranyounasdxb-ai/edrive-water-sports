'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarCheck2, CircleDollarSign, CirclePlay, Clock3, WalletCards, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAed, formatTime } from './operations-data';
import { useOperations } from './operations-store';
import { CollectionBadge, PageHeader, PaymentBadge, StatusBadge, SummaryTile } from './shared';

export function AdminDashboardPage() {
  const { bookings, vehicles } = useOperations();
  const today = '2026-07-02';
  const todayBookings = bookings.filter((booking) => booking.preferredDate === today);
  const newToday = todayBookings.filter((booking) => booking.bookingStatus === 'New / Pending').length;
  const confirmed = bookings.filter((booking) => booking.bookingStatus === 'Confirmed').length;
  const inProgress = bookings.filter((booking) => booking.bookingStatus === 'In Progress').length;
  const completedToday = todayBookings.filter((booking) => booking.bookingStatus === 'Completed').length;
  const exceptions = bookings.filter((booking) => ['Cancelled', 'No Show'].includes(booking.bookingStatus)).length;
  const revenueToday = todayBookings.reduce((sum, booking) => sum + booking.amountReceived, 0);
  const pending = bookings.reduce((sum, booking) => sum + booking.amountPending, 0);
  const cashPending = bookings.filter((booking) => ['With Manager', 'With Captain', 'With Driver'].includes(booking.collectionStatus)).reduce((sum, booking) => sum + booking.amountReceived, 0);
  const maintenance = vehicles.filter((vehicle) => ['Maintenance', 'Damaged'].includes(vehicle.status)).length;

  return (
    <div className="flex flex-col gap-6" data-testid="admin-dashboard-page">
      <PageHeader title="Operations command center" description="Live booking, payment, collection, and fleet priorities for today." actions={<Button asChild size="sm"><Link href="/admin/bookings">Review new bookings</Link></Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <SummaryTile label="New Bookings Today" value={`${newToday}`} detail="Awaiting admin call" icon={Clock3} />
        <SummaryTile label="Confirmed Bookings" value={`${confirmed}`} detail="Ready for operations" icon={CalendarCheck2} />
        <SummaryTile label="In-progress Rides" value={`${inProgress}`} detail="Live fleet activity" icon={CirclePlay} />
        <SummaryTile label="Completed Today" value={`${completedToday}`} detail="Closed rides" icon={CalendarCheck2} />
        <SummaryTile label="Cancelled / No-show" value={`${exceptions}`} detail="Needs follow-up" icon={AlertTriangle} tone="red" />
        <SummaryTile label="Revenue Today" value={formatAed(revenueToday)} detail="Amount received" icon={CircleDollarSign} />
        <SummaryTile label="Pending Payments" value={formatAed(pending)} detail="Outstanding balance" icon={WalletCards} tone="gold" />
        <SummaryTile label="Cash Pending Collection" value={formatAed(cashPending)} detail="With operations staff" icon={WalletCards} tone="gold" />
        <SummaryTile label="Vehicles in Maintenance" value={`${maintenance}`} detail="Damage or service" icon={Wrench} tone={maintenance ? 'red' : 'aqua'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Operational queue</CardTitle><CardDescription>Latest bookings and manager updates.</CardDescription></div><Button asChild variant="outline" size="sm"><Link href="/admin/manager">Open operations</Link></Button></CardHeader><CardContent className="flex flex-col gap-2">{bookings.slice(0, 6).map((booking) => <div key={booking.id} className="grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-xs font-semibold text-primary">{booking.bookingCode}</p><p className="mt-1 font-semibold text-foreground">{booking.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{booking.serviceType} · {formatTime(booking.preferredTime)} · {booking.assignedVehicleName ?? 'Unassigned'}</p></div><div className="flex flex-wrap gap-2"><StatusBadge status={booking.bookingStatus} /><PaymentBadge status={booking.paymentStatus} /></div><p className="text-sm font-semibold text-foreground sm:text-right">{formatAed(booking.amountReceived)}<span className="block text-xs font-normal text-gold-deep">{formatAed(booking.amountPending)} due</span></p></div>)}</CardContent></Card>
        <div className="flex flex-col gap-5">
          <Card><CardHeader><CardTitle>Collection custody</CardTitle><CardDescription>Where received money is currently held.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{bookings.filter((booking) => booking.amountReceived > 0).map((booking) => <div key={booking.id} className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-foreground">{booking.bookingCode}</p><p className="text-xs text-muted-foreground">{booking.paymentCollectedBy || 'Not assigned'}</p></div><div className="text-right"><p className="text-sm font-semibold text-foreground">{formatAed(booking.amountReceived)}</p><CollectionBadge status={booking.collectionStatus} /></div></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Fleet attention</CardTitle><CardDescription>Vehicles that need operational action.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{vehicles.filter((vehicle) => vehicle.status !== 'Available').map((vehicle) => <div key={vehicle.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/50 p-3"><div><p className="text-sm font-semibold text-foreground">{vehicle.name}</p><p className="mt-1 text-xs text-muted-foreground">{vehicle.notes}</p></div><span className="rounded-md border border-border bg-white px-2 py-1 text-xs font-semibold text-foreground">{vehicle.status}</span></div>)}</CardContent></Card>
        </div>
      </div>
    </div>
  );
}
