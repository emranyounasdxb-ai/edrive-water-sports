'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppDatePicker } from './shared/app-date-picker';
import { usePortalAccess } from './portal-access';
import { bookingCode, bookingPending, bookingReceived, bookingTotal, packageName, reportAmount, type OperationsBooking } from '@/lib/operations-reporting';
import { exportFinanceCsv, exportFinancePdf, type ExportColumn } from '@/lib/finance-report-export';
import { getAllFinanceReportData, getFinanceReportData, type FinanceReportFilters } from '@/services/finance-reporting';
import { safeUiError, uiLabel } from '@/lib/ui-labels';

const money = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(value);
const initial: FinanceReportFilters = {};
const columns: ExportColumn<OperationsBooking>[] = [
  { heading: 'Booking Reference', value: bookingCode }, { heading: 'Booking Date', value: (row) => String(row.preferred_date || row.created_at || '').slice(0, 10) },
  { heading: 'Customer', value: (row) => String(row.customer_name || '-') }, { heading: 'Package / Service', value: packageName },
  { heading: 'Vehicle Type', value: (row) => uiLabel(row.selected_package_category || row.service_type) }, { heading: 'Booking Source', value: (row) => uiLabel(row.booking_source || row.source) },
  { heading: 'B2B Agent', value: (row) => String(row.b2b_agent_name || '-') }, { heading: 'Base Amount AED', value: (row) => reportAmount(row.base_amount_aed) },
  { heading: 'VAT AED', value: (row) => reportAmount(row.vat_amount) },
  { heading: 'Total AED', value: bookingTotal }, { heading: 'Received AED', value: bookingReceived }, { heading: 'Outstanding AED', value: bookingPending },
  { heading: 'Payment Method', value: (row) => uiLabel(row.payment_method) }, { heading: 'Payment Status', value: (row) => uiLabel(row.payment_status) },
  { heading: 'Collection Status', value: (row) => uiLabel(row.collection_status) }, { heading: 'Refund AED', value: (row) => reportAmount(row.total_refunded_aed) }
];

export function FinanceBookingsPage() {
  const { fullName, email } = usePortalAccess();
  const [draft, setDraft] = useState<FinanceReportFilters>(initial);
  const [applied, setApplied] = useState<FinanceReportFilters>(initial);
  const [rows, setRows] = useState<OperationsBooking[]>([]);
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await getFinanceReportData(applied); setRows(data.bookings); setOptions(data.filter_options); }
    catch (cause) { console.error('Financial bookings load failed', cause); setError(safeUiError(cause, 'load')); }
    finally { setLoading(false); }
  }, [applied]);
  useEffect(() => { void load(); }, [load]);

  const exportContext = useMemo(() => ({ reportType: 'Financial Bookings', dateFrom: applied.date_from || '', dateTo: applied.date_to || '', filters: applied, rows, columns, generatedBy: fullName || email }), [applied, email, fullName, rows]);
  async function runExport(format: 'csv' | 'pdf') {
    setExporting(format); setNotice('');
    try {
      const completeData = await getAllFinanceReportData(applied);
      const completeContext = { ...exportContext, rows: completeData.bookings };
      setNotice(format === 'csv' ? await exportFinanceCsv(completeContext) : await exportFinancePdf(completeContext));
    }
    catch { setNotice('The export could not be generated.'); } finally { setExporting(''); }
  }
  function field(key: keyof FinanceReportFilters, value: string | boolean) { setDraft((current) => ({ ...current, [key]: value })); }
  const optionData = options as { agents?: Array<{ id: string; label: string }>; packages?: string[]; booking_statuses?: string[]; payment_statuses?: string[] };

  return <section className="space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Finance Portal</p><h1 className="mt-1 font-heading text-2xl font-semibold text-primary-900">Financial Bookings</h1><p className="mt-1 text-sm text-muted-foreground">Review booking revenue, payments and outstanding balances.</p></header>
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-5">
      <AppDatePicker label="Date From" value={draft.date_from || ''} placeholder="Select start date" maxDate={draft.date_to} onChange={(v) => field('date_from', v)} />
      <AppDatePicker label="Date To" value={draft.date_to || ''} placeholder="Select end date" minDate={draft.date_from} onChange={(v) => field('date_to', v)} />
      <FilterInput label="Booking Reference" value={draft.booking_reference || ''} onChange={(v) => field('booking_reference', v)} />
      <FilterInput label="Customer" value={draft.customer || ''} onChange={(v) => field('customer', v)} />
      <Select label="Booking Source" value={draft.booking_source || ''} onChange={(v) => field('booking_source', v)} values={['Website', 'B2B']} />
      <Select label="Payment Status" value={draft.payment_status || ''} onChange={(v) => field('payment_status', v)} values={optionData.payment_statuses} />
      <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(draft.outstanding_only)} onChange={(e) => field('outstanding_only', e.target.checked)} />Outstanding only</label>
      <div className="flex items-end gap-2 md:col-span-2"><Button onClick={() => setApplied({ ...draft })}>Apply Filters</Button><Button variant="outline" onClick={() => { setDraft(initial); setApplied(initial); }}>Clear Filters</Button><Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" />Refresh</Button></div>
      <details className="md:col-span-3 xl:col-span-5"><summary className="cursor-pointer text-sm font-bold text-primary">More Filters</summary><div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-5"><Select label="B2B Agent" value={draft.agent_id || ''} onChange={(v) => field('agent_id', v)} options={optionData.agents} /><Select label="Package" value={draft.package || ''} onChange={(v) => field('package', v)} values={optionData.packages} /><FilterInput label="Vehicle Type" value={draft.vehicle_type || ''} onChange={(v) => field('vehicle_type', v)} /><FilterInput label="Payment Method" value={draft.payment_method || ''} onChange={(v) => field('payment_method', v)} /><FilterInput label="Collection Status" value={draft.collection_status || ''} onChange={(v) => field('collection_status', v)} /></div></details>
    </div>
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={Boolean(exporting) || !rows.length} onClick={() => void runExport('csv')}><Download className="size-4" />Export CSV</Button><Button variant="outline" disabled={Boolean(exporting) || !rows.length} onClick={() => void runExport('pdf')}><FileDown className="size-4" />Export PDF</Button>{notice ? <span role="alert" className="self-center text-xs font-semibold text-amber-700">{notice}</span> : null}</div>
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error} <button className="underline" onClick={() => void load()}>Retry</button></div> : null}
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[1280px] text-left text-xs"><thead className="sticky top-0 bg-primary-50 text-primary-900"><tr>{columns.map((column) => <th key={column.heading} className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold tracking-[0.04em]">{column.heading}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={columns.length} className="p-6 text-center">Loading financial bookings...</td></tr> : rows.length ? rows.map((row) => <tr key={String(row.id)} className="h-11 border-t border-border/60">{columns.map((column) => <td key={column.heading} className="max-w-56 truncate whitespace-nowrap px-3 py-2">{column.heading.includes('AED') || ['Total AED', 'Received AED', 'Outstanding AED', 'Refund AED'].includes(column.heading) ? money(Number(column.value(row) || 0)) : String(column.value(row) ?? '-')}</td>)}</tr>) : <tr><td colSpan={columns.length} className="p-6 text-center text-muted-foreground">No financial bookings match the applied filters.</td></tr>}</tbody></table></div>
  </section>;
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-xs font-bold text-muted-foreground">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Select({ label, value, onChange, values = [], options = [] }: { label: string; value: string; onChange: (value: string) => void; values?: string[]; options?: Array<{ id: string; label: string }> }) { return <label className="grid gap-1 text-xs font-bold text-muted-foreground">{label}<select className="h-10 rounded-md border border-input bg-white px-3 text-sm text-foreground" value={value} onChange={(event) => onChange(event.target.value)}><option value="">All</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}{values.map((item) => <option key={item} value={item}>{uiLabel(item)}</option>)}</select></label>; }
