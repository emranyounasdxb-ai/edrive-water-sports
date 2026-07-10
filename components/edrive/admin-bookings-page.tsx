'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, ClipboardCheck, Eye, MessageCircle, RefreshCw, Save, Search, WalletCards, X } from 'lucide-react';
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
  booking_number?: string | null;
  status: string | null;
  admin_status: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  selected_package_capacity?: number | null;
  experience_type: string | null;
  service_type: string | null;
  duration_minutes?: number | null;
  vehicle_quantity?: number | null;
  guest_count?: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_notes?: string | null;
  total_amount: number | string | null;
  payment_status: string | null;
  payment_method?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  collection_status?: string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
  confirmed_at?: string | null;
  internal_note?: string | null;
  created_at: string | null;
  updated_at?: string | null;
};

type ManagerOption = { name: string; email: string };
type BookingFilter = 'all' | 'new' | 'pending' | 'confirmed' | 'b2b' | 'direct' | 'unassigned';
type ManageValues = { status: string; assignedManagerName: string; internalNote: string };

const bookingStatusOptions = ['Pending', 'Confirmed', 'Cancelled'];

function asNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function displayText(value: string | null | undefined, fallback = '-') {
  return String(value || '').trim() || fallback;
}

function isActiveStatus(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase() === 'active';
}

function niceDate(value: string | null) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function prettyKey(value: string | null | undefined) {
  return displayText(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string | null | undefined) {
  if (status === 'Confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'No Show' || status === 'Cancelled') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'Completed') return 'bg-primary-50 text-primary-900 border-primary/20';
  if (status === 'In Progress') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-gold/10 text-gold border-gold/35';
}

function packageFromNotes(notes?: string | null) {
  const value = String(notes || '');
  const marker = 'Selected vehicle:';
  const start = value.indexOf(marker);
  if (start < 0) return '';
  const after = value.slice(start + marker.length).trim();
  const bracket = after.indexOf('(');
  const dot = after.indexOf('.');
  const end = bracket >= 0 ? bracket : dot >= 0 ? dot : after.length;
  return after.slice(0, end).trim();
}

function packageLabel(booking: BookingRow) {
  return booking.selected_package_name || packageFromNotes(booking.customer_notes) || booking.selected_package_category || booking.experience_type || '-';
}

function serviceDetail(booking: BookingRow) {
  const parts = [booking.service_type || 'website'];
  if (booking.selected_package_capacity) parts.push(`${booking.selected_package_capacity} seater`);
  if (booking.duration_minutes) parts.push(`${booking.duration_minutes} min`);
  return parts.join(' · ');
}

function bookingTotal(booking: BookingRow) {
  return asNumber(booking.total_amount);
}

function bookingPending(booking: BookingRow) {
  const pending = asNumber(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(bookingTotal(booking) - asNumber(booking.amount_received_aed), 0);
}

function bookingReceived(booking: BookingRow) {
  const received = asNumber(booking.amount_received_aed);
  if (received > 0) return received;
  return Math.max(bookingTotal(booking) - bookingPending(booking), 0);
}

function paymentTypeLabel(booking: BookingRow) {
  return booking.payment_source === 'b2b' || booking.b2b_agent_name ? 'B2B' : 'Direct Sale';
}

function isB2BBooking(booking: BookingRow) {
  return paymentTypeLabel(booking) === 'B2B';
}

function whatsappPhone(value: string | null) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  return digits;
}

function whatsAppHref(booking: BookingRow) {
  const phone = whatsappPhone(booking.customer_phone);
  if (!phone) return '';
  const customerName = booking.customer_name || 'there';
  const packageName = packageLabel(booking);
  const dateText = niceDate(booking.preferred_date);
  const timeText = booking.preferred_time || 'your selected time';
  const message = encodeURIComponent(`Hello ${customerName}, this is eDrive Water Sports. We would like to confirm your ${packageName} booking for ${dateText} at ${timeText}. Please reply to confirm your availability. Thank you.`);
  return `https://web.whatsapp.com/send?phone=${phone}&text=${message}&app_absent=0`;
}

function adminStatusForBookingStatus(status: string, fallback: string | null | undefined) {
  if (status === 'Confirmed') return 'Confirmed';
  if (status === 'Cancelled') return 'Closed';
  return fallback || 'New';
}

function managerStatusForBookingStatus(status: string, fallback: string | null | undefined) {
  if (status === 'Cancelled') return 'Cancelled';
  if (status === 'Confirmed') return fallback && fallback !== 'Assigned' ? fallback : 'Pending';
  return fallback && fallback !== 'Assigned' ? fallback : 'Pending';
}

function managerStageLabel(booking: BookingRow) {
  const stage = displayText(booking.manager_status, 'Pending');
  return stage === 'Assigned' ? 'Pending' : stage;
}

function isAdminLocked(booking: BookingRow) {
  const status = displayText(booking.status, 'Pending');
  const stage = managerStageLabel(booking);
  const hasManager = Boolean(displayText(booking.assigned_manager_name, ''));
  if (['Completed', 'No Show', 'Cancelled'].includes(status)) return true;
  if (['In Progress', 'Completed', 'No Show'].includes(stage)) return true;
  return status === 'Confirmed' && hasManager;
}

export function AdminBookingsLivePage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<BookingFilter>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);

  async function loadManagers() {
    const { data } = await supabase.from('admin_users').select('full_name,email,role,status').order('full_name', { ascending: true }).limit(100);
    const rows = ((data || []) as Array<{ full_name: string | null; email: string | null; role: string | null; status: string | null }>);
    const activeManagers = rows
      .filter((item) => String(item.role || '').trim().toLowerCase() === 'manager' && isActiveStatus(item.status))
      .map((item) => ({ name: item.full_name || item.email || 'Manager', email: item.email || '' }));
    setManagers(activeManagers);
  }

  async function loadBookings() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(200);
    if (queryError) {
      setError(queryError.message);
      setBookings([]);
    } else {
      setBookings((data || []) as BookingRow[]);
    }
    setLoading(false);
  }

  async function refreshAll() {
    await Promise.all([loadBookings(), loadManagers()]);
  }

  async function saveBookingStatus(booking: BookingRow, values: ManageValues) {
    if (isAdminLocked(booking)) throw new Error('This booking is already with the manager and is read-only for admin.');
    const assignedManagerName = values.assignedManagerName.trim();
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      status: values.status,
      admin_status: adminStatusForBookingStatus(values.status, booking.admin_status),
      manager_status: managerStatusForBookingStatus(values.status, booking.manager_status),
      assigned_manager_name: assignedManagerName || null,
      internal_note: values.internalNote.trim() || null,
      updated_at: now
    };
    if (values.status === 'Confirmed' && !booking.confirmed_at) payload.confirmed_at = now;
    const queryBuilder = supabase.from(bookingRequestsTable).update(payload);
    const result = booking.id ? await queryBuilder.eq('id', booking.id) : await queryBuilder.eq('booking_code', booking.booking_code);
    if (result.error) throw new Error(result.error.message);
    await refreshAll();
    setSelectedBooking(null);
  }

  useEffect(() => { void refreshAll(); }, []);

  const stats = useMemo(() => {
    const newCount = bookings.filter((booking) => (booking.admin_status || 'New') === 'New').length;
    const confirmedCount = bookings.filter((booking) => booking.status === 'Confirmed').length;
    const pendingPayment = bookings.reduce((sum, booking) => sum + bookingPending(booking), 0);
    const b2bPending = bookings.filter((booking) => isB2BBooking(booking) && bookingPending(booking) > 0).length;
    return { newCount, confirmedCount, pendingPayment, b2bPending };
  }, [bookings]);

  const filterOptions = useMemo(() => [
    { id: 'all' as const, label: 'All', count: bookings.length },
    { id: 'new' as const, label: 'New', count: stats.newCount },
    { id: 'pending' as const, label: 'Pending', count: bookings.filter((booking) => (booking.status || 'Pending') === 'Pending').length },
    { id: 'confirmed' as const, label: 'Confirmed', count: stats.confirmedCount },
    { id: 'b2b' as const, label: 'B2B', count: bookings.filter(isB2BBooking).length },
    { id: 'direct' as const, label: 'Direct Sale', count: bookings.filter((booking) => !isB2BBooking(booking)).length },
    { id: 'unassigned' as const, label: 'Unassigned', count: bookings.filter((booking) => !booking.assigned_manager_name).length }
  ], [bookings, stats.confirmedCount, stats.newCount]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch = !term || [booking.booking_code, booking.booking_number, booking.customer_name, booking.customer_phone, booking.customer_email, packageLabel(booking), booking.status, booking.manager_status, booking.assigned_manager_name, paymentTypeLabel(booking)].some((value) => String(value || '').toLowerCase().includes(term));
      if (!matchesSearch) return false;
      if (activeFilter === 'new') return (booking.admin_status || 'New') === 'New';
      if (activeFilter === 'pending') return (booking.status || 'Pending') === 'Pending';
      if (activeFilter === 'confirmed') return booking.status === 'Confirmed';
      if (activeFilter === 'b2b') return isB2BBooking(booking);
      if (activeFilter === 'direct') return !isB2BBooking(booking);
      if (activeFilter === 'unassigned') return !booking.assigned_manager_name;
      return true;
    });
  }, [activeFilter, bookings, query]);

  return (
    <section className="w-full py-4 sm:py-6">
      <div className="w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Bookings</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Booking requests</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Confirm new requests and assign a manager. Assigned rides become read-only for admin.</p>
          </div>
          <Button type="button" onClick={refreshAll} variant="outline" className="w-fit rounded-full bg-white"><RefreshCw data-icon aria-hidden="true" />Refresh</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric title="New Requests" value={String(stats.newCount)} icon={CalendarDays} />
          <Metric title="Confirmed" value={String(stats.confirmedCount)} icon={ClipboardCheck} />
          <Metric title="Pending Collection" value={formatAed(stats.pendingPayment)} icon={WalletCards} />
          <Metric title="B2B Pending" value={String(stats.b2bPending)} icon={WalletCards} />
        </div>

        <Card className="mt-6 overflow-hidden rounded-[1.5rem] border-border/80 bg-white shadow-[0_18px_45px_rgba(8,37,50,0.06)]">
          <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="font-heading text-xl font-semibold">Booking list</CardTitle>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Showing {filtered.length} of {bookings.length} records</p>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking, customer, manager..." className="h-10 rounded-full bg-white pl-9" />
            </div>
          </CardHeader>

          <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">
            {filterOptions.map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${activeFilter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>
                {item.label} <span className={activeFilter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span>
              </button>
            ))}
          </div>

          <CardContent className="p-0">
            {error ? <p className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <div className="overflow-x-auto">
              <Table className="min-w-[1260px]">
                <TableHeader>
                  <TableRow className="bg-[#F7FAFA]">
                    <TableHead className="w-[170px] whitespace-nowrap">Booking</TableHead>
                    <TableHead className="w-[190px] whitespace-nowrap">Customer</TableHead>
                    <TableHead className="w-[230px] whitespace-nowrap">Package</TableHead>
                    <TableHead className="w-[150px] whitespace-nowrap">Schedule</TableHead>
                    <TableHead className="w-[150px] whitespace-nowrap">Amount</TableHead>
                    <TableHead className="w-[150px] whitespace-nowrap">Type</TableHead>
                    <TableHead className="w-[130px] whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-[170px] whitespace-nowrap">Manager</TableHead>
                    <TableHead className="w-[110px] whitespace-nowrap text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Loading bookings...</TableCell></TableRow> : null}
                  {!loading && filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No booking requests found.</TableCell></TableRow> : null}
                  {filtered.map((booking, index) => {
                    const locked = isAdminLocked(booking);
                    return (
                      <TableRow key={booking.id || `${booking.booking_code}-${index}`} className="align-top hover:bg-[#F7FAFA]">
                        <TableCell className="whitespace-nowrap py-4">
                          <div className="font-mono text-[13px] font-bold text-primary-900">{booking.booking_code}</div>
                          {booking.booking_number && booking.booking_number !== booking.booking_code ? <div className="text-xs text-muted-foreground">{booking.booking_number}</div> : null}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="whitespace-nowrap font-semibold text-foreground">{booking.customer_name || '-'}</div>
                          <div className="whitespace-nowrap text-xs text-muted-foreground">{booking.customer_phone || booking.customer_email || '-'}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold text-foreground">{packageLabel(booking)}</div>
                          <div className="text-xs text-muted-foreground">{serviceDetail(booking)}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4">
                          <div className="font-semibold text-foreground">{niceDate(booking.preferred_date)}</div>
                          <div className="text-xs text-muted-foreground">{booking.preferred_time || '-'}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4">
                          <div className="font-semibold text-foreground">{formatAed(bookingTotal(booking))}</div>
                          <div className="text-xs font-semibold text-muted-foreground">Pending {formatAed(bookingPending(booking))}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${isB2BBooking(booking) ? 'border-primary/25 bg-primary-50 text-primary' : 'border-border bg-[#F4F7F8] text-muted-foreground'}`}>{paymentTypeLabel(booking)}</span>
                          <div className="mt-1 max-w-[135px] truncate text-xs text-muted-foreground">{booking.b2b_agent_name || prettyKey(booking.payment_source || 'direct')}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status || 'Pending'}</span></TableCell>
                        <TableCell className="py-4">
                          <div className="whitespace-nowrap font-semibold text-foreground">{booking.assigned_manager_name || 'Unassigned'}</div>
                          <div className="whitespace-nowrap text-xs text-muted-foreground">{managerStageLabel(booking)}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4 text-right"><Button type="button" size="sm" variant="outline" className="rounded-full bg-white" onClick={() => setSelectedBooking(booking)}>{locked ? <Eye className="size-3.5" aria-hidden="true" /> : null}{locked ? 'View' : 'Manage'}</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {selectedBooking ? <ManageBookingModal booking={selectedBooking} managers={managers} onClose={() => setSelectedBooking(null)} onSave={saveBookingStatus} /> : null}
    </section>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) {
  return <Card className="rounded-[1.35rem] bg-white shadow-[0_12px_32px_rgba(8,37,50,0.06)]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}

function ManageBookingModal({ booking, managers, onClose, onSave }: { booking: BookingRow; managers: ManagerOption[]; onClose: () => void; onSave: (booking: BookingRow, values: ManageValues) => Promise<void> }) {
  const locked = isAdminLocked(booking);
  const total = bookingTotal(booking);
  const [values, setValues] = useState<ManageValues>({ status: booking.status || 'Pending', assignedManagerName: booking.assigned_manager_name || '', internalNote: booking.internal_note || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const whatsapp = whatsAppHref(booking);
  const sourceLabel = paymentTypeLabel(booking);
  const managerOptions = Array.from(new Set([values.assignedManagerName, ...managers.map((manager) => manager.name)].filter(Boolean)));

  async function submit() {
    setSaving(true);
    setError('');
    try {
      await onSave(booking, values);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update booking.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-3 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-[1.35rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-3">
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{locked ? 'View Booking' : 'Manage Booking'}</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="font-heading text-lg font-semibold text-foreground">{booking.booking_code}</h2><span className="rounded-full border border-primary/20 bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{sourceLabel}</span>{booking.b2b_agent_name ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gold">{booking.b2b_agent_name}</span> : null}</div></div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button>
        </div>

        <div className="max-h-[calc(85vh-8.7rem)] overflow-y-auto p-4">
          {error ? <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {locked ? <p className="mb-3 rounded-xl border border-primary/15 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-900">This booking is already with manager. Admin can view status and payment details only.</p> : null}
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.15rem] border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-heading text-base font-semibold text-foreground">Booking Summary</h3><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status || 'Pending'}</span></div>
              <div className="grid gap-1.5">
                <InfoLine label="Customer" value={booking.customer_name || '-'} />
                <InfoLine label="Phone" value={booking.customer_phone || '-'} />
                <InfoLine label="Email" value={booking.customer_email || '-'} />
                <InfoLine label="Package" value={packageLabel(booking)} />
                <InfoLine label="Date / Time" value={`${niceDate(booking.preferred_date)} · ${booking.preferred_time || '-'}`} />
                <InfoLine label="Party" value={`${booking.vehicle_quantity || 1} vehicle · ${booking.guest_count || booking.selected_package_capacity || 1} guests`} />
                <InfoLine label="Assigned Manager" value={booking.assigned_manager_name || 'Not assigned'} />
                <InfoLine label="Assigned Vehicle" value={booking.assigned_vehicle_name || 'Not assigned'} />
                <InfoLine label="Customer / Agent Note" value={booking.customer_notes || 'No note added.'} />
              </div>
            </div>

            <div className="rounded-[1.15rem] border border-border bg-[#F8FBFB] p-4">
              {locked ? (
                <div className="grid gap-1.5">
                  <InfoLine label="Booking Status" value={booking.status || 'Pending'} />
                  <InfoLine label="Manager Stage" value={managerStageLabel(booking)} />
                  <InfoLine label="Payment Status" value={booking.payment_status || 'Not Paid'} />
                  <InfoLine label="Payment Method" value={booking.payment_method || (isB2BBooking(booking) ? 'B2B Invoice' : '-')} />
                  <InfoLine label="Received" value={formatAed(bookingReceived(booking))} />
                  <InfoLine label="Pending" value={formatAed(bookingPending(booking))} />
                  <InfoLine label="Collection" value={prettyKey(booking.collection_status || 'Pending')} />
                  <div className="mt-2 rounded-xl border border-border bg-white px-3 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Internal Note</p><p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-foreground">{booking.internal_note || 'No internal note.'}</p></div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-semibold text-foreground">Booking Status<select value={values.status} onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10">{bookingStatusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="grid gap-1.5 text-sm font-semibold text-foreground">Assigned Manager<select value={values.assignedManagerName} onChange={(event) => setValues((current) => ({ ...current, assignedManagerName: event.target.value }))} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"><option value="">Select manager</option>{managerOptions.map((manager) => <option key={manager} value={manager}>{manager}</option>)}</select></label>
                    <div className="sm:col-span-2">
                      <p className="mb-2 text-sm font-semibold text-foreground">Booking Type / Amount</p>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-white p-2">
                        <div className="rounded-xl bg-[#F7FAFA] px-3 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Type</p><p className="mt-2 text-sm font-bold text-foreground">{sourceLabel}</p></div>
                        <div className="rounded-xl bg-primary-50 px-3 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Amount</p><p className="mt-2 text-sm font-bold text-foreground">{formatAed(total)}</p></div>
                      </div>
                    </div>
                  </div>
                  <label className="mt-4 grid gap-1.5 text-sm font-semibold text-foreground">Internal Note<textarea value={values.internalNote} onChange={(event) => setValues((current) => ({ ...current, internalNote: event.target.value }))} className="min-h-32 rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" /></label>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-border/70 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 rounded-xl border border-primary/15 bg-primary-50 px-3 py-2 text-xs font-semibold text-foreground"><span>Total: {formatAed(total)}</span><span>·</span><span>Type: {sourceLabel}</span><span>·</span><span>Pending: {formatAed(bookingPending(booking))}</span></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {whatsapp ? <Button asChild className="rounded-full bg-[#25D366] text-white hover:bg-[#1FB85A]"><a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp Customer</a></Button> : null}
            {locked ? <Button type="button" variant="outline" onClick={onClose} className="rounded-full bg-white">Close</Button> : <Button type="button" onClick={submit} disabled={saving} className="rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save Changes'}</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-primary-900/55 bg-[#F7FAFA] px-3 py-2"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span><span className="text-right text-sm font-bold text-foreground">{value}</span></div>;
}
