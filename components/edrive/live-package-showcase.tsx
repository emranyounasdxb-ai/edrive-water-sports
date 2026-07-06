'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, MapPin, MessageCircle, TicketCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { whatsappUrl } from '@/lib/company-info';
import { cn } from '@/lib/utils';

type LivePackage = {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string;
  duration_minutes: number;
  base_price: number;
  b2b_price: number;
  capacity: number;
  image_url: string | null;
  short_description: string | null;
  status: string;
  is_featured: boolean;
  display_order: number;
};

function formatAed(value: number) {
  return `AED ${Number(value || 0).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;
}

function categoryLabel(value: string) {
  if (value === 'jet_car_rental') return 'Jet Car';
  if (value === 'jet_ski_rental') return 'Jet Ski';
  if (value === 'yacht_rental') return 'Yacht';
  return 'Package';
}

function fallbackImage(item: LivePackage) {
  if (item.image_url) return item.image_url;
  if (item.category === 'jet_ski_rental') return '/images/packages/jet-ski.webp';
  if (item.category === 'jet_car_rental' && Number(item.capacity) >= 4) return '/images/packages/jet-car-4-seater.webp';
  if (item.category === 'jet_car_rental') return '/images/packages/jet-car-2-seater.webp';
  return '';
}

export function LivePackageShowcase({ title = 'Live Booking Packages', text = 'Location-wise packages and prices loaded from the dashboard.', limit, compact = false }: { title?: string; text?: string; limit?: number; compact?: boolean }) {
  const [items, setItems] = useState<LivePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('All');

  useEffect(() => {
    async function loadPackages() {
      setLoading(true);
      const { data } = await supabase
        .from('packages')
        .select('id,title,slug,category,location,duration_minutes,base_price,b2b_price,capacity,image_url,short_description,status,is_featured,display_order')
        .eq('status', 'active')
        .order('display_order', { ascending: true })
        .order('location', { ascending: true })
        .order('capacity', { ascending: true })
        .order('duration_minutes', { ascending: true });
      setItems(((data || []) as LivePackage[]).filter((item) => Number(item.base_price) > 0));
      setLoading(false);
    }
    loadPackages();
  }, []);

  const locations = useMemo(() => ['All', ...Array.from(new Set(items.map((item) => item.location).filter(Boolean)))], [items]);
  const visibleItems = useMemo(() => {
    const filtered = selectedLocation === 'All' ? items : items.filter((item) => item.location === selectedLocation);
    return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
  }, [items, limit, selectedLocation]);

  if (!loading && !items.length) return null;

  return (
    <section className={cn('border-y border-border bg-white/70', compact ? 'py-7' : 'py-10 sm:py-12 lg:py-14')}>
      <div className="container-x">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary text-white">Live prices</Badge>
              <Badge variant="secondary" className="rounded-full">B2C public rates</Badge>
            </div>
            <h2 className="section-title">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{text}</p>
          </div>
          {!limit ? (
            <label className="grid gap-1.5 text-sm font-semibold text-foreground">
              Location
              <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
                {locations.map((location) => <option key={location}>{location}</option>)}
              </select>
            </label>
          ) : null}
        </div>

        <div className={cn('mt-7 grid gap-5 md:grid-cols-2', compact ? 'xl:grid-cols-5' : 'xl:grid-cols-3')}>
          {loading ? Array.from({ length: limit || 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[1.75rem] bg-white/80" />) : visibleItems.map((item) => <LivePackageCard key={item.id} item={item} compact={compact} />)}
        </div>
      </div>
    </section>
  );
}

function LivePackageCard({ item, compact }: { item: LivePackage; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = fallbackImage(item);
  const params = new URLSearchParams({
    package: item.slug,
    packageName: item.title,
    location: item.location,
    duration: String(item.duration_minutes),
    price: String(item.base_price),
    capacity: String(item.capacity),
    category: item.category
  });
  const bookingHref = `/booking?${params.toString()}`;
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I am interested in ${item.title} from ${item.location}.`);
  return (
    <article className="premium-surface premium-card-hover flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] p-4">
      <div className="relative min-h-[14rem] overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-primary-900 via-primary-700 to-accent-500 p-5 text-white">
        {imageSrc && !imageFailed ? <img src={imageSrc} alt={item.title} onError={() => setImageFailed(true)} className="absolute inset-0 h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/88 via-primary-900/42 to-primary-900/10" aria-hidden="true" />
        <div className="relative flex h-full min-h-[12rem] flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15"><TicketCheck className="size-5" aria-hidden="true" /></span>
            <Badge variant="gold">{categoryLabel(item.category)}</Badge>
          </div>
          <div>
            <h3 className="font-heading text-2xl font-semibold leading-tight text-white">{item.title}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/72"><MapPin className="size-3.5" aria-hidden="true" />{item.location}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-2 pt-4">
        <div className="grid gap-2 rounded-[1.1rem] bg-primary-50 px-4 py-3 text-sm">
          <p className="font-semibold text-primary-900">From {formatAed(item.base_price)}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5 text-primary" aria-hidden="true" />{item.duration_minutes} minutes</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5 text-primary" aria-hidden="true" />{item.capacity} seater</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.short_description || 'Premium eDrive water sports package with team support and booking confirmation.'}</p>
        <div className={cn('mt-auto grid min-w-0 gap-2 pt-5', compact ? 'grid-cols-[minmax(0,1fr)_4.9rem]' : 'grid-cols-[minmax(0,1fr)_5.2rem]')}>
          <Button asChild size="sm" className="h-9 min-w-0 rounded-full px-3 text-xs font-bold shadow-[0_8px_18px_rgba(8,37,50,0.18)]"><Link href={bookingHref} className="min-w-0 justify-center truncate">Book Now<ArrowRight className="ml-1 size-3.5 shrink-0" aria-hidden="true" /></Link></Button>
          <Button asChild size="sm" variant="outline" className="h-9 min-w-0 rounded-full border-emerald-300 bg-emerald-500 px-2 text-xs font-bold text-white shadow-[0_8px_18px_rgba(16,185,129,0.2)] hover:bg-emerald-600 hover:text-white"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="justify-center"><MessageCircle className="size-3.5 shrink-0" aria-hidden="true" />Ask</a></Button>
        </div>
      </div>
    </article>
  );
}
