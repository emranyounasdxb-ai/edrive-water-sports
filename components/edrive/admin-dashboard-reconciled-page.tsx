'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Building2, CalendarDays, CheckCircle2, ClipboardCheck, CreditCard, RefreshCw, Ship, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import {
  type CompanyLedgerEntry,
  type OperationsBooking,
  b2bOutstanding,
  bookingCode,
  bookingDateKey,
  bookingStage,
  bookingTotal,
  companyLedgerAmount,
  directOutstanding,
  dubaiTodayKey,
  earnedRevenue,
  isCancelled,
  isCompleted,
  isInProgress,
  isNoShow,
  isPendingRequest,
  managerOutstanding,
  packageName,
  reportAmount,
  reportText,
  sumAmounts
} from '@/lib/operations-reporting';
import { supabase } from '@/lib/supabase-client';

type ReceiptRow = { id: string; received_amount: number | string | null };

type DashboardData = {
  bookings: OperationsBooking[];
  ledger: CompanyLedgerEntry[];
  receipts: ReceiptRow[];
};

function niceDate(value: unknown) {
  const clean = reportText(value);
  if (!clean) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00`));
}

function stageTone(stage: string) {
  const clean = stage.toLowerCase();
  if (clean === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (clean === 'in progress') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (clean === 'assigned' || clean === 'confirmed') return 'border-primary/25 bg-primary-50 text-primary';
  if (clean === 'no show' || clean === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function Metric({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: LucideIcon }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_30px_rgba(8,37,50,0.05)]">
      <CardContent className="flex min-w-0 items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold text-foreground sm:text-2xl">{value}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-muted-foreground">{helper}</p></div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardReconciledPage() {
  const [data, setData] = useState<DashboardData>({ bookings: [], ledger: [], receipts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const [bookingResult, ledgerResult, receiptResult] = await Promise.all([
      supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('payment_ledger_entries').select('id,receipt_id,booking_code,account_type,account_name,entry_type,amount,narration,created_at').eq('account_type', 'company').eq('entry_type', 'company_in').order('created_at', { ascending: false }).limit(5000),
      supabase.from('payment_receipts').select('id,received_amount').order('received_at', { ascending: false }).limit(5000)
    ]);

    const firstError = bookingResult.error || ledgerResult.error || receiptResult.error;
    if (firstError) setError(firstError.message);
    setData({
      bookings: (bookingResult.data || []) as OperationsBooking[],
      ledger: (ledgerResult.data || []) as CompanyLedgerEntry[],
      receipts: (receiptResult.data || []) as ReceiptRow[]
    });
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const summary = useMemo(() => {
    const today = dubaiTodayKey();
    const todayRows = data.bookings.filter((booking) => bookingDateKey(booking) === today);
    const activeToday = todayRows.filter((booking) => !isCancelled(booking) && !isNoShow(booking));
    const needsAction = data.bookings.filter(isPendingRequest).length;
    const inProgress = data.bookings.filter(isInProgress).length;
    const completedToday = todayRows.filter(isCompleted).length;
    const noShowToday = todayRows.filter(isNoShow).length;
    const revenue = sumAmounts(data.bookings, earnedRevenue);
    const managerDue = sumAmounts(data.bookings, managerOutstanding);
    const b2bDue = sumAmounts(data.bookings, b2bOutstanding);
    const directDue = sumAmounts(data.bookings, directOutstanding);
    const companyReceived = sumAmounts(data.ledger, companyLedgerAmount);
    const receiptsTotal = data.receipts.reduce((sum, receipt) => sum + reportAmount(receipt.received_amount), 0);
    return { todayRides: activeToday.length, needsAction, inProgress, completedToday, noShowToday, revenue, managerDue, b2bDue, directDue, companyReceived, receiptsTotal };
  }, [data]);

  const recent = data.bookings.slice(0, 10);
  const ledgerMatchesReceipts = Math.abs(summary.companyReceived - summary.receiptsTotal) < 0.01;

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Dashboard</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Operations overview</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Live operational, receivable and company ledger figures using one reconciled calculation standard.</p></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={load} className="rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button><Button asChild className="rounded-full"><Link href="/admin/bookings">Open Bookings</Link></Button></div>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Needs Action" value={String(summary.needsAction)} helper="Pending or confirmed without manager" icon={CalendarDays} />
        <Metric title="Today Rides" value={String(summary.todayRides)} helper={`${summary.completedToday} completed · ${summary.noShowToday} no show`} icon={ClipboardCheck} />
        <Metric title="In Progress" value={String(summary.inProgress)} helper="Rides currently started" icon={Ship} />
        <Metric title="Completed Revenue" value={formatAed(summary.revenue)} helper="Completed rides only" icon={CheckCircle2} />
        <Metric title="Manager Outstanding" value={formatAed(summary.managerDue)} helper="Cash/card awaiting admin settlement" icon={WalletCards} />
        <Metric title="B2B Outstanding" value={formatAed(summary.b2bDue)} helper="Completed B2B balances" icon={Building2} />
        <Metric title="Direct Outstanding" value={formatAed(summary.directDue)} helper="Unpaid customer balance" icon={CreditCard} />
        <Metric title="Company Received" value={formatAed(summary.companyReceived)} helper="Company ledger credits only" icon={WalletCards} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card className="overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Recent operations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader><TableRow><TableHead>Booking</TableHead><TableHead>Customer / Package</TableHead><TableHead>Schedule</TableHead><TableHead>Manager</TableHead><TableHead>Total</TableHead><TableHead>Stage</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading dashboard...</TableCell></TableRow> : null}
                  {!loading && !recent.length ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No booking records.</TableCell></TableRow> : null}
                  {recent.map((booking) => { const stage = bookingStage(booking); return <TableRow key={reportText(booking.id || bookingCode(booking))}><TableCell><p className="font-mono text-xs font-bold text-primary">{bookingCode(booking)}</p></TableCell><TableCell><p className="font-semibold text-foreground">{reportText(booking.customer_name, 'Guest')}</p><p className="text-xs text-muted-foreground">{packageName(booking)}</p></TableCell><TableCell><p className="font-semibold text-foreground">{niceDate(booking.preferred_date)}</p><p className="text-xs text-muted-foreground">{reportText(booking.preferred_time, '-')}</p></TableCell><TableCell>{reportText(booking.assigned_manager_name, 'Unassigned')}</TableCell><TableCell className="font-semibold">{formatAed(bookingTotal(booking))}</TableCell><TableCell><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${stageTone(stage)}`}>{stage}</span></TableCell></TableRow>; })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Financial reconciliation</CardTitle></CardHeader>
          <CardContent className="grid gap-3 p-4">
            <div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Completed Sales</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{formatAed(summary.revenue)}</p><p className="mt-1 text-xs text-muted-foreground">Cancelled and No Show excluded.</p></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border p-4"><p className="text-xs font-bold text-muted-foreground">Total Outstanding</p><p className="mt-2 font-heading text-xl font-semibold text-red-700">{formatAed(summary.managerDue + summary.b2bDue + summary.directDue)}</p></div><div className="rounded-2xl border border-border p-4"><p className="text-xs font-bold text-muted-foreground">Saved Receipts</p><p className="mt-2 font-heading text-xl font-semibold text-emerald-700">{formatAed(summary.receiptsTotal)}</p></div></div>
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${ledgerMatchesReceipts ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{ledgerMatchesReceipts ? 'Company ledger and saved receipts match.' : `Ledger difference: ${formatAed(Math.abs(summary.companyReceived - summary.receiptsTotal))}`}</div>
            <Button asChild variant="outline" className="rounded-full bg-white"><Link href="/admin/payments">Open Payments</Link></Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
