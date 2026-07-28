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
      ['Today Revenue', money(sumAmounts(todayBookings, earnedRevenue))],
      ['Current Month Revenue', money(sumAmounts(bookings, earnedRevenue))],
      ['Company Received', money(sumAmounts(bookings, bookingReceived))],
      ['Total Outstanding', money(sumAmounts(bookings, totalOutstanding))],
      ['VAT Collected', money(sumAmounts(bookings, (row) => reportAmount(row.vat_amount)))],
      ['Pending Manager Settlements', money(sumAmounts(bookings, managerOutstanding))],
      ['Pending B2B Receivables', money(sumAmounts(bookings, b2bOutstanding))],
      ['Pending Direct Payments', money(sumAmounts(bookings, directOutstanding))],
      ['Pending Refund Requests', String(data?.pending_refunds ?? 0)],
      ['Combined B2B Wallet Balance', money(data?.combined_wallet_balance_aed ?? (data?.wallet_credits_aed || 0) - (data?.wallet_debits_aed || 0))]
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

  if (loading) return <section className="space-y-4 animate-pulse"><div className="h-12 w-72 rounded bg-slate-200" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <div key={i} className="h-24 rounded-3xl bg-white" />)}</div></section>;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Finance Portal</p><h1 className="mt-1 font-heading text-2xl font-semibold text-primary-900">Finance Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Revenue, collections and receivables for the current Dubai month.</p></div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" />Refresh</Button>
      </header>
      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error} <button className="ml-2 underline" onClick={() => void load()}>Retry</button></div> : null}
      {!error && !bookings.length ? <div className="rounded-2xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">No financial activity exists for the selected month.</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(([label, value]) => <Card key={label} className="rounded-2xl border-0 shadow-sm"><CardContent className="min-h-[82px] p-3.5"><p className="truncate whitespace-nowrap text-[11px] font-bold text-muted-foreground">{label}</p><p className="mt-1.5 truncate whitespace-nowrap font-heading text-xl font-semibold tabular-nums text-primary-900">{value}</p></CardContent></Card>)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><h2 className="font-heading text-lg font-semibold">Revenue trend</h2><div className="mt-5 flex h-48 items-end gap-2">{daily.length ? daily.map(([day, value]) => <div key={day} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[9px] font-bold text-muted-foreground">{money(value)}</span><div className="w-full rounded-t-lg bg-primary" style={{ height: `${Math.max(4, (value / maxDay) * 140)}px` }} /><span className="text-[9px] text-muted-foreground">{day.slice(5)}</span></div>) : <p className="m-auto text-sm text-muted-foreground">No earned revenue in this period.</p>}</div></CardContent></Card>
        <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><h2 className="font-heading text-lg font-semibold">Receivables breakdown</h2>{[
          ['Managers', sumAmounts(bookings, managerOutstanding)],
          ['B2B Agents', sumAmounts(bookings, b2bOutstanding)],
          ['Direct customers', sumAmounts(bookings, directOutstanding)]
        ].map(([label, value]) => <div key={String(label)} className="mt-3 flex justify-between rounded-2xl bg-[#F4F7F8] px-4 py-3 text-sm"><span>{label}</span><strong>{money(Number(value))}</strong></div>)}</CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><h2 className="font-heading text-lg font-semibold">Payment-method split</h2>{paymentSplit.length ? paymentSplit.map(([label, value]) => <div key={label} className="mt-3 flex justify-between rounded-2xl bg-[#F4F7F8] px-4 py-3 text-sm"><span>{uiLabel(label)}</span><strong>{money(value)}</strong></div>) : <p className="mt-4 text-sm text-muted-foreground">No collected payments in this period.</p>}</CardContent></Card>
        <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><h2 className="font-heading text-lg font-semibold">Refund queue</h2><div className="mt-3 grid grid-cols-3 gap-2">{[['Pending', data?.pending_refunds || 0], ['Approved', money(data?.approved_refunds_aed || 0)], ['Rejected', data?.rejected_refunds || 0]].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-[#F4F7F8] p-3 text-center"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}</div></CardContent></Card>
      </div>
      <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><h2 className="font-heading text-lg font-semibold">Recent receipts</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="py-2">Receipt</th><th>Source</th><th>Amount</th><th>Method</th><th>Reference</th><th>Received by</th><th>Date</th></tr></thead><tbody>{(data?.receipts || []).slice(0, 8).map((receipt) => <tr key={receipt.id} className="border-b border-border/60"><td className="py-3 font-bold">{receipt.receipt_number || receipt.id}</td><td>{receipt.source_name || uiLabel(receipt.source_type)}</td><td>{money(reportAmount(receipt.received_amount))}</td><td>{uiLabel(receipt.payment_method)}</td><td>{receipt.reference_no || '-'}</td><td>{receipt.received_by || '-'}</td><td>{receipt.received_at ? new Date(receipt.received_at).toLocaleString('en-AE') : '-'}</td></tr>)}</tbody></table></div></CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{quickLinks.map(([href, label, Icon]) => <Link key={href} href={href} className="flex items-center justify-between rounded-2xl bg-white p-4 font-bold shadow-sm"><span className="flex items-center gap-2"><Icon className="size-4 text-primary" />{label}</span><ArrowRight className="size-4" /></Link>)}</div>
    </section>
  );
}
