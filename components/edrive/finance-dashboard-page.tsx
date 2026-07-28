'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  b2bOutstanding, bookingReceived, directOutstanding, earnedRevenue, managerOutstanding,
  reportAmount, sumAmounts, totalOutstanding
} from '@/lib/operations-reporting';
import { safeUiError, uiLabel } from '@/lib/ui-labels';
import { getFinanceReportData, type FinanceReportData } from '@/services/finance-reporting';
import { CompactKpiCard, CompactMetricStrip, CompactPageHeader } from './shared/compact-presentation';
import { DashboardActionList, DashboardActivityList, DashboardAreaChart, DashboardPanel, DashboardProgressList } from './shared/dashboard-visuals';

const money = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(value);
const dateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const monthStart = () => `${dateKey().slice(0, 7)}-01`;
const shortDate = (value: string) => new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', timeZone: 'Asia/Dubai' }).format(new Date(`${value}T12:00:00`));
const shortDateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }).format(new Date(value)) : '';

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
  const todayBookings = todayData?.bookings || [];
  const totals = {
    today: sumAmounts(todayBookings, earnedRevenue),
    month: sumAmounts(bookings, earnedRevenue),
    received: sumAmounts(bookings, bookingReceived),
    outstanding: sumAmounts(bookings, totalOutstanding),
    wallet: data?.combined_wallet_balance_aed ?? (data?.wallet_credits_aed || 0) - (data?.wallet_debits_aed || 0),
    manager: sumAmounts(bookings, managerOutstanding),
    b2b: sumAmounts(bookings, b2bOutstanding),
    direct: sumAmounts(bookings, directOutstanding),
    vat: sumAmounts(bookings, (row) => reportAmount(row.vat_amount))
  };

  const daily = useMemo(() => {
    const map = new Map<string, { revenue: number; received: number; outstanding: number }>();
    bookings.forEach((booking) => {
      const key = String(booking.preferred_date || booking.created_at || '').slice(0, 10);
      if (!key) return;
      const row = map.get(key) || { revenue: 0, received: 0, outstanding: 0 };
      row.revenue += earnedRevenue(booking);
      row.received += bookingReceived(booking);
      row.outstanding += totalOutstanding(booking);
      map.set(key, row);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  }, [bookings]);

  const paymentSplit = useMemo(() => {
    const totalsByMethod = new Map<string, number>();
    bookings.forEach((booking) => {
      const method = uiLabel(String(booking.payment_method || booking.payment_source || 'Other'));
      totalsByMethod.set(method, (totalsByMethod.get(method) || 0) + bookingReceived(booking));
    });
    return Array.from(totalsByMethod.entries()).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const attention = [
    totals.manager > 0 ? { title: 'Manager settlements pending', meta: 'Payments awaiting Ride Manager handover', value: money(totals.manager), href: '/admin/payments', tone: 'warning' as const } : null,
    totals.b2b > 0 ? { title: 'B2B receivables outstanding', meta: 'Completed partner bookings awaiting collection', value: money(totals.b2b), href: '/admin/payments', tone: 'warning' as const } : null,
    totals.direct > 0 ? { title: 'Direct balances outstanding', meta: 'Customer payments still due', value: money(totals.direct), href: '/admin/payments', tone: 'critical' as const } : null,
    (data?.pending_refunds || 0) > 0 ? { title: 'Refund decisions required', meta: 'Pending B2B refund requests', value: String(data?.pending_refunds || 0), href: '/admin/b2b-finance', tone: 'critical' as const } : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (loading) return <DashboardLoading />;

  return (
    <section className="space-y-3">
      <CompactPageHeader eyebrow="Finance" title="Finance Overview" description="Revenue, collections and receivables for the current Dubai month." actions={<Button size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="size-4" />Refresh</Button>} />
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}<Button size="sm" variant="ghost" className="ml-2" onClick={() => void load()}>Retry</Button></div> : null}

      <CompactMetricStrip>
        <CompactKpiCard label="Today" value={money(totals.today)} detail="Revenue earned today." className="ring-1 ring-primary/20" />
        <CompactKpiCard label="Month Revenue" value={money(totals.month)} detail="Revenue earned in the current Dubai month." />
        <CompactKpiCard label="Company Received" value={money(totals.received)} detail="Payments received by the company." />
        <CompactKpiCard label="Outstanding" value={money(totals.outstanding)} detail="Total receivables awaiting collection." />
        <CompactKpiCard label="Wallet Balance" value={money(totals.wallet)} detail="Combined B2B Agent wallet balance." />
      </CompactMetricStrip>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <CompactKpiCard label="Managers" value={money(totals.manager)} detail="Awaiting Ride Manager handover." />
        <CompactKpiCard label="B2B" value={money(totals.b2b)} detail="Partner receivables." />
        <CompactKpiCard label="Direct" value={money(totals.direct)} detail="Direct customer balances." />
        <CompactKpiCard label="VAT" value={money(totals.vat)} detail="VAT included in current-month bookings." />
        <CompactKpiCard label="Pending Refunds" value={String(data?.pending_refunds || 0)} detail="Refund requests awaiting a decision." />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <DashboardPanel title="Revenue & Collections" description="Daily earned revenue, company receipts and outstanding balances">
          <DashboardAreaChart labels={daily.map(([day]) => shortDate(day))} series={[
            { name: 'Earned Revenue', color: '#0f8f91', values: daily.map(([, row]) => row.revenue) },
            { name: 'Company Received', color: '#16a34a', values: daily.map(([, row]) => row.received) },
            { name: 'Outstanding', color: '#f59e0b', values: daily.map(([, row]) => row.outstanding) }
          ]} formatValue={money} ariaLabel="Daily revenue, company receipts and outstanding balances for the current Dubai month" />
        </DashboardPanel>
        <DashboardPanel title="Needs Attention" description="Financial work requiring follow-up">
          <DashboardActionList items={attention} />
        </DashboardPanel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardPanel title="Receivables Breakdown">
          <DashboardProgressList items={[
            { label: 'Managers', value: totals.manager, color: '#0f8f91' },
            { label: 'B2B Agents', value: totals.b2b, color: '#0891b2' },
            { label: 'Direct Customers', value: totals.direct, color: '#f59e0b' }
          ]} formatValue={money} empty="No receivables are outstanding." />
        </DashboardPanel>
        <DashboardPanel title="Payment Mix">
          <DashboardProgressList items={paymentSplit.map(([label, value], index) => ({ label, value, color: ['#0f8f91', '#0891b2', '#16a34a', '#f59e0b'][index % 4] }))} formatValue={money} empty="No collected payments in this period." />
        </DashboardPanel>
        <DashboardPanel title="Refund Status">
          <div className="grid grid-cols-3 divide-x divide-border/60 p-4 text-center">
            {[['Pending', data?.pending_refunds || 0], ['Approved', money(data?.approved_refunds_aed || 0)], ['Rejected', data?.rejected_refunds || 0]].map(([label, value]) => <div key={String(label)} className="px-2"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Recent Finance Activity" description="Latest receipts recorded in the company account">
        <DashboardActivityList items={(data?.receipts || []).slice(0, 6).map((receipt) => ({
          title: `${receipt.source_name || uiLabel(receipt.source_type)} · ${money(reportAmount(receipt.received_amount))}`,
          meta: `${uiLabel(receipt.payment_method)}${receipt.reference_no ? ` · ${receipt.reference_no}` : ''}`,
          time: shortDateTime(receipt.received_at),
          icon: ReceiptText,
          href: '/admin/payments'
        }))} empty="No recent finance activity is available." />
      </DashboardPanel>
    </section>
  );
}

function DashboardLoading() {
  return <section className="space-y-3 animate-pulse"><div className="h-12 w-72 rounded-xl bg-slate-200" /><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 rounded-xl bg-white" />)}</div><div className="grid gap-3 xl:grid-cols-[2fr_1fr]"><div className="h-72 rounded-2xl bg-white" /><div className="h-72 rounded-2xl bg-white" /></div></section>;
}
