'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, MessageCircle, RefreshCw, TicketCheck, Users } from 'lucide-react';
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
  capacity: number;
  image_url: string | null;
  short_description: string | null;
  status: string;
  is_featured: boolean;
  display_order: number;
};

type PackageCardItem = LivePackage & { display_image_url: string };

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
  if (value === 'jet_car_rental') return 'jet car ride';
  if (value === 'jet_ski_rental') return 'jet ski ride';
  if (value === 'yacht_rental') return 'yacht experience';
  return 'water sports experience';
}

function defaultDescription(item: LivePackage) {
  return `Enjoy a ${item.duration_minutes} minute ${serviceLabel(item.category)} with clear timing, guest support, and booking confirmation.`;
}

function fallbackImageForPackage(item: LivePackage, index = 0) {
  const categoryOffset = item.category === 'jet_car_rental' ? 7 : 3;
  const seed = index * 5 + Number(item.duration_minutes || 0) + Number(item.capacity || 0) * categoryOffset + Number(item.display_order || 0);
  return getLivePackageImage(item.category, seed);
}

function imageForLivePackage(item: LivePackage, index = 0, repeatedImage = false) {
  if (item.image_url && !repeatedImage) return item.image_url;
  return fallbackImageForPackage(item, index);
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

function withDisplayImages(items: LivePackage[]) {
  const usedImages = new Map<string, number>();
  return items.map((item, index) => {
    const rawImage = String(item.image_url || '').trim();
    const repeatedImage = rawImage ? (usedImages.get(rawImage) || 0) > 0 : false;
    if (rawImage) usedImages.set(rawImage, (usedImages.get(rawImage) || 0) + 1);
    return { ...item, display_image_url: imageForLivePackage(item, index, repeatedImage) };
  });
}

async function fetchPublicPackages(categories?: string[]) {
  const rpcResult = await supabase.rpc('get_public_packages', {
    p_categories: categories?.length ? categories : null
  });
  if (!rpcResult.error) return (rpcResult.data || []) as LivePackage[];

  let query = supabase
    .from('packages')
    .select('id,title,slug,category,duration_minutes,base_price,capacity,image_url,short_description,status,is_featured,display_order')
    .eq('status', 'active');

  if (categories?.length) query = query.in('category', categories);

  const fallbackResult = await query
    .order('display_order', { ascending: true })
    .order('category', { ascending: true })
    .order('capacity', { ascending: true })
    .order('duration_minutes', { ascending: true });

  if (fallbackResult.error) throw fallbackResult.error;
  return (fallbackResult.data || []) as LivePackage[];
}

export function LivePackageShowcase({ title = 'Ride Packages', text = '', limit, compact = false, categories }: LivePackageShowcaseProps) {
  const [items, setItems] = useState<LivePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const categoriesKey = categories?.join('|') || '';

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      setLoading(true);
      setLoadError('');

      try {
        const rows = await fetchPublicPackages(categoriesKey ? categoriesKey.split('|') : undefined);
        if (!active) return;
        setItems(rows.filter((item) => Number(item.base_price) > 0 && Number(item.duration_minutes) > 0));
      } catch {
        if (!active) return;
        setItems([]);
        setLoadError('Ride packages could not be loaded right now. Please retry or contact the eDrive team for the latest availability.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPackages();
    return () => { active = false; };
  }, [categoriesKey, reloadKey]);

  const visibleItems = useMemo(() => withDisplayImages(sortedPackages(items)), [items]);
  const displayedItems = typeof limit === 'number' ? visibleItems.slice(0, limit) : visibleItems;

  if (!loading && !visibleItems.length) {
    return (
      <section id="live-packages" className={cn('border-y border-border bg-white/70', compact ? 'py-6' : 'py-8 sm:py-10 lg:py-11')}>
        <div className="container-x">
          <div className="mx-auto max-w-5xl">
            <Badge className="rounded-full bg-primary px-2.5 py-1 text-[10px] text-white">Ride packages</Badge>
            <h2 className="mt-3 section-title">{title}</h2>
            {text ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p> : null}
            <div className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold leading-6 text-amber-900">{loadError || 'No online packages are available at this moment. Contact the eDrive team to confirm the latest ride options and timings.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-full bg-white" onClick={() => setReloadKey((value) => value + 1)}>
                  <RefreshCw className="size-3.5" aria-hidden="true" />Retry
                </Button>
                <Button asChild size="sm" className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" aria-hidden="true" />WhatsApp Team</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="live-packages" className={cn('border-y border-border bg-white/70', compact ? 'py-6' : 'py-8 sm:py-10 lg:py-11')}>
      <div className="container-x">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary px-2.5 py-1 text-[10px] text-white">Current prices</Badge>
                <Badge className="rounded-full bg-white px-2.5 py-1 text-[10px] text-primary-900" variant="secondary">{loading ? 'Loading packages' : `${visibleItems.length} packages`}</Badge>
              </div>
              <h2 className="section-title">{title}</h2>
              {text ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p> : null}
              <noscript><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">JavaScript is required to display live package prices. Jet ski and jet car bookings are available daily from Dubai Islands with durations and guest capacity confirmed by the eDrive team.</p></noscript>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: limit || 9 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[1.25rem] bg-white/80" />)
              : displayedItems.map((item, index) => <LivePackageCard key={item.id} item={item} index={index} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function LivePackageCard({ item }: { item: PackageCardItem; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = item.display_image_url;
  const bookingHref = `/booking?package=${encodeURIComponent(item.id)}&category=${encodeURIComponent(item.category)}&capacity=${encodeURIComponent(String(item.capacity || 2))}&duration=${encodeURIComponent(String(item.duration_minutes || 0))}`;
  const description = item.short_description || defaultDescription(item);
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I am interested in this package: ${item.title}

Duration: ${item.duration_minutes} minutes
Guests/Seats: ${item.capacity}
Price: ${formatAed(Number(item.base_price || 0))}

Please confirm availability and the best timing.`);

  return (
    <article className="premium-surface premium-card-hover flex h-full min-w-0 flex-col overflow-hidden rounded-[1.2rem] p-2">
      <div className="relative aspect-[16/8.6] w-full overflow-hidden rounded-[0.9rem] bg-primary-50">
        {imageSrc && !imageFailed ? (
          <img src={imageSrc} alt={item.title} onError={() => setImageFailed(true)} className="h-full w-full object-cover object-center transition duration-700 hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 via-white to-accent-100 text-primary">
            <TicketCheck className="size-6" aria-hidden="true" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-primary-950/22 to-transparent" aria-hidden="true" />
        <div className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-xl bg-white/82 text-primary shadow-sm backdrop-blur-sm">
          <TicketCheck className="size-4" aria-hidden="true" />
        </div>
        <Badge className="absolute right-2 top-2 bg-white/92 px-2 py-0.5 text-[9px] font-bold text-primary-900 shadow-sm" variant="secondary">{categoryLabel(item.category)}</Badge>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-2.5">
        <h3 className="font-heading text-[0.92rem] font-semibold leading-[1.25] tracking-[-0.01em] text-foreground sm:text-[0.96rem]">{item.title}</h3>
        <div className="mt-2 grid gap-1.5 rounded-[0.85rem] bg-primary-50 px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-primary-900">{formatAed(Number(item.base_price || 0))}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-primary-900">{item.duration_minutes} min</span>
          </div>
          <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><Users className="size-3 text-primary" aria-hidden="true" />{item.capacity} seater</p>
          <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><Clock className="size-3 text-primary" aria-hidden="true" />Includes ride time and support</p>
        </div>
        <p className="mt-2 overflow-hidden text-[12px] leading-5 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{description}</p>
        <div className="mt-auto grid gap-1.5 pt-3">
          <Button asChild size="sm" className="h-8 w-full rounded-full text-[10.5px] font-bold shadow-[0_8px_18px_rgba(8,37,50,0.12)]"><Link href={bookingHref} className="justify-center">Book This Package<ArrowRight className="ml-1 size-3 shrink-0" aria-hidden="true" /></Link></Button>
          <Button asChild size="sm" variant="outline" className="h-8 w-full rounded-full border-emerald-300 bg-emerald-500 text-[10.5px] font-bold text-white shadow-[0_8px_18px_rgba(16,185,129,0.14)] hover:bg-emerald-600 hover:text-white"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="justify-center">Ask on WhatsApp</a></Button>
        </div>
      </div>
    </article>
  );
}
