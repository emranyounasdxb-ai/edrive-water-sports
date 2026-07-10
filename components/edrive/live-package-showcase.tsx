'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, MessageCircle, TicketCheck, Users } from 'lucide-react';
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

type LivePackageShowcaseProps = {
  title?: string;
  text?: string;
  limit?: number;
  compact?: boolean;
  categories?: string[];
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

function serviceLabel(value: string) {
  if (value === 'jet_car_rental') return 'Jet Car Rental';
  if (value === 'jet_ski_rental') return 'Jet Ski Rental';
  if (value === 'yacht_rental') return 'Yacht Rental';
  return 'Water Sports Package';
}

function defaultDescription(item: LivePackage) {
  return `${serviceLabel(item.category)} for ${item.duration_minutes} minutes. Price and details are managed from the live package dashboard.`;
}

function imageForLivePackage(item: LivePackage, index = 0) {
  const seed = Number(item.display_order || index || 0) + Number(item.duration_minutes || 0) + Number(item.capacity || 0);
  return item.image_url || getLivePackageImage(item.category, seed);
}

function sortedPackages(items: LivePackage[]) {
  return [...items].sort((a, b) => {
    const featuredSort = Number(b.is_featured) - Number(a.is_featured);
    if (featuredSort !== 0) return featuredSort;
    return Number(a.display_order || 100) - Number(b.display_order || 100)
      || String(a.category).localeCompare(String(b.category))
      || Number(a.capacity || 0) - Number(b.capacity || 0)
      || Number(a.duration_minutes || 0) - Number(b.duration_minutes || 0);
  });
}

export function LivePackageShowcase({ title = 'Live Booking Packages', text = '', limit, compact = false, categories }: LivePackageShowcaseProps) {
  const [items, setItems] = useState<LivePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      setLoading(true);
      let query = supabase
        .from('packages')
        .select('id,title,slug,category,duration_minutes,base_price,b2b_price,capacity,image_url,short_description,status,is_featured,display_order')
        .eq('status', 'active');

      if (categories?.length) query = query.in('category', categories);

      const { data } = await query
        .order('display_order', { ascending: true })
        .order('category', { ascending: true })
        .order('capacity', { ascending: true })
        .order('duration_minutes', { ascending: true });

      if (!active) return;
      setItems(((data || []) as LivePackage[]).filter((item) => Number(item.base_price) > 0 && Number(item.duration_minutes) > 0));
      setLoading(false);
    }

    void loadPackages();
    return () => { active = false; };
  }, [categories?.join('|')]);

  const visibleItems = useMemo(() => sortedPackages(items), [items]);

  if (!loading && !visibleItems.length) return null;

  return (
    <section id="live-packages" className={cn('border-y border-border bg-white/70', compact ? 'py-7' : 'py-10 sm:py-12 lg:py-14')}>
      <div className="container-x">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary text-white">Live prices</Badge>
              <Badge className="rounded-full bg-white text-primary-900" variant="secondary">{loading ? 'Loading packages' : `${visibleItems.length} packages`}</Badge>
            </div>
            <h2 className="section-title">{title}</h2>
            {text ? <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{text}</p> : null}
          </div>
        </div>

        <div className={cn('mt-7 grid gap-4 sm:grid-cols-2', compact ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4')}>
          {loading
            ? Array.from({ length: limit || 8 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-[1.5rem] bg-white/80" />)
            : visibleItems.map((item, index) => <LivePackageCard key={item.id} item={item} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function LivePackageCard({ item, index }: { item: LivePackage; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = imageForLivePackage(item, index);
  const bookingHref = `/booking?category=${encodeURIComponent(item.category)}&capacity=${encodeURIComponent(String(item.capacity || 2))}&duration=${encodeURIComponent(String(item.duration_minutes || 0))}`;
  const description = item.short_description || defaultDescription(item);
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I am interested in this package: ${item.title}

Duration: ${item.duration_minutes} minutes
Guests/Seats: ${item.capacity}
Price: ${formatAed(Number(item.base_price || 0))}

Please confirm availability and the best timing.`);

  return (
    <article className="premium-surface premium-card-hover flex h-full min-w-0 flex-col overflow-hidden rounded-[1.45rem] p-2.5">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.05rem] bg-primary-50">
        {imageSrc && !imageFailed ? (
          <img src={imageSrc} alt={item.title} onError={() => setImageFailed(true)} className="h-full w-full object-cover object-center transition duration-700 hover:scale-105" loading="lazy" />
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
        <h3 className="font-heading text-[1rem] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground sm:text-[1.05rem]">{item.title}</h3>
        <div className="mt-3 grid gap-2 rounded-[1rem] bg-primary-50 px-3.5 py-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-primary-900">{formatAed(Number(item.base_price || 0))}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-primary-900">{item.duration_minutes} min</span>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Users className="size-3.5 text-primary" aria-hidden="true" />{item.capacity} seater</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock className="size-3.5 text-primary" aria-hidden="true" />Exact package price from backend</p>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{description}</p>
        <div className="mt-auto grid gap-2 pt-4">
          <Button asChild size="sm" className="h-9 w-full rounded-full text-[11px] font-bold shadow-[0_8px_18px_rgba(8,37,50,0.16)]"><Link href={bookingHref} className="justify-center">Book This Package<ArrowRight className="ml-1 size-3.5 shrink-0" aria-hidden="true" /></Link></Button>
          <Button asChild size="sm" variant="outline" className="h-9 w-full rounded-full border-emerald-300 bg-emerald-500 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(16,185,129,0.18)] hover:bg-emerald-600 hover:text-white"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="justify-center"><MessageCircle className="size-3.5 shrink-0" aria-hidden="true" />Ask on WhatsApp</a></Button>
        </div>
      </div>
    </article>
  );
}
