import { supabase } from '@/lib/supabase/client';

export async function getBookingReport(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id,booking_number,status,start_at,end_at,gross_amount_aed,discount_amount_aed,net_amount_aed,vehicle_id')
    .gte('start_at', startDate)
    .lt('start_at', endDate)
    .order('start_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
