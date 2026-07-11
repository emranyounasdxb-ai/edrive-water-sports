'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, CreditCard, FileText, RefreshCw, Search, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

export type ManagerIdentity = {
  name: string;
  email: string;
};

type BookingRow = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  service_type?: string | null;
  duration_minutes?: number | string | null;
  selected_package_capacity?: number | string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  total_amount?: number | string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  collection_status?: string | null;
  b2b_agent_name?: string | null;
  internal_note?: string | null;
  updated_at?: string | null;
};

type CollectionFilter = 'all' | 'today' | 'cash' | 'card' | 'b2b' | 'no_collection';

const filters: Array<{ id: CollectionFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'b2b', label: 'B2B' },
  { id: 'no_collection', label: 'No Collection' }
];

function asText(value: unknown, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(value: unknown) {
  return asText(value).slice(0, 10);
}

function niceDate(value: unknown) {
  const text = asText(value);
  if (!text) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(text.includes('T') ? text : `${text}T12:00:00`));
}

function bookingCode(booking: BookingRow) {
  return asText(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

function packageLabel(booking: BookingRow) {
  return asText(booking.selected_package_name || booking.selected_package_category || booking.service_type, 'Ride package');
}

function rideLine(booking: BookingRow) {
  const parts = [booking.service_type, booking.selected_package_capacity ? `${booking.selected_package_capacity} seater` : '', booking.duration_minutes ? `${booking.duration_minutes} min` : ''].filter(Boolean).map(String);
  return parts.length ? parts.join(' · ') : packageLabel(booking);
}

function statusLabel(booking: BookingRow) {
  const status = asText(booking.status, 'Pending');
  const managerStatus = asText(booking.manager_status, '');
  if (status === 'No Show' || managerStatus === 'No Show') return 'No Collection';
  if (asText(booking.payment_method) === 'B2B Invoice') return 'B2B Invoice';
  if (status === 'Completed' || managerStatus === 'Completed') return asText(booking.payment_status, 'Collected');
  return 'Waiting';
}

function isNoCollection(booking: BookingRow) {
  return statusLabel(booking) === 'No Collection' || asText(booking.collection_status).toLowerCase() === 'no_collection';
}

function isB2B(booking: BookingRow) {
  return asText(booking.payment_method) === 'B2B Invoice' || asText(booking.payment_source).toLowerCase() === 'b2b' || Boolean(booking.b2b_agent_name);
}

function totalAmount(booking: BookingRow) {
  return isNoCollection(booking) ? 0 : asNumber(booking.total_amount);
}

function receivedAmount(booking: BookingRow) {
  if (isNoCollection(booking) || isB2B(booking)) return 0;
  return asNumber(booking.amount_received_aed);
}

function pendingAmount(booking: BookingRow) {
  if (isNoCollection(booking)) return 0;
  const pending = asNumber(booking.amount_pending_aed);
  if (pending > 0) return pending;
  return Math.max(totalAmount(booking) - receivedAmount(booking), 0);
}

function matchesManager(booking: BookingRow, manager: ManagerIdentity) {
  const assigned = asText(booking.assigned_manager_name).toLowerCase();
  const name = manager.name.toLowerCase();
  const email = manager.email.toLowerCase();
  return Boolean(assigned && (assigned === name || assigned === email));
}

function collectionType(booking: BookingRow) {
  if (isNoCollection(booking)) return 'No Collection';
  if (isB2B(booking)) return 'B2B Invoice';
  const method = asText(booking.payment_method, 'Cash');
  return method === 'Card' ? 'Card' : 'Cash';
}

function filterMatches(booking: BookingRow, filter: CollectionFilter) {
  const type = collectionType(booking).toLowerCase();
  if (filter === 'today') return dateKey(booking.preferred_date) === todayKey();
  if (filter === 'cash') return type === 'cash';
  if (filter === 'card') return type === 'card';
  if (filter === 'b2b') return type === 'b2b invoice';
  if (filter === 'no_collection') return type === 'no collection';
  return type !== 'no collection';
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof WalletCards }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_10px_26px_rgba(8,37,50,0.055)]">
      <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground">{title}</p>
          <p className="mt-1 font-heading text-xl font-semibold leading-tight text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 text-sm font-bold text-foreground">{value}</div></div>;
}

function toneFor(booking: BookingRow) {
  const type = collectionType(booking);
  if (type === 'No Collection') return 'border-red-200 bg-red-50 text-red-700';
  if (type === 'B2B Invoice') return 'border-primary/25 bg-primary-50 text-primary';
  if (type === 'Card') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function CollectionCard({ booking, expanded, onToggle }: { booking: BookingRow; expanded: boolean; onToggle: () => void }) {
  const type = collectionType(booking);
  const received = receivedAmount(booking);
  const pending = pendingAmount(booking);
  return (
    <div className="rounded-[1.15rem] border border-border bg-white p-3.5 shadow-[0_10px_24px_rgba(8,37,50,0.05)]">
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{bookingCode(booking)}</p>
          <h3 className="mt-1 break-words font-heading text-base font-semibold text-foreground">{asText(booking.customer_name, 'Guest')}</h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{packageLabel(booking)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{niceDate(booking.preferred_date)} · {asText(booking.preferred_time, '-')}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${toneFor(booking)}`}>{type}</span>
      </button>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F7FAFA] p-2.5">
        <div><p className="text-[10px] font-bold text-muted-foreground">Total</p><p className="text-sm font-bold text-foreground">{formatAed(totalAmount(booking))}</p></div>
        <div><p className="text-[10px] font-bold text-muted-foreground">Received</p><p className="text-sm font-bold text-emerald-700">{formatAed(received)}</p></div>
        <div><p className="text-[10px] font-bold text-muted-foreground">Balance</p><p className={pending > 0 ? 'text-sm font-bold text-red-700' : 'text-sm font-bold text-emerald-700'}>{formatAed(pending)}</p></div>
      </div>

      <Button type="button" variant="outline" onClick={onToggle} className="mt-3 w-full rounded-2xl bg-white">
        {expanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
        {expanded ? 'Hide Details' : 'View Details'}
      </Button>

      {expanded ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Detail label="Phone" value={asText(booking.customer_phone || booking.customer_email, '-')} />
          <Detail label="Vehicle" value={asText(booking.assigned_vehicle_name, '-')} />
          <Detail label="Ride" value={rideLine(booking)} />
          <Detail label="Status" value={statusLabel(booking)} />
          <Detail label="Method" value={type} />
          <Detail label="Agent" value={asText(booking.b2b_agent_name, isB2B(booking) ? 'B2B Agent' : 'Direct')} />
          {booking.internal_note ? <div className="sm:col-span-2"><Detail label="Note" value={<span className="whitespace-pre-wrap">{booking.internal_note}</span>} /></div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function ManagerCollectionsPage({ manager }: { manager: ManagerIdentity }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [expanded, setExpanded] = useState('');

  async function loadCollections() {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from(bookingRequestsTable).select('*').order('preferred_date', { ascending: false }).limit(800);
    if (loadError) {
      setBookings([]);
      setError(loadError.message);
    } else {
      setBookings((data || []) as BookingRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { void loadCollections(); }, []);

  const managerRecords = useMemo(() => bookings.filter((booking) => matchesManager(booking, manager) && ['completed', 'no show'].includes(asText(booking.status).toLowerCase())), [bookings, manager]);

  const metrics = useMemo(() => {
    const completed = managerRecords.filter((booking) => asText(booking.status).toLowerCase() === 'completed');
    const cash = completed.filter((booking) => collectionType(booking) === 'Cash').reduce((sum, booking) => sum + receivedAmount(booking), 0);
    const card = completed.filter((booking) => collectionType(booking) === 'Card').reduce((sum, booking) => sum + receivedAmount(booking), 0);
    const b2b = completed.filter((booking) => collectionType(booking) === 'B2B Invoice').reduce((sum, booking) => sum + pendingAmount(booking), 0);
    const todayDone = completed.filter((booking) => dateKey(booking.preferred_date) === todayKey()).length;
    return { cash, card, b2b, todayDone };
  }, [managerRecords]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return managerRecords
      .filter((booking) => filterMatches(booking, filter))
      .filter((booking) => !term || [bookingCode(booking), booking.customer_name, booking.customer_phone, packageLabel(booking), collectionType(booking), booking.assigned_vehicle_name].some((value) => asText(value).toLowerCase().includes(term)))
      .sort((a, b) => asText(b.preferred_date || b.updated_at).localeCompare(asText(a.preferred_date || a.updated_at)));
  }, [filter, managerRecords, query]);

  const counts = useMemo(() => Object.fromEntries(filters.map((item) => [item.id, managerRecords.filter((booking) => filterMatches(booking, item.id)).length])) as Record<CollectionFilter, number>, [managerRecords]);

  return (
    <section className="w-full overflow-hidden px-2 py-3 sm:px-4 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Collections</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl">My collections</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Simple view for cash, card and B2B invoices from your completed rides.</p>
        </div>
        <Button type="button" variant="outline" onClick={loadCollections} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Cash in Hand" value={formatAed(metrics.cash)} icon={WalletCards} />
        <SummaryCard title="Card Collected" value={formatAed(metrics.card)} icon={CreditCard} />
        <SummaryCard title="B2B Invoice" value={formatAed(metrics.b2b)} icon={FileText} />
        <SummaryCard title="Today Done" value={String(metrics.todayDone)} icon={CheckCircle2} />
      </div>

      <Card className="mt-4 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Collection records</h2>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading...' : `Showing ${visible.length} of ${managerRecords.length}`}</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, booking..." className="h-10 rounded-full bg-white pl-9" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-y border-border/70 py-3">
            {filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${filter === item.id ? 'border-primary bg-primary text-white shadow-sm' : 'border-border bg-white text-muted-foreground'}`}>{item.label} <span className={filter === item.id ? 'text-white/80' : 'text-muted-foreground'}>{counts[item.id]}</span></button>)}
          </div>

          <div className="mt-3 grid gap-3">
            {loading ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center text-sm font-semibold text-muted-foreground">Loading collections...</div> : null}
            {!loading && visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] p-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No records found</p><p className="mt-2 text-sm text-muted-foreground">Completed rides ke baad collection records yahan show honge.</p></div> : null}
            {!loading && visible.map((booking, index) => {
              const key = String(booking.id || `${bookingCode(booking)}-${index}`);
              return <CollectionCard key={key} booking={booking} expanded={expanded === key} onToggle={() => setExpanded((current) => current === key ? '' : key)} />;
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
