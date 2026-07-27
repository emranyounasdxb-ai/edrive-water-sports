import { supabase } from '@/lib/supabase-client';

export type B2BFinanceSummary = {
  wallet_balance_aed: number;
  wallet_credits_aed: number;
  wallet_debits_aed: number;
  pending_refunds: number;
  approved_refunds_aed: number;
  rejected_refunds: number;
};

export type B2BWalletLedgerEntry = {
  id: string;
  direction: 'credit' | 'debit';
  transaction_type: string;
  amount_aed: number;
  balance_after_aed: number;
  booking_request_id: string | null;
  refund_request_id: string | null;
  reversal_of_entry_id: string | null;
  idempotency_key?: string | null;
  actor_admin_user_id?: string | null;
  description: string;
  created_at: string;
};

export type B2BRefundRequest = {
  id: string;
  booking_request_id: string;
  b2b_agent_id: string;
  request_type: 'cancellation' | 'no_show_refund';
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  requested_amount_aed: number;
  approved_amount_aed: number | null;
  decision_note: string | null;
  requested_at: string;
  decided_at: string | null;
};

export type B2BAgentDirectoryEntry = {
  id: string;
  agent_code: string | null;
  company_name: string;
  status: string;
};

export type B2BBookingResult = {
  id: string;
  booking_code: string;
  total_amount?: number;
  amount_received_aed?: number;
};

async function rpc<T>(name: string, parameters: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) {
    throw new Error([error.message, error.details, error.hint].filter(Boolean).join(' '));
  }
  return data as T;
}

export function manageB2BAgentProfile(agentId: string | null, authUserId: string, profile: Record<string, unknown>) {
  return rpc<Record<string, unknown>>('manage_b2b_agent_profile', {
    p_agent_id: agentId,
    p_auth_user_id: authUserId,
    p_profile: profile
  });
}

export function setB2BAgentStatus(agentId: string, status: 'Active' | 'Suspended' | 'Inactive') {
  return rpc<Record<string, unknown>>('set_b2b_agent_status', {
    p_agent_id: agentId,
    p_status: status
  });
}

export function adjustB2BWallet(agentId: string, direction: 'credit' | 'debit', amountAed: number, description: string, operationKey: string) {
  return rpc<B2BWalletLedgerEntry>('adjust_b2b_wallet', {
    p_agent_id: agentId,
    p_direction: direction,
    p_amount_aed: amountAed,
    p_description: description,
    p_idempotency_key: `adjustment:${operationKey.trim()}`
  });
}

export function reverseB2BWalletEntry(ledgerEntryId: string, reason: string, operationKey: string) {
  return rpc<B2BWalletLedgerEntry>('reverse_b2b_wallet_entry', {
    p_ledger_entry_id: ledgerEntryId,
    p_reason: reason,
    p_idempotency_key: `reversal:${operationKey.trim()}`
  });
}

export function requestB2BRefund(bookingRequestId: string, reason: string, note?: string) {
  return rpc<B2BRefundRequest>('request_b2b_refund', {
    p_booking_request_id: bookingRequestId,
    p_reason: reason,
    p_note: note?.trim() || null
  });
}

export function decideB2BRefund(refundRequestId: string, decision: 'Approved' | 'Rejected', note: string) {
  return rpc<B2BRefundRequest>('decide_b2b_refund', {
    p_refund_request_id: refundRequestId,
    p_decision: decision,
    p_note: note
  });
}

export function getB2BFinanceSummary(agentId?: string | null) {
  return rpc<B2BFinanceSummary>('get_b2b_finance_summary', {
    p_agent_id: agentId || null
  });
}

export function getB2BAgentDirectory() {
  return rpc<B2BAgentDirectoryEntry[]>('get_b2b_agent_directory', {});
}

export function createB2BBooking(payload: Record<string, unknown>) {
  return rpc<B2BBookingResult>('create_b2b_booking', {
    p_booking: payload
  });
}
