import { Sparkles } from 'lucide-react';
import { formatAed } from '@/lib/booking-data';
import { getPackagePricePresentation, type PackagePriceAudience, type PackagePricingFields } from '@/lib/package-pricing';
import { cn } from '@/lib/utils';

export function PackageOfferRibbon({ pricing, showIcon = true }: { pricing: PackagePricingFields; showIcon?: boolean }) {
  const offer = getPackagePricePresentation(pricing, 'b2c');
  if (!offer.active) return null;
  return <span className="inline-flex h-8 max-w-full items-center justify-start whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-md" aria-label={`Active offer: ${offer.label}`}>{showIcon ? <Sparkles className="mr-1.5 size-3.5 shrink-0" aria-hidden="true" /> : null}<span className="truncate">{offer.label}</span></span>;
}

export function PackageOfferPrice({ pricing, audience, compact = false, showRibbon = false, className }: { pricing: PackagePricingFields; audience: PackagePriceAudience; compact?: boolean; showRibbon?: boolean; className?: string }) {
  const value = getPackagePricePresentation(pricing, audience);
  return <div className={cn('min-w-0', className)}>
    {showRibbon && value.active ? <PackageOfferRibbon pricing={pricing} /> : null}
    {value.active ? <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', showRibbon && 'mt-2')}>
      <span className="text-xs font-semibold text-muted-foreground line-through" aria-label={`Regular ${audience.toUpperCase()} price ${formatAed(value.normalPrice)}`}>{formatAed(value.normalPrice)}</span>
      <span className={cn('font-heading font-bold text-primary-900', compact ? 'text-sm' : 'text-lg')} aria-label={`Offer ${audience.toUpperCase()} price ${formatAed(value.effectivePrice)}`}>{formatAed(value.effectivePrice)}</span>
      {!compact ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700" aria-label={`Savings ${formatAed(value.savings)}`}>Save {formatAed(value.savings)}</span> : null}
    </div> : <span className={cn('font-heading font-bold text-primary-900', compact ? 'text-sm' : 'text-lg')} aria-label={`${audience.toUpperCase()} price ${formatAed(value.normalPrice)}`}>{formatAed(value.normalPrice)}</span>}
  </div>;
}
