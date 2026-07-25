import { supabase } from '@/lib/supabase-client';

export type AssignableVehicle = {
  vehicle_id: string;
  registration_number: string;
  vehicle_code: string | null;
  vehicle_name: string | null;
  vehicle_type: string | null;
  capacity: number | null;
  status: string;
};

export type BookingAssignmentRpcResult = {
  booking_request_id?: string;
  assigned_manager_id?: string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_id?: string | null;
  assigned_vehicle_name?: string | null;
  vehicle_ids?: string[];
  vehicle_count?: number;
  status?: string;
  manager_status?: string;
  ride_started_at?: string | null;
  ride_completed_at?: string | null;
  payment_method?: string | null;
  amount_received_aed?: number;
  amount_pending_aed?: number;
  [key: string]: unknown;
};

export class BookingAssignmentError extends Error {
  constructor(message: string, readonly rpc: string) {
    super(message);
    this.name = 'BookingAssignmentError';
  }
}

async function callRpc<T>(rpc: string, parameters: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(rpc, parameters);
  if (error) {
    const detail = [error.message, error.details, error.hint].filter(Boolean).join(' ');
    throw new BookingAssignmentError(detail || `The ${rpc} request failed.`, rpc);
  }
  return data as T;
}

export function setBookingManager(bookingRequestId: string, managerId: string) {
  return callRpc<BookingAssignmentRpcResult>('set_booking_manager', {
    p_booking_request_id: bookingRequestId,
    p_manager_id: managerId
  });
}

export function getAssignableVehicles(bookingRequestId: string) {
  return callRpc<AssignableVehicle[]>('get_assignable_vehicles', {
    p_booking_request_id: bookingRequestId
  });
}

export function startBookingRide(bookingRequestId: string, vehicleIds: string[]) {
  return callRpc<BookingAssignmentRpcResult>('start_booking_ride', {
    p_booking_request_id: bookingRequestId,
    p_vehicle_ids: vehicleIds
  });
}

export function markBookingNoShow(bookingRequestId: string, reason: string, note?: string) {
  return callRpc<BookingAssignmentRpcResult>('mark_booking_no_show', {
    p_booking_request_id: bookingRequestId,
    p_reason: reason,
    p_note: note?.trim() || null
  });
}

export function completeBookingRide(
  bookingRequestId: string,
  values: {
    paymentMethod: 'Cash' | 'Card' | 'B2B Invoice';
    amountReceivedAed: number;
    cardReference?: string;
    note?: string;
  }
) {
  return callRpc<BookingAssignmentRpcResult>('complete_booking_ride', {
    p_booking_request_id: bookingRequestId,
    p_payment_method: values.paymentMethod,
    p_amount_received_aed: values.amountReceivedAed,
    p_card_reference: values.cardReference?.trim() || null,
    p_note: values.note?.trim() || null
  });
}
