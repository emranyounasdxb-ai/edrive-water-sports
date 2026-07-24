'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Car, RefreshCw, ShipWheel, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

type PublicFleetUnit = {
  id: string;
  vehicle_code: string;
  vehicle_name: string;
  vehicle_type: string;
  capacity: number;
  status: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  location: string | null;
  image_url: string | null;
  description: string | null;
  sort_order: number;
};

type FleetFilter = 'all' | 'jet_ski' | 'jet_car';

const filters: Array<{ value: FleetFilter; label: string }> = [
  { value: 'all', label: 'All Fleet' },
  { value: 'jet_ski', label: 'Jet Skis' },
  { value: 'jet_car', label: 'Jet Cars' }
];

function normalizedType(value: string) {
  const type = String(value || '').toLowerCase();
  if (type.includes('ski')) return 'jet_ski';
  return 'jet_car';
}

function typeLabel(value: string) {
  return normalizedType(value) === 'jet_ski' ? 'Jet Ski' : 'Jet Car';
}

function statusLabel(value: string) {
  const status = String(value || '').toLowerCase();
  if (status === 'available') return 'Available';
  if (status === 'assigned') return 'Assigned';
  if (status === 'in_use') return 'In Use';
  return 'Reserved';
}

function statusClass(value: string) {
  const status = String(value || '').toLowerCase();
  if (status === 'available') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'in_use') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function fallbackImage(unit: PublicFleetUnit) {
  const source = `${unit.vehicle_code} ${unit.vehicle_name}`.toLowerCase();
  if (normalizedType(unit.vehicle_type) === 'jet_ski') {
    const match = source.match(/(?:js|jet\s*ski)\D*(\d{1,2})/);
    const number = Math.min(Math.max(Number(match?.[1] || 1), 1), 4);
    return `/images/edrive/fleet/js-${String(number).padStart(2, '0')}.webp`;
  }

  const match = source.match(/(?:jc|jet\s*car)\D*(\d{1,2})/);
  const number = Math.min(Math.max(Number(match?.[1] || 1), 1), 12);
  return `/images/edrive/fleet/jc-${String(number).padStart(2, '0')}.webp`;
}

function unitDetails(unit: PublicFleetUnit) {
  return [unit.brand, unit.model, unit.year ? String(unit.year) : ''].filter(Boolean).join(' · ');
}

export function PublicFleetShowcase() {
  const [items, setItems] = useState<PublicFleetUnit[]>([]);
  const [filter, setFilter] = useState<FleetFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadFleet() {
      setLoading(true);
      setError('');
      const result = await supabase.rpc('get_public_fleet_units');
      if (!active) return;

      if (result.error) {
        setItems([]);
        setError('Fleet details could not be loaded right now. Please retry or contact the eDrive team.');
      } else {
        setItems((result.data || []) as PublicFleetUnit[]);
      }
      setLoading(false);
    }

    void loadFleet();
    return () => { active = false; };
  }, [reloadKey]);

  const visibleItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => normalizedType(item.vehicle_type) === filter);
  }, [filter, items]);

  return (
    <section className="border-b border-border bg-[#f4f5f5] py-14 sm:py-16 lg:py-20">
      <div className="container-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Original eDrive vehicles</p>
            <h2 className="mt-3 section-title">Our Fleet</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Explore individual eDrive Jet Ski and Jet Car units using the original images maintained in the fleet system.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filter fleet vehicles">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  filter === item.value
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[28rem] animate-pulse rounded-[1.6rem] bg-white/80" />)}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm font-semibold text-amber-900">{error}</p>
            <Button type="button" variant="outline" className="mt-4 rounded-full bg-white" onClick={() => setReloadKey((value) => value + 1)}>
              <RefreshCw className="size-4" aria-hidden="true" />Retry
            </Button>
          </div>
        ) : visibleItems.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((unit) => <FleetUnitCard key={unit.id} unit={unit} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.4rem] border border-border bg-white p-6 text-sm text-muted-foreground">
            No public fleet units are available in this category right now.
          </div>
        )}
      </div>
    </section>
  );
}

function FleetUnitCard({ unit }: { unit: PublicFleetUnit }) {
  const [imageFailed, setImageFailed] = useState(false);
  const type = normalizedType(unit.vehicle_type);
  const imageSrc = !imageFailed && String(unit.image_url || '').trim() ? String(unit.image_url).trim() : fallbackImage(unit);
  const details = unitDetails(unit);
  const categoryHref = type === 'jet_ski' ? '/jet-ski-rentals' : '/jet-car-rentals';
  const Icon = type === 'jet_ski' ? ShipWheel : Car;

  return (
    <article className="premium-surface premium-card-hover flex h-full flex-col overflow-hidden rounded-[1.6rem] p-2.5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.15rem] bg-primary-50">
        <img
          src={imageSrc}
          alt={`${unit.vehicle_code} ${unit.vehicle_name}`}
          className="h-full w-full object-cover object-center transition duration-700 hover:scale-105"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-primary-950/45 to-transparent" aria-hidden="true" />
        <Badge className="absolute left-3 top-3 border-white/60 bg-white/92 text-primary-900" variant="secondary">{typeLabel(unit.vehicle_type)}</Badge>
        <Badge className={cn('absolute right-3 top-3 border', statusClass(unit.status))} variant="outline">{statusLabel(unit.status)}</Badge>
        <span className="absolute bottom-3 left-3 rounded-full bg-primary-950/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">{unit.vehicle_code}</span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <h3 className="font-heading text-xl font-semibold leading-tight text-foreground">{unit.vehicle_name || `${typeLabel(unit.vehicle_type)} ${unit.vehicle_code}`}</h3>
            {details ? <p className="mt-1 text-xs font-medium text-muted-foreground">{details}</p> : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-900"><Users className="size-3.5" aria-hidden="true" />Up to {Number(unit.capacity || 2)} guests</span>
          {unit.location ? <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">{unit.location}</span> : null}
        </div>

        <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
          {unit.description || `A premium eDrive ${typeLabel(unit.vehicle_type).toLowerCase()} prepared for safe, supported rides from Dubai Islands.`}
        </p>

        <Button asChild className="mt-5 w-full rounded-full">
          <Link href={categoryHref}>View {typeLabel(unit.vehicle_type)} Packages<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </Button>
      </div>
    </article>
  );
}
