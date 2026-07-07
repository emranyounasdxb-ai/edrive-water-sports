'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, MapPin, MessageCircle, TicketCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { whatsappUrl } from '@/lib/company-info';
import { getLivePackageImage } from '@/lib/edrive-package-images';
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

function imageForLivePackage(item: LivePackage, index = 0) {
  const seed = Number(item.display_order || index || 0);
  return getLivePackageImage(item.category, seed);
}

function splitPackageTitle(title: string, durationMinutes: number) {
  const normalizedTitle = title.replace(/\s+/g, ' ').trim();
  const explicitDuration = normalizedTitle.match(/\s+[–-]\s*(\d+\s*(?:minute|minutes|min|mins))$/i);

  if (explicitDuration?.index) {
    return {
      name: normalizedTitle.slice(0, explicitDuration.index).trim(),
      timing: explicitDuration[1].replace(/\bmins?\b/i, 'Minutes').replace(/\bminute(s)?\b/i, 'Minutes')
    };
  }

  return {
    name: normalizedTitle,
    timing: `${durationMinutes} Minutes`
  };
}

export function LivePackageShowcase({ title = 'Live Booking Packages', text = '', limit, compact = false }: { title?: string; text?: string; limit?: number; compact?: boolean }) {
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
    <section id="live-packages" className={cn('border-y border-border bg-white/70', compact ? 'py-7' : 'py-10 sm:py-12 lg:py-14')}>
      <div className="container-x">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary text-white">Live prices</Badge>
            </div>
            <h2 className="section-title">{title}</h2>
            {text ? <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{text}</p> : null}
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

        <div className={cn('mt-7 grid gap-4 md:grid-cols-2', compact ? 'xl:grid-cols-5' : 'xl:grid-cols-3')}>
          {loading ? Array.from({ length: limit || 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[1.5rem] bg-white/80" />) : visibleItems.map((item, index) => <LivePackageCard key={item.id} item={item} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function LivePackageCard({ item, index }: { item: LivePackage; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = imageForLivePackage(item, index);
  const bookingHref = '/booking';
  const titleParts = splitPackageTitle(item.title, item.duration_minutes);
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I am interested in this water sports experience: ${item.title}.

Please suggest the best available package, price, duration, and timing for this experience.

My preferred date:
Number of guests:
Preferred location:`);

  return (
    <article className="premium-surface premium-card-hover flex h-full min-w-0 flex-col overflow-hidden rounded-[1.45rem] p-2.5">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.05rem] bg-primary-50">
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={item.title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover object-center transition duration-700 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 via-white to-accent-100 text-primary">
            <TicketCheck className="size-7" aria-hidden="true" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-primary-950/22 to-transparent" aria-hidden="true" />
        <div className="absolute left-2.5 top-2.5 flex size-10 items-center justify-center rounded-2xl bg-white/82 text-primary shadow-sm backdrop-blur-sm">
          <TicketCheck className="size-5" aria-hidden="true" />
        </div>
        <Badge className="absolute right-2.5 top-2.5 bg-white/92 px-2.5 py-1 text-[10px] font-bold text-primary-900 shadow-sm" variant="secondary">{categoryLabel(item.category)}</Badge>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-2.5 pt-3">
        <div>
          <h3 className="mx-auto max-w-[10.5rem] text-center font-heading text-[0.88rem] font-semibold leading-[1.22] tracking-[-0.01em] text-foreground sm:text-[0.94rem]">
            <span className="block break-words">{titleParts.name}</span>
            <span className="mt-1 block whitespace-nowrap text-[0.88rem] font-semibold sm:text-[0.94rem]">{titleParts.timing}</span>
          </h3>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><MapPin className="size-3.5 text-primary" aria-hidden="true" />{item.location}</p>
        </div>

        <div className="mt-3 grid gap-1.5 rounded-[1rem] bg-primary-50 px-3.5 py-3 text-xs">
          <p className="font-semibold text-primary-900">From {formatAed(item.base_price)}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock className="size-3.5 text-primary" aria-hidden="true" />{item.duration_minutes} minutes</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Users className="size-3.5 text-primary" aria-hidden="true" />{item.capacity} seater</p>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{item.short_description || 'Premium eDrive water sports package with team support and booking confirmation.'}</p>
        <div className="mt-auto grid gap-2 pt-4">
          <Button asChild size="sm" className="h-9 w-full rounded-full text-[11px] font-bold shadow-[0_8px_18px_rgba(8,37,50,0.16)]"><Link href={bookingHref} className="justify-center">Book Now<ArrowRight className="ml-1 size-3.5 shrink-0" aria-hidden="true" /></Link></Button>
          <Button asChild size="sm" variant="outline" className="h-9 w-full rounded-full border-emerald-300 bg-emerald-500 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(16,185,129,0.18)] hover:bg-emerald-600 hover:text-white"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="justify-center"><MessageCircle className="size-3.5 shrink-0" aria-hidden="true" />Ask on WhatsApp</a></Button>
        </div>
      </div>
    </article>
  );
}
