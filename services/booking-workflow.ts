import { supabase } from '@/lib/supabase/client';

export type B2BAgent = {
  id: string;
  portal_user_id: string | null;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  billing_email: string | null;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  credit_limit_aed: number;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CompleteBookingInput = {
  bookingId: string;
  assignedVehicleId: string;
  paymentMethod: string;
  amountReceivedAed?: number;
  paymentSource?: 'direct' | 'b2b';
  b2bAgentId?: string | null;
  managerNote?: string | null;
  providerReference?: string | null;
};

export type AdminReceivePaymentInput = {
  paymentId: string;
  note?: string | null;
};

export async function listActiveB2BAgents(): Promise<B2BAgent[]> {
  const { data, error } = await (supabase as any)
    .from('b2b_agents')
    .select('id, company_name, contact_person, email, phone, billing_email, commission_type, commission_value, credit_limit_aed, is_active, portal_user_id, created_by, updated_by, created_at, updated_at')
    .eq('is_active', true)
    .order('company_name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function completeBookingByManager(input: CompleteBookingInput) {
  const { data, error } = await (supabase as any).rpc('manager_complete_booking', {
    p_booking_id: input.bookingId,
    p_assigned_vehicle_id: input.assignedVehicleId,
    p_payment_method: input.paymentMethod,
    p_amount_received_aed: input.amountReceivedAed ?? 0,
    p_payment_source: input.paymentSource ?? 'direct',
    p_b2b_agent_id: input.b2bAgentId ?? null,
    p_manager_note: input.managerNote ?? null,
    p_provider_reference: input.providerReference ?? null
  });

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function markPaymentReceivedByAdmin(input: AdminReceivePaymentInput) {
  const { data, error } = await (supabase as any).rpc('admin_mark_payment_received', {
    p_payment_id: input.paymentId,
    p_note: input.note ?? null
  });

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function listPaymentLedger() {
  const { data, error } = await (supabase as any)
    .from('payment_ledger')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listB2BAgentPortalInvoices() {
  const { data, error } = await (supabase as any)
    .from('b2b_agent_portal_invoices')
    .select('*')
    .order('issued_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
