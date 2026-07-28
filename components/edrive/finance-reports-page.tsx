'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppDatePicker } from './shared/app-date-picker';
import { usePortalAccess } from './portal-access';
import {
  b2bOutstanding, bookingCode, bookingPending, bookingReceived, bookingTotal, earnedRevenue,
  managerOutstanding, packageName, reportAmount, sumAmounts, type OperationsBooking
} from '@/lib/operations-reporting';
import { exportFinanceCsv, exportFinancePdf, type ExportColumn } from '@/lib/finance-report-export';
import { getAllFinanceReportData, getFinanceReportData, type FinanceReportData, type FinanceReportFilters } from '@/services/finance-reporting';

const reportTypes = ['Financial Summary', 'Daily Collection Report', 'Revenue Report', 'Payment Transaction Report', 'Outstanding Receivables Report', 'VAT Report', 'Refund Report', 'B2B Wallet Ledger Report', 'B2B Agent Sales Report', 'Package Revenue Report', 'Jet Ski vs Jet Car Revenue Report', 'Customer Payment Statement', 'User / Cashier Collection Report', 'Monthly Financial Summary'];
const money = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(value);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const initial = (): FinanceReportFilters => ({ date_from: `${today().slice(0, 7)}-01`, date_to: today() });
const bookingColumns: ExportColumn<OperationsBooking>[] = [
  { heading: 'Booking Reference', value: bookingCode }, { heading: 'Date', value: (row) => String(row.preferred_date || row.created_at || '').slice(0, 10) },
  { heading: 'Customer', value: (row) => String(row.customer_name || '-') }, { heading: 'Package', value: packageName },
  { heading: 'Source', value: (row) => String(row.booking_source || row.source || '-') }, { heading: 'Status', value: (row) => String(row.status || '-') },
  { heading: 'Payment Method', value: (row) => String(row.payment_method || '-') }, { heading: 'Payment Status', value: (row) => String(row.payment_status || '-') },
  { heading: 'Total AED', value: bookingTotal }, { heading: 'Received AED', value: bookingReceived }, { heading: 'Outstanding AED', value: bookingPending },
  { heading: 'VAT AED', value: (row) => reportAmount(row.vat_amount) }, { heading: 'Refunded AED', value: (row) => reportAmount(row.total_refunded_aed) }
];
type GenericExportRow = Record<string, unknown>;
const receiptColumns: ExportColumn<GenericExportRow>[] = [
  { heading: 'Receipt', value: (row) => String(row.receipt_number || row.id || '-') },
  { heading: 'Source', value: (row) => String(row.source_name || row.source_type || '-') },
  { heading: 'Amount AED', value: (row) => Number(row.received_amount || 0) },
  { heading: 'Method', value: (row) => String(row.payment_method || '-') },
  { heading: 'Reference', value: (row) => String(row.reference_no || '-') },
  { heading: 'Processed By', value: (row) => String(row.received_by || '-') },
  { heading: 'Received At', value: (row) => String(row.received_at || '-') }
];
const ledgerColumns: ExportColumn<GenericExportRow>[] = [
  { heading: 'Booking', value: (row) => String(row.booking_code || '-') },
  { heading: 'Account', value: (row) => String(row.account_name || '-') },
  { heading: 'Entry Type', value: (row) => String(row.entry_type || '-') },
  { heading: 'Amount AED', value: (row) => Number(row.amount || 0) },
  { heading: 'Narration', value: (row) => String(row.narration || '-') },
  { heading: 'Created At', value: (row) => String(row.created_at || '-') }
];
const walletColumns: ExportColumn<GenericExportRow>[] = [
  { heading: 'Agent', value: (row) => String(row.b2b_agent_name || row.b2b_agent_id || '-') },
  { heading: 'Direction', value: (row) => String(row.direction || '-') },
  { heading: 'Transaction Type', value: (row) => String(row.transaction_type || '-') },
  { heading: 'Amount AED', value: (row) => Number(row.amount_aed || 0) },
  { heading: 'Balance After AED', value: (row) => Number(row.balance_after_aed || 0) },
  { heading: 'Booking ID', value: (row) => String(row.booking_request_id || '-') },
  { heading: 'Description', value: (row) => String(row.description || '-') },
  { heading: 'Created At', value: (row) => String(row.created_at || '-') }
];
const refundColumns: ExportColumn<GenericExportRow>[] = [
  { heading: 'Agent', value: (row) => String(row.b2b_agent_name || row.b2b_agent_id || '-') },
  { heading: 'Booking ID', value: (row) => String(row.booking_request_id || '-') },
  { heading: 'Request Type', value: (row) => String(row.request_type || '-') },
  { heading: 'Status', value: (row) => String(row.status || '-') },
  { heading: 'Requested AED', value: (row) => Number(row.requested_amount_aed || 0) },
  { heading: 'Approved AED', value: (row) => Number(row.approved_amount_aed || 0) },
  { heading: 'Requested At', value: (row) => String(row.requested_at || '-') },
  { heading: 'Decided At', value: (row) => String(row.decided_at || '-') }
];

function exportDataset(reportType: string, data: FinanceReportData) {
  if (['Daily Collection Report', 'User / Cashier Collection Report'].includes(reportType)) {
    return { rows: data.receipts.map((row) => ({ ...row })), columns: receiptColumns };
  }
  if (reportType === 'Payment Transaction Report') {
    return { rows: data.ledger.map((row) => ({ ...row })), columns: ledgerColumns };
  }
  if (reportType === 'B2B Wallet Ledger Report') {
    return { rows: data.wallet_ledger.map((row) => ({ ...row })), columns: walletColumns };
  }
  if (reportType === 'Refund Report') {
    return { rows: data.refunds.map((row) => ({ ...row })), columns: refundColumns };
  }
  return {
    rows: data.bookings.map((row) => ({ ...row })),
    columns: bookingColumns.map((column) => ({
      heading: column.heading,
      value: (row: GenericExportRow) => column.value(row as OperationsBooking)
    }))
  };
}

export function FinanceReportsPage() {
  const { fullName, email } = usePortalAccess();
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [draft, setDraft] = useState<FinanceReportFilters>(initial);
  const [applied, setApplied] = useState<FinanceReportFilters>(initial);
  const [data, setData] = useState<FinanceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await getFinanceReportData(applied)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load finance report.'); } finally { setLoading(false); } }, [applied]);
  useEffect(() => { void load(); }, [load]);
  const rows = data?.bookings || [];
  const summary = useMemo(() => [
    { label: 'Earned revenue', value: money(sumAmounts(rows, earnedRevenue)) },
    { label: 'Company received', value: money(sumAmounts(rows, bookingReceived)) },
    { label: 'Outstanding', value: money(sumAmounts(rows, bookingPending) + sumAmounts(rows, managerOutstanding) + sumAmounts(rows, b2bOutstanding)) },
    { label: 'VAT', value: money(sumAmounts(rows, (row) => reportAmount(row.vat_amount))) },
    { label: 'Wallet debits', value: money(data?.wallet_debits_aed || 0) },
    { label: 'Wallet credits', value: money(data?.wallet_credits_aed || 0) },
    { label: 'Approved refunds', value: money(data?.approved_refunds_aed || 0) },
    { label: 'Rejected refunds', value: String(data?.rejected_refunds || 0) }
  ], [data, rows]);
  const context = { reportType, dateFrom: applied.date_from || '', dateTo: applied.date_to || '', filters: { ...applied, report_type: reportType }, rows, columns: bookingColumns, generatedBy: fullName || email, summary };
  const selectedExportRows = data ? exportDataset(reportType, data).rows : [];
  async function runExport(format: 'csv' | 'pdf') { setExporting(format); setNotice(''); try { const complete = await getAllFinanceReportData(applied); const dataset = exportDataset(reportType, complete); const exportContext = { ...context, rows: dataset.rows, columns: dataset.columns }; setNotice(format === 'csv' ? await exportFinanceCsv(exportContext) : await exportFinancePdf(exportContext)); } catch { setNotice('The complete filtered export could not be generated. Narrow the date range and try again.'); } finally { setExporting(''); } }
  function field(key: keyof FinanceReportFilters, value: string) { setDraft((current) => ({ ...current, [key]: value })); }
  const options = data?.filter_options || {};

  return <section className="space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Finance Portal</p><h1 className="mt-1 font-heading text-3xl font-semibold text-primary-900">Financial Reports</h1><p className="mt-1 text-sm text-muted-foreground">Secured, filter-aware reporting from live booking and finance records.</p></header>
    <div className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-5">
      <Select label="Report Type" value={reportType} onChange={setReportType} values={reportTypes} all={false} />
      <AppDatePicker label="Date From" value={draft.date_from || ''} placeholder="Select start date" maxDate={draft.date_to} onChange={(v) => field('date_from', v)} />
      <AppDatePicker label="Date To" value={draft.date_to || ''} placeholder="Select end date" minDate={draft.date_from} onChange={(v) => field('date_to', v)} />
      <Select label="Booking Source" value={draft.booking_source || ''} onChange={(v) => field('booking_source', v)} values={['Website', 'B2B']} />
      <Select label="Booking Status" value={draft.booking_status || ''} onChange={(v) => field('booking_status', v)} values={options.booking_statuses} />
      <Select label="Payment Status" value={draft.payment_status || ''} onChange={(v) => field('payment_status', v)} values={options.payment_statuses} />
      <Text label="Payment Method" value={draft.payment_method || ''} onChange={(v) => field('payment_method', v)} />
      <Text label="Customer" value={draft.customer || ''} onChange={(v) => field('customer', v)} />
      <Text label="Booking Reference" value={draft.booking_reference || ''} onChange={(v) => field('booking_reference', v)} />
      <Select label="B2B Agent" value={draft.agent_id || ''} onChange={(v) => field('agent_id', v)} options={options.agents} />
      <Select label="Package" value={draft.package || ''} onChange={(v) => field('package', v)} values={options.packages} />
      <Text label="Vehicle Type" value={draft.vehicle_type || ''} onChange={(v) => field('vehicle_type', v)} />
      <Text label="Processed By" value={draft.processed_by || ''} onChange={(v) => field('processed_by', v)} />
      <Text label="Refund Status" value={draft.refund_status || ''} onChange={(v) => field('refund_status', v)} />
      <div className="flex items-end gap-2"><Button onClick={() => setApplied({ ...draft })}>Apply Filters</Button><Button variant="outline" onClick={() => { const reset = initial(); setDraft(reset); setApplied(reset); }}>Clear</Button></div>
    </div>
    <div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" />Refresh</Button><Button variant="outline" disabled={Boolean(exporting) || !selectedExportRows.length} onClick={() => void runExport('csv')}><Download className="size-4" />Export CSV</Button><Button variant="outline" disabled={Boolean(exporting) || !selectedExportRows.length} onClick={() => void runExport('pdf')}><FileDown className="size-4" />Export PDF</Button>{notice ? <span role="alert" className="text-xs font-semibold text-amber-700">{notice}</span> : null}</div>
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error} <button className="underline" onClick={() => void load()}>Retry</button></div> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summary.map((item) => <div key={item.label} className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">{item.label}</p><p className="mt-2 font-heading text-xl font-semibold text-primary-900">{item.value}</p></div>)}</div>
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm"><div className="border-b px-4 py-3"><h2 className="font-heading text-lg font-semibold">{reportType}</h2><p className="text-xs text-muted-foreground">{rows.length} filtered records</p></div><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-primary-50"><tr>{bookingColumns.map((column) => <th key={column.heading} className="px-3 py-3">{column.heading}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={bookingColumns.length} className="p-8 text-center">Loading report...</td></tr> : rows.length ? rows.map((row) => <tr key={String(row.id)} className="border-t">{bookingColumns.map((column) => <td key={column.heading} className="whitespace-nowrap px-3 py-3">{String(column.value(row) ?? '-')}</td>)}</tr>) : <tr><td colSpan={bookingColumns.length} className="p-8 text-center text-muted-foreground">No records match the applied filters.</td></tr>}</tbody></table></div>
  </section>;
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-xs font-bold text-muted-foreground">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Select({ label, value, onChange, values = [], options = [], all = true }: { label: string; value: string; onChange: (value: string) => void; values?: string[]; options?: Array<{ id: string; label: string }>; all?: boolean }) { return <label className="grid gap-1 text-xs font-bold text-muted-foreground">{label}<select className="h-10 rounded-md border border-input bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{all ? <option value="">All</option> : null}{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}{values.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>; }
