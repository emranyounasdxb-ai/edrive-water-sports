'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Car, ImageIcon, MapPin, Pencil, Plus, Search, TicketCheck, Waves, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';

const locations = ['Jumeirah', 'Dubai Marina', 'Dubai Harbour', 'Dubai Islands', 'Fishing Harbour'];
const categoryMap: Record<string, string> = { 'Jet Car Rental': 'jet_car_rental', 'Jet Ski Rental': 'jet_ski_rental', 'Yacht Rental': 'yacht_rental' };
const statusMap: Record<string, string> = { Active: 'active', Draft: 'draft', Inactive: 'inactive' };
const packageImageOptions = [
  { label: 'No image', value: '' },
  { label: 'Jet Ski', value: '/images/packages/jet-ski.webp' },
  { label: 'Jet Car 2 Seater', value: '/images/packages/jet-car-2-seater.webp' },
  { label: 'Jet Car 4 Seater', value: '/images/packages/jet-car-4-seater.webp' },
  { label: 'Combo / VIP', value: '/images/packages/combo-package.webp' }
];
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
  imageUrl: string;
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
  imageUrl: '/images/packages/jet-car-2-seater.webp',
  shortDescription: '',
  status: 'Active',
  isFeatured: true,
  displayOrder: '100'
};

const toText = (value: unknown) => String(value ?? '');
const toNumberText = (value: unknown) => String(Number(value || 0));
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const formatAed = (value: string) => `AED ${Number(value || 0).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;

function getDefaultImage(category: string, capacity: string) {
  if (category === 'Jet Ski Rental') return '/images/packages/jet-ski.webp';
  if (category === 'Jet Car Rental' && Number(capacity) >= 4) return '/images/packages/jet-car-4-seater.webp';
  if (category === 'Jet Car Rental') return '/images/packages/jet-car-2-seater.webp';
  return '';
}

function mapPackage(row: Record<string, unknown>): PackageRecord {
  const category = reverse(categoryMap, toText(row.category));
  const capacity = toNumberText(row.capacity || 2);
  return {
    id: toText(row.id),
    title: toText(row.title),
    slug: toText(row.slug),
    category,
    location: toText(row.location || 'Dubai Islands'),
    durationMinutes: toNumberText(row.duration_minutes),
    basePrice: toNumberText(row.base_price),
    b2bPrice: toNumberText(row.b2b_price),
    vatPercent: toNumberText(row.vat_percent || 5),
    capacity,
    imageUrl: toText(row.image_url) || getDefaultImage(category, capacity),
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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadPackages() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('packages')
      .select('id,title,slug,category,location,duration_minutes,base_price,b2b_price,vat_percent,capacity,image_url,short_description,status,is_featured,display_order')
      .order('location')
      .order('category')
      .order('capacity')
      .order('duration_minutes');

    if (queryError) setError(queryError.message);
    else setItems(((data || []) as Array<Record<string, unknown>>).map(mapPackage));
    setLoading(false);
  }

  useEffect(() => { loadPackages(); }, []);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesLocation = locationFilter === 'All' || item.location === locationFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesCapacity = capacityFilter === 'All' || item.capacity === capacityFilter;
      const matchesDuration = durationFilter === 'All' || item.durationMinutes === durationFilter;
      const matchesSearch = !query || `${item.title} ${item.location} ${item.category} ${item.shortDescription}`.toLowerCase().includes(query);
      return matchesLocation && matchesCategory && matchesCapacity && matchesDuration && matchesSearch;
    });
  }, [items, locationFilter, categoryFilter, capacityFilter, durationFilter, searchTerm]);

  const activeCount = items.filter((item) => item.status === 'Active').length;
  const jetCarCount = items.filter((item) => item.category === 'Jet Car Rental').length;
  const jetSkiCount = items.filter((item) => item.category === 'Jet Ski Rental').length;
  const durationOptions = Array.from(new Set(items.map((item) => item.durationMinutes))).sort((a, b) => Number(a) - Number(b));
  const capacityOptions = Array.from(new Set(items.map((item) => item.capacity))).sort((a, b) => Number(a) - Number(b));

  async function savePackage(values: PackageFormValues) {
    setError('');
    const title = values.title.trim();
    const slug = values.slug.trim() || slugify(`${values.location}-${title}-${values.durationMinutes}-minutes`);
    const imageUrl = values.imageUrl.trim() || getDefaultImage(values.category, values.capacity);
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
      image_url: imageUrl,
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

  function clearFilters() {
    setLocationFilter('All');
    setCategoryFilter('All');
    setCapacityFilter('All');
    setDurationFilter('All');
    setSearchTerm('');
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Packages</span>
            <Badge variant="secondary" className="rounded-full">Supabase connected</Badge>
            <Badge className="rounded-full bg-primary text-white">Repo images + B2C/B2B rates</Badge>
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Package Pricing Manager</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage location-wise B2C and B2B rates with curated package images from the website repo.</p>
        </div>
        <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}><Plus data-icon aria-hidden="true" />Add Package</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Total Packages" value={String(items.length)} description="All pricing rows" icon={<TicketCheck className="size-5" />} />
        <Metric label="Active Rates" value={String(activeCount)} description="Visible for booking" icon={<TicketCheck className="size-5" />} />
        <Metric label="Booking Areas" value={String(new Set(items.map((item) => item.location)).size)} description="Service locations" icon={<MapPin className="size-5" />} />
        <Metric label="Jet Car Packages" value={String(jetCarCount)} description="Active jet car rates" icon={<Car className="size-5" />} />
        <Metric label="Jet Ski Packages" value={String(jetSkiCount)} description="Active jet ski rates" icon={<Waves className="size-5" />} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-base">Pricing Filters</CardTitle>
              <CardDescription>Filter packages by booking area, ride type, seating, duration, or package name.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <FilterSelect label="Booking Area" value={locationFilter} options={['All', ...locations]} onChange={setLocationFilter} />
            <FilterSelect label="Ride Type" value={categoryFilter} options={['All', 'Jet Car Rental', 'Jet Ski Rental']} onChange={setCategoryFilter} />
            <FilterSelect label="Seating" value={capacityFilter} options={['All', ...capacityOptions]} onChange={setCapacityFilter} suffix=" seater" />
            <FilterSelect label="Duration" value={durationFilter} options={['All', ...durationOptions]} onChange={setDurationFilter} suffix=" min" />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground xl:col-span-2">
              Search Packages
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search package, area, type..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" />
              </span>
            </label>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-base">Pricing Rates Table</CardTitle>
            <CardDescription>Showing {filteredItems.length} of {items.length} pricing rows. Images are repo paths; Supabase stores only the selected image path.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            {locationFilter !== 'All' ? <Badge variant="secondary">{locationFilter}</Badge> : null}
            {categoryFilter !== 'All' ? <Badge variant="secondary">{categoryFilter}</Badge> : null}
            {capacityFilter !== 'All' ? <Badge variant="secondary">{capacityFilter} seater</Badge> : null}
            {durationFilter !== 'All' ? <Badge variant="secondary">{durationFilter} min</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="max-h-[70vh] overflow-auto rounded-2xl border border-border/70">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow>{['Image', 'Package', 'Area', 'Type', 'Duration', 'Capacity', 'B2C', 'B2B', 'Status', 'Action'].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length ? filteredItems.map((row) => <TableRow key={row.id}>
                  <TableCell><PackageThumbnail src={row.imageUrl} title={row.title} /></TableCell>
                  <TableCell className="min-w-[15rem]"><p className="font-semibold text-foreground">{row.title}</p><p className="mt-1 max-w-[18rem] truncate text-xs text-muted-foreground">{row.shortDescription || row.slug}</p></TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell><Badge variant="secondary">{row.category.replace(' Rental', '')}</Badge></TableCell>
                  <TableCell>{row.durationMinutes} min</TableCell>
                  <TableCell>{row.capacity} seater</TableCell>
                  <TableCell className="font-semibold text-primary-900">{formatAed(row.basePrice)}</TableCell>
                  <TableCell>{formatAed(row.b2bPrice)}</TableCell>
                  <TableCell><Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>{row.status}</Badge></TableCell>
                  <TableCell><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => { setEditing(row); setOpen(true); }}><Pencil className="size-4" aria-hidden="true" />Edit</Button><Button type="button" size="sm" variant="subtle" onClick={() => deactivatePackage(row)}>Deactivate</Button></div></TableCell>
                </TableRow>) : <TableRow><TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">{loading ? 'Loading packages...' : 'No packages found for the selected filters.'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {open ? <PackageModal initialValues={editing || undefined} onClose={() => { setOpen(false); setEditing(null); }} onSubmit={savePackage} /> : null}
    </div>
  );
}

function PackageThumbnail({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ImageIcon className="size-5" aria-hidden="true" /></span>;
  return <img src={src} alt={title} onError={() => setFailed(true)} className="size-12 rounded-2xl border border-border object-cover shadow-sm" />;
}

function Metric({ label, value, description, icon }: { label: string; value: string; description: string; icon: ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{description}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">{icon}</span></CardContent></Card>;
}

function FilterSelect({ label, value, options, onChange, suffix = '' }: { label: string; value: string; options: string[]; onChange: (value: string) => void; suffix?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option} value={option}>{option === 'All' ? 'All' : `${option}${suffix}`}</option>)}</select></label>;
}

function PackageModal({ initialValues, onClose, onSubmit }: { initialValues?: PackageRecord; onClose: () => void; onSubmit: (values: PackageFormValues) => Promise<void> }) {
  const [values, setValues] = useState<PackageFormValues>(initialValues ? { ...initialValues } : emptyPackage);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); await onSubmit(values); setSaving(false); }
  function updateField<K extends keyof PackageFormValues>(name: K, value: PackageFormValues[K]) { setValues((current) => ({ ...current, [name]: value })); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm"><div className="flex max-h-[92vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]"><div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Package Form</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{initialValues ? 'Edit Package' : 'Add Package'}</h2></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button></div><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Package Image<div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"><PackageThumbnail src={values.imageUrl} title={values.title || 'Package image'} /><select value={values.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{packageImageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></label><FormInput label="Custom Image Path" value={values.imageUrl} placeholder="/images/packages/jet-ski.webp" onChange={(value) => updateField('imageUrl', value)} /><FormInput label="Package Title" value={values.title} required onChange={(value) => updateField('title', value)} /><FormInput label="Slug / URL" value={values.slug} placeholder="Auto-generated if empty" onChange={(value) => updateField('slug', value)} /><SelectInput label="Location" value={values.location} options={locations} required onChange={(value) => updateField('location', value)} /><SelectInput label="Category" value={values.category} options={Object.keys(categoryMap)} required onChange={(value) => updateField('category', value)} /><FormInput label="Duration Minutes" type="number" value={values.durationMinutes} required onChange={(value) => updateField('durationMinutes', value)} /><FormInput label="Capacity / Seater" type="number" value={values.capacity} required onChange={(value) => updateField('capacity', value)} /><FormInput label="B2C Price" type="number" value={values.basePrice} required onChange={(value) => updateField('basePrice', value)} /><FormInput label="B2B Price" type="number" value={values.b2bPrice} required onChange={(value) => updateField('b2bPrice', value)} /><FormInput label="VAT %" type="number" value={values.vatPercent} required onChange={(value) => updateField('vatPercent', value)} /><FormInput label="Display Order" type="number" value={values.displayOrder} onChange={(value) => updateField('displayOrder', value)} /><SelectInput label="Status" value={values.status} options={Object.keys(statusMap)} required onChange={(value) => updateField('status', value)} /><label className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"><input type="checkbox" checked={values.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} />Featured package</label><label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Short Description<textarea value={values.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} className="min-h-20 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label></div><div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Package'}</Button></div></form></div></div>;
}

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>;
}

function SelectInput({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
