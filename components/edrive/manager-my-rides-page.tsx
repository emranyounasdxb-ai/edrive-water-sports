'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Save, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';
import { AdminOperationsAssignmentsPage } from './admin-operations-modules';

type PortalProfile = { full_name: string | null; email: string | null; role: string | null; status: string | null };
type ManagerProfile = { name: string; email: string; role: string; ready: boolean };
type VehicleOption = { name: string; code: string; type: string; status: string };
type CompletionValues = { method: 'Cash' | 'Card' | 'B2B Invoice'; amount: number; reference: string; note: string };
type RideFilter = 'today' | 'tomorrow' | 'upcoming' | 'overdue' | 'completed' | 'no-show' | 'all';
type RideType = 'jet_car' | 'jet_ski' | '';

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  selected_package_capacity?: number | string | null;
  selected_package_price?: number | string | null;
  selected_package_b2b_price?: number | string | null;
  service_type?: string | null;
  experience_type?: string | null;
  duration_minutes?: number | string | null;
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
  internal_note?: string | null;
};

const selectClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10';
const filterLabels: Record<RideFilter, string> = { today: 'Today', tomorrow: 'Tomorrow', upcoming: 'Upcoming', overdue: 'Overdue', completed: 'Done', 'no-show': 'No Show', all: 'All' };

function text(value: unknown, fallback = '-') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function numberValue(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function localDateKey(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(value: unknown) { return text(value, '').slice(0, 10); }
function dateLabel(value: unknown) {
  const clean = text(value, '');
  if (!clean) return 'No date';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00`));
}
function bookingCode(booking: BookingRow) { return text(booking.booking_code || booking.booking_number || booking.id, 'Booking'); }
function packageLabel(booking: BookingRow) { return text(booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type, 'Package'); }
function rideDetails(booking: BookingRow) {
  const parts = [booking.service_type, booking.selected_package_capacity ? `${booking.selected_package_capacity} seater` : '', booking.duration_minutes ? `${booking.duration_minutes} min` : ''].filter(Boolean).map(String);
  return parts.length ? parts.join(' · ') : 'Ride details pending';
}
function totalAmount(booking: BookingRow) { return numberValue(booking.total_amount || booking.selected_package_price || booking.selected_package_b2b_price); }
function receivedAmount(booking: BookingRow) {
  const received = numberValue(booking.amount_received_aed);
  if (received > 0) return received;
  return Math.max(totalAmount(booking) - numberValue(booking.amount_pending_aed), 0);
}
function managerStage(booking: BookingRow) {
  const raw = text(booking.manager_status, 'Pending');
  return raw === 'Assigned' ? 'Pending' : raw;
}
function cardStatus(booking: BookingRow) {
  const status = text(booking.status, 'Confirmed');
  const stage = managerStage(booking);
  const workflow = text(booking.payment_workflow_status, '').toLowerCase();
  if (status === 'Completed' || stage === 'Completed') return 'Completed';
  if (status === 'No Show' || stage === 'No Show') return 'No Show';
  if (workflow.includes('ride in progress')) return 'In Progress';
  if (status === 'Confirmed') return 'Confirmed';
  return status || 'Confirmed';
}
function pendingAmount(booking: BookingRow) {
  if (cardStatus(booking) === 'No Show') return 0;
  const pending = numberValue(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(totalAmount(booking) - receivedAmount(booking), 0);
}
function isB2BBooking(booking: BookingRow) { return String(booking.payment_source || '').toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name); }
function statusTone(status: unknown) {
  const value = text(status, 'Confirmed').toLowerCase();
  if (value.includes('complete') || value.includes('paid')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value.includes('no show') || value.includes('cancel')) return 'border-red-200 bg-red-50 text-red-700';
  if (value.includes('progress') || value.includes('check')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}
function matchesManager(booking: BookingRow, manager: ManagerProfile) {
  const assigned = String(booking.assigned_manager_name || '').trim().toLowerCase();
  return Boolean(assigned && (assigned === manager.name.trim().toLowerCase() || assigned === manager.email.trim().toLowerCase()));
}
function isVisibleBooking(booking: BookingRow) { return ['confirmed', 'completed', 'no show'].includes(text(booking.status, '').toLowerCase()); }
function scheduleSortValue(booking: BookingRow) { return `${dateKey(booking.preferred_date) || '9999-12-31'} ${text(booking.preferred_time, '23:59')}`; }
function isFutureBooking(booking: BookingRow) { const rideDate = dateKey(booking.preferred_date); return Boolean(rideDate && rideDate > localDateKey()); }
function canOperateBooking(booking: BookingRow) { const status = cardStatus(booking); return status !== 'Completed' && status !== 'No Show' && !isFutureBooking(booking); }
function matchesFilter(booking: BookingRow, filter: RideFilter) {
  const status = cardStatus(booking); const rideDate = dateKey(booking.preferred_date); const today = localDateKey(); const tomorrow = localDateKey(1); const active = status !== 'Completed' && status !== 'No Show';
  if (filter === 'today') return active && rideDate === today;
  if (filter === 'tomorrow') return active && rideDate === tomorrow;
  if (filter === 'upcoming') return active && Boolean(rideDate) && rideDate > tomorrow;
  if (filter === 'overdue') return active && Boolean(rideDate) && rideDate < today;
  if (filter === 'completed') return status === 'Completed';
  if (filter === 'no-show') return status === 'No Show';
  return true;
}
function isVehicleAvailable(vehicle: VehicleOption) { return text(vehicle.status, '').toLowerCase() === 'available'; }
function vehicleValue(vehicle: VehicleOption) { return text(vehicle.name || vehicle.code, ''); }
function sameVehicle(vehicle: VehicleOption, selected: string) {
  const value = selected.trim().toLowerCase();
  return Boolean(value && [vehicle.name, vehicle.code].some((item) => text(item, '').toLowerCase() === value));
}
function findVehicle(vehicles: VehicleOption[], selected: string) { return vehicles.find((item) => sameVehicle(item, selected)); }
function normalizeRideType(value: unknown): RideType {
  const clean = text(value, '').toLowerCase().replace(/[_-]+/g, ' ');
  if (!clean) return '';
  if (clean.includes('jet car') || /(^|\s)jc\s*\d*/.test(clean)) return 'jet_car';
  if (clean.includes('jet ski') || clean.includes('jetski') || /(^|\s)js\s*\d*/.test(clean)) return 'jet_ski';
  return '';
}
function expectedRideType(booking: BookingRow): RideType {
  const sources = [booking.selected_package_category, booking.selected_package_name, booking.experience_type, booking.service_type];
  return sources.map(normalizeRideType).find(Boolean) || '';
}
function rideTypeLabel(type: RideType) {
  if (type === 'jet_car') return 'Jet Car';
  if (type === 'jet_ski') return 'Jet Ski';
  return 'Vehicle';
}
function vehicleRideType(vehicle: VehicleOption): RideType {
  return normalizeRideType(vehicle.type) || normalizeRideType(vehicle.name) || normalizeRideType(vehicle.code);
}
function vehicleMatchesRide(vehicle: VehicleOption, expected: RideType) {
  if (!expected) return true;
  return vehicleRideType(vehicle) === expected;
}

async function updateVehicleStatus(vehicleName: string, status: 'available' | 'booked') {
  const clean = vehicleName.trim();
  if (!clean) return;
  const payload = { status, updated_at: new Date().toISOString() };
  await supabase.from('vehicles').update(payload).eq('vehicle_name', clean);
  await supabase.from('vehicles').update(payload).eq('vehicle_code', clean);
}

async function loadManagerProfile(): Promise<ManagerProfile> {
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  const authEmail = authUser?.email || '';
  if (!authUser) return { name: '', email: '', role: 'admin', ready: true };
  const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
  const { data } = await supabase.from('admin_users').select('full_name,email,role,status').or(filter).limit(1);
  const profile = (data || [])[0] as PortalProfile | undefined;
  return { name: profile?.full_name || authEmail, email: profile?.email || authEmail, role: profile?.role || 'admin', ready: true };
}

function CompactStat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'bad' }) {
  const toneClass = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-foreground';
  return <span className="inline-flex items-baseline gap-1.5 text-xs font-bold text-muted-foreground"><span>{label}</span><span className={`font-heading text-base ${toneClass}`}>{value}</span></span>;
}
function Detail({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'warning' }) {
  return <div className={`min-w-0 rounded-xl px-3 py-2 ${tone === 'warning' ? 'bg-red-50' : 'bg-[#F7FAFA]'}`}><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className={`mt-1 break-words text-sm font-bold ${tone === 'warning' ? 'text-red-700' : 'text-foreground'}`}>{value}</div>{sub ? <div className={`mt-0.5 break-words text-xs ${tone === 'warning' ? 'text-red-700' : 'text-muted-foreground'}`}>{sub}</div> : null}</div>;
}
function paymentSubText(booking: BookingRow) { const status = cardStatus(booking); if (status === 'No Show') return 'No collection'; if (status === 'Completed') return text(booking.payment_method, '') === 'B2B Invoice' ? `B2B pending ${formatAed(pendingAmount(booking))}` : `Received ${formatAed(receivedAmount(booking))}`; return `Pending ${formatAed(pendingAmount(booking))}`; }

function PaymentModal({ booking, onClose, onComplete }: { booking: BookingRow; onClose: () => void; onComplete: (values: CompletionValues) => Promise<void> }) {
  const isB2B = isB2BBooking(booking);
  const total = totalAmount(booking);
  const [method, setMethod] = useState<CompletionValues['method']>(isB2B ? 'B2B Invoice' : 'Cash');
  const [amount, setAmount] = useState(String(isB2B ? 0 : pendingAmount(booking) || total));
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    setSaving(true); setError('');
    try {
      const numeric = Number(amount || 0);
      if (method !== 'B2B Invoice' && (!Number.isFinite(numeric) || numeric <= 0)) throw new Error('Enter received amount.');
      if (method === 'Card' && !reference.trim()) throw new Error('Card reference required.');
      await onComplete({ method, amount: Number.isFinite(numeric) ? numeric : 0, reference: reference.trim(), note: note.trim() });
    } catch (modalError) { setError(modalError instanceof Error ? modalError.message : 'Unable to complete ride.'); } finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"><div className="w-full max-w-md rounded-[1.5rem] bg-white p-4 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Complete Ride</p><h3 className="mt-1 font-heading text-xl font-semibold text-foreground">Payment details</h3><p className="mt-1 text-sm text-muted-foreground">{formatAed(total)} total</p></div><button type="button" onClick={onClose} className="rounded-full border border-border p-2 text-muted-foreground"><X className="size-4" /></button></div>{error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}<div className="mt-4 grid gap-3"><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Method<select value={method} onChange={(event) => setMethod(event.target.value as CompletionValues['method'])} className={selectClass}><option value="Cash">Cash</option><option value="Card">Card</option><option value="B2B Invoice">B2B Invoice</option></select></label><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Amount<Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" disabled={method === 'B2B Invoice'} className="h-10 rounded-xl bg-white" /></label>{method === 'Card' ? <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Reference<Input value={reference} onChange={(event) => setReference(event.target.value)} className="h-10 rounded-xl bg-white" /></label> : null}<label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Note<Input value={note} onChange={(event) => setNote(event.target.value)} className="h-10 rounded-xl bg-white" /></label><Button type="button" onClick={submit} disabled={saving} className="rounded-full">{saving ? 'Saving...' : 'Complete Ride'}</Button></div></div></div>;
}

function RideCard({ booking, vehicles, onSaved }: { booking: BookingRow; vehicles: VehicleOption[]; onSaved: () => Promise<void> }) {
  const assignedVehicle = text(booking.assigned_vehicle_name, '');
  const expectedType = expectedRideType(booking);
  const expectedLabel = rideTypeLabel(expectedType);
  const assignedVehicleRow = assignedVehicle ? findVehicle(vehicles, assignedVehicle) : undefined;
  const assignedMatches = !assignedVehicle || (assignedVehicleRow ? vehicleMatchesRide(assignedVehicleRow, expectedType) : !expectedType);
  const initialVehicle = assignedMatches ? assignedVehicle : '';
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [completionOpen, setCompletionOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const status = cardStatus(booking);
  const inProgress = status === 'In Progress';
  const completed = status === 'Completed';
  const noShow = status === 'No Show';
  const actionAllowed = canOperateBooking(booking);
  const assignedTypeWarning = Boolean(assignedVehicle && !assignedMatches);
  const vehicleWarning = assignedTypeWarning ? `${assignedVehicle} is not valid for this ${expectedLabel} booking.` : '';

  useEffect(() => { setVehicle(initialVehicle); }, [initialVehicle]);

  const vehicleOptions = useMemo(() => {
    const names = new Set<string>();
    vehicles
      .filter((item) => isVehicleAvailable(item) && vehicleMatchesRide(item, expectedType))
      .forEach((item) => names.add(vehicleValue(item)));
    if (assignedVehicle && assignedMatches) names.add(assignedVehicle);
    return Array.from(names).filter(Boolean).sort();
  }, [assignedMatches, assignedVehicle, expectedType, vehicles]);

  const selectedVehicle = vehicle ? findVehicle(vehicles, vehicle) : undefined;
  const selectedMatches = !vehicle || Boolean(selectedVehicle && vehicleMatchesRide(selectedVehicle, expectedType));
  const selectedAvailable = !vehicle || Boolean(selectedVehicle && selectedMatches && isVehicleAvailable(selectedVehicle)) || (vehicle === assignedVehicle && assignedMatches);

  async function startRide() {
    if (!vehicle.trim()) { setError(`Please select available ${expectedLabel} first.`); return; }
    const selected = findVehicle(vehicles, vehicle);
    if (!selected) { setError('Selected vehicle was not found. Please select another vehicle.'); return; }
    if (!vehicleMatchesRide(selected, expectedType)) { setError(`This booking is for ${expectedLabel}. Please select a ${expectedLabel} only.`); return; }
    if (!isVehicleAvailable(selected)) { setError('This vehicle is not available. Please select another available vehicle.'); return; }
    setSaving(true); setError('');
    try {
      const payload: Record<string, unknown> = { assigned_vehicle_name: vehicle, payment_workflow_status: 'Ride In Progress', updated_at: new Date().toISOString() };
      const query = supabase.from(bookingRequestsTable).update(payload);
      const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
      if (result.error) throw new Error(result.error.message);
      await updateVehicleStatus(vehicle, 'booked');
      await onSaved();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to start ride.'); } finally { setSaving(false); }
  }

  async function markNoShow() {
    setSaving(true); setError('');
    try {
      const payload: Record<string, unknown> = { status: 'No Show', manager_status: 'No Show', amount_received_aed: 0, amount_pending_aed: 0, payment_status: 'No Show', collection_status: 'no_collection', payment_workflow_status: 'No Show', updated_at: new Date().toISOString() };
      const query = supabase.from(bookingRequestsTable).update(payload);
      const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
      if (result.error) throw new Error(result.error.message);
      if (assignedVehicle || vehicle) await updateVehicleStatus(assignedVehicle || vehicle, 'available');
      await onSaved();
    } catch (showError) { setError(showError instanceof Error ? showError.message : 'Unable to mark no show.'); } finally { setSaving(false); }
  }

  async function completeRide(values: CompletionValues) {
    const total = totalAmount(booking); const received = values.method === 'B2B Invoice' ? 0 : values.amount; const pending = values.method === 'B2B Invoice' ? total : Math.max(total - received, 0);
    const noteParts = [booking.internal_note, values.method === 'Card' && values.reference ? `Card ref: ${values.reference}` : '', values.note].filter(Boolean).map(String);
    const payload: Record<string, unknown> = { status: 'Completed', manager_status: 'Completed', payment_method: values.method, amount_received_aed: received, amount_pending_aed: pending, payment_status: values.method === 'B2B Invoice' ? 'Not Paid' : pending <= 0 ? 'Paid' : 'Partial Paid', collection_status: values.method === 'B2B Invoice' ? 'pending_collection' : pending <= 0 ? 'collected' : 'partial_collection', payment_workflow_status: values.method === 'B2B Invoice' ? 'B2B Invoice Generated' : 'Collected By Manager', internal_note: noteParts.join('\n'), updated_at: new Date().toISOString() };
    if (values.method === 'B2B Invoice') payload.payment_source = 'b2b';
    const query = supabase.from(bookingRequestsTable).update(payload); const result = booking.id ? await query.eq('id', booking.id) : await query.eq('booking_code', bookingCode(booking));
    if (result.error) throw new Error(result.error.message);
    if (assignedVehicle || vehicle) await updateVehicleStatus(assignedVehicle || vehicle, 'available');
    setCompletionOpen(false); await onSaved();
  }

  return <div className="rounded-[1.15rem] border border-border bg-white p-3 shadow-[0_10px_24px_rgba(8,37,50,0.05)] sm:p-4"><button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-start justify-between gap-3 text-left"><div className="min-w-0"><p className="text-xs font-bold text-primary">{dateLabel(booking.preferred_date)} · {text(booking.preferred_time, 'Time pending')}</p><h3 className="mt-1 break-words font-heading text-base font-semibold leading-tight text-foreground">{packageLabel(booking)}</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">{text(booking.customer_name, 'Guest')}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(status)}`}>{status}</span></button><div className="mt-3 grid grid-cols-2 gap-2"><Detail label="Vehicle" value={vehicle || (assignedTypeWarning ? `Select ${expectedLabel}` : 'Not selected')} sub={vehicleWarning || (inProgress || completed ? 'Assigned vehicle' : `Select ${expectedLabel} before ride`)} tone={assignedTypeWarning ? 'warning' : 'default'} /><Detail label="Payment" value={formatAed(totalAmount(booking))} sub={paymentSubText(booking)} /></div>{expanded ? <div className="mt-3 grid grid-cols-2 gap-2"><Detail label="Booking" value={bookingCode(booking)} /><Detail label="Ride" value={rideDetails(booking)} sub={text(booking.customer_phone || booking.customer_email, '')} /></div> : null}<div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{isB2BBooking(booking) ? `B2B · ${text(booking.b2b_agent_name, 'Agent')}` : 'Direct Sale'}</Badge><Badge variant="secondary">{expectedLabel}</Badge><button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-full border border-border bg-white px-3 py-1 text-xs font-bold text-muted-foreground">{expanded ? 'Less' : 'Details'} {expanded ? <ChevronUp className="inline size-3" /> : <ChevronDown className="inline size-3" />}</button></div>{error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}<div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value)} disabled={!actionAllowed || inProgress} className={selectClass}><option value="">Select available {expectedLabel}</option>{vehicleOptions.map((item) => <option key={item} value={item}>{item}</option>)}{!vehicleOptions.length ? <option value="" disabled>No available {expectedLabel}</option> : null}</select>{actionAllowed && !inProgress && vehicle && !selectedAvailable ? <span className="text-[11px] font-semibold normal-case tracking-normal text-red-700">Selected vehicle is not available for this booking.</span> : null}{assignedTypeWarning ? <span className="text-[11px] font-semibold normal-case tracking-normal text-red-700">Previous vehicle type does not match this booking.</span> : null}</label><div className="flex flex-col gap-2 sm:flex-row">{actionAllowed && !inProgress ? <Button type="button" onClick={startRide} disabled={saving || !vehicle || !selectedAvailable || !selectedMatches} className="rounded-full"><Save className="size-4" />{saving ? 'Starting...' : 'Start Ride'}</Button> : null}{inProgress ? <Button type="button" onClick={() => setCompletionOpen(true)} className="rounded-full bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="size-4" />Complete Ride</Button> : null}{actionAllowed ? <Button type="button" variant="outline" onClick={markNoShow} disabled={saving} className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100"><AlertCircle className="size-4" />No Show</Button> : null}{!actionAllowed && isFutureBooking(booking) ? <Button type="button" disabled variant="outline" className="rounded-full bg-white">Upcoming</Button> : null}{completed ? <Button type="button" disabled className="rounded-full bg-emerald-600"><CheckCircle2 className="size-4" />Completed</Button> : null}{noShow ? <Button type="button" disabled variant="outline" className="rounded-full border-red-200 bg-red-50 text-red-700"><AlertCircle className="size-4" />No Show</Button> : null}</div></div>{completionOpen ? <PaymentModal booking={booking} onClose={() => setCompletionOpen(false)} onComplete={completeRide} /> : null}</div>;
}

function ManagerAssignedRidesPage({ manager }: { manager: ManagerProfile }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RideFilter>('today');

  async function loadData() {
    setLoading(true); setError('');
    try {
      const [bookingResult, vehicleResult] = await Promise.all([
        supabase.from(bookingRequestsTable).select('*').order('preferred_date', { ascending: true }).limit(500),
        supabase.from('vehicles').select('vehicle_code,vehicle_name,vehicle_type,status').order('vehicle_code', { ascending: true }).limit(500)
      ]);
      if (bookingResult.error) throw new Error(bookingResult.error.message);
      setBookings((bookingResult.data || []) as BookingRow[]);
      setVehicles(((vehicleResult.data || []) as Record<string, unknown>[]).map((row) => ({ name: text(row.vehicle_name || row.vehicle_code, 'Vehicle'), code: text(row.vehicle_code, ''), type: text(row.vehicle_type, ''), status: text(row.status, '') })));
    } catch (loadError) {
      setBookings([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load assigned rides.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const scopedBookings = useMemo(() => bookings.filter((booking) => isVisibleBooking(booking) && matchesManager(booking, manager)), [bookings, manager]);
  const counts = useMemo(() => ({ today: scopedBookings.filter((booking) => matchesFilter(booking, 'today')).length, tomorrow: scopedBookings.filter((booking) => matchesFilter(booking, 'tomorrow')).length, upcoming: scopedBookings.filter((booking) => matchesFilter(booking, 'upcoming')).length, overdue: scopedBookings.filter((booking) => matchesFilter(booking, 'overdue')).length, completed: scopedBookings.filter((booking) => matchesFilter(booking, 'completed')).length, 'no-show': scopedBookings.filter((booking) => matchesFilter(booking, 'no-show')).length, all: scopedBookings.length }), [scopedBookings]);
  const visible = useMemo(() => { const term = query.trim().toLowerCase(); return scopedBookings.filter((booking) => matchesFilter(booking, filter)).filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), booking.assigned_vehicle_name, booking.manager_status, booking.payment_method].some((value) => String(value || '').toLowerCase().includes(term))).sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b))); }, [filter, query, scopedBookings]);
  const metrics = useMemo(() => { const active = scopedBookings.filter((booking) => ['Confirmed', 'In Progress'].includes(cardStatus(booking))).length; const inProgress = scopedBookings.filter((booking) => cardStatus(booking) === 'In Progress').length; const completed = scopedBookings.filter((booking) => cardStatus(booking) === 'Completed').length; const completedBookings = scopedBookings.filter((booking) => cardStatus(booking) === 'Completed'); const cash = completedBookings.filter((booking) => text(booking.payment_method, '').toLowerCase() === 'cash').reduce((sum, booking) => sum + receivedAmount(booking), 0); const card = completedBookings.filter((booking) => text(booking.payment_method, '').toLowerCase() === 'card').reduce((sum, booking) => sum + receivedAmount(booking), 0); return { active, inProgress, completed, cash, card }; }, [scopedBookings]);
  const filterList: RideFilter[] = ['today', 'tomorrow', 'upcoming', 'overdue', 'completed', 'no-show', 'all'];

  return <section className="w-full overflow-hidden px-1 py-1 pb-28 sm:px-4 sm:py-4 lg:px-8 lg:py-8"><div className="flex items-start justify-between gap-3 rounded-[1.2rem] border border-white/70 bg-white/72 p-3.5 shadow-[0_12px_28px_rgba(8,37,50,0.05)] backdrop-blur-xl sm:p-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">My Rides</p><h1 className="mt-1 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl">Assigned rides</h1><p className="mt-1 text-sm font-semibold text-muted-foreground">{counts.today} today · {counts.upcoming} upcoming</p></div><button type="button" onClick={loadData} className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-primary shadow-sm" aria-label="Refresh rides"><RefreshCw className="size-4" /></button></div>{error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}<div className="mt-3 rounded-[1.15rem] border border-border/70 bg-white/70 px-3 py-2.5 shadow-[0_8px_20px_rgba(8,37,50,0.035)]"><div className="flex flex-wrap gap-x-4 gap-y-1.5"><CompactStat label="Active" value={String(metrics.active)} /><CompactStat label="Progress" value={String(metrics.inProgress)} /><CompactStat label="Done" value={String(metrics.completed)} tone="good" /><CompactStat label="Cash" value={formatAed(metrics.cash)} tone="good" /><CompactStat label="Card" value={formatAed(metrics.card)} /></div></div><Card className="mt-3 overflow-hidden rounded-[1.35rem] border-border/80 bg-white shadow-[0_12px_28px_rgba(8,37,50,0.05)]"><CardHeader className="gap-3 border-b border-border/70 bg-[#F7FAFA] px-4 py-3"><div><CardTitle className="font-heading text-xl font-semibold sm:text-2xl">{filterLabels[filter]} rides</CardTitle><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{loading ? 'Loading...' : `${visible.length} rides`}</p></div>{scopedBookings.length > 0 ? <div className="relative w-full"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rides..." className="h-10 rounded-full bg-white pl-9" /></div> : null}</CardHeader><div className="flex flex-wrap gap-2 border-b border-border/70 bg-white px-4 py-3">{filterList.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${filter === item ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground'}`}>{filterLabels[item]} <span className={filter === item ? 'text-white/80' : 'text-muted-foreground'}>{counts[item]}</span></button>)}</div><CardContent className="grid gap-3 p-3 sm:p-4 xl:grid-cols-2">{loading ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-5 text-center text-sm font-semibold text-muted-foreground">Loading assigned rides...</div> : null}{!loading && visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-5 text-center"><p className="font-heading text-base font-semibold text-foreground">No rides in {filterLabels[filter]}</p><p className="mt-1 text-sm text-muted-foreground">Booking date ke hisab se rides yahan show hongi.</p></div> : null}{visible.map((booking, index) => <RideCard key={String(booking.id || `${bookingCode(booking)}-${index}`)} booking={booking} vehicles={vehicles} onSaved={loadData} />)}</CardContent></Card></section>;
}

export function ManagerScopedAssignmentsPage() {
  const [manager, setManager] = useState<ManagerProfile>({ name: '', email: '', role: 'admin', ready: false });
  useEffect(() => { let active = true; void loadManagerProfile().then((profile) => { if (active) setManager(profile); }); return () => { active = false; }; }, []);
  if (!manager.ready) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading access...</div>;
  if (manager.role === 'manager') return <ManagerAssignedRidesPage manager={manager} />;
  return <AdminOperationsAssignmentsPage />;
}
