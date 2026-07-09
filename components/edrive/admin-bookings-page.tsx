'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardCheck, FileClock, MessageCircle, RefreshCw, Save, Search, WalletCards, X } from 'lucide-react';
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
  meeting_point_name?: string | null;
  meeting_point_address?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_hotel_or_area?: string | null;
  customer_notes?: string | null;
  subtotal?: number | string | null;
  vat_amount?: number | string | null;
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
  customer_arrived?: boolean | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  admin_payment_received_at?: string | null;
  manager_note?: string | null;
  internal_note?: string | null;
  created_at: string | null;
  updated_at?: string | null;
};

type DebugState = {
  projectHost: string;
  table: string;
  count: number | null;
  receivedRows: number;
  lastError: string;
  lastLoadedAt: string;
};

type ManageValues = {
  status: string;
  adminStatus: string;
  managerStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentSource: string;
  paymentWorkflowStatus: string;
  collectionStatus: string;
  amountReceivedAed: string;
  assignedManagerName: string;
  assignedVehicleName: string;
  b2bAgentName: string;
  customerArrived: boolean;
  managerNote: string;
  internalNote: string;
};

const bookingStatusOptions = ['Pending', 'Confirmed', 'Cancelled', 'No Show', 'Completed'];
const adminStatusOptions = ['New', 'Reviewed', 'Contacted', 'Confirmed', 'Closed'];
const managerStatusOptions = ['Pending', 'Assigned', 'Guest Received', 'In Progress', 'Completed'];
const paymentStatusOptions = ['Not Paid', 'Partial', 'Paid', 'Refunded'];
const paymentMethodOptions = ['', 'Cash', 'Card', 'Bank Transfer', 'Online Link', 'B2B Invoice'];
const paymentSourceOptions = ['direct', 'b2b'];
const paymentWorkflowOptions = ['unpaid', 'partial_paid', 'paid_to_manager', 'pending_from_b2b_agent', 'received_by_admin', 'settled', 'refunded'];
const collectionStatusOptions = ['pending_collection', 'with_manager', 'with_b2b_agent', 'with_admin', 'settled'];

const supabaseProjectHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host || 'missing-url';
  } catch {
    return 'invalid-url';
  }
})();

function asNumber(value: unknown) {
  return Number(value || 0);
}

function displayText(value: string | null | undefined, fallback = '-') {
  return String(value || '').trim() || fallback;
}

function niceDate(value: string | null) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function niceCreatedAt(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function prettyKey(value: string | null | undefined) {
  return displayText(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string | null) {
  if (status === 'Confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Cancelled') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'Completed') return 'bg-primary-50 text-primary-900 border-primary/20';
  if (status === 'No Show') return 'bg-red-50 text-red-700 border-red-200';
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
  const total = bookingTotal(booking);
  const received = asNumber(booking.amount_received_aed);
  return Math.max(total - received, 0);
}

function whatsAppHref(booking: BookingRow) {
  const digits = String(booking.customer_phone || '').replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';
  const message = encodeURIComponent(`Hello ${booking.customer_name || ''}, this is eDrive Water Sports regarding your booking ${booking.booking_code}.`);
  return `https://wa.me/${digits}?text=${message}`;
}

function defaultWorkflowStatus(values: ManageValues) {
  const received = asNumber(values.amountReceivedAed);
  if (values.paymentStatus === 'Refunded') return 'refunded';
  if (values.paymentSource === 'b2b') return 'pending_from_b2b_agent';
  if (values.collectionStatus === 'settled') return 'settled';
  if (values.collectionStatus === 'with_admin') return 'received_by_admin';
  if (values.paymentStatus === 'Paid') return 'paid_to_manager';
  if (received > 0) return 'partial_paid';
  return 'unpaid';
}

export function AdminBookingsLivePage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
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

  async function saveBookingStatus(booking: BookingRow, values: ManageValues) {
    const total = bookingTotal(booking);
    const amountReceived = Math.max(asNumber(values.amountReceivedAed), 0);
    const amountPending = Math.max(total - amountReceived, 0);
    const workflowStatus = values.paymentWorkflowStatus || defaultWorkflowStatus(values);
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      status: values.status,
      admin_status: values.adminStatus,
      manager_status: values.managerStatus,
      payment_status: values.paymentStatus,
      payment_method: values.paymentMethod || null,
      payment_source: values.paymentSource,
      payment_workflow_status: workflowStatus,
      collection_status: values.collectionStatus,
      amount_received_aed: amountReceived,
      amount_pending_aed: amountPending,
      assigned_manager_name: values.assignedManagerName.trim() || null,
      assigned_vehicle_name: values.assignedVehicleName.trim() || null,
      b2b_agent_name: values.paymentSource === 'b2b' ? values.b2bAgentName.trim() || null : null,
      customer_arrived: values.customerArrived,
      manager_note: values.managerNote.trim() || null,
      internal_note: values.internalNote.trim() || null,
      updated_at: now
    };

    if (values.status === 'Confirmed' && !booking.confirmed_at) payload.confirmed_at = now;
    if (values.status === 'Completed' && !booking.completed_at) payload.completed_at = now;
    if ((values.collectionStatus === 'with_admin' || values.collectionStatus === 'settled') && !booking.admin_payment_received_at) payload.admin_payment_received_at = now;

    const queryBuilder = supabase.from(bookingRequestsTable).update(payload);
    const result = booking.id ? await queryBuilder.eq('id', booking.id) : await queryBuilder.eq('booking_code', booking.booking_code);
    if (result.error) throw new Error(result.error.message);
    await loadBookings();
    setSelectedBooking(null);
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((booking) => [booking.booking_code, booking.booking_number, booking.customer_name, booking.customer_phone, booking.customer_email, packageLabel(booking), booking.status, booking.manager_status, booking.payment_workflow_status, booking.collection_status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [bookings, query]);

  const newCount = bookings.filter((booking) => (booking.admin_status || 'New') === 'New').length;
  const confirmedCount = bookings.filter((booking) => booking.status === 'Confirmed').length;
  const pendingPayment = bookings.reduce((sum, booking) => sum + bookingPending(booking), 0);

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
          <Metric title="Pending Collection" value={formatAed(pendingPayment)} icon={WalletCards} />
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
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operations</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Loading bookings...</TableCell></TableRow> : null}
                  {!loading && filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No booking requests found.</TableCell></TableRow> : null}
                  {filtered.map((booking, index) => (
                    <TableRow key={booking.id || `${booking.booking_code}-${index}`}>
                      <TableCell>
                        <div className="font-bold text-primary-900">{booking.booking_code}</div>
                        {booking.booking_number && booking.booking_number !== booking.booking_code ? <div className="text-xs text-muted-foreground">{booking.booking_number}</div> : null}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{booking.customer_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{booking.customer_phone || booking.customer_email || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{packageLabel(booking)}</div>
                        <div className="text-xs text-muted-foreground">{serviceDetail(booking)}</div>
                      </TableCell>
                      <TableCell>{niceDate(booking.preferred_date)}<div className="text-xs text-muted-foreground">{booking.preferred_time || '-'}</div></TableCell>
                      <TableCell>{formatAed(bookingTotal(booking))}<div className="text-xs text-muted-foreground">Pending {formatAed(bookingPending(booking))}</div></TableCell>
                      <TableCell><div className="font-semibold text-foreground">{booking.payment_status || 'Not Paid'}</div><div className="text-xs text-muted-foreground">{prettyKey(booking.collection_status || 'pending_collection')}</div></TableCell>
                      <TableCell><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status || 'Pending'}</span></TableCell>
                      <TableCell><div className="font-semibold text-foreground">{booking.manager_status || 'Pending'}</div><div className="text-xs text-muted-foreground">{booking.assigned_vehicle_name || 'No vehicle assigned'}</div></TableCell>
                      <TableCell><Button type="button" size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>Manage</Button></TableCell>
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
      {selectedBooking ? <ManageBookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onSave={saveBookingStatus} /> : null}
    </section>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
  return <Card className="rounded-[1.35rem]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}

function ManageBookingModal({ booking, onClose, onSave }: { booking: BookingRow; onClose: () => void; onSave: (booking: BookingRow, values: ManageValues) => Promise<void> }) {
  const total = bookingTotal(booking);
  const [values, setValues] = useState<ManageValues>({
    status: booking.status || 'Pending',
    adminStatus: booking.admin_status || 'New',
    managerStatus: booking.manager_status || 'Pending',
    paymentStatus: booking.payment_status || 'Not Paid',
    paymentMethod: booking.payment_method || '',
    paymentSource: booking.payment_source || 'direct',
    paymentWorkflowStatus: booking.payment_workflow_status || 'unpaid',
    collectionStatus: booking.collection_status || 'pending_collection',
    amountReceivedAed: String(booking.amount_received_aed ?? 0),
    assignedManagerName: booking.assigned_manager_name || '',
    assignedVehicleName: booking.assigned_vehicle_name || '',
    b2bAgentName: booking.b2b_agent_name || '',
    customerArrived: Boolean(booking.customer_arrived),
    managerNote: booking.manager_note || '',
    internalNote: booking.internal_note || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const whatsapp = whatsAppHref(booking);
  const amountReceived = Math.max(asNumber(values.amountReceivedAed), 0);
  const amountPending = Math.max(total - amountReceived, 0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Manage Booking</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{booking.booking_code}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button>
        </div>

        <div className="max-h-[calc(92vh-5rem)] overflow-y-auto p-5">
          {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-3 rounded-[1.25rem] border border-border bg-white p-4">
              <InfoLine label="Customer" value={booking.customer_name || '-'} />
              <InfoLine label="Phone" value={booking.customer_phone || '-'} />
              <InfoLine label="Email" value={booking.customer_email || '-'} />
              <InfoLine label="Package" value={packageLabel(booking)} />
              <InfoLine label="Service" value={serviceDetail(booking)} />
              <InfoLine label="Date / Time" value={`${niceDate(booking.preferred_date)} · ${booking.preferred_time || '-'}`} />
              <InfoLine label="Party" value={`${booking.vehicle_quantity || 1} vehicle · ${booking.guest_count || '-'} guests`} />
              <InfoLine label="Total" value={formatAed(total)} />
              <InfoLine label="Pending" value={formatAed(amountPending)} />
              {booking.customer_notes ? <InfoLine label="Notes" value={booking.customer_notes} /> : null}
            </div>

            <div className="grid gap-4 rounded-[1.25rem] border border-border bg-[#F7FAFA] p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="Booking Status" value={values.status} options={bookingStatusOptions} onChange={(status) => setValues((current) => ({ ...current, status }))} />
                <SelectField label="Admin Status" value={values.adminStatus} options={adminStatusOptions} onChange={(adminStatus) => setValues((current) => ({ ...current, adminStatus }))} />
                <SelectField label="Manager Status" value={values.managerStatus} options={managerStatusOptions} onChange={(managerStatus) => setValues((current) => ({ ...current, managerStatus }))} />
                <SelectField label="Payment Status" value={values.paymentStatus} options={paymentStatusOptions} onChange={(paymentStatus) => setValues((current) => ({ ...current, paymentStatus }))} />
                <SelectField label="Payment Method" value={values.paymentMethod} options={paymentMethodOptions} onChange={(paymentMethod) => setValues((current) => ({ ...current, paymentMethod }))} />
                <SelectField label="Payment Source" value={values.paymentSource} options={paymentSourceOptions} onChange={(paymentSource) => setValues((current) => ({ ...current, paymentSource, paymentWorkflowStatus: paymentSource === 'b2b' ? 'pending_from_b2b_agent' : current.paymentWorkflowStatus }))} />
                <SelectField label="Payment Workflow" value={values.paymentWorkflowStatus} options={paymentWorkflowOptions} onChange={(paymentWorkflowStatus) => setValues((current) => ({ ...current, paymentWorkflowStatus }))} />
                <SelectField label="Collection Status" value={values.collectionStatus} options={collectionStatusOptions} onChange={(collectionStatus) => setValues((current) => ({ ...current, collectionStatus }))} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Manager" value={values.assignedManagerName} onChange={(assignedManagerName) => setValues((current) => ({ ...current, assignedManagerName }))} placeholder="Manager name" />
                <TextField label="Assigned Vehicle" value={values.assignedVehicleName} onChange={(assignedVehicleName) => setValues((current) => ({ ...current, assignedVehicleName }))} placeholder="Vehicle name/code" />
                <TextField label="B2B Agent" value={values.b2bAgentName} onChange={(b2bAgentName) => setValues((current) => ({ ...current, b2bAgentName }))} placeholder="Agent company" />
                <NumberField label="Amount Received" value={values.amountReceivedAed} onChange={(amountReceivedAed) => setValues((current) => ({ ...current, amountReceivedAed }))} />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={values.customerArrived} onChange={(event) => setValues((current) => ({ ...current, customerArrived: event.target.checked }))} className="size-4 rounded border-border" />
                Customer arrived / received by manager
              </label>

              <TextAreaField label="Manager Note" value={values.managerNote} onChange={(managerNote) => setValues((current) => ({ ...current, managerNote }))} />
              <TextAreaField label="Internal Note" value={values.internalNote} onChange={(internalNote) => setValues((current) => ({ ...current, internalNote }))} />

              <div className="grid gap-2 rounded-xl border border-primary/15 bg-white px-3 py-2 text-xs text-primary-900 md:grid-cols-3">
                <div><span className="font-bold">Total:</span> {formatAed(total)}</div>
                <div><span className="font-bold">Received:</span> {formatAed(amountReceived)}</div>
                <div><span className="font-bold">Pending:</span> {formatAed(amountPending)}</div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {whatsapp ? <Button asChild variant="outline"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp Customer</a></Button> : null}
                <Button type="button" onClick={submit} disabled={saving}><Save data-icon aria-hidden="true" />{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border/70 bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold leading-5 text-foreground">{value}</p></div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option} value={option}>{option ? prettyKey(option) : 'None'}</option>)}</select></label>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl" /></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<Input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl" /></label>;
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary" /></label>;
}
