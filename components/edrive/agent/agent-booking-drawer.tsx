'use client';

import { CalendarDays } from 'lucide-react';
import { formatAed } from '@/lib/booking-data';
import { AgentStatusBadge } from './agent-status-badge';
import { uiLabel } from '@/lib/ui-labels';
import {
  AppInspectorBody, AppInspectorHeader, AppInspectorRow, AppInspectorSection,
  AppInspectorSheet, AppInspectorTimeline
} from '../shared/app-inspector-sheet';

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
  return <AppInspectorSheet open={open} onOpenChange={onOpenChange} size="lg"><AppInspectorHeader eyebrow="Partner Booking" title={booking?.booking_code || 'Booking details'} description="Booking, schedule and wallet pricing details." icon={CalendarDays} badges={booking ? <div className="flex flex-wrap gap-1.5"><AgentStatusBadge status={booking.status} /><AgentStatusBadge status={booking.payment_status || 'Not Paid'} />{requestStatus}</div> : null} />{booking ? <AppInspectorBody>
    <AppInspectorSection title="Booking Details">
      <AppInspectorRow label="Customer" value={booking.customer_name || 'Not specified'} />
      <AppInspectorRow label="Phone" value={booking.customer_phone || 'Not specified'} copyable />
      <AppInspectorRow label="Scheduled Date" value={booking.preferred_date || 'Not specified'} />
      <AppInspectorRow label="Scheduled Time" value={booking.preferred_time || 'Not specified'} />
      <AppInspectorRow label="Package" value={booking.selected_package_name || 'Not specified'} />
      <AppInspectorRow label="Quantity / Guests" value={`${booking.vehicle_quantity || 1} vehicle(s) · ${booking.guest_count || '-'} guest(s)`} />
    </AppInspectorSection>
    <AppInspectorSection title="Pricing">
      <AppInspectorRow label="B2B Subtotal" value={formatAed(booking.base_amount_aed || 0)} />
      <AppInspectorRow label="VAT 5%" value={formatAed(booking.vat_amount || 0)} />
      <AppInspectorRow label="Wallet Debit" value={formatAed(booking.total_amount || 0)} />
      <AppInspectorRow label="Paid" value={formatAed(booking.amount_received_aed || 0)} />
      <AppInspectorRow label="Pending" value={formatAed(booking.amount_pending_aed || 0)} />
    </AppInspectorSection>
    <AppInspectorSection title="Timeline"><AppInspectorTimeline items={[{ label: 'Booking submitted', time: displayTimeline(booking.created_at) }, { label: 'Booking status', time: uiLabel(booking.status) }, { label: 'Ride started', time: displayTimeline(booking.ride_started_at || 'Not started') }]} /></AppInspectorSection>
  </AppInspectorBody> : null}</AppInspectorSheet>;
}

function displayTimeline(value: string | null) { return value ? (value.includes('T') ? new Date(value).toLocaleString('en-AE') : value) : 'Not specified'; }
