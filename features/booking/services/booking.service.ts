import { supabase } from '@/lib/supabase/client';
import type { BookingFormValues } from '@/features/booking/schemas/booking.schema';
import { combineDubaiDateTime } from '@/features/booking/utils/date';
import type { BookingStatus } from '@/lib/supabase/types';

export type PublicBookingResult = {
  booking_id: string;
  booking_number: string;
  status: BookingStatus;
  gross_amount_aed: number;
  discount_amount_aed: number;
  net_amount_aed: number;
};

export async function createPublicBooking(values: BookingFormValues): Promise<PublicBookingResult> {
  const { data, error } = await supabase.rpc('create_public_booking', {
    p_full_name: values.fullName.trim(),
    p_phone: values.phone.trim(),
    p_whatsapp: values.whatsapp?.trim() || null,
    p_email: values.email?.trim() || null,
    p_country: values.country.trim(),
    p_vehicle_id: values.vehicleId,
    p_start_at: combineDubaiDateTime(values.date, values.timeSlot),
    p_duration_minutes: values.durationMinutes,
    p_special_notes: values.specialNotes?.trim() || null,
    p_coupon_code: values.couponCode?.trim() || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.[0]) {
    throw new Error('Booking could not be created.');
  }

  return data[0];
}
