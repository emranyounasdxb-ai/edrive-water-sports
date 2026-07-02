import { supabase } from '@/lib/supabase/client';
import type { BookingStatus } from '@/lib/supabase/types';

export async function listBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id,booking_number,status,start_at,end_at,duration_minutes,gross_amount_aed,discount_amount_aed,net_amount_aed,vehicle_id,customer_id,created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select('id,booking_number,status')
    .single();

  if (error) throw new Error(error.message);
  return data;
}
