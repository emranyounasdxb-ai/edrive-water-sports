'use client';

import { CalendarDays, Clock3, UserRound, WalletCards } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatAed } from '@/lib/booking-data';
import { AgentStatusBadge } from './agent-status-badge';

export type AgentBookingView = {
  id: string; booking_code: string | null; customer_name: string | null; customer_phone: string | null;
  selected_package_name: string | null; selected_package_category?: string | null; preferred_date: string | null;
  preferred_time: string | null; vehicle_quantity: number | null; guest_count?: number | null; base_amount_aed: number | null;
  vat_amount: number | null; total_amount: number | null; amount_received_aed?: number | null; amount_pending_aed?: number | null;
  payment_status?: string | null; status: string | null; admin_status?: string | null; ride_started_at?: string | null;
  created_at: string | null;
};

export function AgentBookingDrawer({ booking, open, onOpenChange, requestStatus }: {
  booking: AgentBookingView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestStatus?: React.ReactNode;
}) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="sm:max-w-xl xl:max-w-[620px]"><SheetHeader><SheetTitle>{booking?.booking_code || 'Booking details'}</SheetTitle><SheetDescription>Booking, schedule and wallet pricing details.</SheetDescription></SheetHeader>{booking ? <div className="flex-1 space-y-4 overflow-y-auto p-4">
    <div className="flex flex-wrap gap-2"><AgentStatusBadge status={booking.status} /><AgentStatusBadge status={booking.payment_status || 'Not Paid'} />{requestStatus}</div>
    <section className="grid gap-3 sm:grid-cols-2">
      <Info icon={UserRound} label="Customer" value={booking.customer_name || '-'} detail={booking.customer_phone || undefined} />
      <Info icon={CalendarDays} label="Scheduled date" value={booking.preferred_date || '-'} />
      <Info icon={Clock3} label="Scheduled time" value={booking.preferred_time || '-'} />
      <Info icon={WalletCards} label="Package" value={booking.selected_package_name || '-'} detail={`${booking.vehicle_quantity || 1} vehicle(s) · ${booking.guest_count || '-'} guest(s)`} />
    </section>
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"><h3 className="font-semibold">Pricing breakdown</h3><Price label="B2B subtotal" value={booking.base_amount_aed || 0} /><Price label="VAT 5%" value={booking.vat_amount || 0} /><Price label="Total wallet debit" value={booking.total_amount || 0} strong /><Price label="Paid" value={booking.amount_received_aed || 0} /><Price label="Pending" value={booking.amount_pending_aed || 0} /></section>
    <section className="rounded-xl border border-slate-200 p-3.5"><h3 className="font-semibold">Booking timeline</h3><Timeline label="Booking submitted" value={booking.created_at} /><Timeline label="Booking status" value={booking.status} /><Timeline label="Ride started" value={booking.ride_started_at || 'Not started'} /></section>
  </div> : null}</SheetContent></Sheet>;
}

function Info({ icon: Icon, label, value, detail }: { icon: typeof UserRound; label: string; value: string; detail?: string }) {
  return <div className="rounded-xl border border-slate-200 p-3.5"><Icon className="size-4 text-teal-700" /><p className="mt-2 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p>{detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}</div>;
}
function Price({ label, value, strong }: { label: string; value: number; strong?: boolean }) { return <div className={`mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm ${strong ? 'font-bold text-slate-950' : 'text-slate-600'}`}><span>{label}</span><span>{formatAed(value)}</span></div>; }
function Timeline({ label, value }: { label: string; value: string | null }) { return <div className="relative ml-2 border-l border-teal-200 py-2 pl-5 before:absolute before:-left-1 before:top-4 before:size-2 before:rounded-full before:bg-teal-600"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="text-sm font-medium text-slate-900">{value ? (value.includes('T') ? new Date(value).toLocaleString('en-AE') : value) : '-'}</p></div>; }
