import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export async function createVehicle(payload: VehicleInsert) {
  const { data, error } = await supabase.from('vehicles').insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVehicle(vehicleId: string, payload: VehicleUpdate) {
  const { data, error } = await supabase.from('vehicles').update(payload).eq('id', vehicleId).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function archiveVehicle(vehicleId: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ is_archived: true, is_available: false, is_visible_public: false })
    .eq('id', vehicleId)
    .select('id,is_archived')
    .single();

  if (error) throw new Error(error.message);
  return data;
}
