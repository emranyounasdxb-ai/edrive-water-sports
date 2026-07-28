'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Eye, FileSearch, RefreshCw, Search, X } from 'lucide-react';
import Link from 'next/link';
import { AgentBookingDrawer, type AgentBookingView } from '@/components/edrive/agent/agent-booking-drawer';
import { AgentDateFilterPicker } from '@/components/edrive/agent/agent-date-filter-picker';
import { AgentEmptyState } from '@/components/edrive/agent/agent-empty-state';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { useAgentPortal } from '@/components/edrive/agent/agent-portal-provider';
import { AgentRequestModal } from '@/components/edrive/agent/agent-request-modal';
import { AgentStatusBadge } from '@/components/edrive/agent/agent-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { safeUiError } from '@/lib/ui-labels';
import type { B2BRefundRequest } from '@/services/b2b-finance';

type Booking = AgentBookingView & { total_refunded_aed: number | null; payment_workflow_status: string | null };
const tabs = ['All', 'Active', 'Confirmed', 'No Show', 'Completed', 'Cancelled'];

export default function AgentBookingsPage() {
  const { agentId, refreshPortal } = useAgentPortal();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<B2BRefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [requestBooking, setRequestBooking] = useState<Booking | null>(null);

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const [bookingResult, requestResult] = await Promise.all([
        supabase.from('booking_requests').select('id,booking_code,customer_name,customer_phone,selected_package_name,selected_package_category,preferred_date,preferred_time,vehicle_quantity,guest_count,base_amount_aed,vat_amount,total_amount,amount_received_aed,amount_pending_aed,total_refunded_aed,payment_status,payment_workflow_status,status,admin_status,ride_started_at,created_at').eq('b2b_agent_id', agentId).order('created_at', { ascending: false }),
        supabase.from('b2b_refund_requests').select('id,booking_request_id,b2b_agent_id,request_type,status,reason,requested_amount_aed,approved_amount_aed,decision_note,requested_at,decided_at').eq('b2b_agent_id', agentId).order('requested_at', { ascending: false })
      ]);
      if (bookingResult.error || requestResult.error) throw new Error(bookingResult.error?.message || requestResult.error?.message);
      setBookings((bookingResult.data || []) as Booking[]); setRequests((requestResult.data || []) as B2BRefundRequest[]);
      if (refresh) await refreshPortal();
    } catch (loadError) { console.error('Partner bookings load failed', loadError); setError(safeUiError(loadError, 'load')); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, [agentId]);

  const filtered = useMemo(() => bookings.filter((booking) => {
    const value = `${booking.booking_code} ${booking.customer_name} ${booking.customer_phone} ${booking.selected_package_name}`.toLowerCase();
    const status = String(booking.status || '').toLowerCase();
    const tabMatch = tab === 'All' || (tab === 'Active' ? !['completed', 'cancelled', 'no show', 'no_show'].includes(status) : status === tab.toLowerCase());
    return value.includes(search.toLowerCase()) && tabMatch && (!dateFrom || String(booking.preferred_date) >= dateFrom) && (!dateTo || String(booking.preferred_date) <= dateTo);
  }), [bookings, search, tab, dateFrom, dateTo]);
  const filtersActive = Boolean(search || dateFrom || dateTo || tab !== 'All');
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setTab('All'); };
  const changeDateFrom = (value: string) => {
    setDateFrom(value);
    if (value && dateTo && value > dateTo) setDateTo('');
  };
  const changeDateTo = (value: string) => {
    if (value && dateFrom && value < dateFrom) return;
    setDateTo(value);
  };
  const tabCount = (item: string) => bookings.filter((booking) => {
    const status = String(booking.status || '').toLowerCase();
    return item === 'All' || (item === 'Active' ? !['completed', 'cancelled', 'no show', 'no_show'].includes(status) : status === item.toLowerCase());
  }).length;

  function latestRequest(id: string) { return requests.find((request) => request.booking_request_id === id); }
  function isEligible(booking: Booking) {
    const status = String(booking.status || '').toLowerCase();
    const request = latestRequest(booking.id);
    return !booking.ride_started_at && !['completed', 'cancelled', 'ride in progress', 'ride_in_progress'].includes(status) && (!request || request.status === 'Rejected');
  }

  if (loading) return <><AgentPageHeader eyebrow="Bookings" title="My bookings" description="Search, filter and review every booking submitted by your company." /><PageSkeleton /></>;

  return <>
    <AgentPageHeader eyebrow="Bookings" title="My bookings" description="Search, filter and review every booking submitted by your company." actions={<Button variant="outline" disabled={refreshing} onClick={() => load(true)}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>} />
    {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <Card className="mt-4 rounded-xl border-slate-200 shadow-sm"><CardContent className="p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_auto_auto_auto] lg:items-end">
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600"><span>Search</span><span className="relative"><Search className="absolute left-3 top-3 size-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Booking, customer or package" className="h-10 pl-9" /></span></label>
        <AgentDateFilterPicker label="From Date" value={dateFrom} placeholder="Select start date" maxDate={dateTo || undefined} onChange={changeDateFrom} />
        <AgentDateFilterPicker label="To Date" value={dateTo} placeholder="Select end date" minDate={dateFrom || undefined} onChange={changeDateTo} />
        <Button type="button" size="sm" variant="ghost" className="h-10 justify-self-start lg:justify-self-auto" onClick={clearFilters} disabled={!filtersActive}><X className="size-4" />Clear Filters</Button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{tabs.map((item) => <Button key={item} size="sm" variant={tab === item ? 'default' : 'outline'} onClick={() => setTab(item)} className="shrink-0">{item}<span className="rounded-full bg-black/10 px-1.5 text-[10px]">{tabCount(item)}</span></Button>)}</div>
    </CardContent></Card>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {!filtered.length ? <AgentEmptyState compact icon={FileSearch} title={filtersActive ? 'No matching bookings' : 'No bookings yet'} description={filtersActive ? 'Adjust or clear your current filters.' : 'Create your first partner booking to get started.'} action={filtersActive ? <Button size="sm" variant="outline" onClick={clearFilters}>Clear Filters</Button> : <Button asChild size="sm"><Link href="/agent/new-booking">Create Booking</Link></Button>} /> : <div className="divide-y divide-slate-100">{filtered.map((booking) => {
        const request = latestRequest(booking.id);
        return <article key={booking.id} className="grid min-w-0 gap-3 p-4 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] lg:items-center">
          <div><p className="font-mono text-xs font-bold text-teal-700">{booking.booking_code || booking.id}</p><p className="mt-1 font-semibold">{booking.customer_name || '-'}</p><p className="text-xs text-slate-500">{booking.customer_phone || '-'}</p></div>
          <div><p className="text-sm font-semibold">{booking.selected_package_name || '-'}</p><p className="mt-1 text-xs text-slate-500">{booking.vehicle_quantity || 1} vehicle(s) · {booking.guest_count || '-'} guest(s)</p></div>
          <div className="flex items-start gap-2"><CalendarRange className="mt-0.5 size-4 text-teal-700" /><div><p className="text-sm font-semibold">{booking.preferred_date || '-'}</p><p className="text-xs text-slate-500">{booking.preferred_time || '-'}</p></div></div>
          <div><p className="font-heading text-lg font-semibold">{formatAed(booking.total_amount || 0)}</p><div className="mt-1 flex flex-wrap gap-1"><AgentStatusBadge status={booking.status} />{request ? <AgentStatusBadge status={request.status} /> : null}</div></div>
          <div className="flex flex-wrap gap-2 xl:justify-end"><Button size="sm" variant="outline" onClick={() => setSelected(booking)}><Eye className="size-4" />Details</Button>{isEligible(booking) ? <Button size="sm" onClick={() => setRequestBooking(booking)}>{['no show', 'no_show'].includes(String(booking.status || '').toLowerCase()) ? 'Request Refund' : 'Request Cancellation'}</Button> : null}</div>
          {request?.status === 'Rejected' && request.decision_note ? <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 xl:col-span-5"><strong>Previous request rejected:</strong> {request.decision_note}</div> : null}
        </article>;
      })}</div>}
    </div>
    <AgentBookingDrawer booking={selected} open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} requestStatus={selected && latestRequest(selected.id) ? <AgentStatusBadge status={latestRequest(selected.id)?.status} /> : undefined} />
    <AgentRequestModal booking={requestBooking} open={Boolean(requestBooking)} onOpenChange={(open) => { if (!open) setRequestBooking(null); }} onSuccess={() => load(true)} />
  </>;
}
function PageSkeleton() { return <div className="mt-4 animate-pulse space-y-4"><div className="h-28 rounded-xl bg-white shadow-sm" /><div className="space-y-px overflow-hidden rounded-xl border border-slate-200 bg-white">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 bg-slate-50" />)}</div></div>; }
