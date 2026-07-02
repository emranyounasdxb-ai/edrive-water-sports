'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck2, CircleDollarSign, Clock3, Download, PhoneCall, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { BookingDetailPanel } from './booking-detail-panel';
import { formatAed, formatBookingDate, formatTime, type BookingStatus } from './operations-data';
import { useOperations } from './operations-store';
import { PageHeader, PaymentBadge, StatusBadge, SummaryTile } from './shared';

const filters: Array<'All' | BookingStatus> = ['All', 'New / Pending', 'Contacted', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

export function AdminBookingsPage() {
  const { bookings } = useOperations();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedBooking = bookings.find((booking) => booking.id === selectedId) ?? null;

  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    const matchesFilter = filter === 'All' || booking.bookingStatus === filter;
    const haystack = `${booking.bookingCode} ${booking.customerName} ${booking.customerPhone} ${booking.serviceType}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [bookings, filter, query]);

  const count = (status: BookingStatus) => bookings.filter((booking) => booking.bookingStatus === status).length;
  const pendingAmount = bookings.reduce((total, booking) => total + booking.amountPending, 0);

  return (
    <div className="flex flex-col gap-6" data-testid="admin-bookings-page">
      <PageHeader title="Booking operations" description="Review new website requests, contact customers, confirm schedules, and follow every manager update from one record." actions={<Button variant="outline" size="sm"><Download data-icon="inline-start" aria-hidden="true" />Export</Button>} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <SummaryTile label="New / Pending" value={`${count('New / Pending')}`} detail="Awaiting review" icon={Clock3} />
        <SummaryTile label="Contacted" value={`${count('Contacted')}`} detail="Follow-up active" icon={PhoneCall} />
        <SummaryTile label="Confirmed" value={`${count('Confirmed')}`} detail="Sent to operations" icon={CalendarCheck2} />
        <SummaryTile label="In Progress" value={`${count('In Progress')}`} detail="Live rides" icon={CalendarCheck2} />
        <SummaryTile label="Pending Payment" value={formatAed(pendingAmount)} detail="Across open bookings" icon={CircleDollarSign} tone="gold" />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>All bookings</CardTitle>
            <CardDescription>Click a booking to contact, confirm, reschedule, cancel, or review operational details.</CardDescription>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <Button key={item} type="button" size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)}>
                {item}<span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">{item === 'All' ? bookings.length : count(item)}</span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex max-w-md items-center gap-2 rounded-md border border-input bg-white px-3 shadow-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking, customer, or phone" className="border-0 px-0 shadow-none focus-visible:ring-0" />
          </div>

          {filteredBookings.length ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Booking</TableHead><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Schedule</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id} className={cn(selectedId === booking.id && 'bg-primary-50')}>
                        <TableCell className="font-semibold text-foreground">{booking.bookingCode}<span className="mt-1 block text-xs font-normal text-muted-foreground">{booking.source}</span></TableCell>
                        <TableCell><span className="font-medium text-foreground">{booking.customerName}</span><span className="mt-1 block text-xs">{booking.customerPhone}</span></TableCell>
                        <TableCell><span className="text-foreground">{booking.serviceType}</span><span className="mt-1 block text-xs">{booking.durationMinutes} min · {booking.guestCount} guests</span></TableCell>
                        <TableCell><span className="text-foreground">{formatBookingDate(booking.preferredDate)}</span><span className="mt-1 block text-xs">{formatTime(booking.preferredTime)}</span></TableCell>
                        <TableCell><StatusBadge status={booking.bookingStatus} /></TableCell>
                        <TableCell><PaymentBadge status={booking.paymentStatus} /><span className="mt-1 block text-xs">{booking.collectionStatus}</span></TableCell>
                        <TableCell className="font-semibold text-foreground">{formatAed(booking.finalAmount)}<span className="mt-1 block text-xs font-normal text-gold-deep">{formatAed(booking.amountPending)} due</span></TableCell>
                        <TableCell className="text-right"><Button type="button" variant="outline" size="sm" data-testid={`open-admin-${booking.bookingCode}`} onClick={() => setSelectedId(booking.id)}>Open</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 md:hidden">
                {filteredBookings.map((booking) => (
                  <button key={booking.id} type="button" onClick={() => setSelectedId(booking.id)} className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition hover:border-primary/40">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-primary">{booking.bookingCode}</p><p className="mt-1 font-semibold text-foreground">{booking.customerName}</p></div><StatusBadge status={booking.bookingStatus} /></div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground"><span>{booking.serviceType} · {booking.durationMinutes} min</span><span className="text-right">{formatAed(booking.finalAmount)}</span><span>{formatBookingDate(booking.preferredDate)}</span><span className="text-right">{formatTime(booking.preferredTime)}</span></div>
                    <div className="mt-4 flex items-center justify-between"><PaymentBadge status={booking.paymentStatus} /><span className="text-xs font-medium text-gold-deep">{formatAed(booking.amountPending)} due</span></div>
                  </button>
                ))}
              </div>
            </>
          ) : <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center"><p className="font-semibold text-foreground">No bookings found</p><p className="mt-1 text-sm text-muted-foreground">Try another status or search term.</p></div>}
        </CardContent>
      </Card>

      <BookingDetailPanel booking={selectedBooking} mode="admin" onClose={() => setSelectedId(null)} />
    </div>
  );
}
