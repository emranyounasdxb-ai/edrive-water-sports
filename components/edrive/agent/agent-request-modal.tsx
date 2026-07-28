'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatAed } from '@/lib/booking-data';
import { requestB2BRefund } from '@/services/b2b-finance';
import type { AgentBookingView } from './agent-booking-drawer';

export function AgentRequestModal({ booking, open, onOpenChange, onSuccess }: {
  booking: AgentBookingView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setReason(''); setNote(''); setError(''); } }, [open]);
  const noShow = ['no show', 'no_show'].includes(String(booking?.status || '').toLowerCase());
  const action = noShow ? 'Refund' : 'Cancellation';

  async function submit() {
    if (!booking || !reason.trim()) { setError('A clear request reason is required.'); return; }
    setSaving(true); setError('');
    try {
      await requestB2BRefund(booking.id, reason.trim(), note.trim() || undefined);
      await onSuccess();
      onOpenChange(false);
    } catch (requestError) {
      console.error('Agent request submission failed', requestError);
      setError(`The ${action.toLowerCase()} request could not be submitted. Please try again.`);
    } finally { setSaving(false); }
  }

  return <Sheet open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}><SheetContent className="sm:max-w-xl xl:max-w-[620px]">
    <SheetHeader><SheetTitle>Request {action}</SheetTitle><SheetDescription>Submit this request for Super Admin review. Approval and the final eligible amount are controlled by the secured booking workflow.</SheetDescription></SheetHeader>
    {booking ? <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:grid-cols-2">
        <Detail label="Booking" value={booking.booking_code || booking.id} /><Detail label="Customer" value={booking.customer_name || '-'} />
        <Detail label="Package" value={booking.selected_package_name || '-'} /><Detail label="Schedule" value={`${booking.preferred_date || '-'} · ${booking.preferred_time || '-'}`} />
        <Detail label="Original wallet debit" value={formatAed(booking.total_amount || 0)} /><Detail label="Eligible requested amount" value={formatAed(Math.max(Number(booking.amount_received_aed || booking.total_amount || 0), 0))} />
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">Reason <span className="font-normal text-slate-500">Required</span><Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder={`Explain why this ${action.toLowerCase()} is being requested.`} autoFocus /></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">Additional note <span className="font-normal text-slate-500">Optional</span><Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Add any useful operational context." /></label>
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-5 text-amber-900"><AlertCircle className="mt-0.5 size-5 shrink-0" /><p>Submitting does not immediately cancel the booking or credit the wallet. Super Admin approval and backend eligibility checks remain final.</p></div>
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
    </div> : null}
    <SheetFooter><Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" disabled={saving || !reason.trim()} onClick={submit}><Send className="size-4" />{saving ? 'Submitting...' : `Submit ${action} Request`}</Button></SheetFooter>
  </SheetContent></Sheet>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>; }
