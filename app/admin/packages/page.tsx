'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Car,
  CheckCircle2,
  Eye,
  ImageIcon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  TicketCheck,
  Trash2,
  Waves,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortalAccess } from '@/components/edrive/portal-access';
import { getJetCarPackageImage, getJetSkiPackageImage, jetCarPackageImages, jetSkiPackageImages } from '@/lib/edrive-package-images';
import { supabase } from '@/lib/supabase-client';

const categoryMap: Record<string, string> = {
  'Jet Car Rental': 'jet_car_rental',
  'Jet Ski Rental': 'jet_ski_rental',
  'Yacht Rental': 'yacht_rental'
};

const statusMap: Record<string, string> = { Active: 'active', Draft: 'draft', Inactive: 'inactive' };

const packageImageOptions = [
  { label: 'Auto by package type', value: '' },
  ...jetCarPackageImages.map((value, index) => ({ label: `Jet Car ${String(index + 1).padStart(2, '0')}`, value })),
  ...jetSkiPackageImages.slice(1).map((value, index) => ({ label: `Jet Ski ${String(index + 1).padStart(2, '0')}`, value }))
];

const reverse = (map: Record<string, string>, value?: string) => Object.keys(map).find((key) => map[key] === value) || value || '';
const toText = (value: unknown) => String(value ?? '');
const toNumberText = (value: unknown) => String(Number(value || 0));
const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const formatAed = (value: string) => `AED ${Number(value || 0).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;

type PackageRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  durationMinutes: string;
  basePrice: string;
  b2bPrice: string;
  capacity: string;
  imageUrl: string;
  shortDescription: string;
  status: string;
  isFeatured: boolean;
  displayOrder: string;
};

type PackageFormValues = Omit<PackageRecord, 'id'>;
type SortKey = 'title' | 'category' | 'durationMinutes' | 'capacity' | 'basePrice' | 'b2bPrice' | 'status' | 'displayOrder';
type SortDirection = 'asc' | 'desc';
type ConfirmAction = { type: 'activate' | 'deactivate' | 'delete'; record: PackageRecord } | null;

const emptyPackage: PackageFormValues = {
  title: '',
  slug: '',
  category: 'Jet Car Rental',
  durationMinutes: '30',
  basePrice: '0',
  b2bPrice: '0',
  capacity: '2',
  imageUrl: '',
  shortDescription: '',
  status: 'Active',
  isFeatured: true,
  displayOrder: '100'
};

function isUploadedPackageImage(value: string) {
  return value.includes('/images/edrive/packages/jet-ski/') || value.includes('/images/edrive/packages/jet-car/');
}

function getDefaultImage(category: string, seedValue: string | number = 0) {
  const seed = Number(seedValue || 0);
  if (category === 'Jet Ski Rental' || category === 'jet_ski_rental') return getJetSkiPackageImage(seed);
  if (category === 'Jet Car Rental' || category === 'jet_car_rental') return getJetCarPackageImage(seed);
  return getJetSkiPackageImage(seed);
}

function resolvePackageImage(category: string, imageUrl: string, seedValue: string | number = 0) {
  return isUploadedPackageImage(imageUrl) ? imageUrl : getDefaultImage(category, seedValue);
}

function mapPackage(row: Record<string, unknown>, index: number): PackageRecord {
  const category = reverse(categoryMap, toText(row.category));
  const capacity = toNumberText(row.capacity || 2);
  const displayOrder = toNumberText(row.display_order || index);
  return {
    id: toText(row.id),
    title: toText(row.title),
    slug: toText(row.slug),
    category,
    durationMinutes: toNumberText(row.duration_minutes),
    basePrice: toNumberText(row.base_price),
    b2bPrice: toNumberText(row.b2b_price),
    capacity,
    imageUrl: resolvePackageImage(category, toText(row.image_url), displayOrder),
    shortDescription: toText(row.short_description),
    status: reverse(statusMap, toText(row.status || 'active')),
    isFeatured: Boolean(row.is_featured),
    displayOrder
  };
}

function packageSpecKey(value: Pick<PackageFormValues, 'category' | 'capacity' | 'durationMinutes'>) {
  return `${categoryMap[value.category] || value.category}|${Number(value.capacity || 0)}|${Number(value.durationMinutes || 0)}`;
}

function generatedPackageTitle(value: Pick<PackageFormValues, 'category' | 'capacity' | 'durationMinutes'>) {
  const category = value.category.replace(' Rental', '');
  return `${category} ${Number(value.capacity || 0)} Seater - ${Number(value.durationMinutes || 0)} Minutes`;
}

function validatePackage(values: PackageFormValues, items: PackageRecord[], editingId?: string) {
  const title = values.title.trim();
  const slug = values.slug.trim() ? slugify(values.slug) : slugify(`${title}-${values.durationMinutes}-minutes`);
  const duration = Number(values.durationMinutes);
  const capacity = Number(values.capacity);
  const b2c = Number(values.basePrice);
  const b2b = Number(values.b2bPrice);
  const displayOrder = Number(values.displayOrder);

  if (title.length < 5 || title.length > 120) return 'Package title must be between 5 and 120 characters.';
  if (!/^[a-z0-9][a-z0-9 '&()+,./-]*$/i.test(title)) return 'Package title contains unsupported characters.';
  if (!Number.isInteger(duration) || duration < 10 || duration > 480) return 'Duration must be a whole number between 10 and 480 minutes.';
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 12) return 'Capacity must be a whole number between 1 and 12.';
  if (!Number.isFinite(b2c) || b2c <= 0) return 'B2C price must be greater than zero.';
  if (!Number.isFinite(b2b) || b2b < 0) return 'B2B price cannot be negative.';
  if (b2b > b2c) return 'B2B price cannot be higher than the B2C price.';
  if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 9999) return 'Display order must be a whole number between 0 and 9999.';
  if (values.status === 'Active' && !values.imageUrl.trim()) {
    // The auto image option is valid and will be resolved during save.
  }

  const duplicateTitle = items.find((item) => item.id !== editingId && item.status !== 'Inactive' && normalizeText(item.title) === normalizeText(title));
  if (duplicateTitle) return `A live package already uses the title “${duplicateTitle.title}”.`;

  const duplicateSlug = items.find((item) => item.id !== editingId && normalizeText(item.slug) === normalizeText(slug));
  if (duplicateSlug) return `The URL slug is already used by “${duplicateSlug.title}”.`;

  if (values.status !== 'Inactive') {
    const duplicateSpec = items.find((item) => item.id !== editingId && item.status !== 'Inactive' && packageSpecKey(item) === packageSpecKey(values));
    if (duplicateSpec) {
      return `A ${values.category.replace(' Rental', '')} ${capacity} seater package for ${duration} minutes already exists: “${duplicateSpec.title}”. Deactivate or delete it before creating another.`;
    }
  }

  return '';
}

function rpcUnavailable(message: string, functionName: string) {
  const value = message.toLowerCase();
  return value.includes(functionName.toLowerCase()) && (value.includes('does not exist') || value.includes('schema cache') || value.includes('could not find') || value.includes('pgrst202'));
}

function statusBadgeClass(status: string) {
  if (status === 'Active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Draft') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-600';
}

export default function Page() {
  const { canMutateCurrentPage, isSuperAdmin, loading: accessLoading } = usePortalAccess();
  const [items, setItems] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PackageRecord | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [featuredFilter, setFeaturedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('displayOrder');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadPackages() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('packages')
      .select('id,title,slug,category,duration_minutes,base_price,b2b_price,capacity,image_url,short_description,status,is_featured,display_order')
      .order('display_order')
      .order('category')
      .order('capacity')
      .order('duration_minutes');

    if (queryError) setError(queryError.message);
    else setItems(((data || []) as Array<Record<string, unknown>>).map(mapPackage));
    setLoading(false);
  }

  useEffect(() => { void loadPackages(); }, []);

  const duplicateSpecCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.filter((item) => item.status !== 'Inactive').forEach((item) => counts.set(packageSpecKey(item), (counts.get(packageSpecKey(item)) || 0) + 1));
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesCapacity = capacityFilter === 'All' || item.capacity === capacityFilter;
      const matchesDuration = durationFilter === 'All' || item.durationMinutes === durationFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesFeatured = featuredFilter === 'All' || (featuredFilter === 'Featured' ? item.isFeatured : !item.isFeatured);
      const matchesSearch = !query || `${item.title} ${item.slug} ${item.category} ${item.capacity} seater ${item.durationMinutes} min ${item.shortDescription}`.toLowerCase().includes(query);
      return matchesCategory && matchesCapacity && matchesDuration && matchesStatus && matchesFeatured && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const numericKeys: SortKey[] = ['durationMinutes', 'capacity', 'basePrice', 'b2bPrice', 'displayOrder'];
      const comparison = numericKeys.includes(sortKey)
        ? Number(a[sortKey]) - Number(b[sortKey])
        : String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, categoryFilter, capacityFilter, durationFilter, statusFilter, featuredFilter, searchTerm, sortKey, sortDirection]);

  useEffect(() => { setPage(1); }, [categoryFilter, capacityFilter, durationFilter, statusFilter, featuredFilter, searchTerm, sortKey, sortDirection, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = items.filter((item) => item.status === 'Active').length;
  const draftCount = items.filter((item) => item.status === 'Draft').length;
  const inactiveCount = items.filter((item) => item.status === 'Inactive').length;
  const jetCarCount = items.filter((item) => item.category === 'Jet Car Rental').length;
  const jetSkiCount = items.filter((item) => item.category === 'Jet Ski Rental').length;
  const duplicateCount = Array.from(duplicateSpecCounts.values()).filter((count) => count > 1).length;
  const durationOptions = Array.from(new Set(items.map((item) => item.durationMinutes))).sort((a, b) => Number(a) - Number(b));
  const capacityOptions = Array.from(new Set(items.map((item) => item.capacity))).sort((a, b) => Number(a) - Number(b));

  function openCreate() {
    setEditing(null);
    setModalReadOnly(false);
    setOpen(true);
  }

  function openRecord(record: PackageRecord, readOnly: boolean) {
    setEditing(record);
    setModalReadOnly(readOnly);
    setOpen(true);
  }

  async function savePackage(values: PackageFormValues) {
    setError('');
    setSuccess('');
    const validationError = validatePackage(values, items, editing?.id);
    if (validationError) return validationError;

    const title = values.title.trim();
    const slug = values.slug.trim() ? slugify(values.slug) : slugify(`${title}-${values.durationMinutes}-minutes`);
    const imageUrl = values.imageUrl.trim() || getDefaultImage(values.category, values.displayOrder || values.durationMinutes);
    const payload = {
      title,
      slug,
      category: categoryMap[values.category] || 'jet_car_rental',
      duration_minutes: Number(values.durationMinutes),
      base_price: Number(values.basePrice),
      b2b_price: Number(values.b2bPrice),
      capacity: Number(values.capacity),
      image_url: imageUrl,
      short_description: values.shortDescription.trim().slice(0, 500),
      status: statusMap[values.status] || 'active',
      is_featured: values.isFeatured,
      display_order: Number(values.displayOrder || 100)
    };

    const rpcResult = await supabase.rpc('save_package_catalog_entry', {
      p_payload: payload,
      p_package_id: editing?.id || null
    });

    if (rpcResult.error && !rpcUnavailable(rpcResult.error.message || '', 'save_package_catalog_entry')) {
      return rpcResult.error.message;
    }

    if (rpcResult.error) {
      const result = editing
        ? await supabase.from('packages').update(payload).eq('id', editing.id)
        : await supabase.from('packages').insert(payload);
      if (result.error) return result.error.message;
    }

    setOpen(false);
    setEditing(null);
    setSuccess(editing ? 'Package updated successfully.' : 'Package created successfully.');
    await loadPackages();
    return '';
  }

  async function applyStatusAction(record: PackageRecord, nextStatus: 'active' | 'inactive') {
    setActionBusy(true);
    setError('');
    setSuccess('');
    const { error: updateError } = await supabase.from('packages').update({ status: nextStatus }).eq('id', record.id);
    setActionBusy(false);
    setConfirmAction(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(nextStatus === 'active' ? 'Package activated and restored to the live catalog.' : 'Package deactivated. Existing bookings remain unchanged.');
    await loadPackages();
  }

  async function legacyPackageUsage(record: PackageRecord) {
    if (record.slug) {
      const slugResult = await supabase.from('booking_requests').select('id').eq('selected_package_slug', record.slug).limit(1);
      if (!slugResult.error && slugResult.data?.length) return true;
    }
    const nameResult = await supabase.from('booking_requests').select('id').eq('selected_package_name', record.title).limit(1);
    return !nameResult.error && Boolean(nameResult.data?.length);
  }

  async function deletePackage(record: PackageRecord) {
    setActionBusy(true);
    setError('');
    setSuccess('');

    const rpcResult = await supabase.rpc('delete_package_if_unused', { p_package_id: record.id });
    if (rpcResult.error && !rpcUnavailable(rpcResult.error.message || '', 'delete_package_if_unused')) {
      setActionBusy(false);
      setConfirmAction(null);
      setError(rpcResult.error.message);
      return;
    }

    if (rpcResult.error) {
      const used = await legacyPackageUsage(record);
      if (used) {
        setActionBusy(false);
        setConfirmAction(null);
        setError('This package is linked to an existing booking and cannot be deleted. Deactivate it instead.');
        return;
      }
      const deleteResult = await supabase.from('packages').delete().eq('id', record.id);
      if (deleteResult.error) {
        setActionBusy(false);
        setConfirmAction(null);
        setError(deleteResult.error.message);
        return;
      }
    }

    setActionBusy(false);
    setConfirmAction(null);
    setSuccess('Unused package deleted permanently.');
    await loadPackages();
  }

  function clearFilters() {
    setCategoryFilter('All');
    setCapacityFilter('All');
    setDurationFilter('All');
    setStatusFilter('All');
    setFeaturedFilter('All');
    setSearchTerm('');
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Package Catalog</span>
            <Badge variant="secondary" className="rounded-full">Live Data</Badge>
            <Badge className="rounded-full bg-primary text-white">Retail & Partner Pricing</Badge>
            {duplicateCount ? <Badge className="rounded-full border border-red-200 bg-red-50 text-red-700">{duplicateCount} duplicate specification{duplicateCount === 1 ? '' : 's'}</Badge> : null}
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Package Catalog & Pricing Manager</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage public package identity, ride configuration, pricing, visibility, display order, and safe catalog lifecycle actions.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground"><span>{jetCarCount} Jet Car</span><span>•</span><span>{jetSkiCount} Jet Ski</span></div>
        </div>
        {!accessLoading && canMutateCurrentPage ? <Button type="button" onClick={openCreate}><Plus data-icon aria-hidden="true" />Add Package</Button> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total Packages" value={String(items.length)} description="All catalog records" icon={<TicketCheck className="size-5" />} />
        <Metric label="Live Packages" value={String(activeCount)} description="Visible for new bookings" icon={<CheckCircle2 className="size-5" />} />
        <Metric label="Draft Packages" value={String(draftCount)} description="Not published yet" icon={<Pencil className="size-5" />} />
        <Metric label="Inactive Packages" value={String(inactiveCount)} description="Retained for history" icon={<RotateCcw className="size-5" />} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><CardTitle className="text-base">Catalog Filters</CardTitle><CardDescription>Filter packages by ride type, seating, duration, status, visibility, or package name.</CardDescription></div>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <FilterSelect label="Ride Type" value={categoryFilter} options={['All', 'Jet Car Rental', 'Jet Ski Rental']} onChange={setCategoryFilter} />
            <FilterSelect label="Seating" value={capacityFilter} options={['All', ...capacityOptions]} onChange={setCapacityFilter} suffix=" seater" />
            <FilterSelect label="Duration" value={durationFilter} options={['All', ...durationOptions]} onChange={setDurationFilter} suffix=" min" />
            <FilterSelect label="Status" value={statusFilter} options={['All', 'Active', 'Draft', 'Inactive']} onChange={setStatusFilter} />
            <FilterSelect label="Featured" value={featuredFilter} options={['All', 'Featured', 'Not Featured']} onChange={setFeaturedFilter} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground xl:col-span-2">Search Packages<span className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search package, slug, type, seating..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" /></span></label>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><CardTitle className="text-base">Catalog & Pricing Table</CardTitle><CardDescription>Showing {pagedItems.length} of {filteredItems.length} filtered packages ({items.length} total).</CardDescription></div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <label className="flex items-center gap-2">Rows<select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-9 rounded-xl border border-border bg-white px-3 text-xs font-semibold"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
          </div>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {success ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p> : null}
          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <Table className="min-w-[1280px]">
              <TableHeader className="bg-[#F7FAFA]">
                <TableRow>
                  <TableHead>Image</TableHead>
                  <SortableHead label="Package" column="title" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortableHead label="Type" column="category" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortableHead label="Duration" column="durationMinutes" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortableHead label="Capacity" column="capacity" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortableHead label="B2C" column="basePrice" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortableHead label="B2B" column="b2bPrice" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortableHead label="Order" column="displayOrder" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortableHead label="Status" column="status" active={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <TableHead className="sticky right-0 bg-[#F7FAFA] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedItems.length ? pagedItems.map((row) => {
                  const duplicate = row.status !== 'Inactive' && (duplicateSpecCounts.get(packageSpecKey(row)) || 0) > 1;
                  return <TableRow key={row.id} className={duplicate ? 'bg-red-50/40' : ''}>
                    <TableCell><PackageThumbnail src={row.imageUrl} title={row.title} /></TableCell>
                    <TableCell className="min-w-[18rem]"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{row.title}</p>{row.isFeatured ? <Badge className="bg-accent-100 text-accent-800">Featured</Badge> : null}{duplicate ? <Badge className="border border-red-200 bg-red-50 text-red-700">Duplicate spec</Badge> : null}</div><p className="mt-1 max-w-[22rem] truncate text-xs text-muted-foreground">{row.shortDescription || row.slug}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">/{row.slug}</p></TableCell>
                    <TableCell><Badge variant="secondary">{row.category.replace(' Rental', '')}</Badge></TableCell>
                    <TableCell>{row.durationMinutes} min</TableCell>
                    <TableCell>{row.capacity} seater</TableCell>
                    <TableCell className="font-semibold text-primary-900">{formatAed(row.basePrice)}</TableCell>
                    <TableCell>{formatAed(row.b2bPrice)}</TableCell>
                    <TableCell>{row.displayOrder}</TableCell>
                    <TableCell><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadgeClass(row.status)}`}>{row.status}</span></TableCell>
                    <TableCell className="sticky right-0 bg-white text-right"><div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openRecord(row, !canMutateCurrentPage)}>{canMutateCurrentPage ? <Pencil className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}{canMutateCurrentPage ? 'Edit' : 'View'}</Button>
                      {canMutateCurrentPage ? row.status === 'Inactive' ? <Button type="button" size="sm" variant="subtle" onClick={() => setConfirmAction({ type: 'activate', record: row })}><RotateCcw className="size-4" aria-hidden="true" />Activate</Button> : <Button type="button" size="sm" variant="subtle" onClick={() => setConfirmAction({ type: 'deactivate', record: row })}>Deactivate</Button> : null}
                      {isSuperAdmin ? <Button type="button" size="sm" variant="danger" onClick={() => setConfirmAction({ type: 'delete', record: row })}><Trash2 className="size-4" aria-hidden="true" />Delete</Button> : null}
                    </div></TableCell>
                  </TableRow>;
                }) : <TableRow><TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">{loading ? 'Loading packages...' : 'No packages found for the selected filters.'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs font-semibold text-muted-foreground">Page {safePage} of {totalPages}</p>
            <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button type="button" size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</Button></div>
          </div>
        </CardContent>
      </Card>

      {open ? <PackageModal initialValues={editing || undefined} readOnly={modalReadOnly} items={items} onClose={() => { setOpen(false); setEditing(null); setModalReadOnly(false); }} onSubmit={savePackage} /> : null}
      {confirmAction ? <ConfirmationModal action={confirmAction} busy={actionBusy} onClose={() => setConfirmAction(null)} onConfirm={() => {
        if (confirmAction.type === 'delete') void deletePackage(confirmAction.record);
        else void applyStatusAction(confirmAction.record, confirmAction.type === 'activate' ? 'active' : 'inactive');
      }} /> : null}
    </div>
  );
}

function PackageThumbnail({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="flex h-14 w-20 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ImageIcon className="size-5" aria-hidden="true" /></span>;
  return <img src={src} alt={title} onError={() => setFailed(true)} className="h-14 w-20 rounded-2xl border border-border object-cover shadow-sm" loading="lazy" />;
}

function Metric({ label, value, description, icon }: { label: string; value: string; description: string; icon: ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{description}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">{icon}</span></CardContent></Card>;
}

function FilterSelect({ label, value, options, onChange, suffix = '' }: { label: string; value: string; options: string[]; onChange: (value: string) => void; suffix?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option} value={option}>{option === 'All' ? 'All' : `${option}${suffix}`}</option>)}</select></label>;
}

function SortableHead({ label, column, active, direction, onSort }: { label: string; column: SortKey; active: SortKey; direction: SortDirection; onSort: (key: SortKey) => void }) {
  const Icon = active !== column ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;
  return <TableHead><button type="button" data-readonly-allow="true" onClick={() => onSort(column)} className="inline-flex items-center gap-1.5 font-semibold text-foreground">{label}<Icon className="size-3.5 text-muted-foreground" aria-hidden="true" /></button></TableHead>;
}

function PackageModal({ initialValues, readOnly, items, onClose, onSubmit }: { initialValues?: PackageRecord; readOnly: boolean; items: PackageRecord[]; onClose: () => void; onSubmit: (values: PackageFormValues) => Promise<string> }) {
  const [values, setValues] = useState<PackageFormValues>(initialValues ? { ...initialValues } : emptyPackage);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const generatedTitle = generatedPackageTitle(values);
  const duplicate = values.status !== 'Inactive' && items.some((item) => item.id !== initialValues?.id && item.status !== 'Inactive' && packageSpecKey(item) === packageSpecKey(values));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setFormError('');
    const nextError = await onSubmit(values);
    if (nextError) setFormError(nextError);
    setSaving(false);
  }

  function updateField<K extends keyof PackageFormValues>(name: K, value: PackageFormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-[58rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Package Catalog</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{readOnly ? 'View Package' : initialValues ? 'Edit Package' : 'Add Package'}</h2><p className="mt-1 text-xs text-muted-foreground">{readOnly ? 'This package is read-only for your current role.' : 'Complete ride configuration, pricing, publishing, and website presentation details.'}</p></div><button type="button" data-readonly-allow="true" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button></div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid content-start gap-3 px-5 py-4 sm:grid-cols-2">
              {formError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:col-span-2">{formError}</p> : null}
              {duplicate ? <p className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700 sm:col-span-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" />A non-inactive package already uses this ride type, capacity, and duration. Save is blocked until the duplicate is removed or deactivated.</p> : null}
              <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Package Image<div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"><PackageThumbnail src={values.imageUrl || getDefaultImage(values.category, values.displayOrder)} title={values.title || 'Package image'} /><select disabled={readOnly} value={values.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary disabled:bg-slate-50">{packageImageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></label>
              <FormInput label="Custom Image Path" value={values.imageUrl} placeholder="/images/edrive/packages/jet-car/jet-car-package-01.webp" maxLength={240} disabled={readOnly} onChange={(value) => updateField('imageUrl', value)} />
              <div className="grid gap-1.5"><FormInput label="Package Title" value={values.title} required maxLength={120} disabled={readOnly} onChange={(value) => updateField('title', value)} />{!readOnly ? <button type="button" onClick={() => updateField('title', generatedTitle)} className="w-fit text-xs font-semibold text-primary hover:underline">Use suggested title: {generatedTitle}</button> : null}</div>
              <FormInput label="Slug / URL" value={values.slug} placeholder="Auto-generated if empty" maxLength={160} disabled={readOnly} onChange={(value) => updateField('slug', value)} />
              <SelectInput label="Category" value={values.category} options={Object.keys(categoryMap)} required disabled={readOnly} onChange={(value) => updateField('category', value)} />
              <FormInput label="Duration Minutes" type="number" min={10} max={480} step={1} value={values.durationMinutes} required disabled={readOnly} onChange={(value) => updateField('durationMinutes', value)} />
              <FormInput label="Capacity / Seater" type="number" min={1} max={12} step={1} value={values.capacity} required disabled={readOnly} onChange={(value) => updateField('capacity', value)} />
              <FormInput label="B2C Price" type="number" min={1} step="0.01" value={values.basePrice} required disabled={readOnly} onChange={(value) => updateField('basePrice', value)} />
              <FormInput label="B2B Price" type="number" min={0} step="0.01" value={values.b2bPrice} required disabled={readOnly} helper="Must be equal to or lower than B2C price." onChange={(value) => updateField('b2bPrice', value)} />
              <FormInput label="Display Order" type="number" min={0} max={9999} step={1} value={values.displayOrder} disabled={readOnly} helper="Lower numbers appear first on the website." onChange={(value) => updateField('displayOrder', value)} />
              <SelectInput label="Status" value={values.status} options={Object.keys(statusMap)} required disabled={readOnly} onChange={(value) => updateField('status', value)} />
              <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"><input type="checkbox" disabled={readOnly} checked={values.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} />Featured package</label>
              <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Short Description<textarea disabled={readOnly} maxLength={500} value={values.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} className="min-h-24 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary disabled:bg-slate-50" /><span className="text-right text-[10px] font-medium text-muted-foreground">{values.shortDescription.length}/500</span></label>
            </div>

            <aside className="border-t border-border/70 bg-[#F7FAFA] p-5 lg:border-l lg:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Website Card Preview</p><div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white bg-white p-2 shadow-[0_18px_45px_rgba(8,37,50,0.08)]"><div className="aspect-[16/9] overflow-hidden rounded-[1rem] bg-primary-50"><PackageThumbnailLarge src={values.imageUrl || getDefaultImage(values.category, values.displayOrder)} title={values.title || generatedTitle} /></div><div className="p-3"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary">{values.category.replace(' Rental', '')}</Badge>{values.isFeatured ? <Badge className="bg-accent-100 text-accent-800">Featured</Badge> : null}</div><h3 className="mt-3 font-heading text-lg font-semibold text-foreground">{values.title || generatedTitle}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{values.shortDescription || 'Add a concise public description explaining the ride experience and what guests can expect.'}</p><div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-primary-50 p-3 text-xs"><span className="font-bold text-primary-900">{values.durationMinutes || 0} min</span><span className="text-right font-bold text-primary-900">{values.capacity || 0} seater</span><span className="col-span-2 font-heading text-xl font-semibold text-primary-900">{formatAed(values.basePrice)}</span></div></div></div><div className="mt-4 rounded-xl border border-border bg-white p-4 text-xs leading-5 text-muted-foreground"><p><strong className="text-foreground">Public status:</strong> {values.status}</p><p className="mt-1"><strong className="text-foreground">Display order:</strong> {values.displayOrder || 0}</p><p className="mt-1 break-all"><strong className="text-foreground">URL:</strong> /{values.slug ? slugify(values.slug) : slugify(`${values.title || generatedTitle}-${values.durationMinutes}-minutes`)}</p></div></aside>
          </div>
          <div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4"><Button type="button" variant="outline" data-readonly-allow="true" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>{!readOnly ? <Button type="submit" disabled={saving || duplicate}>{saving ? 'Saving...' : 'Save Package'}</Button> : null}</div>
        </form>
      </div>
    </div>
  );
}

function PackageThumbnailLarge({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="flex h-full w-full items-center justify-center text-primary"><ImageIcon className="size-8" aria-hidden="true" /></span>;
  return <img src={src} alt={title} onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

function ConfirmationModal({ action, busy, onClose, onConfirm }: { action: Exclude<ConfirmAction, null>; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const isDelete = action.type === 'delete';
  const isActivate = action.type === 'activate';
  const title = isDelete ? 'Delete package permanently?' : isActivate ? 'Activate package?' : 'Deactivate package?';
  const description = isDelete
    ? 'Deletion is only allowed when the package has never been used in a booking. Linked packages are protected and must be deactivated instead.'
    : isActivate
      ? 'This package will become available to the public booking catalog, subject to its current pricing and display order.'
      : 'This package will disappear from new public bookings. Existing bookings and their original prices will remain unchanged.';

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/40 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-[0_28px_80px_rgba(8,37,50,0.28)]"><span className={`flex size-11 items-center justify-center rounded-2xl ${isDelete ? 'bg-red-50 text-red-700' : isActivate ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{isDelete ? <Trash2 className="size-5" /> : isActivate ? <RotateCcw className="size-5" /> : <AlertTriangle className="size-5" />}</span><h2 className="mt-4 font-heading text-xl font-semibold text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-4 rounded-xl bg-[#F7FAFA] p-3"><p className="font-semibold text-foreground">{action.record.title}</p><p className="mt-1 text-xs text-muted-foreground">{action.record.category} · {action.record.capacity} seater · {action.record.durationMinutes} minutes</p></div><div className="mt-5 flex justify-end gap-3"><Button type="button" variant="outline" disabled={busy} data-readonly-allow="true" onClick={onClose}>Cancel</Button><Button type="button" variant={isDelete ? 'danger' : 'default'} disabled={busy} onClick={onConfirm}>{busy ? 'Processing...' : isDelete ? 'Delete Package' : isActivate ? 'Activate Package' : 'Deactivate Package'}</Button></div></div></div>;
}

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '', min, max, step, maxLength, disabled = false, helper = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string; min?: number; max?: number; step?: number | string; maxLength?: number; disabled?: boolean; helper?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<input required={required} disabled={disabled} type={type} min={min} max={max} step={step} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary disabled:bg-slate-50" />{helper ? <span className="text-[10px] font-medium leading-4 text-muted-foreground">{helper}</span> : null}</label>;
}

function SelectInput({ label, value, options, onChange, required = false, disabled = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean; disabled?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary disabled:bg-slate-50">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
