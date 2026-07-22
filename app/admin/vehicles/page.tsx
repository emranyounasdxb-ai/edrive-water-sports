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
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Ship,
  Trash2,
  Upload,
  Wrench,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortalAccess } from '@/components/edrive/portal-access';
import { supabase } from '@/lib/supabase-client';

const locations = ['Dubai', 'Jumeirah', 'Dubai Marina', 'Dubai Harbour', 'Dubai Islands', 'Fishing Harbour'];
const typeMap: Record<string, string> = { 'Jet Car': 'jet_car', 'Jet Ski': 'jet_ski' };
const statusMap: Record<string, string> = {
  Available: 'available',
  Reserved: 'booked',
  Assigned: 'assigned',
  'In Use': 'in_use',
  Maintenance: 'maintenance',
  'Out of Service': 'out_of_service',
  Retired: 'retired',
  'For Sale': 'for_sale'
};
const fleetBasePath = '/images/edrive/fleet';
const jetCarImageOptions = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return { label: `Jet Car ${number}`, value: `${fleetBasePath}/jc-${number}.webp` };
});
const jetSkiImageOptions = Array.from({ length: 4 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return { label: `Jet Ski ${number}`, value: `${fleetBasePath}/js-${number}.webp` };
});
const fleetImageOptions = [{ label: 'Auto by fleet type', value: '' }, ...jetCarImageOptions, ...jetSkiImageOptions];
const fleetImageBucket = 'fleet-images';
const maxFleetImageBytes = 5 * 1024 * 1024;
const allowedFleetImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const reverse = (map: Record<string, string>, value?: string) => Object.keys(map).find((key) => map[key] === value) || value || '';
const toText = (value: unknown) => String(value ?? '').trim();
const toNumberText = (value: unknown) => value === null || value === undefined || value === '' ? '' : String(Number(value));
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeRegistration = (value: string) => value.trim().toUpperCase().replace(/\s+/g, ' ');
const normalizeCode = (value: string) => value.trim().toUpperCase().replace(/\s+/g, '-');
const normalizeImei = (value: string) => value.replace(/\D/g, '');

function fleetImageExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'png' || extension === 'webp') return extension;
  return 'jpg';
}

async function uploadFleetImage(file: File, code: string) {
  if (!allowedFleetImageTypes.has(file.type)) throw new Error('Fleet image must be JPG, PNG, or WebP.');
  if (file.size > maxFleetImageBytes) throw new Error('Fleet image must be 5 MB or smaller.');

  const safeCode = normalizeCode(code) || 'fleet-unit';
  const objectPath = `vehicles/${safeCode.toLowerCase()}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fleetImageExtension(file)}`;
  const uploadResult = await supabase.storage.from(fleetImageBucket).upload(objectPath, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false
  });

  if (uploadResult.error) {
    const message = uploadResult.error.message || 'Fleet image upload failed.';
    if (message.toLowerCase().includes('bucket not found')) {
      throw new Error('Fleet image storage is not active yet. Apply supabase/fleet-edit-partial-and-image-upload.sql first.');
    }
    throw new Error(message);
  }

  const publicUrl = supabase.storage.from(fleetImageBucket).getPublicUrl(objectPath).data.publicUrl;
  if (!publicUrl) throw new Error('Fleet image uploaded, but its public URL could not be created.');
  return publicUrl;
}

function imagePathFromCode(code: string, name: string, type: string) {
  const source = `${code} ${name}`.toLowerCase();
  const jetCarMatch = source.match(/(?:jc|jet\s*car)\D*(\d{1,2})/);
  const jetSkiMatch = source.match(/(?:js|jet\s*ski)\D*(\d{1,2})/);
  if (type === 'Jet Ski') {
    const number = Math.min(Math.max(Number(jetSkiMatch?.[1] || 1), 1), 4);
    return `${fleetBasePath}/js-${String(number).padStart(2, '0')}.webp`;
  }
  const number = Math.min(Math.max(Number(jetCarMatch?.[1] || 1), 1), 12);
  return `${fleetBasePath}/jc-${String(number).padStart(2, '0')}.webp`;
}

function resolveFleetImage(imageUrl: string, code: string, name: string, type: string) {
  if (imageUrl && !imageUrl.includes('/images/fleet/') && !imageUrl.includes('/images/edrive/packages/')) return imageUrl;
  return imagePathFromCode(code, name, type);
}

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function isPastDate(value: string) {
  if (!value) return false;
  const target = new Date(`${value.slice(0, 10)}T23:59:59`).getTime();
  return Number.isFinite(target) && target < Date.now();
}

function isExpiringSoon(value: string) {
  if (!value) return false;
  const target = new Date(`${value.slice(0, 10)}T23:59:59`).getTime();
  const diff = target - Date.now();
  return diff >= 0 && diff <= 30 * 86400000;
}

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
  registrationExpiry: string;
  insuranceNumber: string;
  insuranceExpiry: string;
  deviceImei: string;
  chassisVin: string;
  engineSerial: string;
  color: string;
  installationDate: string;
  expiryDate: string;
  imageUrl: string;
  notes: string;
  sortOrder: string;
  updatedAt: string;
};

type FleetFormValues = Omit<FleetRecord, 'id' | 'updatedAt'>;
type SortKey = 'code' | 'name' | 'type' | 'location' | 'capacity' | 'regNo' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc';
type ConfirmAction = { type: 'maintenance' | 'available' | 'retire' | 'reactivate' | 'delete'; record: FleetRecord } | null;
type DrawerTab = 'overview' | 'compliance' | 'identifiers' | 'activity';
type ActivityItem = { id: string; title: string; detail: string; createdAt: string };

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
  registrationExpiry: '',
  insuranceNumber: '',
  insuranceExpiry: '',
  deviceImei: '',
  chassisVin: '',
  engineSerial: '',
  color: '',
  installationDate: '',
  expiryDate: '',
  imageUrl: '',
  notes: '',
  sortOrder: '100'
};

function mapFleet(row: Record<string, unknown>): FleetRecord {
  const type = reverse(typeMap, toText(row.type || row.vehicle_type));
  const code = toText(row.vehicle_code);
  const name = toText(row.name || row.vehicle_name);
  const imageUrl = resolveFleetImage(toText(row.main_image_url || row.primary_image_url), code, name, type);
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
    regNo: toText(row.reg_no || row.registration_number),
    registrationExpiry: toText(row.registration_expiry || row.expiry_date).slice(0, 10),
    insuranceNumber: toText(row.insurance_number),
    insuranceExpiry: toText(row.insurance_expiry).slice(0, 10),
    deviceImei: toText(row.device_imei || row.tracker_imei),
    chassisVin: toText(row.chassis_vin || row.vin),
    engineSerial: toText(row.engine_serial || row.engine_number),
    color: toText(row.color),
    installationDate: toText(row.date_of_installation).slice(0, 10),
    expiryDate: toText(row.expiry_date).slice(0, 10),
    imageUrl,
    notes: toText(row.notes),
    sortOrder: toNumberText(row.sort_order || 100),
    updatedAt: toText(row.updated_at)
  };
}

function complianceIssues(record: FleetRecord) {
  const issues: string[] = [];
  if (!record.regNo) issues.push('Registration required');
  else if (!record.registrationExpiry) issues.push('Registration expiry missing');
  else if (isPastDate(record.registrationExpiry)) issues.push('Registration expired');
  else if (isExpiringSoon(record.registrationExpiry)) issues.push('Registration expiring soon');

  if (!record.insuranceNumber) issues.push('Insurance required');
  else if (!record.insuranceExpiry) issues.push('Insurance expiry missing');
  else if (isPastDate(record.insuranceExpiry)) issues.push('Insurance expired');
  else if (isExpiringSoon(record.insuranceExpiry)) issues.push('Insurance expiring soon');

  if (!record.deviceImei) issues.push('Tracker missing');
  if (!record.brand || !record.model) issues.push('Brand/model incomplete');
  if (!record.imageUrl) issues.push('Image missing');
  return issues;
}

function validateFleet(values: FleetFormValues, items: FleetRecord[], editingId?: string) {
  const code = normalizeCode(values.code);
  const name = values.name.trim();
  const regNo = normalizeRegistration(values.regNo);
  const imei = normalizeImei(values.deviceImei);
  const chassis = normalizeKey(values.chassisVin);
  const capacity = Number(values.capacity);
  const year = values.year ? Number(values.year) : 0;
  const sortOrder = Number(values.sortOrder);

  if (!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(code)) return 'Fleet code must contain 3–40 letters, numbers, or hyphens.';
  if (name.length < 3 || name.length > 120) return 'Vehicle name must contain 3–120 characters.';
  if (!editingId && (!regNo || regNo.length < 3 || regNo.length > 40)) return 'Registration number is required for every new fleet unit.';
  if (regNo && (regNo.length < 3 || regNo.length > 40)) return 'Registration number must contain 3–40 characters.';
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 12) return 'Capacity must be a whole number between 1 and 12.';
  if (year && (!Number.isInteger(year) || year < 1990 || year > new Date().getFullYear() + 1)) return 'Vehicle year is outside the allowed range.';
  if (imei && (imei.length < 10 || imei.length > 20)) return 'Tracker IMEI must contain 10–20 digits.';
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) return 'Display order must be between 0 and 9999.';
  if (values.status === 'Available' && values.registrationExpiry && isPastDate(values.registrationExpiry)) return 'A vehicle with expired registration cannot be marked Available.';
  if (values.status === 'Available' && values.insuranceExpiry && isPastDate(values.insuranceExpiry)) return 'A vehicle with expired insurance cannot be marked Available.';

  const duplicateCode = items.find((item) => item.id !== editingId && normalizeKey(item.code) === normalizeKey(code));
  if (duplicateCode) return `Fleet code ${code} is already used by “${duplicateCode.name}”.`;
  if (regNo) {
    const duplicateReg = items.find((item) => item.id !== editingId && normalizeKey(item.regNo) === normalizeKey(regNo));
    if (duplicateReg) return `Registration number ${regNo} is already assigned to ${duplicateReg.code}.`;
  }
  if (imei) {
    const duplicateImei = items.find((item) => item.id !== editingId && normalizeImei(item.deviceImei) === imei);
    if (duplicateImei) return `Tracker IMEI is already assigned to ${duplicateImei.code}.`;
  }
  if (chassis) {
    const duplicateVin = items.find((item) => item.id !== editingId && normalizeKey(item.chassisVin) === chassis);
    if (duplicateVin) return `Chassis/VIN is already assigned to ${duplicateVin.code}.`;
  }
  return '';
}

function rpcUnavailable(message: string, functionName: string) {
  const value = message.toLowerCase();
  return value.includes(functionName.toLowerCase()) && (value.includes('does not exist') || value.includes('schema cache') || value.includes('could not find') || value.includes('pgrst202'));
}

function fleetSaveErrorMessage(message: string) {
  const value = message.toLowerCase();
  if (value.includes('vehicle_type') && value.includes('type text')) return 'Fleet database enum fix is pending. Apply supabase/fleet-edit-partial-and-image-upload.sql.';
  return message;
}

function statusBadgeClass(status: string) {
  if (status === 'Available') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Maintenance' || status === 'Out of Service') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'Reserved' || status === 'Assigned' || status === 'In Use') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'Retired') return 'border-slate-200 bg-slate-100 text-slate-600';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function complianceSummary(record: FleetRecord) {
  const issues = complianceIssues(record);
  if (!issues.length) return { label: 'Complete', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', issues };
  if (!record.regNo) return { label: 'Registration required', className: 'border-red-200 bg-red-50 text-red-700', issues };
  const urgent = issues.some((issue) => issue.includes('expired'));
  return {
    label: `${issues.length} issue${issues.length === 1 ? '' : 's'}`,
    className: urgent ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700',
    issues
  };
}

function registrationNotice(record: FleetRecord) {
  if (!record.regNo) return 'Not added';
  if (!record.registrationExpiry) return 'Expiry missing';
  if (isPastDate(record.registrationExpiry)) return 'Expired';
  if (isExpiringSoon(record.registrationExpiry)) return 'Expiring soon';
  return '';
}

export default function Page() {
  const { role, isSuperAdmin, loading: accessLoading } = usePortalAccess();
  const canMaintain = isSuperAdmin || role === 'maintenance_staff';
  const [items, setItems] = useState<FleetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FleetRecord | null>(null);
  const [viewing, setViewing] = useState<FleetRecord | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionMenuId, setActionMenuId] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadFleet() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from('vehicles').select('*').order('sort_order', { ascending: true }).order('vehicle_code', { ascending: true });
    if (queryError) setError(queryError.message);
    else setItems(((data || []) as Array<Record<string, unknown>>).map(mapFleet));
    setLoading(false);
  }

  useEffect(() => { void loadFleet(); }, []);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const issues = complianceIssues(item);
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesLocation = locationFilter === 'All' || item.location === locationFilter;
      const matchesCapacity = capacityFilter === 'All' || item.capacity === capacityFilter;
      const matchesCompliance = complianceFilter === 'All'
        || (complianceFilter === 'Complete' && issues.length === 0)
        || (complianceFilter === 'Needs Attention' && issues.length > 0)
        || (complianceFilter === 'Missing Registration' && !item.regNo)
        || (complianceFilter === 'Missing Tracker' && !item.deviceImei)
        || (complianceFilter === 'Expiring Soon' && (isExpiringSoon(item.registrationExpiry) || isExpiringSoon(item.insuranceExpiry)));
      const matchesSearch = !query || `${item.code} ${item.name} ${item.type} ${item.regNo} ${item.deviceImei} ${item.chassisVin} ${item.location} ${item.brand} ${item.model}`.toLowerCase().includes(query);
      return matchesType && matchesStatus && matchesLocation && matchesCapacity && matchesCompliance && matchesSearch;
    });
    return [...filtered].sort((a, b) => {
      const numeric = sortKey === 'capacity';
      const comparison = numeric ? Number(a[sortKey]) - Number(b[sortKey]) : String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, typeFilter, statusFilter, locationFilter, capacityFilter, complianceFilter, searchTerm, sortKey, sortDirection]);

  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, locationFilter, capacityFilter, complianceFilter, searchTerm, sortKey, sortDirection, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);
  const operational = items.filter((item) => ['Reserved', 'Assigned', 'In Use'].includes(item.status)).length;
  const available = items.filter((item) => item.status === 'Available').length;
  const maintenance = items.filter((item) => ['Maintenance', 'Out of Service'].includes(item.status)).length;
  const complianceAlerts = items.filter((item) => complianceIssues(item).length > 0).length;
  const retired = items.filter((item) => item.status === 'Retired').length;
  const capacityOptions = Array.from(new Set(items.map((item) => item.capacity))).filter(Boolean).sort((a, b) => Number(a) - Number(b));

  function openCreate() {
    setActionMenuId('');
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(record: FleetRecord) {
    setActionMenuId('');
    setViewing(null);
    setEditing(record);
    setFormOpen(true);
  }

  function openView(record: FleetRecord) {
    setActionMenuId('');
    setViewing(record);
  }

  function prepareAction(action: NonNullable<ConfirmAction>) {
    setActionMenuId('');
    setActionNote('');
    setConfirmAction(action);
  }

  async function saveFleet(values: FleetFormValues, imageFile?: File | null) {
    setError('');
    setSuccess('');
    const validationError = validateFleet(values, items, editing?.id);
    if (validationError) return validationError;

    const code = normalizeCode(values.code);
    const name = values.name.trim();
    let uploadedImageUrl = '';
    if (imageFile) {
      try {
        uploadedImageUrl = await uploadFleetImage(imageFile, code);
      } catch (uploadError) {
        return uploadError instanceof Error ? uploadError.message : 'Unable to upload the fleet image.';
      }
    }
    const imageUrl = uploadedImageUrl || values.imageUrl.trim() || imagePathFromCode(code, name, values.type);
    const payload = {
      vehicle_code: code,
      vehicle_name: name,
      vehicle_type: typeMap[values.type] || 'jet_car',
      name,
      slug: slugify(code),
      type: typeMap[values.type] || 'jet_car',
      description: values.notes.trim() || `${values.capacity} seater ${values.type} fleet unit.`,
      rental_price_aed_per_hour: 0,
      location: values.location,
      capacity: Number(values.capacity),
      status: statusMap[values.status] || 'available',
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: values.year ? Number(values.year) : null,
      reg_no: normalizeRegistration(values.regNo),
      registration_expiry: values.registrationExpiry || null,
      insurance_number: values.insuranceNumber.trim() || null,
      insurance_expiry: values.insuranceExpiry || null,
      device_imei: normalizeImei(values.deviceImei) || null,
      chassis_vin: values.chassisVin.trim().toUpperCase() || null,
      engine_serial: values.engineSerial.trim().toUpperCase() || null,
      color: values.color.trim(),
      date_of_installation: values.installationDate || null,
      expiry_date: values.registrationExpiry || values.expiryDate || null,
      primary_image_url: imageUrl,
      main_image_url: imageUrl,
      notes: values.notes.trim(),
      sort_order: Number(values.sortOrder || 100),
      is_available: values.status === 'Available',
      is_visible_public: values.status !== 'Retired',
      is_archived: values.status === 'Retired'
    };

    const rpcResult = await supabase.rpc('save_fleet_asset_entry', { p_payload: payload, p_vehicle_id: editing?.id || null });
    if (rpcResult.error && !rpcUnavailable(rpcResult.error.message || '', 'save_fleet_asset_entry')) return fleetSaveErrorMessage(rpcResult.error.message);

    if (rpcResult.error) {
      const legacyPayload = {
        vehicle_code: payload.vehicle_code,
        vehicle_name: payload.vehicle_name,
        vehicle_type: payload.vehicle_type,
        name: payload.name,
        slug: payload.slug,
        type: payload.type,
        description: payload.description,
        rental_price_aed_per_hour: 0,
        location: payload.location,
        capacity: payload.capacity,
        status: payload.status,
        brand: payload.brand,
        model: payload.model,
        year: payload.year,
        reg_no: payload.reg_no,
        device_imei: payload.device_imei,
        color: payload.color,
        date_of_installation: payload.date_of_installation,
        expiry_date: payload.expiry_date,
        primary_image_url: payload.primary_image_url,
        main_image_url: payload.main_image_url,
        notes: payload.notes,
        sort_order: payload.sort_order,
        is_available: payload.is_available,
        is_visible_public: payload.is_visible_public,
        is_archived: payload.is_archived
      };
      const result = editing ? await supabase.from('vehicles').update(legacyPayload).eq('id', editing.id) : await supabase.from('vehicles').insert(legacyPayload);
      if (result.error) return result.error.message;
    }

    const wasEditing = Boolean(editing);
    setFormOpen(false);
    setEditing(null);
    setSuccess(wasEditing ? 'Fleet unit updated successfully.' : 'Fleet unit created successfully.');
    await loadFleet();
    return '';
  }

  async function applyStatusAction(record: FleetRecord, nextStatus: string, note = '') {
    setActionBusy(true);
    setError('');
    setSuccess('');
    const rpcResult = await supabase.rpc('set_fleet_asset_status', { p_vehicle_id: record.id, p_status: nextStatus, p_note: note || null });
    if (rpcResult.error && !rpcUnavailable(rpcResult.error.message || '', 'set_fleet_asset_status')) {
      setActionBusy(false);
      setConfirmAction(null);
      setError(rpcResult.error.message);
      return;
    }
    if (rpcResult.error) {
      const result = await supabase.from('vehicles').update({
        status: nextStatus,
        is_available: nextStatus === 'available',
        is_archived: nextStatus === 'retired',
        notes: note ? `${record.notes ? `${record.notes}\n` : ''}${note}` : record.notes
      }).eq('id', record.id);
      if (result.error) {
        setActionBusy(false);
        setConfirmAction(null);
        setError(result.error.message);
        return;
      }
    }
    setActionBusy(false);
    setConfirmAction(null);
    setActionNote('');
    setSuccess(nextStatus === 'retired' ? 'Fleet unit retired. Historical records remain available.' : `Fleet status updated to ${reverse(statusMap, nextStatus)}.`);
    await loadFleet();
  }

  async function deleteFleet(record: FleetRecord) {
    setActionBusy(true);
    setError('');
    setSuccess('');
    const rpcResult = await supabase.rpc('delete_fleet_asset_if_unused', { p_vehicle_id: record.id });
    setActionBusy(false);
    setConfirmAction(null);
    setActionNote('');
    if (rpcResult.error) {
      setError(rpcUnavailable(rpcResult.error.message || '', 'delete_fleet_asset_if_unused')
        ? 'Fleet delete protection is not active in the database yet. Apply supabase/fleet-asset-hardening.sql before deleting.'
        : rpcResult.error.message);
      return;
    }
    setSuccess('Unused fleet unit deleted permanently.');
    await loadFleet();
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    const { type, record } = confirmAction;
    if (type === 'delete') return deleteFleet(record);
    if (type === 'maintenance') return applyStatusAction(record, 'maintenance', actionNote.trim() || 'Moved to maintenance from Fleet Manager.');
    if (type === 'available') return applyStatusAction(record, 'available', actionNote.trim() || 'Returned to available fleet.');
    if (type === 'retire') return applyStatusAction(record, 'retired', actionNote.trim() || 'Retired from active fleet.');
    return applyStatusAction(record, 'available', actionNote.trim() || 'Reactivated from retired fleet.');
  }

  function clearFilters() {
    setTypeFilter('All');
    setStatusFilter('All');
    setLocationFilter('All');
    setCapacityFilter('All');
    setComplianceFilter('All');
    setSearchTerm('');
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection('asc'); }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Fleet Assets</span>
            <Badge variant="secondary" className="rounded-full">Live Data</Badge>
            <Badge className="rounded-full bg-primary text-white">Asset & Compliance Manager</Badge>
            {complianceAlerts ? <Badge className="rounded-full border border-amber-200 bg-amber-50 text-amber-700">{complianceAlerts} compliance alert{complianceAlerts === 1 ? '' : 's'}</Badge> : null}
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Fleet Asset & Compliance Manager</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage registration-controlled Jet Cars and Jet Skis, availability, maintenance, compliance, retirement, and safe asset deletion.</p>
        </div>
        {!accessLoading && isSuperAdmin ? <Button type="button" onClick={openCreate}><Plus data-icon aria-hidden="true" />Add Fleet Unit</Button> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Total Fleet" value={String(items.length)} description={`${retired} retired`} icon={<Ship className="size-5" />} />
        <Metric label="Available" value={String(available)} description="Ready to assign" icon={<CheckCircle2 className="size-5" />} />
        <Metric label="Reserved / In Use" value={String(operational)} description="Operational workflow" icon={<Car className="size-5" />} />
        <Metric label="Maintenance" value={String(maintenance)} description="Needs attention" icon={<Wrench className="size-5" />} />
        <Metric label="Compliance Alerts" value={String(complianceAlerts)} description="Missing or expiring data" icon={<AlertTriangle className="size-5" />} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><CardTitle className="text-base">Fleet Filters</CardTitle><CardDescription>Filter by type, lifecycle status, location, seating, compliance readiness, registration, tracker, or vehicle identity.</CardDescription></div>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <FilterSelect label="Vehicle Type" value={typeFilter} options={['All', 'Jet Car', 'Jet Ski']} onChange={setTypeFilter} />
            <FilterSelect label="Status" value={statusFilter} options={['All', ...Object.keys(statusMap)]} onChange={setStatusFilter} />
            <FilterSelect label="Location" value={locationFilter} options={['All', ...locations]} onChange={setLocationFilter} />
            <FilterSelect label="Capacity" value={capacityFilter} options={['All', ...capacityOptions]} onChange={setCapacityFilter} suffix=" seater" />
            <FilterSelect label="Compliance" value={complianceFilter} options={['All', 'Complete', 'Needs Attention', 'Missing Registration', 'Missing Tracker', 'Expiring Soon']} onChange={setComplianceFilter} />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground xl:col-span-2">Search Fleet<span className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Code, name, Reg No, IMEI, VIN..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" /></span></label>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-visible">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 lg:flex-row lg:items-end lg:justify-between">
          <div><CardTitle className="text-base">Fleet Inventory</CardTitle><CardDescription>Showing {pagedItems.length} of {filteredItems.length} filtered units ({items.length} total). Open View for complete registration, tracker, insurance, identifiers, and history.</CardDescription></div>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Rows<select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-9 rounded-xl border border-border bg-white px-3 text-xs font-semibold"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
        </CardHeader>
        <CardContent className="p-0">
          {error ? <p className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {success ? <p className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p> : null}
          <Table className="min-w-0 table-fixed">
            <TableHeader className="bg-[#F7FAFA]"><TableRow>
              <SortableHead label="Vehicle" column="code" active={sortKey} direction={sortDirection} onSort={toggleSort} className="w-[38%] sm:w-[30%]" />
              <SortableHead label="Type" column="type" active={sortKey} direction={sortDirection} onSort={toggleSort} className="hidden w-[11%] md:table-cell" />
              <SortableHead label="Location" column="location" active={sortKey} direction={sortDirection} onSort={toggleSort} className="hidden w-[12%] lg:table-cell" />
              <SortableHead label="Registration" column="regNo" active={sortKey} direction={sortDirection} onSort={toggleSort} className="hidden w-[16%] sm:table-cell" />
              <TableHead className="w-[18%]">Compliance</TableHead>
              <SortableHead label="Status" column="status" active={sortKey} direction={sortDirection} onSort={toggleSort} className="w-[15%]" />
              <TableHead className="w-[9.5rem] text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {pagedItems.length ? pagedItems.map((row, rowIndex) => {
                const summary = complianceSummary(row);
                const regNotice = registrationNotice(row);
                const hasMenu = canMaintain || isSuperAdmin;
                return <TableRow key={row.id} className={summary.issues.length ? 'bg-amber-50/20' : ''}>
                  <TableCell className="py-3"><button type="button" onClick={() => openView(row)} className="flex min-w-0 items-center gap-3 text-left"><FleetThumbnail src={row.imageUrl} title={row.name} /><span className="min-w-0"><span className="block truncate font-semibold text-foreground">{row.name}</span><span className="mt-0.5 block truncate text-xs font-semibold text-primary">{row.code}<span className="font-normal text-muted-foreground"> · {row.capacity} seats</span></span></span></button></TableCell>
                  <TableCell className="hidden py-3 md:table-cell"><Badge variant="secondary" className="font-semibold">{row.type}</Badge></TableCell>
                  <TableCell className="hidden truncate py-3 lg:table-cell">{row.location}</TableCell>
                  <TableCell className="hidden py-3 sm:table-cell"><p className={`truncate font-semibold ${row.regNo ? 'text-foreground' : 'text-red-700'}`}>{row.regNo || 'Not added'}</p>{regNotice ? <p className={`mt-1 truncate text-[10px] font-semibold ${regNotice === 'Expired' ? 'text-red-700' : 'text-amber-700'}`}>{regNotice}</p> : null}</TableCell>
                  <TableCell className="py-3"><button type="button" onClick={() => openView(row)} title={summary.issues.join('\n')} className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${summary.className}`}>{summary.issues.length ? <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" /> : <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />}<span className="truncate">{summary.label}</span></button></TableCell>
                  <TableCell className="py-3"><span className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadgeClass(row.status)}`}>{row.status}</span></TableCell>
                  <TableCell className="py-3 text-right"><div className="relative inline-flex items-center justify-end gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => openView(row)}><Eye className="size-4" aria-hidden="true" />View</Button>
                    {hasMenu ? <><button type="button" onClick={() => setActionMenuId((current) => current === row.id ? '' : row.id)} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary" aria-label={`More actions for ${row.code}`}><MoreHorizontal className="size-4" aria-hidden="true" /></button>{actionMenuId === row.id ? <div className={`absolute right-0 z-50 w-52 rounded-2xl border border-border bg-white p-1.5 text-left shadow-[0_18px_45px_rgba(8,37,50,0.16)] ${rowIndex >= pagedItems.length - 2 ? 'bottom-11' : 'top-11'}`}>
                      {isSuperAdmin ? <ActionMenuButton icon={<Pencil className="size-4" />} label="Edit fleet unit" onClick={() => openEdit(row)} /> : null}
                      {canMaintain && row.status !== 'Maintenance' && row.status !== 'Retired' ? <ActionMenuButton icon={<Wrench className="size-4" />} label="Move to maintenance" onClick={() => prepareAction({ type: 'maintenance', record: row })} /> : null}
                      {canMaintain && row.status === 'Maintenance' ? <ActionMenuButton icon={<CheckCircle2 className="size-4" />} label="Return to available" onClick={() => prepareAction({ type: 'available', record: row })} /> : null}
                      {isSuperAdmin && row.status !== 'Retired' ? <ActionMenuButton icon={<Ship className="size-4" />} label="Retire fleet unit" onClick={() => prepareAction({ type: 'retire', record: row })} /> : null}
                      {isSuperAdmin && row.status === 'Retired' ? <ActionMenuButton icon={<RefreshCw className="size-4" />} label="Reactivate fleet unit" onClick={() => prepareAction({ type: 'reactivate', record: row })} /> : null}
                      {isSuperAdmin ? <ActionMenuButton icon={<Trash2 className="size-4" />} label="Delete permanently" danger onClick={() => prepareAction({ type: 'delete', record: row })} /> : null}
                    </div> : null}</> : null}
                  </div></TableCell>
                </TableRow>;
              }) : <TableRow><TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">{loading ? 'Loading fleet...' : 'No fleet units found for the selected filters.'}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 px-5 py-4 sm:flex-row"><p className="text-xs font-semibold text-muted-foreground">Page {safePage} of {totalPages}</p><div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button><Button type="button" size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button></div></div>
        </CardContent>
      </Card>

      {viewing ? <FleetDrawer record={viewing} isSuperAdmin={isSuperAdmin} onEdit={() => openEdit(viewing)} onClose={() => setViewing(null)} /> : null}
      {formOpen ? <FleetFormModal initialValues={editing || undefined} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={saveFleet} /> : null}
      {confirmAction ? <ConfirmModal action={confirmAction} note={actionNote} setNote={setActionNote} busy={actionBusy} onClose={() => { setConfirmAction(null); setActionNote(''); }} onConfirm={runConfirmedAction} /> : null}
    </div>
  );
}

function FleetThumbnail({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><ImageIcon className="size-5" aria-hidden="true" /></span>;
  return <img src={src} alt={title} onError={() => setFailed(true)} className="h-12 w-16 shrink-0 rounded-xl border border-border object-cover shadow-sm" loading="lazy" />;
}

function Metric({ label, value, description, icon }: { label: string; value: string; description: string; icon: ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{description}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">{icon}</span></CardContent></Card>;
}

function FilterSelect({ label, value, options, onChange, suffix = '' }: { label: string; value: string; options: string[]; onChange: (value: string) => void; suffix?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option} value={option}>{option === 'All' ? 'All' : `${option}${suffix}`}</option>)}</select></label>;
}

function SortableHead({ label, column, active, direction, onSort, className = '' }: { label: string; column: SortKey; active: SortKey; direction: SortDirection; onSort: (column: SortKey) => void; className?: string }) {
  const Icon = active !== column ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;
  return <TableHead className={className}><button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1 font-bold">{label}<Icon className="size-3.5" aria-hidden="true" /></button></TableHead>;
}

function ActionMenuButton({ icon, label, onClick, danger = false }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${danger ? 'text-red-700 hover:bg-red-50' : 'text-foreground hover:bg-primary-50 hover:text-primary'}`}>{icon}{label}</button>;
}

function FleetDrawer({ record, isSuperAdmin, onEdit, onClose }: { record: FleetRecord; isSuperAdmin: boolean; onEdit: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<DrawerTab>('overview');
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const issues = complianceIssues(record);

  useEffect(() => {
    let active = true;
    async function loadActivity() {
      setActivityLoading(true);
      const [auditResult, maintenanceResult] = await Promise.all([
        supabase.from('fleet_asset_audit_logs').select('id, action, created_at').eq('vehicle_id', record.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('fleet_maintenance_logs').select('id, status_from, status_to, note, created_at').eq('vehicle_id', record.id).order('created_at', { ascending: false }).limit(20)
      ]);
      if (!active) return;
      const auditItems = ((auditResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
        id: `audit-${toText(item.id)}`,
        title: `Fleet ${toText(item.action) || 'update'}`,
        detail: 'Fleet master record activity',
        createdAt: toText(item.created_at)
      }));
      const maintenanceItems = ((maintenanceResult.data || []) as Array<Record<string, unknown>>).map((item) => ({
        id: `maintenance-${toText(item.id)}`,
        title: `${reverse(statusMap, toText(item.status_from)) || 'Status'} → ${reverse(statusMap, toText(item.status_to)) || toText(item.status_to)}`,
        detail: toText(item.note) || 'Lifecycle status updated',
        createdAt: toText(item.created_at)
      }));
      setActivity([...auditItems, ...maintenanceItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20));
      setActivityLoading(false);
    }
    void loadActivity();
    return () => { active = false; };
  }, [record.id]);

  return <div className="fixed inset-0 z-[80] bg-primary-900/35 backdrop-blur-sm" onMouseDown={onClose}><aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-[-24px_0_70px_rgba(8,37,50,0.2)]" onMouseDown={(event) => event.stopPropagation()}>
    <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5"><div className="flex min-w-0 items-center gap-3"><FleetThumbnail src={record.imageUrl} title={record.name} /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Fleet Profile</p><h2 className="truncate font-heading text-xl font-semibold text-foreground">{record.name}</h2><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{record.code} · {record.type}</p></div></div><button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground hover:text-primary" aria-label="Close fleet details"><X className="size-4" aria-hidden="true" /></button></div>
    <div className="flex flex-wrap gap-2 border-b border-border/70 px-5 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadgeClass(record.status)}`}>{record.status}</span>{issues.length ? <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{issues.length} compliance issue{issues.length === 1 ? '' : 's'}</span> : <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Compliance complete</span>}</div>
    <div className="flex gap-1 overflow-x-auto border-b border-border/70 px-4 py-2">{([
      ['overview', 'Overview'],
      ['compliance', 'Compliance'],
      ['identifiers', 'Tracker & IDs'],
      ['activity', 'Activity']
    ] as Array<[DrawerTab, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition ${tab === value ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-primary-50 hover:text-primary'}`}>{label}</button>)}</div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      {tab === 'overview' ? <div className="grid gap-3 sm:grid-cols-2"><DetailCard label="Vehicle type" value={record.type} /><DetailCard label="Location" value={record.location} /><DetailCard label="Capacity" value={`${record.capacity} seats`} /><DetailCard label="Status" value={record.status} /><DetailCard label="Brand" value={record.brand || 'Not added'} /><DetailCard label="Model" value={record.model || 'Not added'} /><DetailCard label="Year" value={record.year || 'Not added'} /><DetailCard label="Color" value={record.color || 'Not added'} /><DetailCard label="Last updated" value={formatDate(record.updatedAt)} /><div className="sm:col-span-2"><DetailCard label="Notes" value={record.notes || 'No notes added.'} /></div></div> : null}
      {tab === 'compliance' ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><DetailCard label="Registration number" value={record.regNo || 'Not added'} /><DetailCard label="Registration expiry" value={formatDate(record.registrationExpiry)} /><DetailCard label="Insurance number" value={record.insuranceNumber || 'Not added'} /><DetailCard label="Insurance expiry" value={formatDate(record.insuranceExpiry)} /></div><div className="rounded-2xl border border-border bg-[#F7FAFA] p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Compliance summary</p><div className="mt-3 grid gap-2">{issues.length ? issues.map((issue) => <div key={issue} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700"><AlertTriangle className="size-4" aria-hidden="true" />{issue}</div>) : <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700"><ShieldCheck className="size-4" aria-hidden="true" />Fleet profile is complete.</div>}</div></div></div> : null}
      {tab === 'identifiers' ? <div className="grid gap-3 sm:grid-cols-2"><DetailCard label="Tracker IMEI" value={record.deviceImei || 'Not assigned'} /><DetailCard label="Chassis / VIN" value={record.chassisVin || 'Not added'} /><DetailCard label="Engine / Serial" value={record.engineSerial || 'Not added'} /><DetailCard label="Installation date" value={formatDate(record.installationDate)} /><DetailCard label="Fleet code" value={record.code} /><DetailCard label="Display order" value={record.sortOrder || '100'} /></div> : null}
      {tab === 'activity' ? <div className="space-y-3">{activityLoading ? <p className="rounded-2xl bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">Loading activity...</p> : activity.length ? activity.map((item) => <div key={item.id} className="rounded-2xl border border-border bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-foreground">{item.title}</p><span className="shrink-0 text-[10px] font-semibold text-muted-foreground">{formatDate(item.createdAt)}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p></div>) : <p className="rounded-2xl bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">No fleet activity has been recorded yet.</p>}</div> : null}
    </div>
    <div className="flex justify-end gap-3 border-t border-border/70 bg-white p-5"><Button type="button" variant="outline" onClick={onClose}>Close</Button>{isSuperAdmin ? <Button type="button" onClick={onEdit}><Pencil className="size-4" aria-hidden="true" />Edit Fleet Unit</Button> : null}</div>
  </aside></div>;
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-semibold leading-6 text-foreground">{value}</p></div>;
}

function FleetFormModal({ initialValues, onClose, onSubmit }: { initialValues?: FleetRecord; onClose: () => void; onSubmit: (values: FleetFormValues, imageFile?: File | null) => Promise<string> }) {
  const [values, setValues] = useState<FleetFormValues>(initialValues ? { ...initialValues } : emptyFleet);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const issues = initialValues ? complianceIssues({ ...initialValues, ...values, imageUrl: imagePreview || values.imageUrl }) : [];

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const message = await onSubmit(values, imageFile);
      if (message) setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof FleetFormValues>(name: K, value: FleetFormValues[K]) { setValues((current) => ({ ...current, [name]: value })); }
  function updateType(value: string) { setValues((current) => ({ ...current, type: value, capacity: value === 'Jet Ski' ? '2' : '4', imageUrl: current.imageUrl || imagePathFromCode(current.code, current.name, value) })); }
  function selectImage(file: File | null) {
    if (!file) { setImageFile(null); return; }
    if (!allowedFleetImageTypes.has(file.type)) { setFormError('Fleet image must be JPG, PNG, or WebP.'); return; }
    if (file.size > maxFleetImageBytes) { setFormError('Fleet image must be 5 MB or smaller.'); return; }
    setFormError('');
    setImageFile(file);
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm"><div className="flex max-h-[94vh] w-full max-w-[58rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
    <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Fleet Asset Profile</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{initialValues ? 'Edit Fleet Unit' : 'Add Fleet Unit'}</h2>{issues.length ? <p className="mt-1 text-xs font-semibold text-amber-700">{issues.length} compliance item{issues.length === 1 ? '' : 's'} require attention.</p> : null}</div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button></div>
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="grid gap-4 overflow-y-auto px-5 py-4 lg:grid-cols-[1.15fr_0.85fr]"><div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold leading-6 text-sky-800 lg:col-span-2">You can save available changes now. Missing insurance, tracker, VIN, expiry dates, year, color, or other optional details will remain highlighted and can be completed later.</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SectionTitle title="Identity & Registration" />
        <FormInput label="Fleet Code *" value={values.code} required placeholder="JC-0001 / JS-0001" maxLength={40} onChange={(value) => updateField('code', value)} />
        <FormInput label="Vehicle Name *" value={values.name} required maxLength={120} onChange={(value) => updateField('name', value)} />
        <SelectInput label="Vehicle Type *" value={values.type} options={Object.keys(typeMap)} required onChange={updateType} />
        <FormInput label={initialValues ? 'Registration Number' : 'Registration Number *'} value={values.regNo} required={!initialValues} maxLength={40} placeholder={initialValues ? 'Add when available' : 'Required and unique'} onChange={(value) => updateField('regNo', value)} />
        <FormInput label="Registration Expiry (optional)" type="date" value={values.registrationExpiry} onChange={(value) => updateField('registrationExpiry', value)} />
        <FormInput label="Insurance Number (optional)" value={values.insuranceNumber} maxLength={80} onChange={(value) => updateField('insuranceNumber', value)} />
        <FormInput label="Insurance Expiry (optional)" type="date" value={values.insuranceExpiry} onChange={(value) => updateField('insuranceExpiry', value)} />
        <FormInput label="Tracker IMEI (optional)" value={values.deviceImei} inputMode="numeric" maxLength={20} onChange={(value) => updateField('deviceImei', value)} />
        <FormInput label="Chassis / VIN (optional)" value={values.chassisVin} maxLength={80} onChange={(value) => updateField('chassisVin', value)} />
        <FormInput label="Engine / Serial Number (optional)" value={values.engineSerial} maxLength={80} onChange={(value) => updateField('engineSerial', value)} />
        <SectionTitle title="Vehicle Configuration" />
        <SelectInput label="Location *" value={values.location} options={locations} required onChange={(value) => updateField('location', value)} />
        <FormInput label="Capacity / Seater *" type="number" value={values.capacity} required min="1" max="12" onChange={(value) => updateField('capacity', value)} />
        <SelectInput label="Status *" value={values.status} options={Object.keys(statusMap)} required onChange={(value) => updateField('status', value)} />
        <FormInput label="Brand (optional)" value={values.brand} maxLength={80} onChange={(value) => updateField('brand', value)} />
        <FormInput label="Model (optional)" value={values.model} maxLength={80} onChange={(value) => updateField('model', value)} />
        <FormInput label="Year (optional)" type="number" value={values.year} min="1990" max={String(new Date().getFullYear() + 1)} onChange={(value) => updateField('year', value)} />
        <FormInput label="Color (optional)" value={values.color} maxLength={60} onChange={(value) => updateField('color', value)} />
        <FormInput label="Date of Installation (optional)" type="date" value={values.installationDate} onChange={(value) => updateField('installationDate', value)} />
        <FormInput label="Display Order" type="number" value={values.sortOrder} min="0" max="9999" onChange={(value) => updateField('sortOrder', value)} />
        <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Notes (optional)<textarea maxLength={2000} value={values.notes} onChange={(event) => updateField('notes', event.target.value)} className="min-h-24 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-[#F7FAFA] p-4">
<div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Fleet Image</p><span className="text-[10px] font-semibold text-muted-foreground">JPG, PNG or WebP · max 5 MB</span></div>
<div className="mt-3 overflow-hidden rounded-2xl bg-white p-3"><img src={imagePreview || values.imageUrl || imagePathFromCode(values.code, values.name, values.type)} alt={values.name || 'Fleet preview'} className="h-48 w-full rounded-xl object-contain" /></div>
<label className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary-50 text-sm font-bold text-primary transition hover:border-primary hover:bg-primary-100"><Upload className="size-4" aria-hidden="true" />{imageFile ? 'Change selected image' : 'Upload fleet image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { selectImage(event.currentTarget.files?.[0] || null); event.currentTarget.value = ''; }} /></label>
{imageFile ? <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2"><span className="min-w-0 truncate text-xs font-semibold text-emerald-800">Selected: {imageFile.name}</span><button type="button" onClick={() => setImageFile(null)} className="shrink-0 text-xs font-bold text-emerald-800 hover:underline">Remove</button></div> : <p className="mt-2 text-xs leading-5 text-muted-foreground">The selected file uploads only when you click Save Fleet Unit.</p>}
<div className="mt-4 border-t border-border/70 pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Or use an existing image</p><select value={values.imageUrl} onChange={(event) => { setImageFile(null); updateField('imageUrl', event.target.value); }} className="mt-2 h-10 w-full rounded-xl border border-border bg-white px-3 text-sm">{fleetImageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><FormInput label="Custom Image URL / Path (optional)" value={values.imageUrl} placeholder="/images/edrive/fleet/jc-01.webp or https://..." onChange={(value) => { setImageFile(null); updateField('imageUrl', value); }} /></div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Compliance Summary</p><div className="mt-3 grid gap-2">{issues.length ? issues.map((issue) => <div key={issue} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700"><AlertTriangle className="size-4" aria-hidden="true" />{issue}</div>) : <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700"><ShieldCheck className="size-4" aria-hidden="true" />Fleet profile is complete.</div>}</div></div>
        {initialValues ? <div className="rounded-2xl border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Lifecycle Snapshot</p><div className="mt-3 grid gap-2 text-sm"><InfoLine label="Status" value={initialValues.status} /><InfoLine label="Registration" value={initialValues.regNo || 'Missing'} /><InfoLine label="Registration expiry" value={formatDate(initialValues.registrationExpiry)} /><InfoLine label="Insurance expiry" value={formatDate(initialValues.insuranceExpiry)} /><InfoLine label="Last updated" value={formatDate(initialValues.updatedAt)} /></div></div> : null}
      </div>
    </div>{formError ? <p className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</p> : null}<div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Fleet Unit'}</Button></div></form>
  </div></div>;
}

function SectionTitle({ title }: { title: string }) { return <div className="sm:col-span-2"><p className="border-b border-border pb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">{title}</p></div>; }
function InfoLine({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F7FAFA] px-3 py-2"><span className="text-xs font-semibold text-muted-foreground">{label}</span><span className="text-right text-xs font-bold text-foreground">{value}</span></div>; }

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '', maxLength, min, max, inputMode }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string; maxLength?: number; min?: string; max?: string; inputMode?: 'numeric' | 'text' | 'tel' | 'email' }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<input required={required} type={type} value={value} maxLength={maxLength} min={min} max={max} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>;
}

function SelectInput({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function ConfirmModal({ action, note, setNote, busy, onClose, onConfirm }: { action: NonNullable<ConfirmAction>; note: string; setNote: (value: string) => void; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const titles = { maintenance: 'Move to maintenance?', available: 'Return to available fleet?', retire: 'Retire fleet unit?', reactivate: 'Reactivate fleet unit?', delete: 'Permanently delete fleet unit?' };
  const descriptions = {
    maintenance: 'The unit will become unavailable for new assignments. Add the issue or maintenance reason below.',
    available: 'Only return this unit to Available when maintenance and compliance checks are complete.',
    retire: 'The unit will remain in historical records but will be removed from active assignment lists.',
    reactivate: 'The unit will return to Available. A valid unique registration number is still required.',
    delete: 'Delete is permanent and is allowed only when no booking, assignment, maintenance, tracker, document, expense, or audit-linked operational history exists.'
  };
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-primary-900/40 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-[0_28px_80px_rgba(8,37,50,0.28)]"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Fleet Lifecycle Action</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{titles[action.type]}</h2></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white"><X className="size-4" aria-hidden="true" /></button></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{descriptions[action.type]}</p><div className="mt-4 rounded-xl bg-[#F7FAFA] px-4 py-3"><p className="font-semibold text-foreground">{action.record.code} · {action.record.name}</p><p className="mt-1 text-xs text-muted-foreground">Registration: {action.record.regNo || 'Missing'}</p></div>{action.type !== 'delete' ? <label className="mt-4 grid gap-1.5 text-sm font-semibold text-foreground">Action note<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Reason, work completed, or operational note..." className="min-h-24 rounded-xl border border-border bg-white px-3 py-3 text-sm outline-none focus:border-primary" /></label> : null}<div className="mt-5 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" variant={action.type === 'delete' ? 'danger' : 'default'} disabled={busy} onClick={onConfirm}>{busy ? 'Processing...' : action.type === 'delete' ? 'Delete Permanently' : 'Confirm Action'}</Button></div></div></div>;
}
