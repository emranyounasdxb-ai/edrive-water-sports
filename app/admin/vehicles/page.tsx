'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Car, CheckCircle2, ImageIcon, Pencil, Plus, Search, Ship, Waves, Wrench, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';

const locations = ['Dubai', 'Jumeirah', 'Dubai Marina', 'Dubai Harbour', 'Dubai Islands', 'Fishing Harbour'];
const typeMap: Record<string, string> = { 'Jet Car': 'jet_car', 'Jet Ski': 'jet_ski' };
const statusMap: Record<string, string> = { Available: 'available', Booked: 'booked', Maintenance: 'maintenance', Inactive: 'inactive', 'For Sale': 'for_sale' };
const fleetBasePath = '/images/edrive/fleet';
const jetCarImageOptions = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return { label: `Jet Car ${number}`, value: `${fleetBasePath}/jc-${number}.webp` };
});
const jetSkiImageOptions = Array.from({ length: 4 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return { label: `Jet Ski ${number}`, value: `${fleetBasePath}/js-${number}.webp` };
});
const fleetImageOptions = [
  { label: 'No image', value: '' },
  ...jetCarImageOptions,
  ...jetSkiImageOptions
];
const reverse = (map: Record<string, string>, value?: string) => Object.keys(map).find((key) => map[key] === value) || value || '';

type FleetRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string;
  capacity: string;
  status: string;
  brand: string;
  model: string;
  year: string;
  regNo: string;
  deviceImei: string;
  color: string;
  installationDate: string;
  expiryDate: string;
  imageUrl: string;
  notes: string;
  sortOrder: string;
};

type FleetFormValues = Omit<FleetRecord, 'id'>;

const emptyFleet: FleetFormValues = {
  code: '',
  name: '',
  type: 'Jet Car',
  location: 'Dubai',
  capacity: '4',
  status: 'Available',
  brand: '',
  model: '',
  year: '',
  regNo: '',
  deviceImei: '',
  color: '',
  installationDate: '',
  expiryDate: '',
  imageUrl: `${fleetBasePath}/jc-01.webp`,
  notes: '',
  sortOrder: '100'
};

const toText = (value: unknown) => String(value ?? '');
const toNumberText = (value: unknown) => value === null || value === undefined || value === '' ? '' : String(Number(value));
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function imagePathFromCode(code: string, name: string, type: string) {
  const source = `${code} ${name}`.toLowerCase();
  const jetCarMatch = source.match(/(?:jc|jet\s*car)\D*(\d{1,2})/);
  const jetSkiMatch = source.match(/(?:js|jet\s*ski)\D*(\d{1,2})/);

  if (type === 'Jet Ski') {
    const number = Math.min(Math.max(Number(jetSkiMatch?.[1] || 1), 1), 4);
    return `${fleetBasePath}/js-${String(number).padStart(2, '0')}.webp`;
  }

  if (type === 'Jet Car') {
    const number = Math.min(Math.max(Number(jetCarMatch?.[1] || 1), 1), 12);
    return `${fleetBasePath}/jc-${String(number).padStart(2, '0')}.webp`;
  }

  return '';
}

function defaultImage(type: string) {
  return imagePathFromCode('', '', type);
}

function isLegacyFleetImage(value: string) {
  return !value || value.includes('/images/fleet/') || value.includes('/images/edrive/packages/');
}

function resolveFleetImage(imageUrl: string, code: string, name: string, type: string) {
  if (!isLegacyFleetImage(imageUrl)) return imageUrl;
  return imagePathFromCode(code, name, type) || defaultImage(type);
}

function mapFleet(row: Record<string, unknown>): FleetRecord {
  const type = reverse(typeMap, toText(row.type || row.vehicle_type));
  const code = toText(row.vehicle_code);
  const name = toText(row.name || row.vehicle_name);
  const storedImageUrl = toText(row.main_image_url) || toText(row.primary_image_url);
  const imageUrl = resolveFleetImage(storedImageUrl, code, name, type);

  return {
    id: toText(row.id),
    code,
    name,
    type,
    location: toText(row.location || 'Dubai'),
    capacity: toNumberText(row.capacity || 2),
    status: reverse(statusMap, toText(row.status || 'available')),
    brand: toText(row.brand),
    model: toText(row.model),
    year: toNumberText(row.year),
    regNo: toText(row.reg_no),
    deviceImei: toText(row.device_imei),
    color: toText(row.color),
    installationDate: toText(row.date_of_installation),
    expiryDate: toText(row.expiry_date),
    imageUrl,
    notes: toText(row.notes),
    sortOrder: toNumberText(row.sort_order || 100)
  };
}

export default function Page() {
  const [items, setItems] = useState<FleetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FleetRecord | null>(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadFleet() {
    setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('vehicles')
      .select('id,vehicle_code,name,vehicle_name,type,vehicle_type,location,capacity,status,brand,model,year,reg_no,device_imei,color,date_of_installation,expiry_date,primary_image_url,main_image_url,notes,sort_order')
      .order('sort_order', { ascending: true })
      .order('vehicle_code', { ascending: true });

    if (queryError) {
      setError(queryError.message);
    } else {
      setItems(((data || []) as Array<Record<string, unknown>>).map(mapFleet));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadFleet();
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesLocation = locationFilter === 'All' || item.location === locationFilter;
      const matchesSearch = !query || `${item.code} ${item.name} ${item.type} ${item.regNo} ${item.deviceImei} ${item.location}`.toLowerCase().includes(query);
      return matchesType && matchesStatus && matchesLocation && matchesSearch;
    });
  }, [items, typeFilter, statusFilter, locationFilter, searchTerm]);

  const jetCars = items.filter((item) => item.type === 'Jet Car');
  const jetSkis = items.filter((item) => item.type === 'Jet Ski');
  const available = items.filter((item) => item.status === 'Available');
  const maintenance = items.filter((item) => item.status === 'Maintenance');

  async function saveFleet(values: FleetFormValues) {
    setError('');

    const code = values.code.trim();
    const name = values.name.trim() || code;
    const imageUrl = values.imageUrl.trim() || imagePathFromCode(code, name, values.type) || defaultImage(values.type);
    const slug = slugify(code || name);
    const dbStatus = statusMap[values.status] || 'available';
    const dbType = typeMap[values.type] || 'jet_car';

    const payload = {
      vehicle_code: code,
      vehicle_name: name,
      vehicle_type: dbType,
      name,
      slug,
      type: dbType,
      description: values.notes || `${values.capacity} seater ${values.type} fleet unit.`,
      rental_price_aed_per_hour: 0,
      location: values.location,
      capacity: Number(values.capacity || 2),
      status: dbStatus,
      brand: values.brand,
      model: values.model,
      year: values.year ? Number(values.year) : null,
      reg_no: values.regNo,
      device_imei: values.deviceImei,
      color: values.color,
      date_of_installation: values.installationDate || null,
      expiry_date: values.expiryDate || null,
      primary_image_url: imageUrl,
      main_image_url: imageUrl,
      notes: values.notes,
      sort_order: Number(values.sortOrder || 100),
      is_available: dbStatus === 'available',
      is_visible_public: true,
      is_archived: dbStatus === 'inactive'
    };

    const result = editing
      ? await supabase.from('vehicles').update(payload).eq('id', editing.id)
      : await supabase.from('vehicles').insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setOpen(false);
    setEditing(null);
    await loadFleet();
  }

  async function updateFleetStatus(record: FleetRecord, statusLabel: 'Available' | 'Maintenance') {
    setError('');
    const dbStatus = statusMap[statusLabel];

    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ status: dbStatus, is_available: dbStatus === 'available', is_archived: false })
      .eq('id', record.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await loadFleet();
    }
  }

  function clearFilters() {
    setTypeFilter('All');
    setStatusFilter('All');
    setLocationFilter('All');
    setSearchTerm('');
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Fleet</span>
            <Badge variant="secondary" className="rounded-full">Supabase connected</Badge>
            <Badge className="rounded-full bg-primary text-white">Live vehicle inventory</Badge>
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Fleet Management</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage actual Jet Cars and Jet Skis used for bookings, assignments, availability, maintenance, trackers, and registration details.</p>
        </div>
        <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus data-icon aria-hidden="true" />
          Add Fleet Unit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Total Fleet" value={String(items.length)} description="All active units" icon={<Ship className="size-5" />} />
        <Metric label="Available" value={String(available.length)} description="Ready to assign" icon={<Ship className="size-5" />} />
        <Metric label="Jet Cars" value={String(jetCars.length)} description="4 seater units" icon={<Car className="size-5" />} />
        <Metric label="Jet Skis" value={String(jetSkis.length)} description="2 seater units" icon={<Waves className="size-5" />} />
        <Metric label="Maintenance" value={String(maintenance.length)} description="Needs attention" icon={<Wrench className="size-5" />} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-base">Fleet Filters</CardTitle>
              <CardDescription>Filter by vehicle type, availability status, booking area, code, registration, or tracker IMEI.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FilterSelect label="Vehicle Type" value={typeFilter} options={['All', 'Jet Car', 'Jet Ski']} onChange={setTypeFilter} />
            <FilterSelect label="Status" value={statusFilter} options={['All', ...Object.keys(statusMap)]} onChange={setStatusFilter} />
            <FilterSelect label="Location" value={locationFilter} options={['All', ...locations]} onChange={setLocationFilter} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground xl:col-span-2">
              Search Fleet
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search code, name, REG no, IMEI..."
                  className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </span>
            </label>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-base">Fleet Inventory Table</CardTitle>
            <CardDescription>Showing {filteredItems.length} of {items.length} fleet units. Edit each unit later with registration, tracker, images, maintenance and notes.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            {typeFilter !== 'All' ? <Badge variant="secondary">{typeFilter}</Badge> : null}
            {statusFilter !== 'All' ? <Badge variant="secondary">{statusFilter}</Badge> : null}
            {locationFilter !== 'All' ? <Badge variant="secondary">{locationFilter}</Badge> : null}
          </div>
        </CardHeader>

        <CardContent>
          {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="max-h-[70vh] overflow-auto rounded-2xl border border-border/70">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow>
                  {['Image', 'Code', 'Vehicle', 'Type', 'Location', 'Capacity', 'REG No.', 'Tracker IMEI', 'Status', 'Action'].map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length ? filteredItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><FleetThumbnail src={row.imageUrl} title={row.name} /></TableCell>
                    <TableCell className="font-semibold text-foreground">{row.code}</TableCell>
                    <TableCell className="min-w-[12rem]">
                      <p className="font-semibold text-foreground">{row.name}</p>
                      <p className="mt-1 max-w-[15rem] truncate text-xs text-muted-foreground">{row.brand || 'Brand pending'} {row.model || ''}</p>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{row.type}</Badge></TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>{row.capacity} seater</TableCell>
                    <TableCell>{row.regNo || '—'}</TableCell>
                    <TableCell>{row.deviceImei || '—'}</TableCell>
                    <TableCell><Badge variant={row.status === 'Available' ? 'default' : 'secondary'}>{row.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(row); setOpen(true); }}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit
                        </Button>
                        {row.status === 'Maintenance' ? (
                          <Button type="button" size="sm" onClick={() => updateFleetStatus(row, 'Available')}>
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Make Available
                          </Button>
                        ) : (
                          <Button type="button" size="sm" variant="subtle" onClick={() => updateFleetStatus(row, 'Maintenance')}>
                            <Wrench className="size-4" aria-hidden="true" />
                            Maintenance
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">
                      {loading ? 'Loading fleet...' : 'No fleet units found for the selected filters.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {open ? (
        <FleetModal
          initialValues={editing || undefined}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSubmit={saveFleet}
        />
      ) : null}
    </div>
  );
}

function FleetThumbnail({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ImageIcon className="size-5" aria-hidden="true" /></span>;
  }
  return <img src={src} alt={title} onError={() => setFailed(true)} className="size-12 rounded-2xl border border-border object-cover shadow-sm" />;
}

function Metric({ label, value, description, icon }: { label: string; value: string; description: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{description}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function FleetModal({ initialValues, onClose, onSubmit }: { initialValues?: FleetRecord; onClose: () => void; onSubmit: (values: FleetFormValues) => Promise<void> }) {
  const [values, setValues] = useState<FleetFormValues>(initialValues ? { ...initialValues } : emptyFleet);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSubmit(values);
    setSaving(false);
  }

  function updateField<K extends keyof FleetFormValues>(name: K, value: FleetFormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateType(value: string) {
    setValues((current) => ({
      ...current,
      type: value,
      capacity: value === 'Jet Ski' ? '2' : '4',
      imageUrl: isLegacyFleetImage(current.imageUrl) ? imagePathFromCode(current.code, current.name, value) : current.imageUrl
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[44rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Fleet Form</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{initialValues ? 'Edit Fleet Unit' : 'Add Fleet Unit'}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">
              Fleet Image
              <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
                <FleetThumbnail src={values.imageUrl} title={values.name || 'Fleet image'} />
                <select value={values.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
                  {fleetImageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </label>

            <FormInput label="Custom Image Path" value={values.imageUrl} placeholder="/images/edrive/fleet/jc-01.webp" onChange={(value) => updateField('imageUrl', value)} />
            <FormInput label="Vehicle Code" value={values.code} required placeholder="JC-01 / JS-01" onChange={(value) => updateField('code', value)} />
            <FormInput label="Vehicle Name" value={values.name} required placeholder="Jet Car 01" onChange={(value) => updateField('name', value)} />
            <SelectInput label="Vehicle Type" value={values.type} options={Object.keys(typeMap)} required onChange={updateType} />
            <SelectInput label="Location" value={values.location} options={locations} required onChange={(value) => updateField('location', value)} />
            <FormInput label="Capacity / Seater" type="number" value={values.capacity} required onChange={(value) => updateField('capacity', value)} />
            <SelectInput label="Status" value={values.status} options={Object.keys(statusMap)} required onChange={(value) => updateField('status', value)} />
            <FormInput label="Brand" value={values.brand} onChange={(value) => updateField('brand', value)} />
            <FormInput label="Model" value={values.model} onChange={(value) => updateField('model', value)} />
            <FormInput label="Year" type="number" value={values.year} onChange={(value) => updateField('year', value)} />
            <FormInput label="REG. No." value={values.regNo} onChange={(value) => updateField('regNo', value)} />
            <FormInput label="DEVICE IMEI" value={values.deviceImei} onChange={(value) => updateField('deviceImei', value)} />
            <FormInput label="Color" value={values.color} onChange={(value) => updateField('color', value)} />
            <FormInput label="Date of Installation" type="date" value={values.installationDate} onChange={(value) => updateField('installationDate', value)} />
            <FormInput label="Expiry Date" type="date" value={values.expiryDate} onChange={(value) => updateField('expiryDate', value)} />
            <FormInput label="Display Order" type="number" value={values.sortOrder} onChange={(value) => updateField('sortOrder', value)} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">
              Notes
              <textarea value={values.notes} onChange={(event) => updateField('notes', event.target.value)} className="min-h-20 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Fleet Unit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
      {label}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" />
    </label>
  );
}

function SelectInput({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
      {label}
      <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}