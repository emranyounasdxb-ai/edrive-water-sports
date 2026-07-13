'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardCheck, Eye, MessageCircle, RefreshCw, Save, Search, ShieldCheck, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  admin_status?: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  experience_type?: string | null;
  service_type?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  collection_status?: string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
  confirmed_at?: string | null;
  internal_note?: string | null;
  created_at?: string | null;
};

type ManagerOption = { name: string; email: string };
type BookingFilter = 'action' | 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'b2b' | 'direct';
type ManageValues = { status: 'Pending' | 'Confirmed' | 'Cancelled'; managerName: string; note: string };

function text(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function numberValue(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function bookingCode(booking: BookingRow) {
  return text(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function packageLabel(booking: BookingRow) {
  return text(booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type, 'Package');
}

function totalAmount(booking: BookingRow) {
  return numberValue(booking.total_amount);
}

function dateLabel(value: unknown) {
  const clean = text(value);
  if (!clean) return 'Date not selected';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00`));
}

function isB2B(booking: BookingRow) {
  return text(booking.payment_source).toLowerCase() === 'b2b' || Boolean(text(booking.b2b_agent_name));
}

function bookingType(booking: BookingRow) {
  return isB2B(booking) ? 'B2B' : 'Direct Sale';
}

function statusValue(booking: BookingRow) {
  return text(booking.status, 'Pending');
}

function managerStage(booking: BookingRow) {
  const stage = text(booking.manager_status, 'Pending');
  return stage === 'Assigned' ? 'Pending' : stage;
}

function workflowValue(booking: BookingRow) {
  return text(booking.payment_workflow_status).toLowerCase();
}

function rideStarted(booking: BookingRow) {
  const stage = managerStage(booking).toLowerCase();
  const workflow = workflowValue(booking);
  return stage === 'in progress' || workflow.includes('ride in progress');
}

function finalBooking(booking: BookingRow) {
  const status = statusValue(booking).toLowerCase();
  const stage = managerStage(booking).toLowerCase();
  return ['completed', 'no show', 'cancelled'].includes(status) || ['completed', 'no show'].includes(stage);
}

function adminLocked(booking: BookingRow) {
  if (finalBooking(booking) || rideStarted(booking)) return true;
  return statusValue(booking) === 'Confirmed' && Boolean(text(booking.assigned_manager_name));
}

function stageLabel(booking: BookingRow) {
  if (statusValue(booking) === 'Completed') return 'Completed';
  if (statusValue(booking) === 'No Show') return 'No Show';
  if (statusValue(booking) === 'Cancelled') return 'Cancelled';
  if (rideStarted(booking)) return 'In Progress';
  if (statusValue(booking) === 'Confirmed' && booking.assigned_manager_name) return 'Assigned';
  return 'Awaiting Confirmation';
}

function statusTone(value: string) {
  const clean = value.toLowerCase();
  if (clean.includes('complete') || clean.includes('assigned')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (clean.includes('progress')) return 'border-sky-200 bg-sky-50 text-sky-700';
  if (clean.includes('no show') || clean.includes('cancel')) return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function whatsappHref(booking: BookingRow) {
  let digits = text(booking.customer_phone).replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  const message = encodeURIComponent(`Hello ${text(booking.customer_name, 'there')}, this is eDrive Water Sports. We are confirming booking ${bookingCode(booking)} for ${dateLabel(booking.preferred_date)} at ${text(booking.preferred_time, 'your selected time')}.`);
  return `https://web.whatsapp.com/send?phone=${digits}&text=${message}&app_absent=0`;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_28px_rgba(8,37,50,0.05)]">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div>
      </CardContent>
    </Card>
  );
}

export function AdminBookingWorkflowPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<BookingFilter>('action');
  const [selected, setSelected] = useState<BookingRow | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    const [bookingResult, managerResult] = await Promise.all([
      supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('admin_users').select('full_name,email,role,status').order('full_name', { ascending: true }).limit(200)
    ]);
    if (bookingResult.error) setError(bookingResult.error.message);
    setBookings((bookingResult.data || []) as BookingRow[]);
    const activeManagers = ((managerResult.data || []) as Array<{ full_name: string | null; email: string | null; role: string | null; status: string | null }>)
      .filter((row) => text(row.role).toLowerCase() === 'manager' && text(row.status).toLowerCase() === 'active')
      .map((row) => ({ name: text(row.full_name || row.email, 'Manager'), email: text(row.email) }));
    setManagers(activeManagers);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => ({
    action: bookings.filter((booking) => statusValue(booking) === 'Pending' || (statusValue(booking) === 'Confirmed' && !booking.assigned_manager_name)).length,
    assigned: bookings.filter((booking) => statusValue(booking) === 'Confirmed' && Boolean(booking.assigned_manager_name) && !rideStarted(booking)).length,
    progress: bookings.filter(rideStarted).length,
    completed: bookings.filter((booking) => statusValue(booking) === 'Completed').length
  }), [bookings]);

  const filterOptions: Array<{ id: BookingFilter; label: string; count: number }> = [
    { id: 'action', label: 'Needs Action', count: stats.action },
    { id: 'all', label: 'All', count: bookings.length },
    { id: 'pending', label: 'Pending', count: bookings.filter((booking) => statusValue(booking) === 'Pending').length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter((booking) => statusValue(booking) === 'Confirmed').length },
    { id: 'in_progress', label: 'In Progress', count: bookings.filter(rideStarted).length },
    { id: 'completed', label: 'Completed', count: bookings.filter((booking) => statusValue(booking) === 'Completed').length },
    { id: 'no_show', label: 'No Show', count: bookings.filter((booking) => statusValue(booking) === 'No Show').length },
    { id: 'b2b', label: 'B2B', count: bookings.filter(isB2B).length },
    { id: 'direct', label: 'Direct', count: bookings.filter((booking) => !isB2B(booking)).length }
  ];

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (filter === 'action' && !(statusValue(booking) === 'Pending' || (statusValue(booking) === 'Confirmed' && !booking.assigned_manager_name))) return false;
      if (filter === 'pending' && statusValue(booking) !== 'Pending') return false;
      if (filter === 'confirmed' && statusValue(booking) !== 'Confirmed') return false;
      if (filter === 'in_progress' && !rideStarted(booking)) return false;
      if (filter === 'completed' && statusValue(booking) !== 'Completed') return false;
      if (filter === 'no_show' && statusValue(booking) !== 'No Show') return false;
      if (filter === 'b2b' && !isB2B(booking)) return false;
      if (filter === 'direct' && isB2B(booking)) return false;
      if (!term) return true;
      return [bookingCode(booking), booking.customer_name, booking.customer_phone, booking.customer_email, packageLabel(booking), booking.assigned_manager_name, booking.b2b_agent_name, stageLabel(booking)].some((value) => text(value).toLowerCase().includes(term));
    });
  }, [bookings, filter, query]);

  async function saveBooking(booking: BookingRow, values: ManageValues) {
    const managerName = values.managerName.trim();
    const key = booking.id ? 'id' : 'booking_code';
    const keyValue = booking.id || bookingCode(booking);
    const latestResult = await supabase.from(bookingRequestsTable).select('*').eq(key, keyValue).maybeSingle();
    if (latestResult.error) throw new Error(latestResult.error.message);
    const latest = (latestResult.data || booking) as BookingRow;

    if (adminLocked(latest)) throw new Error('This booking is already assigned or has started. Admin access is read-only.');
    if (values.status === 'Confirmed') {
      if (!managerName) throw new Error('Select an active manager before confirming this booking.');
      const validManager = managers.some((manager) => manager.name.toLowerCase() === managerName.toLowerCase());
      if (!validManager) throw new Error('Selected manager is not active. Refresh and select an active manager.');
    }
    if (values.status === 'Cancelled' && rideStarted(latest)) throw new Error('Ride has already started. This booking cannot be cancelled by admin.');

    const now = new Date().toISOString();
    const basePayload: Record<string, unknown> = {
      status: values.status,
      internal_note: values.note.trim() || null,
      updated_at: now
    };

    if (values.status === 'Confirmed') {
      Object.assign(basePayload, {
        admin_status: 'Confirmed',
        manager_status: 'Pending',
        assigned_manager_name: managerName,
        confirmed_at: latest.confirmed_at || now
      });
    } else if (values.status === 'Pending') {
      Object.assign(basePayload, {
        admin_status: 'New',
        manager_status: 'Pending',
        assigned_manager_name: null
      });
    } else {
      Object.assign(basePayload, {
        admin_status: 'Closed',
        manager_status: 'Cancelled',
        assigned_manager_name: null,
        payment_workflow_status: 'Cancelled'
      });
      if (numberValue(latest.amount_received_aed) <= 0) {
        Object.assign(basePayload, {
          amount_pending_aed: 0,
          payment_status: 'Cancelled',
          collection_status: 'no_collection'
        });
      }
    }

    const updateResult = await supabase.from(bookingRequestsTable).update(basePayload).eq(key, keyValue);
    if (updateResult.error) throw new Error(updateResult.error.message);
    setSelected(null);
    await load();
  }

  return (
    <section className="w-full py-4 sm:py-6">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Bookings</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">Confirmation & assignment</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">A booking can only be confirmed with an active manager. After assignment, admin access becomes read-only and the selected manager controls ride execution.</p></div>
        <Button type="button" variant="outline" onClick={load} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Needs Action" value={String(stats.action)} icon={AlertCircle} />
        <Metric label="Assigned" value={String(stats.assigned)} icon={UserCheck} />
        <Metric label="In Progress" value={String(stats.progress)} icon={ClipboardCheck} />
        <Metric label="Completed" value={String(stats.completed)} icon={CheckCircle2} />
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {!managers.length && !loading ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">No active manager found. Add or activate a manager in Team & Access before confirming bookings.</p> : null}

      <Card className="mt-4 overflow-hidden rounded-[1.35rem] border-border/80 bg-white">
        <CardHeader className="gap-3 border-b border-border/70 bg-[#F7FAFA] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-xl font-semibold">Booking workflow</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading...' : `${visible.length} of ${bookings.length} bookings`}</p></div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking, guest, manager..." className="h-10 rounded-full bg-white pl-9" /></div>
        </CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">{filterOptions.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground'}`}>{item.label} <span className={filter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span></button>)}</div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1180px]">
              <TableHeader><TableRow className="bg-[#F7FAFA]"><TableHead>Booking</TableHead><TableHead>Customer</TableHead><TableHead>Package</TableHead><TableHead>Schedule</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Manager</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Loading bookings...</TableCell></TableRow> : null}
                {!loading && !visible.length ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No matching bookings.</TableCell></TableRow> : null}
                {visible.map((booking) => {
                  const locked = adminLocked(booking);
                  const stage = stageLabel(booking);
                  return <TableRow key={bookingCode(booking)} className="align-top hover:bg-[#F7FAFA]">
                    <TableCell className="py-3"><p className="font-mono text-xs font-bold text-primary">{bookingCode(booking)}</p><p className="mt-1 text-xs text-muted-foreground">{text(booking.booking_number)}</p></TableCell>
                    <TableCell className="py-3"><p className="font-semibold text-foreground">{text(booking.customer_name, 'Guest')}</p><p className="text-xs text-muted-foreground">{text(booking.customer_phone || booking.customer_email, '-')}</p></TableCell>
                    <TableCell className="py-3"><p className="font-semibold text-foreground">{packageLabel(booking)}</p><p className="text-xs text-muted-foreground">{text(booking.service_type, 'Website')}</p></TableCell>
                    <TableCell className="whitespace-nowrap py-3"><p className="font-semibold text-foreground">{dateLabel(booking.preferred_date)}</p><p className="text-xs text-muted-foreground">{text(booking.preferred_time, '-')}</p></TableCell>
                    <TableCell className="py-3"><span className="rounded-full border border-primary/20 bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary">{bookingType(booking)}</span><p className="mt-1 text-xs text-muted-foreground">{text(booking.b2b_agent_name || booking.payment_source, '-')}</p></TableCell>
                    <TableCell className="py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(stage)}`}>{stage}</span><p className="mt-1 text-xs text-muted-foreground">{statusValue(booking)}</p></TableCell>
                    <TableCell className="py-3"><p className="font-semibold text-foreground">{text(booking.assigned_manager_name, 'Unassigned')}</p><p className="text-xs text-muted-foreground">{managerStage(booking)}</p></TableCell>
                    <TableCell className="whitespace-nowrap py-3"><p className="font-semibold text-foreground">{formatAed(totalAmount(booking))}</p><p className="text-xs text-muted-foreground">{text(booking.payment_status, 'Not Paid')}</p></TableCell>
                    <TableCell className="py-3 text-right"><Button type="button" size="sm" variant="outline" onClick={() => setSelected(booking)} className="rounded-full bg-white">{locked ? <Eye className="size-3.5" aria-hidden="true" /> : <Save className="size-3.5" aria-hidden="true" />}{locked ? 'View' : 'Manage'}</Button></TableCell>
                  </TableRow>;
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selected ? <BookingWorkflowModal booking={selected} managers={managers} onClose={() => setSelected(null)} onSave={saveBooking} /> : null}
    </section>
  );
}

function BookingWorkflowModal({ booking, managers, onClose, onSave }: { booking: BookingRow; managers: ManagerOption[]; onClose: () => void; onSave: (booking: BookingRow, values: ManageValues) => Promise<void> }) {
  const locked = adminLocked(booking);
  const [values, setValues] = useState<ManageValues>({
    status: (['Pending', 'Confirmed', 'Cancelled'].includes(statusValue(booking)) ? statusValue(booking) : 'Pending') as ManageValues['status'],
    managerName: text(booking.assigned_manager_name),
    note: text(booking.internal_note)
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const whatsapp = whatsappHref(booking);
  const confirmReady = values.status !== 'Confirmed' || Boolean(values.managerName.trim());

  async function submit() {
    setSaving(true);
    setError('');
    try {
      await onSave(booking, values);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update booking.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
        <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-[#F7FAFA] p-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{locked ? 'Booking Record' : 'Confirmation Workflow'}</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{bookingCode(booking)}</h2><p className="mt-1 text-sm text-muted-foreground">{text(booking.customer_name, 'Guest')} · {packageLabel(booking)}</p></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground" aria-label="Close"><X className="size-4" /></button></div>
        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto p-4">
          {error ? <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {locked ? <div className="mb-4 flex gap-3 rounded-2xl border border-primary/20 bg-primary-50 p-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-bold text-primary-900">Admin record is read-only</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This booking is assigned, in progress, completed, cancelled or No Show. Ride and payment actions belong to the assigned manager and Payments workflow.</p></div></div> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Customer" value={text(booking.customer_name, 'Guest')} sub={text(booking.customer_phone || booking.customer_email, '-')} />
            <Info label="Schedule" value={dateLabel(booking.preferred_date)} sub={text(booking.preferred_time, '-')} />
            <Info label="Booking Type" value={bookingType(booking)} sub={isB2B(booking) ? text(booking.b2b_agent_name, 'B2B agent') : 'Locked direct sale'} />
            <Info label="Amount" value={formatAed(totalAmount(booking))} sub={text(booking.payment_status, 'Not Paid')} />
          </div>

          {locked ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Booking Status" value={statusValue(booking)} sub={stageLabel(booking)} /><Info label="Assigned Manager" value={text(booking.assigned_manager_name, 'Unassigned')} sub={managerStage(booking)} /><Info label="Assigned Vehicle" value={text(booking.assigned_vehicle_name, 'Not assigned')} /><Info label="Payment Workflow" value={text(booking.payment_workflow_status, 'Pending')} sub={text(booking.collection_status, 'Pending')} /><div className="sm:col-span-2"><Info label="Internal Note" value={text(booking.internal_note, 'No internal note.')} /></div></div>
          ) : (
            <div className="mt-4 rounded-[1.2rem] border border-border bg-[#F7FAFA] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">Booking Status<select value={values.status} onChange={(event) => { const status = event.target.value as ManageValues['status']; setValues((current) => ({ ...current, status, managerName: status === 'Confirmed' ? current.managerName : '' })); }} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold"><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Cancelled">Cancelled</option></select></label>
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">Assigned Manager {values.status === 'Confirmed' ? <span className="text-red-600">*</span> : null}<select value={values.managerName} onChange={(event) => setValues((current) => ({ ...current, managerName: event.target.value }))} disabled={values.status !== 'Confirmed'} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold disabled:bg-slate-100"><option value="">Select active manager</option>{managers.map((manager) => <option key={`${manager.name}-${manager.email}`} value={manager.name}>{manager.name}{manager.email ? ` · ${manager.email}` : ''}</option>)}</select></label>
              </div>
              {values.status === 'Confirmed' ? <p className={`mt-2 text-xs font-semibold ${confirmReady ? 'text-emerald-700' : 'text-red-700'}`}>{confirmReady ? 'Ready: booking will be confirmed and locked to the selected manager.' : 'Manager selection is required before confirmation.'}</p> : null}
              {values.status === 'Cancelled' ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Cancellation is only allowed before manager assignment and before the ride starts.</p> : null}
              <label className="mt-4 grid gap-1.5 text-sm font-semibold text-foreground">Internal Note<textarea value={values.note} onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))} className="min-h-28 rounded-xl border border-border bg-white p-3 text-sm" placeholder="Optional operational note" /></label>
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2"><span className="rounded-full border border-primary/20 bg-primary-50 px-3 py-1 text-xs font-bold text-primary">{bookingType(booking)}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(stageLabel(booking))}`}>{stageLabel(booking)}</span></div>
          <div className="flex flex-col gap-2 sm:flex-row">{whatsapp ? <Button asChild className="rounded-full bg-[#25D366] text-white hover:bg-[#1FB85A]"><a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle className="size-4" />WhatsApp</a></Button> : null}{locked ? <Button type="button" variant="outline" onClick={onClose} className="rounded-full bg-white">Close</Button> : <Button type="button" onClick={submit} disabled={saving || !confirmReady || (values.status === 'Confirmed' && !managers.length)} className="rounded-full"><Save className="size-4" />{saving ? 'Saving...' : values.status === 'Confirmed' ? 'Confirm & Assign' : values.status === 'Cancelled' ? 'Cancel Booking' : 'Save Pending'}</Button>}</div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>{sub ? <p className="mt-0.5 break-words text-xs text-muted-foreground">{sub}</p> : null}</div>;
}
