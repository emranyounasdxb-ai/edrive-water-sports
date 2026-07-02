'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck2, CircleDollarSign, CirclePlay, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookingDetailPanel } from './booking-detail-panel';
import { formatAed, formatTime, type BookingStatus } from './operations-data';
import { isManagerVisible, useOperations } from './operations-store';
import { CollectionBadge, PageHeader, PaymentBadge, StatusBadge, SummaryTile } from './shared';

const managerFilters: Array<'All' | BookingStatus> = ['All', 'Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show'];

export function ManagerOperationsPage() {
  const { bookings, vehicles } = useOperations();
  const [filter, setFilter] = useState<(typeof managerFilters)[number]>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const managerBookings = bookings.filter((booking) => isManagerVisible(booking.bookingStatus));
  const selectedBooking = bookings.find((booking) => booking.id === selectedId) ?? null;

  const visible = useMemo(() => managerBookings.filter((booking) => {
    const matchesFilter = filter === 'All' || booking.bookingStatus === filter;
    return matchesFilter && `${booking.bookingCode} ${booking.customerName} ${booking.assignedVehicleName ?? ''}`.toLowerCase().includes(query.toLowerCase());
  }), [managerBookings, filter, query]);

  const count = (status: BookingStatus) => managerBookings.filter((booking) => booking.bookingStatus === status).length;
  const issues = vehicles.filter((vehicle) => ['Damaged', 'Maintenance', 'Out of Service'].includes(vehicle.status));
  const pendingPaymentCount = managerBookings.filter((booking) => booking.amountPending > 0).length;

  return (
    <div className="flex flex-col gap-6" data-testid="manager-operations-page">
      <PageHeader title="Manager dashboard" description="Run confirmed bookings through assignment, ride, payment, collection, and completion from one operational queue." actions={<Button variant="outline" size="sm"><Download data-icon="inline-start" aria-hidden="true" />Export shift</Button>} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <SummaryTile label="Today's Confirmed" value={`${count('Confirmed')}`} detail="Waiting for assignment" icon={CalendarCheck2} />
        <SummaryTile label="Ready" value={`${count('Ready')}`} detail="Prepared to depart" icon={CalendarCheck2} />
        <SummaryTile label="In Progress" value={`${count('In Progress')}`} detail="Rides underway" icon={CirclePlay} />
        <SummaryTile label="Pending Payments" value={`${pendingPaymentCount}`} detail="Need collection update" icon={CircleDollarSign} tone="gold" />
        <SummaryTile label="Vehicle Issues" value={`${issues.length}`} detail="Damage or maintenance" icon={AlertTriangle} tone="red" />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div><CardTitle>Confirmed operations queue</CardTitle><CardDescription>Only admin-confirmed bookings enter this workspace. Open a row to update all operational fields.</CardDescription></div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {managerFilters.map((item) => <Button key={item} type="button" size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)}>{item}<span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">{item === 'All' ? managerBookings.length : count(item)}</span></Button>)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex max-w-md items-center gap-2 rounded-md border border-input bg-white px-3 shadow-sm"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search confirmed bookings" className="border-0 px-0 shadow-none focus-visible:ring-0" /></div>
          {visible.length ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Booking</TableHead><TableHead>Customer</TableHead><TableHead>Activity / vehicle</TableHead><TableHead>Captain / driver</TableHead><TableHead>Time</TableHead><TableHead>Payment</TableHead><TableHead>Collection</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>{visible.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-semibold text-foreground">{booking.bookingCode}</TableCell>
                      <TableCell><span className="font-medium text-foreground">{booking.customerName}</span><span className="mt-1 block text-xs">{booking.customerPhone}</span></TableCell>
                      <TableCell><span className="text-foreground">{booking.serviceType}</span><span className="mt-1 block text-xs">{booking.assignedVehicleName ?? 'Unassigned'}</span></TableCell>
                      <TableCell><span className="text-foreground">{booking.captainName || booking.driverName || 'Not assigned'}</span><span className="mt-1 block text-xs">{booking.assignedManagerName ?? 'Manager unassigned'}</span></TableCell>
                      <TableCell><span className="text-foreground">{formatTime(booking.preferredTime)}</span><span className="mt-1 block text-xs">{booking.durationMinutes} min</span></TableCell>
                      <TableCell><PaymentBadge status={booking.paymentStatus} /><span className="mt-1 block text-xs">{formatAed(booking.amountPending)} due</span></TableCell>
                      <TableCell><CollectionBadge status={booking.collectionStatus} /></TableCell>
                      <TableCell><StatusBadge status={booking.bookingStatus} /></TableCell>
                      <TableCell className="text-right"><Button type="button" size="sm" variant="outline" data-testid={`open-manager-${booking.bookingCode}`} onClick={() => setSelectedId(booking.id)}>Update</Button></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
              <div className="grid gap-3 md:hidden">{visible.map((booking) => (
                <button key={booking.id} type="button" onClick={() => setSelectedId(booking.id)} className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-primary">{booking.bookingCode}</p><p className="mt-1 font-semibold text-foreground">{booking.customerName}</p></div><StatusBadge status={booking.bookingStatus} /></div>
                  <p className="mt-3 text-sm text-muted-foreground">{booking.serviceType} · {booking.assignedVehicleName ?? 'Vehicle not assigned'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2"><PaymentBadge status={booking.paymentStatus} /><CollectionBadge status={booking.collectionStatus} /></div>
                </button>
              ))}</div>
            </>
          ) : <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center"><p className="font-semibold text-foreground">No operational bookings found</p><p className="mt-1 text-sm text-muted-foreground">Try another status or search term.</p></div>}
        </CardContent>
      </Card>

      {issues.length ? <Card><CardHeader><CardTitle>Vehicle issues</CardTitle><CardDescription>Damage and maintenance records requiring action.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{issues.map((vehicle) => <div key={vehicle.id} className="flex items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50/60 p-4"><div><p className="font-semibold text-foreground">{vehicle.name}</p><p className="mt-1 text-sm text-muted-foreground">{vehicle.notes}</p></div><span className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700">{vehicle.status}</span></div>)}</CardContent></Card> : null}

      <BookingDetailPanel booking={selectedBooking} mode="manager" onClose={() => setSelectedId(null)} />
    </div>
  );
}
