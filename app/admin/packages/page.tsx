'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { MapPin, Pencil, Plus, TicketCheck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';

const locations = ['Jumeirah', 'Dubai Marina', 'Dubai Harbour', 'Dubai Islands', 'Fishing Harbour'];
const categoryMap: Record<string, string> = { 'Jet Car Rental': 'jet_car_rental', 'Jet Ski Rental': 'jet_ski_rental', 'Yacht Rental': 'yacht_rental' };
const statusMap: Record<string, string> = { Active: 'active', Draft: 'draft', Inactive: 'inactive' };
const reverse = (map: Record<string, string>, value?: string) => Object.keys(map).find((key) => map[key] === value) || value || '';

type PackageRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string;
  durationMinutes: string;
  basePrice: string;
  b2bPrice: string;
  vatPercent: string;
  capacity: string;
  shortDescription: string;
  status: string;
  isFeatured: boolean;
  displayOrder: string;
};

type PackageFormValues = Omit<PackageRecord, 'id'>;

const emptyPackage: PackageFormValues = {
  title: '',
  slug: '',
  category: 'Jet Car Rental',
  location: 'Jumeirah',
  durationMinutes: '30',
  basePrice: '0',
  b2bPrice: '0',
  vatPercent: '5',
  capacity: '2',
  shortDescription: '',
  status: 'Active',
  isFeatured: true,
  displayOrder: '100'
};

const toText = (value: unknown) => String(value ?? '');
const toNumberText = (value: unknown) => String(Number(value || 0));
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const formatAed = (value: string) => `AED ${Number(value || 0).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;

function mapPackage(row: Record<string, unknown>): PackageRecord {
  return {
    id: toText(row.id),
    title: toText(row.title),
    slug: toText(row.slug),
    category: reverse(categoryMap, toText(row.category)),
    location: toText(row.location || 'Dubai Islands'),
    durationMinutes: toNumberText(row.duration_minutes),
    basePrice: toNumberText(row.base_price),
    b2bPrice: toNumberText(row.b2b_price),
    vatPercent: toNumberText(row.vat_percent || 5),
    capacity: toNumberText(row.capacity || 2),
    shortDescription: toText(row.short_description),
    status: reverse(statusMap, toText(row.status || 'active')),
    isFeatured: Boolean(row.is_featured),
    displayOrder: toNumberText(row.display_order || 100)
  };
}

export default function Page() {
  const [items, setItems] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PackageRecord | null>(null);
  const [locationFilter, setLocationFilter] = useState('All');

  async function loadPackages() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('packages')
      .select('id,title,slug,category,location,duration_minutes,base_price,b2b_price,vat_percent,capacity,short_description,status,is_featured,display_order')
      .order('location')
      .order('capacity')
      .order('duration_minutes');

    if (queryError) setError(queryError.message);
    else setItems(((data || []) as Array<Record<string, unknown>>).map(mapPackage));
    setLoading(false);
  }

  useEffect(() => { loadPackages(); }, []);

  const filteredItems = useMemo(() => locationFilter === 'All' ? items : items.filter((item) => item.location === locationFilter), [items, locationFilter]);

  async function savePackage(values: PackageFormValues) {
    setError('');
    const title = values.title.trim();
    const slug = values.slug.trim() || slugify(`${values.location}-${title}-${values.durationMinutes}-minutes`);
    const payload = {
      title,
      slug,
      category: categoryMap[values.category] || 'jet_car_rental',
      location: values.location,
      duration_minutes: Number(values.durationMinutes || 0),
      base_price: Number(values.basePrice || 0),
      b2b_price: Number(values.b2bPrice || 0),
      vat_percent: Number(values.vatPercent || 5),
      capacity: Number(values.capacity || 2),
      short_description: values.shortDescription,
      status: statusMap[values.status] || 'active',
      is_featured: values.isFeatured,
      display_order: Number(values.displayOrder || 100)
    };

    const result = editing
      ? await supabase.from('packages').update(payload).eq('id', editing.id)
      : await supabase.from('packages').insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setOpen(false);
    setEditing(null);
    await loadPackages();
  }

  async function deactivatePackage(record: PackageRecord) {
    setError('');
    const { error: updateError } = await supabase.from('packages').update({ status: 'inactive' }).eq('id', record.id);
    if (updateError) setError(updateError.message);
    else await loadPackages();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Packages</span><Badge variant="secondary" className="rounded-full">Supabase connected</Badge><Badge className="rounded-full bg-primary text-white">B2C + B2B pricing</Badge></div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Package pricing manager</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage location-wise packages, durations, public prices, partner prices, capacity, and active status.</p>
        </div>
        <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}><Plus data-icon aria-hidden="true" />Add Package</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total Packages" value={String(items.length)} icon={<TicketCheck className="size-5" />} />
        <Metric label="Active Packages" value={String(items.filter((item) => item.status === 'Active').length)} icon={<TicketCheck className="size-5" />} />
        <Metric label="Locations" value={String(new Set(items.map((item) => item.location)).size)} icon={<MapPin className="size-5" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><CardTitle className="text-base">Location pricing table</CardTitle><CardDescription>Public website uses B2C price. Agent workflows can use B2B price.</CardDescription></div>
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">Filter location<select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{['All', ...locations].map((location) => <option key={location}>{location}</option>)}</select></label>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>{['Package', 'Location', 'Duration', 'Capacity', 'B2C', 'B2B', 'Status', 'Action'].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {filteredItems.length ? filteredItems.map((row) => <TableRow key={row.id}>
                  <TableCell className="min-w-[15rem]"><p className="font-semibold text-foreground">{row.title}</p><p className="mt-1 max-w-[18rem] truncate text-xs text-muted-foreground">{row.shortDescription || row.slug}</p></TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>{row.durationMinutes} min</TableCell>
                  <TableCell>{row.capacity} seater</TableCell>
                  <TableCell className="font-semibold text-primary-900">{formatAed(row.basePrice)}</TableCell>
                  <TableCell>{formatAed(row.b2bPrice)}</TableCell>
                  <TableCell><Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>{row.status}</Badge></TableCell>
                  <TableCell><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => { setEditing(row); setOpen(true); }}><Pencil className="size-4" aria-hidden="true" />Edit</Button><Button type="button" size="sm" variant="subtle" onClick={() => deactivatePackage(row)}>Deactivate</Button></div></TableCell>
                </TableRow>) : <TableRow><TableCell colSpan={8} className="h-28 text-center text-sm text-muted-foreground">{loading ? 'Loading packages...' : 'No packages found. Run the package catalog SQL once, or add packages manually.'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {open ? <PackageModal initialValues={editing || undefined} onClose={() => { setOpen(false); setEditing(null); }} onSubmit={savePackage} /> : null}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">{icon}</span></CardContent></Card>;
}

function PackageModal({ initialValues, onClose, onSubmit }: { initialValues?: PackageRecord; onClose: () => void; onSubmit: (values: PackageFormValues) => Promise<void> }) {
  const [values, setValues] = useState<PackageFormValues>(initialValues ? { ...initialValues } : emptyPackage);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); await onSubmit(values); setSaving(false); }
  function updateField<K extends keyof PackageFormValues>(name: K, value: PackageFormValues[K]) { setValues((current) => ({ ...current, [name]: value })); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm"><div className="flex max-h-[92vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]"><div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Package Form</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{initialValues ? 'Edit Package' : 'Add Package'}</h2></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button></div><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2"><FormInput label="Package Title" value={values.title} required onChange={(value) => updateField('title', value)} /><FormInput label="Slug / URL" value={values.slug} placeholder="Auto-generated if empty" onChange={(value) => updateField('slug', value)} /><SelectInput label="Location" value={values.location} options={locations} required onChange={(value) => updateField('location', value)} /><SelectInput label="Category" value={values.category} options={Object.keys(categoryMap)} required onChange={(value) => updateField('category', value)} /><FormInput label="Duration Minutes" type="number" value={values.durationMinutes} required onChange={(value) => updateField('durationMinutes', value)} /><FormInput label="Capacity / Seater" type="number" value={values.capacity} required onChange={(value) => updateField('capacity', value)} /><FormInput label="B2C Price" type="number" value={values.basePrice} required onChange={(value) => updateField('basePrice', value)} /><FormInput label="B2B Price" type="number" value={values.b2bPrice} required onChange={(value) => updateField('b2bPrice', value)} /><FormInput label="VAT %" type="number" value={values.vatPercent} required onChange={(value) => updateField('vatPercent', value)} /><FormInput label="Display Order" type="number" value={values.displayOrder} onChange={(value) => updateField('displayOrder', value)} /><SelectInput label="Status" value={values.status} options={Object.keys(statusMap)} required onChange={(value) => updateField('status', value)} /><label className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"><input type="checkbox" checked={values.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} />Featured package</label><label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Short Description<textarea value={values.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} className="min-h-20 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label></div><div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Package'}</Button></div></form></div></div>;
}

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>;
}

function SelectInput({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
