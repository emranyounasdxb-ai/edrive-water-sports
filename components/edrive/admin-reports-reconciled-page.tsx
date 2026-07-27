'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Building2, CalendarDays, CheckCircle2, CreditCard, RefreshCw, Ship, UserRound, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppDatePicker } from '@/components/edrive/shared/app-date-picker';
import { formatAed } from '@/lib/booking-data';
import {
  type CompanyLedgerEntry,
  type OperationsBooking,
  b2bOutstanding,
  bookingDateKey,
  bookingPending,
  bookingReceived,
  bookingTotal,
  companyLedgerAmount,
  directOutstanding,
  dubaiTodayKey,
  earnedRevenue,
  isB2BBooking,
  isCancelled,
  isCompleted,
  isInProgress,
  isNoShow,
  managerOutstanding,
  packageName,
  reportAmount,
  reportText,
  sumAmounts
} from '@/lib/operations-reporting';
import { supabase } from '@/lib/supabase-client';

type ReceiptRow = { id: string; received_amount: number | string | null; received_at: string | null };
type VehicleRow = { id?: string | null; vehicle_code?: string | null; vehicle_name?: string | null; status?: string | null };
type FilterOption = { id: string; label: string };
type ReportFilters = {
  dateFrom: string;
  dateTo: string;
  bookingSource: string;
  bookingStatus: string;
  paymentStatus: string;
  agentId: string;
  managerId: string;
  vehicleId: string;
  packageName: string;
  vehicleType: string;
};
type ReportFilterOptions = {
  bookingStatuses: string[];
  paymentStatuses: string[];
  agents: FilterOption[];
  managers: FilterOption[];
  vehicles: FilterOption[];
  packages: string[];
};

type ReportData = {
  bookings: OperationsBooking[];
  ledger: CompanyLedgerEntry[];
  receipts: ReceiptRow[];
  vehicles: VehicleRow[];
  walletCredits: number;
  walletDebits: number;
  approvedRefunds: number;
  rejectedRefunds: number;
};

type ManagerSummary = { name: string; completed: number; inProgress: number; noShow: number; revenue: number; outstanding: number };
type PackageSummary = { name: string; rides: number; revenue: number };
type DailySummary = { date: string; requests: number; completed: number; noShow: number; cancelled: number; revenue: number };
type VehicleSummary = { name: string; rides: number; active: number; revenue: number };

function niceDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function defaultFilters(): ReportFilters {
  const today = dubaiTodayKey();
  return {
    dateFrom: `${today.slice(0, 7)}-01`,
    dateTo: today,
    bookingSource: '',
    bookingStatus: '',
    paymentStatus: '',
    agentId: '',
    managerId: '',
    vehicleId: '',
    packageName: '',
    vehicleType: ''
  };
}

function Metric({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: LucideIcon }) {
  return <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_30px_rgba(8,37,50,0.05)]"><CardContent className="flex min-w-0 items-start gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold text-foreground sm:text-2xl">{value}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-muted-foreground">{helper}</p></div></CardContent></Card>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">{text}</div>;
}

function Bar({ value, max }: { value: number; max: number }) {
  return <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAF3F4]"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(max ? (value / max) * 100 : 0, value > 0 ? 6 : 0)}%` }} /></div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs font-bold text-muted-foreground"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground outline-none focus:border-primary"><option value="">All</option>{options.map((option) => <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label>;
}

export function AdminReportsReconciledPage() {
  const [data, setData] = useState<ReportData>({ bookings: [], ledger: [], receipts: [], vehicles: [], walletCredits: 0, walletDebits: 0, approvedRefunds: 0, rejectedRefunds: 0 });
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions>({ bookingStatuses: [], paymentStatuses: [], agents: [], managers: [], vehicles: [], packages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(filters: ReportFilters) {
    setLoading(true);
    setError('');
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      setError('Date From cannot be after Date To.');
      setLoading(false);
      return;
    }
    const { data: reportData, error: reportError } = await supabase.rpc('get_edrive_report_data', {
      p_filters: {
        date_from: filters.dateFrom || null,
        date_to: filters.dateTo || null,
        booking_source: filters.bookingSource || null,
        booking_status: filters.bookingStatus || null,
        payment_status: filters.paymentStatus || null,
        agent_id: filters.agentId || null,
        manager_id: filters.managerId || null,
        vehicle_id: filters.vehicleId || null,
        package: filters.packageName || null,
        vehicle_type: filters.vehicleType || null
      }
    });
    if (reportError) {
      setError(reportError.message);
      setData({ bookings: [], ledger: [], receipts: [], vehicles: [], walletCredits: 0, walletDebits: 0, approvedRefunds: 0, rejectedRefunds: 0 });
      setLoading(false);
      return;
    }
    const result = (reportData || {}) as {
      bookings?: OperationsBooking[];
      ledger?: CompanyLedgerEntry[];
      receipts?: ReceiptRow[];
      vehicles?: VehicleRow[];
      wallet_credits_aed?: number;
      wallet_debits_aed?: number;
      approved_refunds_aed?: number;
      rejected_refunds?: number;
      filter_options?: {
        booking_statuses?: string[];
        payment_statuses?: string[];
        agents?: FilterOption[];
        managers?: FilterOption[];
        vehicles?: FilterOption[];
        packages?: string[];
      };
    };
    setData({
      bookings: result.bookings || [],
      ledger: result.ledger || [],
      receipts: result.receipts || [],
      vehicles: result.vehicles || [],
      walletCredits: Number(result.wallet_credits_aed || 0),
      walletDebits: Number(result.wallet_debits_aed || 0),
      approvedRefunds: Number(result.approved_refunds_aed || 0),
      rejectedRefunds: Number(result.rejected_refunds || 0)
    });
    setFilterOptions({
      bookingStatuses: result.filter_options?.booking_statuses || [],
      paymentStatuses: result.filter_options?.payment_statuses || [],
      agents: result.filter_options?.agents || [],
      managers: result.filter_options?.managers || [],
      vehicles: result.filter_options?.vehicles || [],
      packages: result.filter_options?.packages || []
    });
    setLoading(false);
  }

  useEffect(() => { void load(appliedFilters); }, []);

  const filteredBookings = data.bookings;
  const filteredLedger = data.ledger;
  const filteredReceipts = data.receipts;

  function updateFilter<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function updateDateFrom(value: string) {
    setDraftFilters((current) => ({
      ...current,
      dateFrom: value,
      dateTo: value && current.dateTo && value > current.dateTo ? '' : current.dateTo
    }));
  }

  function updateDateTo(value: string) {
    setDraftFilters((current) => value && current.dateFrom && value < current.dateFrom
      ? current
      : { ...current, dateTo: value });
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    void load(draftFilters);
  }

  function clearFilters() {
    const cleared = { ...defaultFilters(), dateFrom: '', dateTo: '' };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
    void load(cleared);
  }

  const totals = useMemo(() => {
    const revenue = sumAmounts(filteredBookings, earnedRevenue);
    const companyReceived = sumAmounts(filteredLedger, companyLedgerAmount);
    const receipts = filteredReceipts.reduce((sum, row) => sum + reportAmount(row.received_amount), 0);
    const managerDue = sumAmounts(filteredBookings, managerOutstanding);
    const b2bDue = sumAmounts(filteredBookings, b2bOutstanding);
    const directDue = sumAmounts(filteredBookings, directOutstanding);
    const completed = filteredBookings.filter(isCompleted).filter((row) => !isNoShow(row) && !isCancelled(row)).length;
    const noShow = filteredBookings.filter(isNoShow).length;
    const cancelled = filteredBookings.filter(isCancelled).length;
    const cash = filteredBookings.filter((row) => isCompleted(row) && !isB2BBooking(row) && reportText(row.payment_method).toLowerCase() === 'cash').reduce((sum, row) => sum + bookingReceived(row), 0);
    const card = filteredBookings.filter((row) => isCompleted(row) && !isB2BBooking(row) && reportText(row.payment_method).toLowerCase() === 'card').reduce((sum, row) => sum + bookingReceived(row), 0);
    const b2bSales = filteredBookings.filter((row) => isCompleted(row) && isB2BBooking(row)).reduce((sum, row) => sum + earnedRevenue(row), 0);
    const vat = filteredBookings.reduce((sum, row) => sum + reportAmount((row as OperationsBooking & { vat_amount?: number | string | null }).vat_amount), 0);
    return { revenue, companyReceived, receipts, managerDue, b2bDue, directDue, completed, noShow, cancelled, cash, card, b2bSales, vat };
  }, [filteredBookings, filteredLedger, filteredReceipts]);

  const managers = useMemo(() => {
    const map = new Map<string, ManagerSummary>();
    filteredBookings.forEach((booking) => {
      const name = reportText(booking.assigned_manager_name);
      if (!name) return;
      const current = map.get(name) || { name, completed: 0, inProgress: 0, noShow: 0, revenue: 0, outstanding: 0 };
      if (isCompleted(booking) && !isNoShow(booking) && !isCancelled(booking)) current.completed += 1;
      if (isInProgress(booking)) current.inProgress += 1;
      if (isNoShow(booking)) current.noShow += 1;
      current.revenue += earnedRevenue(booking);
      current.outstanding += managerOutstanding(booking);
      map.set(name, current);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings]);

  const packages = useMemo(() => {
    const map = new Map<string, PackageSummary>();
    filteredBookings.filter((row) => earnedRevenue(row) > 0).forEach((booking) => {
      const name = packageName(booking);
      const current = map.get(name) || { name, rides: 0, revenue: 0 };
      current.rides += 1;
      current.revenue += earnedRevenue(booking);
      map.set(name, current);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredBookings]);

  const daily = useMemo(() => {
    const map = new Map<string, DailySummary>();
    filteredBookings.forEach((booking) => {
      const date = bookingDateKey(booking) || 'No date';
      const current = map.get(date) || { date, requests: 0, completed: 0, noShow: 0, cancelled: 0, revenue: 0 };
      current.requests += 1;
      if (isCompleted(booking) && !isNoShow(booking) && !isCancelled(booking)) current.completed += 1;
      if (isNoShow(booking)) current.noShow += 1;
      if (isCancelled(booking)) current.cancelled += 1;
      current.revenue += earnedRevenue(booking);
      map.set(date, current);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  }, [filteredBookings]);

  const fleet = useMemo(() => {
    const map = new Map<string, VehicleSummary>();
    filteredBookings.filter((row) => isCompleted(row) || isInProgress(row)).forEach((booking) => {
      const name = reportText(booking.assigned_vehicle_name);
      if (!name) return;
      const current = map.get(name) || { name, rides: 0, active: 0, revenue: 0 };
      if (isCompleted(booking)) current.rides += 1;
      if (isInProgress(booking)) current.active += 1;
      current.revenue += earnedRevenue(booking);
      map.set(name, current);
    });
    return Array.from(map.values()).sort((a, b) => (b.rides + b.active) - (a.rides + a.active));
  }, [filteredBookings]);

  const usedVehicles = new Set(fleet.map((row) => row.name)).size;
  const fleetCoverage = data.vehicles.length ? (usedVehicles / data.vehicles.length) * 100 : 0;
  const maxPackageRevenue = Math.max(...packages.map((row) => row.revenue), 1);
  const ledgerMatches = Math.abs(totals.companyReceived - totals.receipts) < 0.01;

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Reports</p><h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Reconciled business reports</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Completed sales, collections, receivables, manager performance and fleet activity using the same rules as the operations dashboard.</p></div>
        <Button type="button" variant="outline" onClick={() => void load(appliedFilters)} disabled={loading} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      <Card className="mt-5 rounded-[1.5rem] border-border/80 bg-white shadow-[0_12px_30px_rgba(8,37,50,0.05)]">
        <CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Report filters</CardTitle></CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <AppDatePicker label="Date From" value={draftFilters.dateFrom} placeholder="Select start date" maxDate={draftFilters.dateTo || undefined} onChange={updateDateFrom} />
            <AppDatePicker label="Date To" value={draftFilters.dateTo} placeholder="Select end date" minDate={draftFilters.dateFrom || undefined} onChange={updateDateTo} />
            <FilterSelect label="Booking Source" value={draftFilters.bookingSource} onChange={(value) => updateFilter('bookingSource', value)} options={[{ value: 'direct', label: 'Direct / B2C' }, { value: 'b2b', label: 'B2B' }]} />
            <FilterSelect label="Booking Status" value={draftFilters.bookingStatus} onChange={(value) => updateFilter('bookingStatus', value)} options={filterOptions.bookingStatuses.map((value) => ({ value, label: value }))} />
            <FilterSelect label="Payment Status" value={draftFilters.paymentStatus} onChange={(value) => updateFilter('paymentStatus', value)} options={filterOptions.paymentStatuses.map((value) => ({ value, label: value }))} />
            <FilterSelect label="B2B Agent" value={draftFilters.agentId} onChange={(value) => updateFilter('agentId', value)} options={filterOptions.agents.map((option) => ({ value: option.id, label: option.label }))} />
            <FilterSelect label="Ride Manager" value={draftFilters.managerId} onChange={(value) => updateFilter('managerId', value)} options={filterOptions.managers.map((option) => ({ value: option.id, label: option.label }))} />
            <FilterSelect label="Vehicle Registration" value={draftFilters.vehicleId} onChange={(value) => updateFilter('vehicleId', value)} options={filterOptions.vehicles.map((option) => ({ value: option.id, label: option.label }))} />
            <FilterSelect label="Package" value={draftFilters.packageName} onChange={(value) => updateFilter('packageName', value)} options={filterOptions.packages.map((value) => ({ value, label: value }))} />
            <FilterSelect label="Vehicle Type" value={draftFilters.vehicleType} onChange={(value) => updateFilter('vehicleType', value)} options={[{ value: 'jet_ski', label: 'Jet Ski' }, { value: 'jet_car', label: 'Jet Car' }]} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><Button type="button" onClick={applyFilters} disabled={loading} className="rounded-full">{loading ? 'Loading...' : 'Apply Filters'}</Button><Button type="button" variant="outline" onClick={clearFilters} disabled={loading} className="rounded-full bg-white">Clear Filters</Button></div>
        </CardContent>
      </Card>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {!loading && !error && filteredBookings.length === 0 ? <div className="mt-5"><Empty text="No report data matches the applied filters." /></div> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="VAT" value={formatAed(totals.vat)} helper="VAT for filtered bookings" icon={BarChart3} />
        <Metric title="Wallet Credits" value={formatAed(data.walletCredits)} helper="Filtered B2B wallet credits" icon={WalletCards} />
        <Metric title="Wallet Debits" value={formatAed(data.walletDebits)} helper="Filtered B2B wallet debits" icon={CreditCard} />
        <Metric title="Approved Refunds" value={formatAed(data.approvedRefunds)} helper="Approved filtered refund value" icon={RefreshCw} />
        <Metric title="Rejected Refunds" value={String(data.rejectedRefunds)} helper="Rejected filtered requests" icon={RefreshCw} />
        <Metric title="Completed Revenue" value={formatAed(totals.revenue)} helper={`${totals.completed} completed rides`} icon={BarChart3} />
        <Metric title="Company Received" value={formatAed(totals.companyReceived)} helper="Company ledger credits" icon={WalletCards} />
        <Metric title="Total Outstanding" value={formatAed(totals.managerDue + totals.b2bDue + totals.directDue)} helper="Manager + B2B + direct" icon={CreditCard} />
        <Metric title="No Show / Cancelled" value={`${totals.noShow} / ${totals.cancelled}`} helper="Excluded from revenue" icon={CalendarDays} />
        <Metric title="Cash Collected" value={formatAed(totals.cash)} helper="Completed direct cash rides" icon={WalletCards} />
        <Metric title="Card Collected" value={formatAed(totals.card)} helper="Completed direct card rides" icon={CreditCard} />
        <Metric title="B2B Sales" value={formatAed(totals.b2bSales)} helper={`${formatAed(totals.b2bDue)} outstanding`} icon={Building2} />
        <Metric title="Fleet Coverage" value={`${fleetCoverage.toFixed(0)}%`} helper={`${usedVehicles} of ${data.vehicles.length} vehicles used`} icon={Ship} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Receivable breakdown</CardTitle></CardHeader><CardContent className="grid gap-3 p-4"><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">Manager settlements</p><p className="mt-2 font-heading text-xl font-semibold text-red-700">{formatAed(totals.managerDue)}</p></div><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">B2B agents</p><p className="mt-2 font-heading text-xl font-semibold text-red-700">{formatAed(totals.b2bDue)}</p></div><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">Direct customers</p><p className="mt-2 font-heading text-xl font-semibold text-red-700">{formatAed(totals.directDue)}</p></div></CardContent></Card>
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Payment split</CardTitle></CardHeader><CardContent className="grid gap-3 p-4"><div className="flex items-center justify-between rounded-2xl bg-[#F7FAFA] p-4"><span className="text-sm font-bold">Cash</span><span className="font-heading text-lg font-semibold">{formatAed(totals.cash)}</span></div><div className="flex items-center justify-between rounded-2xl bg-[#F7FAFA] p-4"><span className="text-sm font-bold">Card</span><span className="font-heading text-lg font-semibold">{formatAed(totals.card)}</span></div><div className="flex items-center justify-between rounded-2xl bg-[#F7FAFA] p-4"><span className="text-sm font-bold">B2B</span><span className="font-heading text-lg font-semibold">{formatAed(totals.b2bSales)}</span></div></CardContent></Card>
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-lg font-semibold">Ledger check</CardTitle></CardHeader><CardContent className="grid gap-3 p-4"><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">Company ledger</p><p className="mt-2 font-heading text-xl font-semibold">{formatAed(totals.companyReceived)}</p></div><div className="rounded-2xl bg-[#F7FAFA] p-4"><p className="text-xs font-bold text-muted-foreground">Saved receipts</p><p className="mt-2 font-heading text-xl font-semibold">{formatAed(totals.receipts)}</p></div><div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${ledgerMatches ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{ledgerMatches ? 'Ledger and receipts match.' : `Difference ${formatAed(Math.abs(totals.companyReceived - totals.receipts))}`}</div></CardContent></Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Manager performance</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{loading ? <Empty text="Loading manager report..." /> : null}{!loading && !managers.length ? <Empty text="No manager activity in this period." /> : managers.map((row) => <div key={row.name} className="rounded-2xl border border-border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-heading text-base font-semibold">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.completed} completed | {row.inProgress} in progress | {row.noShow} no show</p></div><p className="font-heading text-lg font-semibold text-primary">{formatAed(row.revenue)}</p></div><div className="mt-2 flex items-center justify-between rounded-xl bg-[#F7FAFA] px-3 py-2 text-xs font-semibold"><span>Outstanding settlement</span><span className={row.outstanding > 0 ? 'text-red-700' : 'text-emerald-700'}>{formatAed(row.outstanding)}</span></div></div>)}</CardContent></Card>
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Package performance</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{!loading && !packages.length ? <Empty text="No completed package sales in this period." /> : packages.map((row) => <div key={row.name} className="rounded-2xl border border-border p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">{row.name}</p><p className="text-xs text-muted-foreground">{row.rides} completed rides</p></div><p className="font-heading text-base font-semibold text-primary">{formatAed(row.revenue)}</p></div><Bar value={row.revenue} max={maxPackageRevenue} /></div>)}</CardContent></Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Daily activity</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{!loading && !daily.length ? <Empty text="No daily activity in this period." /> : daily.map((row) => <div key={row.date} className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-[1fr_0.7fr_0.8fr_0.8fr]"><div><p className="text-sm font-bold">{row.date === 'No date' ? row.date : niceDate(row.date)}</p><p className="text-xs text-muted-foreground">{row.requests} requests</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Completed</p><p className="mt-1 font-semibold">{row.completed}</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">No Show / Cancel</p><p className="mt-1 font-semibold">{row.noShow} / {row.cancelled}</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Revenue</p><p className="mt-1 font-semibold text-primary">{formatAed(row.revenue)}</p></div></div>)}</CardContent></Card>
        <Card className="rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="border-b border-border/70 bg-[#F7FAFA]"><CardTitle className="font-heading text-xl font-semibold">Fleet activity</CardTitle></CardHeader><CardContent className="grid gap-3 p-4">{!loading && !fleet.length ? <Empty text="No assigned vehicle activity in this period." /> : fleet.map((row) => <div key={row.name} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"><div><p className="text-sm font-bold">{row.name}</p><p className="text-xs text-muted-foreground">{row.rides} completed | {row.active} active</p></div><p className="font-heading text-base font-semibold text-primary">{formatAed(row.revenue)}</p></div>)}</CardContent></Card>
      </div>
    </section>
  );
}
