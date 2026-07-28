'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CreditCard, FileBarChart, RefreshCw, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  b2bOutstanding, bookingReceived, directOutstanding, earnedRevenue, managerOutstanding,
  reportAmount, sumAmounts, totalOutstanding, type OperationsBooking
} from '@/lib/operations-reporting';
import { getFinanceReportData, type FinanceReportData } from '@/services/finance-reporting';
import type { LucideIcon } from 'lucide-react';
import { safeUiError, uiLabel } from '@/lib/ui-labels';
import { CompactEmptyState, CompactKpiCard, CompactMetricStrip, CompactPageHeader } from './shared/compact-presentation';

const money = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(value);
const dateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const monthStart = () => `${dateKey().slice(0, 7)}-01`;
const quickLinks: Array<[string, string, LucideIcon]> = [
  ['/admin/payments', 'Payments & Collections', CreditCard],
  ['/admin/b2b-finance', 'B2B Finance', WalletCards],
  ['/admin/reports', 'Financial Reports', FileBarChart],
  ['/admin/finance-bookings', 'Financial Bookings', ArrowRight]
];

export function FinanceDashboardPage() {
  const [data, setData] = useState<FinanceReportData | null>(null);
  const [todayData, setTodayData] = useState<FinanceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [month, today] = await Promise.all([
        getFinanceReportData({ date_from: monthStart(), date_to: dateKey() }),
        getFinanceReportData({ date_from: dateKey(), date_to: dateKey() })
      ]);
      setData(month);
      setTodayData(today);
    } catch (cause) {
      console.error('Finance dashboard load failed', cause);
      setError(safeUiError(cause, 'load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const bookings = data?.bookings || [];
  const metrics = useMemo(() => {
    const todayBookings = todayData?.bookings || [];
    return [
      ['Today', money(sumAmounts(todayBookings, earnedRevenue)), 'Revenue earned today.'],
      ['Month', money(sumAmounts(bookings, earnedRevenue)), 'Revenue earned in the current Dubai month.'],
      ['Received', money(sumAmounts(bookings, bookingReceived)), 'Payments received by the company.'],
      ['Outstanding', money(sumAmounts(bookings, totalOutstanding)), 'Total receivables awaiting collection.'],
      ['VAT', money(sumAmounts(bookings, (row) => reportAmount(row.vat_amount))), 'VAT included in current-month bookings.'],
      ['Managers', money(sumAmounts(bookings, managerOutstanding)), 'Payments awaiting Ride Manager handover.'],
      ['B2B', money(sumAmounts(bookings, b2bOutstanding)), 'Outstanding B2B Agent receivables.'],
      ['Direct', money(sumAmounts(bookings, directOutstanding)), 'Outstanding direct customer payments.'],
      ['Refunds', String(data?.pending_refunds ?? 0), 'Refund requests awaiting a decision.'],
      ['Wallet', money(data?.combined_wallet_balance_aed ?? (data?.wallet_credits_aed || 0) - (data?.wallet_debits_aed || 0)), 'Combined balance across B2B Agent wallets.']
    ];
  }, [bookings, data, todayData]);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((booking) => {
      const key = String(booking.preferred_date || booking.created_at || '').slice(0, 10);
      if (key) map.set(key, (map.get(key) || 0) + earnedRevenue(booking));
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  }, [bookings]);
  const maxDay = Math.max(...daily.map(([, value]) => value), 1);
  const paymentSplit = useMemo(() => {
    const totals = new Map<string, number>();
    bookings.forEach((booking) => {
      const method = String(booking.payment_method || booking.payment_source || 'Other');
      totals.set(method, (totals.get(method) || 0) + bookingReceived(booking));
    });
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  if (loading) return <section className="space-y-3 animate-pulse"><div className="h-10 w-64 rounded bg-slate-200" /><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <div key={i} className="h-14 rounded-xl bg-white" />)}</div></section>;

  return (
    <section className="space-y-4">
      <CompactPageHeader eyebrow="Finance" title="Finance Dashboard" description="Revenue, collections and receivables for the current Dubai month." actions={<Button size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="size-4" />Refresh</Button>} />
      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error} <button className="ml-2 underline" onClick={() => void load()}>Retry</button></div> : null}
      {!error && !bookings.length ? <CompactEmptyState>No financial activity for the selected month.</CompactEmptyState> : null}
      <CompactMetricStrip>{metrics.map(([label, value, detail]) => <CompactKpiCard key={label} label={label} value={value} detail={detail} />)}</CompactMetricStrip>
      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><h2 className="font-heading text-base font-semibold">Revenue trend</h2><div className="mt-3 flex h-44 items-end gap-2">{daily.length ? daily.map(([day, value]) => <div key={day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5"><span className="text-[9px] font-bold text-muted-foreground">{money(value)}</span><div className="w-full rounded-t-md bg-primary" style={{ height: `${Math.max(4, (value / maxDay) * 128)}px` }} /><span className="text-[9px] text-muted-foreground">{day.slice(5)}</span></div>) : <p className="m-auto text-xs text-muted-foreground">No earned revenue in this period.</p>}</div></CardContent></Card>
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><h2 className="font-heading text-base font-semibold">Receivables</h2>{[
          ['Managers', sumAmounts(bookings, managerOutstanding)],
          ['B2B Agents', sumAmounts(bookings, b2bOutstanding)],
          ['Direct customers', sumAmounts(bookings, directOutstanding)]
        ].map(([label, value]) => <div key={String(label)} className="mt-2 flex min-h-9 items-center justify-between rounded-xl bg-[#F4F7F8] px-3 py-2 text-xs"><span>{label}</span><strong>{money(Number(value))}</strong></div>)}</CardContent></Card>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><h2 className="font-heading text-base font-semibold">Payment methods</h2>{paymentSplit.length ? paymentSplit.map(([label, value]) => <div key={label} className="mt-2 flex min-h-9 items-center justify-between rounded-xl bg-[#F4F7F8] px-3 py-2 text-xs"><span>{uiLabel(label)}</span><strong>{money(value)}</strong></div>) : <CompactEmptyState className="mt-2">No collected payments in this period.</CompactEmptyState>}</CardContent></Card>
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><h2 className="font-heading text-base font-semibold">Refund status</h2><div className="mt-2 grid grid-cols-3 divide-x rounded-xl bg-[#F4F7F8]">{[['Pending', data?.pending_refunds || 0], ['Approved', money(data?.approved_refunds_aed || 0)], ['Rejected', data?.rejected_refunds || 0]].map(([label, value]) => <div key={String(label)} className="px-2 py-2 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-bold">{value}</p></div>)}</div></CardContent></Card>
      </div>
      <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><h2 className="font-heading text-base font-semibold">Recent receipts</h2>{(data?.receipts || []).length ? <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr className="border-b text-[10px] text-muted-foreground"><th className="py-2">Receipt</th><th>Source</th><th>Amount</th><th>Method</th><th>Reference</th><th>Received by</th><th>Date</th></tr></thead><tbody>{(data?.receipts || []).slice(0, 8).map((receipt) => <tr key={receipt.id} className="border-b border-border/60"><td className="py-2 font-bold">{receipt.receipt_number || receipt.id}</td><td>{receipt.source_name || uiLabel(receipt.source_type)}</td><td>{money(reportAmount(receipt.received_amount))}</td><td>{uiLabel(receipt.payment_method)}</td><td>{receipt.reference_no || '-'}</td><td>{receipt.received_by || '-'}</td><td>{receipt.received_at ? new Date(receipt.received_at).toLocaleString('en-AE') : '-'}</td></tr>)}</tbody></table></div> : <CompactEmptyState className="mt-2">No recent receipts available.</CompactEmptyState>}</CardContent></Card>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{quickLinks.map(([href, label, Icon]) => <Link key={href} href={href} className="flex min-h-10 items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs font-bold shadow-sm"><span className="flex items-center gap-2"><Icon className="size-4 text-primary" />{label}</span><ArrowRight className="size-4" /></Link>)}</div>
    </section>
  );
}
