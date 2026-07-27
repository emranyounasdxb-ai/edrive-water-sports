'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileClock, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AgentEmptyState } from '@/components/edrive/agent/agent-empty-state';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { AgentPortalShell, type AgentPortalProfile } from '@/components/edrive/agent/agent-portal-shell';
import { AgentStatusBadge } from '@/components/edrive/agent/agent-status-badge';
import { Button } from '@/components/ui/button';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { getB2BFinanceSummary, type B2BRefundRequest } from '@/services/b2b-finance';

type Booking = { id: string; booking_code: string | null; customer_name: string | null; selected_package_name: string | null };
const filters = ['Pending', 'Approved', 'Rejected', 'All'];

export default function AgentRequestsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentPortalProfile | null>(null);
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<B2BRefundRequest[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) { router.replace('/admin/login'); return; }
      const profileResult = await supabase.from('b2b_agents').select('id,agent_code,company_name,contact_person,status').eq('auth_user_id', session.session.user.id).maybeSingle();
      if (profileResult.error) throw new Error(profileResult.error.message);
      const next = profileResult.data as AgentPortalProfile | null;
      if (!next || String(next.status).toLowerCase() !== 'active') throw new Error('An active B2B Agent profile is required.');
      const [summary, requestResult, bookingResult] = await Promise.all([
        getB2BFinanceSummary(),
        supabase.from('b2b_refund_requests').select('id,booking_request_id,b2b_agent_id,request_type,status,reason,requested_amount_aed,approved_amount_aed,decision_note,requested_at,decided_at').eq('b2b_agent_id', next.id).order('requested_at', { ascending: false }),
        supabase.from('booking_requests').select('id,booking_code,customer_name,selected_package_name').eq('b2b_agent_id', next.id)
      ]);
      if (requestResult.error || bookingResult.error) throw new Error(requestResult.error?.message || bookingResult.error?.message);
      setProfile(next); setBalance(summary.wallet_balance_aed); setRequests((requestResult.data || []) as B2BRefundRequest[]); setBookings(Object.fromEntries((bookingResult.data || []).map((booking: Booking) => [booking.id, booking])));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load requests.'); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => requests.filter((request) => filter === 'All' || request.status === filter), [requests, filter]);

  if (loading) return <div className="min-h-screen animate-pulse bg-slate-50 p-6"><div className="mx-auto h-96 max-w-6xl rounded-2xl bg-slate-200" /></div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-red-700">{error || 'Request access unavailable.'}</div>;

  return <AgentPortalShell profile={profile} walletBalance={balance}>
    <AgentPageHeader eyebrow="Requests" title="Cancellations & refunds" description="Track every cancellation and No Show refund request submitted by your company." actions={<Button variant="outline" disabled={refreshing} onClick={() => load(true)}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>} />
    {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <div className="mt-4 flex gap-2 overflow-x-auto">{filters.map((item) => <Button key={item} size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)}>{item}<span className="ml-1 rounded-full bg-black/10 px-1.5 text-[10px]">{requests.filter((request) => item === 'All' || request.status === item).length}</span></Button>)}</div>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">{!visible.length ? <AgentEmptyState icon={FileClock} title={`No ${filter.toLowerCase()} requests`} description="Requests submitted from an eligible booking will appear here." /> : <div className="divide-y divide-slate-100">{visible.map((request) => { const booking = bookings[request.booking_request_id]; return <article key={request.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_0.8fr_1.2fr]">
      <div><div className="flex flex-wrap items-center gap-2"><AgentStatusBadge status={request.status} /><span className="text-xs font-semibold text-slate-500">{request.request_type === 'no_show_refund' ? 'No Show Refund' : 'Cancellation'}</span></div><p className="mt-3 font-mono text-xs font-bold text-teal-700">{booking?.booking_code || request.booking_request_id}</p><p className="mt-1 text-sm font-semibold">{booking?.customer_name || '-'}</p><p className="text-xs text-slate-500">{booking?.selected_package_name || '-'}</p></div>
      <div><Label text="Reason" /><p className="mt-1 text-sm leading-6 text-slate-700">{request.reason}</p>{request.decision_note ? <><Label text="Decision note" /><p className="mt-1 text-sm leading-6 text-slate-700">{request.decision_note}</p></> : null}</div>
      <div><Label text="Requested" /><p className="mt-1 font-heading text-lg font-semibold">{formatAed(request.requested_amount_aed)}</p><Label text="Approved" /><p className="mt-1 font-heading text-lg font-semibold text-emerald-700">{request.approved_amount_aed === null ? '-' : formatAed(request.approved_amount_aed)}</p></div>
      <div className="grid grid-cols-2 gap-3"><DateItem label="Requested" value={request.requested_at} /><DateItem label="Decision" value={request.decided_at} /></div>
    </article>; })}</div>}</div>
  </AgentPortalShell>;
}
function Label({ text }: { text: string }) { return <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{text}</p>; }
function DateItem({ label, value }: { label: string; value: string | null }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xs text-slate-700">{value ? new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Awaiting decision'}</p></div>; }
