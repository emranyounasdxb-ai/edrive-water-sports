'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileClock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AgentEmptyState } from '@/components/edrive/agent/agent-empty-state';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { useAgentPortal } from '@/components/edrive/agent/agent-portal-provider';
import { AgentStatusBadge } from '@/components/edrive/agent/agent-status-badge';
import { Button } from '@/components/ui/button';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { safeUiError } from '@/lib/ui-labels';
import type { B2BRefundRequest } from '@/services/b2b-finance';

type Booking = { id: string; booking_code: string | null; customer_name: string | null; selected_package_name: string | null };
const filters = ['Pending', 'Approved', 'Rejected', 'All'];

export default function AgentRequestsPage() {
  const { agentId, refreshPortal } = useAgentPortal();
  const [requests, setRequests] = useState<B2BRefundRequest[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const [requestResult, bookingResult] = await Promise.all([
        supabase.from('b2b_refund_requests').select('id,booking_request_id,b2b_agent_id,request_type,status,reason,requested_amount_aed,approved_amount_aed,decision_note,requested_at,decided_at').eq('b2b_agent_id', agentId).order('requested_at', { ascending: false }),
        supabase.from('booking_requests').select('id,booking_code,customer_name,selected_package_name').eq('b2b_agent_id', agentId)
      ]);
      if (requestResult.error || bookingResult.error) throw new Error(requestResult.error?.message || bookingResult.error?.message);
      setRequests((requestResult.data || []) as B2BRefundRequest[]); setBookings(Object.fromEntries((bookingResult.data || []).map((booking: Booking) => [booking.id, booking])));
      if (refresh) await refreshPortal();
    } catch (loadError) { console.error('Partner requests load failed', loadError); setError(safeUiError(loadError, 'load')); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, [agentId]);
  const visible = useMemo(() => requests.filter((request) => filter === 'All' || request.status === filter), [requests, filter]);

  if (loading) return <><AgentPageHeader eyebrow="Requests" title="Cancellations & refunds" description="Track every cancellation and No Show refund request submitted by your company." /><RequestsSkeleton /></>;

  return <>
    <AgentPageHeader eyebrow="Requests" title="Cancellations & refunds" description="Track every cancellation and No Show refund request submitted by your company." actions={<Button variant="outline" disabled={refreshing} onClick={() => load(true)}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>} />
    {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <Button key={item} size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)} className="shrink-0">{item}<span className="rounded-full bg-black/10 px-1.5 text-[10px]">{requests.filter((request) => item === 'All' || request.status === item).length}</span></Button>)}</div>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{!visible.length ? <AgentEmptyState compact icon={FileClock} title="No requests yet" description="Cancellation and refund requests from eligible bookings will appear here." action={<Button asChild size="sm" variant="outline"><Link href="/agent/bookings">View My Bookings</Link></Button>} /> : <div className="divide-y divide-slate-100">{visible.map((request) => { const booking = bookings[request.booking_request_id]; return <article key={request.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_0.8fr_1.2fr]">
      <div><div className="flex flex-wrap items-center gap-2"><AgentStatusBadge status={request.status} /><span className="text-xs font-semibold text-slate-500">{request.request_type === 'no_show_refund' ? 'No Show Refund' : 'Cancellation'}</span></div><p className="mt-3 font-mono text-xs font-bold text-teal-700">{booking?.booking_code || request.booking_request_id}</p><p className="mt-1 text-sm font-semibold">{booking?.customer_name || '-'}</p><p className="text-xs text-slate-500">{booking?.selected_package_name || '-'}</p></div>
      <div className="min-w-0"><Label text="Reason" /><p className="mt-1 line-clamp-3 break-words text-sm leading-5 text-slate-700" title={request.reason}>{request.reason}</p>{request.decision_note ? <><Label text="Decision note" /><p className="mt-1 line-clamp-3 break-words text-sm leading-5 text-slate-700" title={request.decision_note}>{request.decision_note}</p></> : null}</div>
      <div><Label text="Requested" /><p className="mt-1 font-heading text-lg font-semibold">{formatAed(request.requested_amount_aed)}</p><Label text="Approved" /><p className="mt-1 font-heading text-lg font-semibold text-emerald-700">{request.approved_amount_aed === null ? '-' : formatAed(request.approved_amount_aed)}</p></div>
      <div className="grid grid-cols-2 gap-3"><DateItem label="Requested" value={request.requested_at} /><DateItem label="Decision" value={request.decided_at} /></div>
    </article>; })}</div>}</div>
  </>;
}
function Label({ text }: { text: string }) { return <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{text}</p>; }
function DateItem({ label, value }: { label: string; value: string | null }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xs text-slate-700">{value ? new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Awaiting decision'}</p></div>; }
function RequestsSkeleton() { return <div className="mt-4 animate-pulse space-y-4"><div className="flex gap-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-9 w-24 rounded-lg bg-slate-200" />)}</div><div className="space-y-px overflow-hidden rounded-xl border border-slate-200 bg-white">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-32 bg-slate-50" />)}</div></div>; }
