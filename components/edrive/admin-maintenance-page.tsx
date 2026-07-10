'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, Eye, RefreshCw, Search, Ship, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-client';

type VehicleStatus = 'all' | 'available' | 'booked' | 'maintenance' | 'for_sale' | 'expiry_soon';

type VehicleRow = Record<string, unknown> & {
  id?: string | null;
  vehicle_code?: string | null;
  vehicle_name?: string | null;
  name?: string | null;
  vehicle_type?: string | null;
  type?: string | null;
  capacity?: number | string | null;
  reg_no?: string | null;
  registration_number?: string | null;
  device_imei?: string | null;
  tracker_imei?: string | null;
  expiry_date?: string | null;
  registration_expiry?: string | null;
  insurance_expiry?: string | null;
  status?: string | null;
  is_available?: boolean | null;
  notes?: string | null;
  updated_at?: string | null;
};

const statusOptions = [
  { label: 'Available', value: 'available' },
  { label: 'Booked', value: 'booked' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'For Sale', value: 'for_sale' }
];

function asText(value: unknown, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function niceStatus(value: unknown) {
  const text = asText(value, 'available').replace(/_/g, ' ').toLowerCase();
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusKey(value: unknown) {
  const text = asText(value, 'available').toLowerCase().replace(/\s+/g, '_');
  if (text.includes('maintenance')) return 'maintenance';
  if (text.includes('booked')) return 'booked';
  if (text.includes('sale')) return 'for_sale';
  return 'available';
}

function niceDate(value: unknown) {
  const text = asText(value);
  if (!text) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(text.includes('T') ? text : `${text}T12:00:00`));
}

function dateValue(vehicle: VehicleRow) {
  return asText(vehicle.expiry_date || vehicle.registration_expiry || vehicle.insurance_expiry);
}

function daysUntil(date: unknown) {
  const text = asText(date);
  if (!text) return null;
  const target = new Date(text.includes('T') ? text : `${text}T12:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target - today.getTime();
  return Math.ceil(diff / 86400000);
}

function expiryLabel(vehicle: VehicleRow) {
  const days = daysUntil(dateValue(vehicle));
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiry Soon';
  return '';
}

function statusTone(value: unknown) {
  const status = asText(value).toLowerCase();
  if (status.includes('available')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status.includes('maintenance') || status.includes('expired')) return 'border-red-200 bg-red-50 text-red-700';
  if (status.includes('booked')) return 'border-primary/25 bg-primary-50 text-primary';
  return 'border-gold/35 bg-gold/10 text-gold';
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone || statusTone(children)}`}>{children}</span>;
}

function vehicleCode(vehicle: VehicleRow) {
  return asText(vehicle.vehicle_code || vehicle.id, 'Vehicle');
}

function vehicleName(vehicle: VehicleRow) {
  return asText(vehicle.vehicle_name || vehicle.name, 'Unnamed Vehicle');
}

function vehicleType(vehicle: VehicleRow) {
  const type = asText(vehicle.vehicle_type || vehicle.type, 'Vehicle');
  return vehicle.capacity ? `${type} · ${vehicle.capacity} seater` : type;
}

function registration(vehicle: VehicleRow) {
  return asText(vehicle.reg_no || vehicle.registration_number, '-');
}

function tracker(vehicle: VehicleRow) {
  return asText(vehicle.device_imei || vehicle.tracker_imei, '-');
}

function noteText(vehicle: VehicleRow) {
  const note = asText(vehicle.notes);
  return note && !note.toLowerCase().includes('seed fleet record') ? note : 'No maintenance note added.';
}

function isAvailable(vehicle: VehicleRow) {
  return statusKey(vehicle.status) === 'available';
}

function isBooked(vehicle: VehicleRow) {
  return statusKey(vehicle.status) === 'booked';
}

function isMaintenance(vehicle: VehicleRow) {
  return statusKey(vehicle.status) === 'maintenance';
}

function isForSale(vehicle: VehicleRow) {
  return statusKey(vehicle.status) === 'for_sale';
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Ship }) {
  return <Card className="rounded-[1.25rem] border-border/80 bg-white shadow-[0_12px_32px_rgba(8,37,50,0.055)]"><CardContent className="flex min-w-0 items-center gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{value}</p></div></CardContent></Card>;
}

function VehicleProfileModal({ vehicle, onClose, onStatus }: { vehicle: VehicleRow; onClose: () => void; onStatus: (vehicle: VehicleRow, status: string) => Promise<void> }) {
  const [saving, setSaving] = useState('');
  const expiry = expiryLabel(vehicle);

  async function update(status: string) {
    setSaving(status);
    await onStatus(vehicle, status);
    setSaving('');
    onClose();
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="max-h-[86vh] w-full max-w-4xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_28px_90px_rgba(8,37,50,0.24)]"><div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] p-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Fleet Unit</p><h2 className="mt-1 break-words font-heading text-2xl font-semibold text-foreground">{vehicleName(vehicle)}</h2><p className="mt-1 text-sm text-muted-foreground">{vehicleCode(vehicle)} · {vehicleType(vehicle)}</p></div><button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close"><X className="size-4" aria-hidden="true" /></button></div><div className="max-h-[calc(86vh-5.5rem)] overflow-y-auto p-5"><div className="flex flex-wrap gap-2"><Badge>{niceStatus(vehicle.status)}</Badge>{expiry ? <Badge>{expiry}</Badge> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Registration" value={registration(vehicle)} /><Info label="Tracker" value={tracker(vehicle)} /><Info label="Expiry" value={niceDate(dateValue(vehicle))} /><Info label="Updated" value={niceDate(vehicle.updated_at)} /></div><div className="mt-4 rounded-2xl border border-border bg-[#F7FAFA] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Maintenance Note</p><p className="mt-2 text-sm font-semibold leading-6 text-foreground">{noteText(vehicle)}</p></div><div className="mt-5 rounded-2xl border border-border bg-white p-4"><p className="text-sm font-bold text-foreground">Update vehicle status</p><div className="mt-3 flex flex-wrap gap-2">{statusOptions.map((option) => <Button key={option.value} type="button" variant="outline" disabled={saving === option.value} onClick={() => update(option.value)} className="rounded-full bg-white">{saving === option.value ? 'Saving...' : option.label}</Button>)}</div></div></div></div></div>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-bold text-foreground">{value}</div></div>;
}

function VehicleRowItem({ vehicle, onView, onStatus }: { vehicle: VehicleRow; onView: () => void; onStatus: (vehicle: VehicleRow, status: string) => Promise<void> }) {
  const [saving, setSaving] = useState('');
  const expiry = expiryLabel(vehicle);

  async function updateStatus(status: string) {
    setSaving(status);
    await onStatus(vehicle, status);
    setSaving('');
  }

  return <div className="grid gap-3 border-b border-border/70 p-3 last:border-b-0 lg:grid-cols-[0.9fr_1.2fr_1fr_0.9fr_1fr_1fr_1.1fr] lg:items-center"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{vehicleCode(vehicle)}</p><p className="mt-0.5 text-sm font-bold text-foreground">{vehicleName(vehicle)}</p></div><div className="text-sm font-semibold text-foreground">{vehicleType(vehicle)}</div><div className="text-sm font-semibold text-foreground">{registration(vehicle)}</div><div className="text-sm font-semibold text-foreground">{tracker(vehicle)}</div><div className="text-sm font-semibold text-foreground">{niceDate(dateValue(vehicle))}{expiry ? <div className="mt-1"><Badge>{expiry}</Badge></div> : null}</div><div className="flex flex-wrap gap-1.5"><Badge>{niceStatus(vehicle.status)}</Badge></div><div className="flex flex-wrap gap-2 lg:justify-end"><Button type="button" size="sm" variant="outline" onClick={onView} className="rounded-full bg-white"><Eye className="size-4" aria-hidden="true" />View</Button><select value={statusKey(vehicle.status)} disabled={Boolean(saving)} onChange={(event) => updateStatus(event.target.value)} className="h-9 rounded-full border border-border bg-white px-3 text-xs font-bold text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10">{statusOptions.map((option) => <option key={option.value} value={option.value}>{saving === option.value ? 'Saving...' : option.label}</option>)}</select></div></div>;
}

export function AdminMaintenancePage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VehicleStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<VehicleRow | null>(null);

  async function refresh() {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from('vehicles').select('*').order('vehicle_code', { ascending: true }).limit(1000);
    if (loadError) {
      setError(loadError.message);
      setVehicles([]);
    } else {
      setVehicles((data || []) as VehicleRow[]);
    }
    setLoading(false);
  }

  async function updateStatus(vehicle: VehicleRow, status: string) {
    const payload: Record<string, unknown> = {
      status,
      is_available: status === 'available',
      updated_at: new Date().toISOString()
    };
    const queryBuilder = supabase.from('vehicles').update(payload);
    const result = vehicle.id ? await queryBuilder.eq('id', vehicle.id) : await queryBuilder.eq('vehicle_code', vehicle.vehicle_code);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await refresh();
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const expiry = Boolean(expiryLabel(vehicle));
      if (filter !== 'all') {
        if (filter === 'expiry_soon' && !expiry) return false;
        if (filter !== 'expiry_soon' && statusKey(vehicle.status) !== filter) return false;
      }
      if (!term) return true;
      return [vehicleCode(vehicle), vehicleName(vehicle), vehicleType(vehicle), registration(vehicle), tracker(vehicle), vehicle.status, noteText(vehicle)].some((value) => asText(value).toLowerCase().includes(term));
    });
  }, [vehicles, query, filter]);

  const available = vehicles.filter(isAvailable).length;
  const booked = vehicles.filter(isBooked).length;
  const maintenance = vehicles.filter(isMaintenance).length;
  const forSale = vehicles.filter(isForSale).length;
  const expirySoon = vehicles.filter((vehicle) => Boolean(expiryLabel(vehicle))).length;

  const filters: Array<{ id: VehicleStatus; label: string; count: number }> = [
    { id: 'all', label: 'All', count: vehicles.length },
    { id: 'available', label: 'Available', count: available },
    { id: 'booked', label: 'Booked', count: booked },
    { id: 'maintenance', label: 'Maintenance', count: maintenance },
    { id: 'for_sale', label: 'For Sale', count: forSale },
    { id: 'expiry_soon', label: 'Expiry Soon', count: expirySoon }
  ];

  return <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Maintenance</p><h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Fleet maintenance</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Compact fleet status, maintenance attention, expiry alerts, and availability control.</p></div><Button type="button" variant="outline" onClick={refresh} className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button></div>{error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Vehicles" value={String(vehicles.length)} icon={Ship} /><MetricCard title="Available" value={String(available)} icon={CalendarDays} /><MetricCard title="Maintenance" value={String(maintenance)} icon={Wrench} /><MetricCard title="Expiry Alerts" value={String(expirySoon)} icon={Wrench} /></div><Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white"><CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">Fleet control list</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading vehicles...' : `Showing ${filtered.length} of ${vehicles.length}`}</p></div><div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, type, reg, tracker..." className="h-10 rounded-full bg-white pl-9 text-sm font-semibold" /></div></CardHeader><div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary-900'}`}>{item.label} <span className={filter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span></button>)}</div><CardContent className="p-0">{loading ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center text-sm font-semibold text-muted-foreground">Loading fleet...</div></div> : null}{!loading && filtered.length === 0 ? <div className="p-4"><div className="rounded-[1.25rem] border border-dashed border-border bg-[#F7FAFA] px-4 py-8 text-center"><p className="font-heading text-lg font-semibold text-foreground">No vehicles found</p><p className="mt-2 text-sm text-muted-foreground">Try another search or filter.</p></div></div> : null}{!loading && filtered.length > 0 ? <><div className="hidden border-b border-border/70 bg-[#F7FAFA] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground lg:grid lg:grid-cols-[0.9fr_1.2fr_1fr_0.9fr_1fr_1fr_1.1fr]"><span>Vehicle</span><span>Type</span><span>Reg</span><span>Tracker</span><span>Expiry</span><span>Status</span><span className="text-right">Action</span></div><div>{filtered.map((vehicle) => <VehicleRowItem key={asText(vehicle.id || vehicle.vehicle_code || vehicle.vehicle_name)} vehicle={vehicle} onView={() => setSelected(vehicle)} onStatus={updateStatus} />)}</div></> : null}</CardContent></Card>{selected ? <VehicleProfileModal vehicle={selected} onClose={() => setSelected(null)} onStatus={updateStatus} /> : null}</section>;
}
