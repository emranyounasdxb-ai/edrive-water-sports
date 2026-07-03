'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, CalendarDays, ClipboardCheck, CreditCard, FileClock, Package, Plus, Settings, Ship, UserCog, UsersRound, WalletCards, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Metric = [string, string, LucideIcon];
type FieldType = 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
type Field = { name: string; label: string; type: FieldType; options?: string[]; placeholder?: string; required?: boolean };
type RecordItem = Record<string, string> & { id: string };

const storageKeys = { staff: 'edrive-admin-staff', packages: 'edrive-admin-packages', vehicles: 'edrive-admin-vehicles' };

const staffFields: Field[] = [
  { name: 'fullName', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true },
  { name: 'role', label: 'Role', type: 'select', options: ['Super Admin', 'Admin', 'Booking Staff', 'Manager / Operations', 'Finance', 'Maintenance Staff'], required: true },
  { name: 'department', label: 'Department', type: 'select', options: ['Admin', 'Booking', 'Operations', 'Finance', 'Maintenance', 'Management'] },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Suspended'], required: true },
  { name: 'password', label: 'Temporary Password', type: 'text', placeholder: 'Set first login password' },
  { name: 'notes', label: 'Notes', type: 'textarea' }
];

const packageFields: Field[] = [
  { name: 'title', label: 'Package Title', type: 'text', required: true },
  { name: 'slug', label: 'Slug / URL', type: 'text', placeholder: 'jet-ski-60-minutes' },
  { name: 'category', label: 'Category', type: 'select', options: ['Jet Ski Rental', 'Jet Car Rental'], required: true },
  { name: 'duration', label: 'Duration', type: 'select', options: ['30 minutes', '60 minutes', '90 minutes', '120 minutes', 'Custom'], required: true },
  { name: 'basePrice', label: 'Base Price', type: 'number', required: true },
  { name: 'vat', label: 'VAT %', type: 'number', placeholder: '5' },
  { name: 'capacity', label: 'Capacity / Max Guests', type: 'number' },
  { name: 'image', label: 'Package Image URL', type: 'text' },
  { name: 'shortDescription', label: 'Short Description', type: 'textarea', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Draft'], required: true }
];

const vehicleFields: Field[] = [
  { name: 'code', label: 'Vehicle Code', type: 'text', placeholder: 'JS-01 / JC-01', required: true },
  { name: 'name', label: 'Vehicle Name', type: 'text', required: true },
  { name: 'type', label: 'Vehicle Type', type: 'select', options: ['Jet Ski', 'Jet Car'], required: true },
  { name: 'brand', label: 'Brand', type: 'text' },
  { name: 'model', label: 'Model', type: 'text' },
  { name: 'year', label: 'Year', type: 'number' },
  { name: 'capacity', label: 'Capacity', type: 'number', required: true },
  { name: 'image', label: 'Main Image URL', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['Available', 'Booked', 'Maintenance', 'Inactive', 'For Sale'], required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' }
];

function useLocalRecords(key: string) {
  const [items, setItems] = useState<RecordItem[]>([]);
  useEffect(() => {
    try { setItems(JSON.parse(window.localStorage.getItem(key) || '[]')); } catch { setItems([]); }
  }, [key]);
  function add(values: Record<string, string>) {
    const next = [{ ...values, id: `${Date.now()}` }, ...items];
    setItems(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  }
  return { items, add };
}

export function AdminDashboardPage() { return <PageShell label="Dashboard" title="Operations overview" text="Live booking, payment, vehicle, staff, and revenue data will appear here after Supabase connection." action="Refresh" metrics={[["New Bookings", "0", CalendarDays], ["Today Rides", "0", ClipboardCheck], ["Pending Payments", "AED 0.00", WalletCards], ["Available Vehicles", "0", Ship]]}><Empty title="No live data connected yet" text="Dummy dashboard numbers have been removed." /></PageShell>; }
export function AdminStaffPage() { const { items, add } = useLocalRecords(storageKeys.staff); return <ManagementPage label="Staff / Users" title="Staff and login access" text="Create admins, booking staff, managers, operations staff, and finance users with role-based access." action="Add Staff" metrics={[["Active Staff", String(items.length), UserCog], ["Managers", String(items.filter((i) => i.role === 'Manager / Operations').length), UsersRound], ["Inactive Staff", String(items.filter((i) => i.status !== 'Active').length), FileClock]]} fields={staffFields} items={items} columns={['fullName', 'role', 'email', 'phone', 'status']} headers={['Staff Name', 'Role', 'Email', 'Phone', 'Status']} empty="No staff users added yet." onAdd={add} />; }
export function AdminPackagesPage() { const { items, add } = useLocalRecords(storageKeys.packages); return <ManagementPage label="Packages / Products" title="Rental packages and product cards" text="Add Jet Ski and Jet Car rental packages. Active packages will power website cards and booking selection." action="Add Package" metrics={[["Active Packages", String(items.filter((i) => i.status === 'Active').length), Package], ["Jet Ski", String(items.filter((i) => i.category === 'Jet Ski Rental').length), CalendarDays], ["Jet Car", String(items.filter((i) => i.category === 'Jet Car Rental').length), FileClock]]} fields={packageFields} items={items} columns={['title', 'category', 'duration', 'basePrice', 'status']} headers={['Package', 'Category', 'Duration', 'Base Price', 'Status']} empty="No rental packages added yet." onAdd={add} />; }
export function AdminVehiclesPage() { const { items, add } = useLocalRecords(storageKeys.vehicles); return <ManagementPage label="Vehicles / Fleet" title="Vehicle master list" text="Add real Jet Skis and Jet Cars with one main image, capacity, status, and maintenance notes." action="Add Vehicle" metrics={[["Jet Skis", String(items.filter((i) => i.type === 'Jet Ski').length), Ship], ["Jet Cars", String(items.filter((i) => i.type === 'Jet Car').length), Ship], ["Maintenance", String(items.filter((i) => i.status === 'Maintenance').length), Settings]]} fields={vehicleFields} items={items} columns={['code', 'name', 'type', 'capacity', 'status']} headers={['Vehicle Code', 'Vehicle Name', 'Type', 'Capacity', 'Status']} empty="No vehicles added yet." onAdd={add} />; }
export function AdminBookingsPage() { return <PageShell label="Bookings" title="Booking requests" text="Website bookings will appear here for confirmation, cancellation, rescheduling, and handover to manager operations." action="New Manual Booking" metrics={[["New Requests", "0", CalendarDays], ["Confirmed", "0", ClipboardCheck], ["Cancelled", "0", FileClock]]}><Records columns={["Booking Code", "Customer", "Package", "Date / Time", "Status"]} empty="No booking requests yet." /></PageShell>; }
export function AdminSchedulePage() { return <PageShell label="Schedule" title="Daily and weekly schedule" text="Calendar view for rides, time slots, assigned vehicles, and manager status updates." action="Add Schedule Note" metrics={[["Today", "0", CalendarDays], ["Upcoming", "0", FileClock], ["Assigned", "0", ClipboardCheck]]}><Empty title="Schedule is ready for integration" text="Confirmed bookings will populate this page once booking data is connected." /></PageShell>; }
export function AdminAssignmentsPage() { return <PageShell label="Assignments" title="Vehicle and crew assignment" text="Manager assigns actual vehicles, captain or guide, payment collection, and ride status here." action="Assign Vehicle" metrics={[["Pending Assignment", "0", ClipboardCheck], ["Assigned Today", "0", Ship], ["Completed", "0", CalendarDays]]}><Records columns={["Booking", "Package", "Vehicle", "Crew", "Status"]} empty="No confirmed bookings pending assignment." /></PageShell>; }
export function ManagerOperationsPage() { return <PageShell label="Manager" title="Manager operations dashboard" text="Confirmed rides, vehicle assignment, crew assignment, payment collection, and ride completion workflow." action="Update Status" metrics={[["Confirmed Rides", "0", ClipboardCheck], ["Vehicles Assigned", "0", Ship], ["Payments Pending", "AED 0.00", CreditCard]]}><Empty title="No confirmed rides yet" text="Confirmed bookings will appear here for manager actions." /></PageShell>; }
export function AdminPaymentsPage() { return <PageShell label="Payments" title="Payment tracking" text="Track not paid, partial, paid, refunded, payment method, amount paid, balance, and collection notes." action="Record Payment" metrics={[["Collected", "AED 0.00", WalletCards], ["Pending", "AED 0.00", FileClock], ["Refunds", "AED 0.00", CreditCard]]}><Records columns={["Booking", "Customer", "Total", "Paid", "Balance", "Status"]} empty="No payment records yet." /></PageShell>; }
export function AdminCustomersPage() { return <PageShell label="Customers" title="Customer directory" text="Customer records, contact details, booking history, repeat customer status, and admin notes." action="Add Customer" metrics={[["Customers", "0", UsersRound], ["Repeat Customers", "0", UsersRound], ["Priority", "0", UsersRound]]}><Records columns={["Customer", "Phone", "Email", "Bookings", "Status"]} empty="No customer records yet." /></PageShell>; }
export function AdminMaintenancePage() { return <PageShell label="Maintenance" title="Vehicle maintenance" text="Track vehicle issues, maintenance dates, costs, status, and available-again dates." action="Add Maintenance" metrics={[["Open Issues", "0", Settings], ["In Service", "0", Ship], ["Closed", "0", ClipboardCheck]]}><Records columns={["Vehicle", "Issue", "Date", "Cost", "Status"]} empty="No maintenance records yet." /></PageShell>; }
export function AdminReportsPage() { return <PageShell label="Reports" title="Business reports" text="Daily revenue, monthly revenue, bookings by package, bookings by vehicle, payment reports, cancellations, and staff performance." action="Export" metrics={[["Revenue", "AED 0.00", BarChart3], ["Bookings", "0", CalendarDays], ["Vehicle Usage", "0%", Ship]]}><Empty title="Reports will use live database records" text="Dummy charts have been removed." /></PageShell>; }
export function AdminSettingsPage() { return <PageShell label="Settings" title="Company and booking settings" text="Manage company details, WhatsApp, email, VAT percentage, meeting point, booking terms, and cancellation policy." action="Save Settings" metrics={[["VAT", "5%", Settings], ["Booking Flow", "Ready", ClipboardCheck], ["Location", "Set", Ship]]}><Records columns={["Setting", "Current Value", "Status"]} empty="Settings fields are ready for Supabase connection." /></PageShell>; }
export function AdminInventoryPage() { return <AdminPackagesPage />; }
export function AdminCouponsPage() { return <AdminPackagesPage />; }
export function AdminReviewsPage() { return <AdminCustomersPage />; }

function ManagementPage({ label, title, text, action, metrics, fields, items, columns, headers, empty, onAdd }: { label: string; title: string; text: string; action: string; metrics: Metric[]; fields: Field[]; items: RecordItem[]; columns: string[]; headers: string[]; empty: string; onAdd: (values: Record<string, string>) => void }) {
  const [open, setOpen] = useState(false);
  return <PageShell label={label} title={title} text={text} action={action} metrics={metrics} onAction={() => setOpen(true)}><Records columns={headers} empty={empty} rows={items} keys={columns} />{open ? <EntryDrawer title={action} fields={fields} onClose={() => setOpen(false)} onSubmit={(values) => { onAdd(values); setOpen(false); }} /> : null}</PageShell>;
}

function EntryDrawer({ title, fields, onClose, onSubmit }: { title: string; fields: Field[]; onClose: () => void; onSubmit: (values: Record<string, string>) => void }) {
  const initial = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, field.options?.[0] ?? ''])), [fields]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(values); }
  return <div className="fixed inset-0 z-50 bg-primary-900/25 backdrop-blur-sm"><div className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin Form</p><h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">{title}</h2></div><button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary"><X className="size-4" aria-hidden="true" /></button></div><form onSubmit={submit} className="grid gap-4">{fields.map((field) => <label key={field.name} className="grid gap-1.5 text-sm font-semibold text-foreground">{field.label}{field.type === 'select' ? <select required={field.required} value={values[field.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea required={field.required} value={values[field.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} placeholder={field.placeholder} className="min-h-24 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /> : <input required={field.required} type={field.type} value={values[field.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} placeholder={field.placeholder} className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" />}</label>)}<div className="sticky bottom-0 mt-3 flex justify-end gap-3 border-t border-border bg-white pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></div></div>;
}

function PageShell({ label, title, text, action, metrics, children, onAction }: { label: string; title: string; text: string; action: string; metrics: Metric[]; children: ReactNode; onAction?: () => void }) { return <div className="flex flex-col gap-5"><div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</span><Badge variant="secondary" className="rounded-full">Database ready</Badge></div><h1 className="font-heading text-3xl font-semibold text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div><Button type="button" onClick={onAction}><Plus data-icon aria-hidden="true" />{action}</Button></div><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">{metrics.map(([metric, value, Icon]) => <Card key={metric}><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{metric}</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span></CardContent></Card>)}</div>{children}</div>; }
function Empty({ title, text }: { title: string; text: string }) { return <Card><CardContent className="p-8 text-center"><p className="font-heading text-xl font-semibold text-foreground">{title}</p><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>; }
function Records({ columns, empty, rows = [], keys }: { columns: string[]; empty: string; rows?: RecordItem[]; keys?: string[] }) { return <Card><CardHeader><CardTitle className="text-base">Records</CardTitle><CardDescription>Saved records show here. Supabase connection will replace local storage later.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.length && keys ? rows.map((row) => <TableRow key={row.id}>{keys.map((key) => <TableCell key={key} className="max-w-[14rem] truncate">{row[key] || '-'}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-28 text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>}</TableBody></Table></CardContent></Card>; }
