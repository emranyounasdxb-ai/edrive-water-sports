'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, CircleX, Database, RefreshCw, ShieldCheck, Ship, UsersRound, WalletCards, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type Row = Record<string, unknown>;
type CheckStatus = 'pass' | 'warning' | 'fail';
type CheckItem = {
  id: string;
  title: string;
  detail: string;
  status: CheckStatus;
  count?: number;
};

type LoadedData = {
  bookings: Row[];
  users: Row[];
  vehicles: Row[];
  receipts: Row[];
  allocations: Row[];
  ledger: Row[];
  audit: Row[];
  errors: Record<string, string>;
  trackingReady: boolean;
};

function text(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function amount(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalized(value: unknown) {
  return text(value).toLowerCase().replace(/_/g, ' ');
}

function isCompleted(row: Row) {
  return [row.status, row.manager_status].map(normalized).includes('completed');
}

function isNoShow(row: Row) {
  return [row.status, row.manager_status, row.payment_status].map(normalized).includes('no show');
}

function isCancelled(row: Row) {
  return [row.status, row.manager_status, row.payment_status, row.payment_workflow_status].map(normalized).some((value) => value.includes('cancel'));
}

function isInProgress(row: Row) {
  return [row.status, row.manager_status].map(normalized).includes('in progress') || normalized(row.payment_workflow_status).includes('ride in progress');
}

function isConfirmed(row: Row) {
  return normalized(row.status) === 'confirmed';
}

function bookingCode(row: Row) {
  return text(row.booking_code || row.booking_number || row.id, 'Booking');
}

function sum(rows: Row[], field: string) {
  return rows.reduce((total, row) => total + amount(row[field]), 0);
}

function statusStyle(status: CheckStatus) {
  if (status === 'pass') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'pass') return <CheckCircle2 className="size-5" aria-hidden="true" />;
  if (status === 'warning') return <AlertTriangle className="size-5" aria-hidden="true" />;
  return <CircleX className="size-5" aria-hidden="true" />;
}

function Metric({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: LucideIcon }) {
  return <Card className="rounded-[1.2rem] border-border/80 bg-white shadow-[0_10px_26px_rgba(8,37,50,0.05)]"><CardContent className="flex items-start gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold text-foreground">{value}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-muted-foreground">{helper}</p></div></CardContent></Card>;
}

export function AdminWorkflowCheckPage() {
  const [data, setData] = useState<LoadedData>({ bookings: [], users: [], vehicles: [], receipts: [], allocations: [], ledger: [], audit: [], errors: {}, trackingReady: false });
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState('');

  async function runChecks() {
    setLoading(true);
    const [bookingResult, userResult, vehicleResult, receiptResult, allocationResult, ledgerResult, auditResult, trackingResult] = await Promise.all([
      supabase.from(bookingRequestsTable).select('*').order('created_at', { ascending: false }).limit(5000),
      supabase.from('admin_users').select('*').limit(500),
      supabase.from('vehicles').select('*').limit(1000),
      supabase.from('payment_receipts').select('*').limit(10000),
      supabase.from('payment_receipt_allocations').select('*').limit(20000),
      supabase.from('payment_ledger_entries').select('*').limit(30000),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.rpc('track_booking', { p_booking_code: '__WORKFLOW_CHECK__', p_contact: '__WORKFLOW_CHECK__' })
    ]);

    const errors: Record<string, string> = {};
    if (bookingResult.error) errors.bookings = bookingResult.error.message;
    if (userResult.error) errors.users = userResult.error.message;
    if (vehicleResult.error) errors.vehicles = vehicleResult.error.message;
    if (receiptResult.error) errors.receipts = receiptResult.error.message;
    if (allocationResult.error) errors.allocations = allocationResult.error.message;
    if (ledgerResult.error) errors.ledger = ledgerResult.error.message;
    if (auditResult.error) errors.audit = auditResult.error.message;
    if (trackingResult.error) errors.tracking = trackingResult.error.message;

    setData({
      bookings: (bookingResult.data || []) as Row[],
      users: (userResult.data || []) as Row[],
      vehicles: (vehicleResult.data || []) as Row[],
      receipts: (receiptResult.data || []) as Row[],
      allocations: (allocationResult.data || []) as Row[],
      ledger: (ledgerResult.data || []) as Row[],
      audit: (auditResult.data || []) as Row[],
      errors,
      trackingReady: !trackingResult.error
    });
    setCheckedAt(new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' }).format(new Date()));
    setLoading(false);
  }

  useEffect(() => { void runChecks(); }, []);

  const analysis = useMemo(() => {
    const activeManagers = data.users.filter((row) => normalized(row.role) === 'manager' && normalized(row.status) === 'active');
    const confirmedWithoutManager = data.bookings.filter((row) => isConfirmed(row) && !text(row.assigned_manager_name));
    const inProgressWithoutVehicle = data.bookings.filter((row) => isInProgress(row) && !text(row.assigned_vehicle_name));
    const completedWithoutPaymentMethod = data.bookings.filter((row) => isCompleted(row) && !isNoShow(row) && !isCancelled(row) && !text(row.payment_method));
    const invalidBalances = data.bookings.filter((row) => {
      if (isNoShow(row) || isCancelled(row)) return false;
      const total = amount(row.total_amount);
      const received = amount(row.amount_received_aed);
      const pending = amount(row.amount_pending_aed);
      return total < 0 || received < 0 || pending < 0 || received > total + 0.01 || pending > total + 0.01 || received + pending > total + 0.01;
    });
    const terminalWithBalance = data.bookings.filter((row) => (isNoShow(row) || isCancelled(row)) && (amount(row.amount_received_aed) > 0 || amount(row.amount_pending_aed) > 0));

    const codeCount = new Map<string, number>();
    data.bookings.forEach((row) => {
      const code = bookingCode(row).toLowerCase();
      codeCount.set(code, (codeCount.get(code) || 0) + 1);
    });
    const duplicateCodes = Array.from(codeCount.entries()).filter(([, count]) => count > 1);

    const receiptIds = new Set(data.receipts.map((row) => text(row.id)).filter(Boolean));
    const orphanAllocations = data.allocations.filter((row) => Boolean(text(row.receipt_id)) && !receiptIds.has(text(row.receipt_id)));
    const orphanLedger = data.ledger.filter((row) => Boolean(text(row.receipt_id)) && !receiptIds.has(text(row.receipt_id)));
    const companyLedger = data.ledger.filter((row) => normalized(row.account_type) === 'company' && normalized(row.entry_type) === 'company in');
    const receiptTotal = sum(data.receipts, 'received_amount');
    const ledgerTotal = sum(companyLedger, 'amount');
    const ledgerDifference = Math.abs(receiptTotal - ledgerTotal);

    const completed = data.bookings.filter((row) => isCompleted(row) && !isNoShow(row) && !isCancelled(row)).length;
    const inProgress = data.bookings.filter(isInProgress).length;
    const noShow = data.bookings.filter(isNoShow).length;
    const cancelled = data.bookings.filter(isCancelled).length;

    const checks: CheckItem[] = [
      { id: 'booking-table', title: 'Booking database', detail: data.errors.bookings || `${data.bookings.length} booking records are readable.`, status: data.errors.bookings ? 'fail' : 'pass' },
      { id: 'manager-access', title: 'Active managers', detail: data.errors.users || (activeManagers.length ? `${activeManagers.length} active manager account(s) available for assignment.` : 'No active manager is available for booking assignment.'), status: data.errors.users ? 'fail' : activeManagers.length ? 'pass' : 'fail', count: activeManagers.length },
      { id: 'confirmed-manager', title: 'Confirmed booking assignment', detail: confirmedWithoutManager.length ? `${confirmedWithoutManager.length} confirmed booking(s) have no assigned manager.` : 'Every confirmed booking has a manager.', status: confirmedWithoutManager.length ? 'fail' : 'pass', count: confirmedWithoutManager.length },
      { id: 'progress-vehicle', title: 'In-progress vehicle assignment', detail: inProgressWithoutVehicle.length ? `${inProgressWithoutVehicle.length} in-progress ride(s) have no assigned vehicle.` : 'Every in-progress ride has a vehicle.', status: inProgressWithoutVehicle.length ? 'fail' : 'pass', count: inProgressWithoutVehicle.length },
      { id: 'payment-method', title: 'Completed payment method', detail: completedWithoutPaymentMethod.length ? `${completedWithoutPaymentMethod.length} completed booking(s) have no payment method.` : 'Every completed booking has a payment method.', status: completedWithoutPaymentMethod.length ? 'warning' : 'pass', count: completedWithoutPaymentMethod.length },
      { id: 'balances', title: 'Payment balance integrity', detail: invalidBalances.length ? `${invalidBalances.length} booking(s) have invalid received or pending amounts.` : 'Booking payment balances are internally consistent.', status: invalidBalances.length ? 'fail' : 'pass', count: invalidBalances.length },
      { id: 'terminal-balances', title: 'No Show and cancelled balances', detail: terminalWithBalance.length ? `${terminalWithBalance.length} terminal booking(s) still contain payment amounts.` : 'No Show and cancelled bookings have no outstanding balance.', status: terminalWithBalance.length ? 'warning' : 'pass', count: terminalWithBalance.length },
      { id: 'duplicate-codes', title: 'Unique booking codes', detail: duplicateCodes.length ? `${duplicateCodes.length} duplicate booking code(s) detected.` : 'Booking codes are unique.', status: duplicateCodes.length ? 'fail' : 'pass', count: duplicateCodes.length },
      { id: 'receipt-ledger', title: 'Receipts and company ledger', detail: data.errors.receipts || data.errors.ledger || (ledgerDifference <= 0.01 ? `Receipts and company ledger match at ${formatAed(receiptTotal)}.` : `Difference detected: ${formatAed(ledgerDifference)}.`), status: data.errors.receipts || data.errors.ledger ? 'fail' : ledgerDifference <= 0.01 ? 'pass' : 'fail' },
      { id: 'allocation-links', title: 'Receipt allocation links', detail: data.errors.allocations || (orphanAllocations.length ? `${orphanAllocations.length} allocation(s) point to a missing receipt.` : 'All allocations link to saved receipts.'), status: data.errors.allocations ? 'fail' : orphanAllocations.length ? 'fail' : 'pass', count: orphanAllocations.length },
      { id: 'ledger-links', title: 'Ledger receipt links', detail: orphanLedger.length ? `${orphanLedger.length} ledger entry or entries point to a missing receipt.` : 'All receipt-linked ledger entries are valid.', status: data.errors.ledger ? 'fail' : orphanLedger.length ? 'fail' : 'pass', count: orphanLedger.length },
      { id: 'audit-log', title: 'Audit Log', detail: data.errors.audit || `${data.audit.length} recent audit event(s) are readable.`, status: data.errors.audit ? 'fail' : 'pass' },
      { id: 'tracking-rpc', title: 'Public booking tracking', detail: data.errors.tracking || 'Secure track_booking function is available.', status: data.trackingReady ? 'pass' : 'fail' },
      { id: 'fleet', title: 'Fleet database', detail: data.errors.vehicles || `${data.vehicles.length} vehicle record(s) are readable.`, status: data.errors.vehicles ? 'fail' : data.vehicles.length ? 'pass' : 'warning', count: data.vehicles.length }
    ];

    return { checks, activeManagers, confirmedWithoutManager, inProgressWithoutVehicle, invalidBalances, duplicateCodes, receiptTotal, ledgerTotal, ledgerDifference, completed, inProgress, noShow, cancelled };
  }, [data]);

  const passCount = analysis.checks.filter((item) => item.status === 'pass').length;
  const warningCount = analysis.checks.filter((item) => item.status === 'warning').length;
  const failCount = analysis.checks.filter((item) => item.status === 'fail').length;
  const overall = failCount ? 'Needs Attention' : warningCount ? 'Ready With Warnings' : 'Workflow Ready';

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Workflow Check</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">End-to-end readiness</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Read-only verification of booking, manager, fleet, payment, audit and public tracking workflows. No records are changed.</p></div>
        <Button type="button" variant="outline" onClick={runChecks} disabled={loading} className="w-fit rounded-full bg-white"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />{loading ? 'Checking...' : 'Run Checks'}</Button>
      </div>

      <div className={`mt-5 flex flex-col gap-3 rounded-[1.35rem] border p-4 sm:flex-row sm:items-center sm:justify-between ${failCount ? 'border-red-200 bg-red-50' : warningCount ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
        <div className="flex items-center gap-3"><span className={`flex size-11 items-center justify-center rounded-2xl bg-white ${failCount ? 'text-red-700' : warningCount ? 'text-amber-700' : 'text-emerald-700'}`}><ShieldCheck className="size-6" aria-hidden="true" /></span><div><p className="font-heading text-xl font-semibold text-foreground">{overall}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{checkedAt ? `Last checked ${checkedAt}` : 'Running initial checks...'}</p></div></div><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-emerald-700">{passCount} Passed</span><span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-amber-700">{warningCount} Warnings</span><span className="rounded-full border border-red-200 bg-white px-3 py-1 text-red-700">{failCount} Failed</span></div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Bookings" value={String(data.bookings.length)} helper={`${analysis.completed} completed · ${analysis.inProgress} in progress`} icon={Workflow} />
        <Metric title="Active Managers" value={String(analysis.activeManagers.length)} helper={`${analysis.confirmedWithoutManager.length} confirmed unassigned`} icon={UsersRound} />
        <Metric title="Fleet Records" value={String(data.vehicles.length)} helper={`${analysis.inProgressWithoutVehicle.length} in-progress without vehicle`} icon={Ship} />
        <Metric title="Company Received" value={formatAed(analysis.ledgerTotal)} helper={`${formatAed(analysis.ledgerDifference)} ledger difference`} icon={WalletCards} />
      </div>

      <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
        <CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="flex items-center gap-2 font-heading text-xl font-semibold"><Database className="size-5 text-primary" aria-hidden="true" />System checks</CardTitle></CardHeader>
        <CardContent className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
          {analysis.checks.map((item) => <div key={item.id} className={`rounded-[1.1rem] border p-4 ${statusStyle(item.status)}`}><div className="flex items-start gap-3"><span className="mt-0.5 shrink-0"><StatusIcon status={item.status} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-heading text-base font-semibold text-foreground">{item.title}</p>{typeof item.count === 'number' && item.count > 0 ? <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold">{item.count}</span> : null}</div><p className="mt-1 break-words text-xs font-semibold leading-5">{item.detail}</p></div></div></div>)}
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Workflow snapshot</CardTitle></CardHeader><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">Completed</p><p className="mt-2 font-heading text-2xl font-semibold text-emerald-700">{analysis.completed}</p></div><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">In Progress</p><p className="mt-2 font-heading text-2xl font-semibold text-sky-700">{analysis.inProgress}</p></div><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">No Show</p><p className="mt-2 font-heading text-2xl font-semibold text-red-700">{analysis.noShow}</p></div><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">Cancelled</p><p className="mt-2 font-heading text-2xl font-semibold text-red-700">{analysis.cancelled}</p></div></CardContent></Card>
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Open workflow pages</CardTitle></CardHeader><CardContent className="grid gap-2 p-4"><Button asChild variant="outline" className="justify-start rounded-full bg-white"><Link href="/admin/bookings">Bookings</Link></Button><Button asChild variant="outline" className="justify-start rounded-full bg-white"><Link href="/admin/payments">Payments</Link></Button><Button asChild variant="outline" className="justify-start rounded-full bg-white"><Link href="/admin/reports">Reports</Link></Button><Button asChild variant="outline" className="justify-start rounded-full bg-white"><Link href="/admin/audit-log">Audit Log</Link></Button><Button asChild variant="outline" className="justify-start rounded-full bg-white"><Link href="/my-booking">Public My Booking</Link></Button></CardContent></Card>
      </div>
    </section>
  );
}
