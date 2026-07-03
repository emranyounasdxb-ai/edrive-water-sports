'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, CalendarDays, ClipboardCheck, CreditCard, FileClock, ImagePlus, Package, Pencil, Plus, Settings, Ship, UploadCloud, UserCog, UsersRound, WalletCards, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';

type Metric = [string, string, LucideIcon];
type FieldType = 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'date' | 'image';
type Field = { name: string; label: string; type: FieldType; options?: string[]; placeholder?: string; required?: boolean; note?: string };
type RecordItem = Record<string, string> & { id: string };
type TableState = { items: RecordItem[]; loading: boolean; error: string; refresh: () => Promise<void> };

const roleMap: Record<string, string> = { 'Super Admin': 'super_admin', Admin: 'admin', 'Booking Staff': 'booking_staff', 'Manager / Operations': 'manager', Finance: 'finance', 'Maintenance Staff': 'maintenance_staff' };
const statusMap: Record<string, string> = { Active: 'active', Inactive: 'inactive', Suspended: 'suspended', Draft: 'draft', Available: 'available', Booked: 'booked', Maintenance: 'maintenance', 'For Sale': 'for_sale' };
const categoryMap: Record<string, string> = { 'Jet Ski Rental': 'jet_ski_rental', 'Jet Car Rental': 'jet_car_rental' };
const typeMap: Record<string, string> = { 'Jet Ski': 'jet_ski', 'Jet Car': 'jet_car' };
const reverse = (map: Record<string, string>, value?: string) => Object.keys(map).find((key) => map[key] === value) || value || '';

const staffFields: Field[] = [
  { name: 'avatar', label: 'Profile Photo', type: 'image', note: 'Recommended size: 600 × 600 px square. Format: WebP, JPG, or PNG. Max file size: 1 MB.' },
  { name: 'fullName', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true },
  { name: 'role', label: 'Role', type: 'select', options: ['Super Admin', 'Admin', 'Booking Staff', 'Manager / Operations', 'Finance', 'Maintenance Staff'], required: true },
  { name: 'department', label: 'Department', type: 'select', options: ['Admin', 'Booking', 'Operations', 'Finance', 'Maintenance', 'Management'] },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Suspended'], required: true },
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
  { name: 'image', label: 'Package Image', type: 'image', note: 'Recommended size: 1600 × 1000 px. Format: WebP, JPG, or PNG. Max file size: 2 MB.' },
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
  { name: 'regNo', label: 'REG. No.', type: 'text', required: true },
  { name: 'deviceImei', label: 'DEVICE IMEI', type: 'text' },
  { name: 'color', label: 'COLOR', type: 'text' },
  { name: 'installationDate', label: 'DATE OF INSTALLATION', type: 'date' },
  { name: 'expiryDate', label: 'EXPIRY DATE', type: 'date' },
  { name: 'capacity', label: 'Capacity', type: 'number', required: true },
  { name: 'image', label: 'Main Image', type: 'image', note: 'Recommended size: 1200 × 800 px. Format: WebP, JPG, or PNG. Max file size: 2 MB.' },
  { name: 'status', label: 'Status', type: 'select', options: ['Available', 'Booked', 'Maintenance', 'Inactive', 'For Sale'], required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' }
];

async function uploadImage(bucket: string, file?: File) {
  if (!file) return '';
  const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `${Date.now()}-${cleanName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function useTable(table: string, mapper: (row: Record<string, unknown>) => RecordItem): TableState {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = async () => {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setItems((data || []).map((row) => mapper(row as Record<string, unknown>)));
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return { items, loading, error, refresh };
}

function mapStaff(row: Record<string, unknown>): RecordItem {
  return { id: String(row.id), avatar: String(row.avatar_url || ''), avatarUrl: String(row.avatar_url || ''), fullName: String(row.full_name || ''), email: String(row.email || ''), phone: String(row.phone || ''), role: reverse(roleMap, String(row.role || '')), department: String(row.department || ''), status: reverse(statusMap, String(row.status || '')), notes: String(row.notes || '') };
}
function mapPackage(row: Record<string, unknown>): RecordItem { return { id: String(row.id), image: String(row.image_url || ''), title: String(row.title || ''), category: reverse(categoryMap, String(row.category || '')), duration: `${row.duration_minutes || ''} minutes`, basePrice: String(row.base_price || ''), status: reverse(statusMap, String(row.status || '')) }; }
function mapVehicle(row: Record<string, unknown>): RecordItem { return { id: String(row.id), image: String(row.main_image_url || ''), code: String(row.vehicle_code || ''), name: String(row.vehicle_name || ''), type: reverse(typeMap, String(row.vehicle_type || '')), regNo: String(row.reg_no || ''), deviceImei: String(row.device_imei || ''), expiryDate: String(row.expiry_date || ''), status: reverse(statusMap, String(row.status || '')) }; }

export function AdminDashboardPage() { return <PageShell label="Dashboard" title="Operations overview" text="Live booking, payment, vehicle, staff, and revenue data will appear here after Supabase connection." action="Refresh" metrics={[["New Bookings", "0", CalendarDays], ["Today Rides", "0", ClipboardCheck], ["Pending Payments", "AED 0.00", WalletCards], ["Available Vehicles", "0", Ship]]}><Empty title="Database connected" text="Staff, packages, vehicles, customers, and bookings are ready for live records." /></PageShell>; }

export function AdminStaffPage() {
  const table = useTable('admin_users', mapStaff);
  async function add(v: Record<string, string>, files: Record<string, File>) {
    const avatarUrl = await uploadImage('staff-avatars', files.avatar);
    const { error } = await supabase.from('admin_users').insert({ avatar_url: avatarUrl, full_name: v.fullName, email: v.email, phone: v.phone, role: roleMap[v.role] || 'admin', department: v.department, status: statusMap[v.status] || 'active', notes: v.notes });
    if (error) throw error;
    await table.refresh();
  }
  async function update(record: RecordItem, v: Record<string, string>, files: Record<string, File>) {
    const uploadedAvatar = await uploadImage('staff-avatars', files.avatar);
    const avatarUrl = uploadedAvatar || v.avatar || record.avatarUrl || '';
    const { error } = await supabase.from('admin_users').update({ avatar_url: avatarUrl, full_name: v.fullName, email: v.email, phone: v.phone, role: roleMap[v.role] || 'admin', department: v.department, status: statusMap[v.status] || 'active', notes: v.notes }).eq('id', record.id);
    if (error) throw error;
    await table.refresh();
  }
  return <ManagementPage label="Staff / Users" title="Staff and login access" text="Create admins, booking staff, managers, operations staff, and finance users with role-based access." action="Add Staff" metrics={[["Active Staff", String(table.items.filter((i) => i.status === 'Active').length), UserCog], ["Managers", String(table.items.filter((i) => i.role === 'Manager / Operations').length), UsersRound], ["Inactive Staff", String(table.items.filter((i) => i.status !== 'Active').length), FileClock]]} fields={staffFields} table={table} columns={['avatarUrl', 'fullName', 'role', 'email', 'phone', 'status']} headers={['Photo', 'Staff Name', 'Role', 'Email', 'Phone', 'Status']} empty="No staff users added yet." onAdd={add} onUpdate={update} />;
}

export function AdminPackagesPage() { const table = useTable('packages', mapPackage); async function add(v: Record<string,string>, files: Record<string,File>) { const imageUrl = await uploadImage('package-images', files.image); const minutes = Number((v.duration || '0').replace(/\D/g, '')) || 0; const slug = v.slug || v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); const { error } = await supabase.from('packages').insert({ title: v.title, slug, category: categoryMap[v.category], duration_minutes: minutes, base_price: Number(v.basePrice || 0), vat_percent: Number(v.vat || 5), capacity: Number(v.capacity || 2), image_url: imageUrl, short_description: v.shortDescription, status: statusMap[v.status] || 'draft' }); if (error) throw error; await table.refresh(); } return <ManagementPage label="Packages / Products" title="Rental packages and product cards" text="Add Jet Ski and Jet Car rental packages. Active packages will power website cards and booking selection." action="Add Package" metrics={[["Active Packages", String(table.items.filter((i) => i.status === 'Active').length), Package], ["Jet Ski", String(table.items.filter((i) => i.category === 'Jet Ski Rental').length), CalendarDays], ["Jet Car", String(table.items.filter((i) => i.category === 'Jet Car Rental').length), FileClock]]} fields={packageFields} table={table} columns={['image','title','category','duration','basePrice','status']} headers={['Image','Package','Category','Duration','Base Price','Status']} empty="No rental packages added yet." onAdd={add} />; }
export function AdminVehiclesPage() { const table = useTable('vehicles', mapVehicle); async function add(v: Record<string,string>, files: Record<string,File>) { const imageUrl = await uploadImage('vehicle-images', files.image); const { error } = await supabase.from('vehicles').insert({ vehicle_code: v.code, vehicle_name: v.name, vehicle_type: typeMap[v.type], brand: v.brand, model: v.model, year: v.year ? Number(v.year) : null, reg_no: v.regNo, device_imei: v.deviceImei, color: v.color, date_of_installation: v.installationDate || null, expiry_date: v.expiryDate || null, capacity: Number(v.capacity || 2), main_image_url: imageUrl, status: statusMap[v.status] || 'available', notes: v.notes }); if (error) throw error; await table.refresh(); } return <ManagementPage label="Vehicles / Fleet" title="Vehicle master list" text="Add real Jet Skis and Jet Cars with registration, tracker, image, capacity, status, and maintenance notes." action="Add Vehicle" metrics={[["Jet Skis", String(table.items.filter((i) => i.type === 'Jet Ski').length), Ship], ["Jet Cars", String(table.items.filter((i) => i.type === 'Jet Car').length), Ship], ["Maintenance", String(table.items.filter((i) => i.status === 'Maintenance').length), Settings]]} fields={vehicleFields} table={table} columns={['image','code','regNo','type','deviceImei','expiryDate','status']} headers={['Image','Vehicle Code','REG. No.','Type','DEVICE IMEI','Expiry Date','Status']} empty="No vehicles added yet." onAdd={add} />; }
export function AdminBookingsPage() { return <PageShell label="Bookings" title="Booking requests" text="Website bookings will appear here for confirmation, cancellation, rescheduling, and handover to manager operations." action="New Manual Booking" metrics={[["New Requests", "0", CalendarDays], ["Confirmed", "0", ClipboardCheck], ["Cancelled", "0", FileClock]]}><Records columns={["Booking Code","Customer","Package","Date / Time","Status"]} empty="No booking requests yet." /></PageShell>; }
export function AdminSchedulePage() { return <PageShell label="Schedule" title="Daily and weekly schedule" text="Calendar view for rides, time slots, assigned vehicles, and manager status updates." action="Add Schedule Note" metrics={[["Today", "0", CalendarDays], ["Upcoming", "0", FileClock], ["Assigned", "0", ClipboardCheck]]}><Empty title="Schedule is ready for integration" text="Confirmed bookings will populate this page once booking data is connected." /></PageShell>; }
export function AdminAssignmentsPage() { return <PageShell label="Assignments" title="Vehicle and crew assignment" text="Manager assigns actual vehicles, captain or guide, payment collection, and ride status here." action="Assign Vehicle" metrics={[["Pending Assignment", "0", ClipboardCheck], ["Assigned Today", "0", Ship], ["Completed", "0", CalendarDays]]}><Records columns={["Booking","Package","Vehicle","Crew","Status"]} empty="No confirmed bookings pending assignment." /></PageShell>; }
export function ManagerOperationsPage() { return <PageShell label="Manager" title="Manager operations dashboard" text="Confirmed rides, vehicle assignment, crew assignment, payment collection, and ride completion workflow." action="Update Status" metrics={[["Confirmed Rides", "0", ClipboardCheck], ["Vehicles Assigned", "0", Ship], ["Payments Pending", "AED 0.00", CreditCard]]}><Empty title="No confirmed rides yet" text="Confirmed bookings will appear here for manager actions." /></PageShell>; }
export function AdminPaymentsPage() { return <PageShell label="Payments" title="Payment tracking" text="Track not paid, partial, paid, refunded, payment method, amount paid, balance, and collection notes." action="Record Payment" metrics={[["Collected", "AED 0.00", WalletCards], ["Pending", "AED 0.00", FileClock], ["Refunds", "AED 0.00", CreditCard]]}><Records columns={["Booking","Customer","Total","Paid","Balance","Status"]} empty="No payment records yet." /></PageShell>; }
export function AdminCustomersPage() { return <PageShell label="Customers" title="Customer directory" text="Customer records, contact details, booking history, repeat customer status, and admin notes." action="Add Customer" metrics={[["Customers", "0", UsersRound], ["Repeat Customers", "0", UsersRound], ["Priority", "0", UsersRound]]}><Records columns={["Customer","Phone","Email","Bookings","Status"]} empty="No customer records yet." /></PageShell>; }
export function AdminMaintenancePage() { return <PageShell label="Maintenance" title="Vehicle maintenance" text="Track vehicle issues, maintenance dates, costs, status, and available-again dates." action="Add Maintenance" metrics={[["Open Issues", "0", Settings], ["In Service", "0", Ship], ["Closed", "0", ClipboardCheck]]}><Records columns={["Vehicle","Issue","Date","Cost","Status"]} empty="No maintenance records yet." /></PageShell>; }
export function AdminReportsPage() { return <PageShell label="Reports" title="Business reports" text="Daily revenue, monthly revenue, bookings by package, bookings by vehicle, payment reports, cancellations, and staff performance." action="Export" metrics={[["Revenue", "AED 0.00", BarChart3], ["Bookings", "0", CalendarDays], ["Vehicle Usage", "0%", Ship]]}><Empty title="Reports will use live database records" text="Dummy charts have been removed." /></PageShell>; }
export function AdminSettingsPage() { return <PageShell label="Settings" title="Company and booking settings" text="Manage company details, WhatsApp, email, VAT percentage, meeting point, booking terms, and cancellation policy." action="Save Settings" metrics={[["VAT", "5%", Settings], ["Booking Flow", "Ready", ClipboardCheck], ["Location", "Set", Ship]]}><Records columns={["Setting","Current Value","Status"]} empty="Settings fields are ready for Supabase connection." /></PageShell>; }
export function AdminInventoryPage() { return <AdminPackagesPage />; } export function AdminCouponsPage() { return <AdminPackagesPage />; } export function AdminReviewsPage() { return <AdminCustomersPage />; }

function ManagementPage({ label, title, text, action, metrics, fields, table, columns, headers, empty, onAdd, onUpdate }: { label: string; title: string; text: string; action: string; metrics: Metric[]; fields: Field[]; table: TableState; columns: string[]; headers: string[]; empty: string; onAdd: (values: Record<string, string>, files: Record<string, File>) => Promise<void>; onUpdate?: (record: RecordItem, values: Record<string, string>, files: Record<string, File>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [error, setError] = useState('');
  async function save(values: Record<string, string>, files: Record<string, File>) {
    setError('');
    try {
      if (editing && onUpdate) await onUpdate(editing, values, files);
      else await onAdd(values, files);
      setOpen(false);
      setEditing(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save record'); }
  }
  function openEdit(record: RecordItem) { setEditing(record); setOpen(true); }
  return <PageShell label={label} title={title} text={text} action={action} metrics={metrics} onAction={() => { setEditing(null); setOpen(true); }}>{table.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{table.error}</p> : null}<Records columns={headers} empty={table.loading ? 'Loading records...' : empty} rows={table.items} keys={columns} onEdit={onUpdate ? openEdit : undefined} />{open ? <EntryModal title={editing ? 'Edit Staff Profile' : action} fields={fields} error={error} initialValues={editing || undefined} onClose={() => { setOpen(false); setEditing(null); }} onSubmit={save} /> : null}</PageShell>;
}

function EntryModal({ title, fields, error, initialValues, onClose, onSubmit }: { title: string; fields: Field[]; error: string; initialValues?: RecordItem; onClose: () => void; onSubmit: (values: Record<string, string>, files: Record<string, File>) => void }) {
  const defaults = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, initialValues?.[field.name] ?? field.options?.[0] ?? ''])), [fields, initialValues]);
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); await onSubmit(values, files); setSaving(false); }
  function setFile(field: Field, event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; setFiles((current) => ({ ...current, [field.name]: file })); setValues((current) => ({ ...current, [field.name]: file.name })); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm"><div className="flex max-h-[92vh] w-full max-w-[34rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]"><div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Admin Form</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{title}</h2></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button></div><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">{fields.map((field) => <FieldInput key={field.name} field={field} value={values[field.name] ?? ''} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} onFile={(event) => setFile(field, event)} />)}{error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 sm:col-span-2">{error}</p> : null}</div><div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></div></form></div></div>;
}
function FieldInput({ field, value, onChange, onFile }: { field: Field; value: string; onChange: (value: string) => void; onFile: (event: ChangeEvent<HTMLInputElement>) => void }) { if (field.type === 'image') return <label className="grid gap-2 text-sm font-semibold text-foreground sm:col-span-2">{field.label}<div className="rounded-[1.15rem] border border-dashed border-primary/35 bg-primary-50/65 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">{value && value.startsWith('http') ? <img src={value} alt="Selected" className="size-11 rounded-2xl object-cover" /> : <ImagePlus className="size-5" aria-hidden="true" />}</span><div><p className="text-sm font-semibold text-foreground">{value ? (value.startsWith('http') ? 'Current image selected' : value) : 'No image selected'}</p><p className="mt-1 text-xs font-normal leading-5 text-muted-foreground">{field.note}</p></div></div><span className="relative inline-flex"><input type="file" accept="image/webp,image/jpeg,image/png" onChange={onFile} className="absolute inset-0 cursor-pointer opacity-0" /><Button type="button" variant="outline" size="sm"><UploadCloud className="size-4" aria-hidden="true" />Upload Image</Button></span></div></div></label>; return <label className={`grid gap-1.5 text-sm font-semibold text-foreground ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}>{field.label}{field.type === 'select' ? <select required={field.required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea required={field.required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className="min-h-20 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /> : <input required={field.required} type={field.type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" />}</label>; }
function ImageCell({ src }: { src?: string }) { return src ? <img src={src} alt="Record image" className="size-11 rounded-2xl border border-border object-cover" /> : <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ImagePlus className="size-4" aria-hidden="true" /></span>; }
function PageShell({ label, title, text, action, metrics, children, onAction }: { label: string; title: string; text: string; action: string; metrics: Metric[]; children: ReactNode; onAction?: () => void }) { return <div className="flex flex-col gap-5"><div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</span><Badge variant="secondary" className="rounded-full">Supabase connected</Badge></div><h1 className="font-heading text-3xl font-semibold text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div><Button type="button" onClick={onAction}><Plus data-icon aria-hidden="true" />{action}</Button></div><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">{metrics.map(([metric, value, Icon]) => <Card key={metric}><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{metric}</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span></CardContent></Card>)}</div>{children}</div>; }
function Empty({ title, text }: { title: string; text: string }) { return <Card><CardContent className="p-8 text-center"><p className="font-heading text-xl font-semibold text-foreground">{title}</p><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>; }
function Records({ columns, empty, rows = [], keys, onEdit }: { columns: string[]; empty: string; rows?: RecordItem[]; keys?: string[]; onEdit?: (record: RecordItem) => void }) { const tableColumns = onEdit ? [...columns, 'Action'] : columns; return <Card><CardHeader><CardTitle className="text-base">Records</CardTitle><CardDescription>Saved records are now loaded from Supabase.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow>{tableColumns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.length && keys ? rows.map((row) => <TableRow key={row.id}>{keys.map((key) => <TableCell key={key} className="max-w-[14rem] truncate">{key === 'image' || key === 'avatarUrl' ? <ImageCell src={row[key]} /> : row[key] || '-'}</TableCell>)}{onEdit ? <TableCell><Button type="button" size="sm" variant="outline" onClick={() => onEdit(row)}><Pencil className="size-4" aria-hidden="true" />Edit</Button></TableCell> : null}</TableRow>) : <TableRow><TableCell colSpan={tableColumns.length} className="h-28 text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>}</TableBody></Table></CardContent></Card>; }
