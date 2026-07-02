import { supabase } from '@/lib/supabase/client';
import type { VehicleType } from '@/lib/supabase/types';

export type PublicVehicle = {
  id: string;
  name: string;
  slug: string;
  type: VehicleType;
  rental_price_aed_per_hour: number;
  sale_price_aed: number | null;
  location: string;
  is_available: boolean;
  primary_image_url: string | null;
};

export async function getPublicVehicles(type?: VehicleType): Promise<PublicVehicle[]> {
  let query = supabase
    .from('vehicles')
    .select('id,name,slug,type,rental_price_aed_per_hour,sale_price_aed,location,is_available,primary_image_url')
    .eq('is_visible_public', true)
    .order('sort_order', { ascending: true });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
