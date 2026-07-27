'use client';

import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react';
import { AgentEmptyState } from './agent-empty-state';
import { formatAed } from '@/lib/booking-data';
import type { B2BWalletLedgerEntry } from '@/services/b2b-finance';

export function walletTransactionLabel(type: string, description = '') {
  const normalizedDescription = description.toLowerCase();
  if (type === 'adjustment_credit' && (normalizedDescription.includes('wallet funding') || normalizedDescription.includes('add wallet funds'))) return 'Wallet Top-up';
  const labels: Record<string, string> = {
    wallet_top_up: 'Wallet Top-up',
    booking_debit: 'Booking Debit',
    refund_credit: 'Refund Credit',
    adjustment_credit: 'Manual Adjustment',
    adjustment_debit: 'Manual Adjustment',
    reversal: 'Reversal'
  };
  return labels[type] || type.replaceAll('_', ' ');
}

export function AgentWalletLedger({ entries, bookingCodes = {}, compact = false }: {
  entries: B2BWalletLedgerEntry[];
  bookingCodes?: Record<string, string>;
  compact?: boolean;
}) {
  if (!entries.length) return <AgentEmptyState icon={ReceiptText} title="No wallet transactions" description="Wallet credits, booking debits and approved refund credits will appear here." />;
  return (
    <div className="divide-y divide-slate-100">
      {entries.map((entry) => {
        const credit = entry.direction === 'credit';
        return (
          <div key={entry.id} className="grid gap-2.5 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className={`flex size-9 items-center justify-center rounded-lg ${credit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{credit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{walletTransactionLabel(entry.transaction_type, entry.description)}</p>{entry.booking_request_id && bookingCodes[entry.booking_request_id] ? <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">{bookingCodes[entry.booking_request_id]}</span> : null}</div>
              <p className="mt-1 truncate text-xs text-slate-500">{entry.description}</p>
              <p className="mt-1 text-xs text-slate-400">{new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.created_at))}</p>
            </div>
            <div className="whitespace-nowrap text-left sm:text-right"><p className={`font-heading text-base font-semibold ${credit ? 'text-emerald-700' : 'text-red-700'}`}>{credit ? '+' : '-'}{formatAed(entry.amount_aed)}</p>{!compact ? <p className="mt-1 text-xs text-slate-500">Balance {formatAed(entry.balance_after_aed)}</p> : null}</div>
          </div>
        );
      })}
    </div>
  );
}
