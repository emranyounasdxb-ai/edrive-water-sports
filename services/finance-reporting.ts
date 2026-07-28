import { supabase } from '@/lib/supabase-client';
import type { CompanyLedgerEntry, OperationsBooking } from '@/lib/operations-reporting';

export type FinanceReportFilters = {
  date_from?: string;
  date_to?: string;
  booking_source?: string;
  booking_status?: string;
  payment_status?: string;
  payment_method?: string;
  customer?: string;
  booking_reference?: string;
  agent_id?: string;
  manager_id?: string;
  vehicle_id?: string;
  package?: string;
  vehicle_type?: string;
  processed_by?: string;
  refund_status?: string;
  collection_status?: string;
  outstanding_only?: boolean;
};

export type FinanceReceipt = {
  id: string;
  receipt_number?: string | null;
  source_type?: string | null;
  source_name?: string | null;
  received_amount?: number | null;
  payment_method?: string | null;
  reference_no?: string | null;
  received_by?: string | null;
  received_at?: string | null;
};

export type FinanceWalletLedgerRow = {
  id: string;
  b2b_agent_id: string;
  b2b_agent_name?: string | null;
  direction: string;
  transaction_type: string;
  amount_aed: number;
  balance_after_aed: number;
  booking_request_id?: string | null;
  refund_request_id?: string | null;
  description?: string | null;
  created_at: string;
};

export type FinanceRefundRow = {
  id: string;
  booking_request_id: string;
  b2b_agent_id: string;
  b2b_agent_name?: string | null;
  request_type: string;
  status: string;
  requested_amount_aed: number;
  approved_amount_aed?: number | null;
  decision_note?: string | null;
  requested_at: string;
  decided_at?: string | null;
};

export type FinanceReportData = {
  bookings: OperationsBooking[];
  ledger: CompanyLedgerEntry[];
  receipts: FinanceReceipt[];
  wallet_ledger: FinanceWalletLedgerRow[];
  refunds: FinanceRefundRow[];
  wallet_credits_aed: number;
  wallet_debits_aed: number;
  approved_refunds_aed: number;
  rejected_refunds: number;
  pending_refunds?: number;
  combined_wallet_balance_aed?: number;
  filter_options: {
    booking_statuses?: string[];
    payment_statuses?: string[];
    agents?: Array<{ id: string; label: string }>;
    managers?: Array<{ id: string; label: string }>;
    vehicles?: Array<{ id: string; label: string }>;
    packages?: string[];
  };
  page?: number;
  page_size?: number;
  booking_page_count?: number;
  receipt_page_count?: number;
  ledger_page_count?: number;
  wallet_ledger_page_count?: number;
  refund_page_count?: number;
};

const emptyData: FinanceReportData = {
  bookings: [],
  ledger: [],
  receipts: [],
  wallet_ledger: [],
  refunds: [],
  wallet_credits_aed: 0,
  wallet_debits_aed: 0,
  approved_refunds_aed: 0,
  rejected_refunds: 0,
  filter_options: {}
};

function cleanFinanceFilters(filters: FinanceReportFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== false)
  );
}

async function getFinanceReportPage(filters: FinanceReportFilters, page: number, pageSize: number): Promise<FinanceReportData> {
  const { data, error } = await supabase.rpc('get_finance_portal_data', {
    p_filters: cleanFinanceFilters(filters),
    p_page: page,
    p_page_size: pageSize
  });
  if (error) throw new Error(error.message || 'Unable to load financial reporting data.');
  return { ...emptyData, ...((data || {}) as Partial<FinanceReportData>) };
}

export function getFinanceReportData(filters: FinanceReportFilters): Promise<FinanceReportData> {
  return getFinanceReportPage(filters, 0, 500);
}

export async function getAllFinanceReportData(filters: FinanceReportFilters): Promise<FinanceReportData> {
  const pageSize = 500;
  const maxPages = 200;
  const bookings: OperationsBooking[] = [];
  const receipts: FinanceReceipt[] = [];
  const ledger: CompanyLedgerEntry[] = [];
  const walletLedger: FinanceWalletLedgerRow[] = [];
  const refunds: FinanceRefundRow[] = [];
  let firstPage: FinanceReportData | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const result = await getFinanceReportPage(filters, page, pageSize);
    if (!firstPage) firstPage = result;
    bookings.push(...result.bookings);
    receipts.push(...result.receipts);
    ledger.push(...result.ledger);
    walletLedger.push(...result.wallet_ledger);
    refunds.push(...result.refunds);
    if (
      result.bookings.length < pageSize
      && result.receipts.length < pageSize
      && result.ledger.length < pageSize
      && result.wallet_ledger.length < pageSize
      && result.refunds.length < pageSize
    ) {
      return { ...result, ...firstPage, bookings, receipts, ledger, wallet_ledger: walletLedger, refunds };
    }
  }

  throw new Error('The filtered export exceeded the safe pagination limit. Narrow the report date range and try again.');
}
