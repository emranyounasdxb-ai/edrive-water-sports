import { Sparkles } from 'lucide-react';
import { formatAed } from '@/lib/booking-data';
import { getPackagePricePresentation, type PackagePriceAudience, type PackagePricingFields } from '@/lib/package-pricing';
import { cn } from '@/lib/utils';

export function PackageOfferRibbon({ pricing, audience = 'b2c' }: { pricing: PackagePricingFields; audience?: PackagePriceAudience }) {
  const offer = getPackagePricePresentation(pricing, audience);
  if (!offer.active) return null;
  return <span className="inline-flex h-7 max-w-full items-center justify-start gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-left text-[10px] font-bold uppercase leading-none tracking-[0.075em] text-white shadow-[0_4px_12px_rgba(217,119,6,0.22)]" aria-label={`Active offer: ${offer.label}`}><Sparkles className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{offer.label}</span></span>;
}

export function PackageOfferPrice({ pricing, audience, compact = false, showRibbon = false, className }: { pricing: PackagePricingFields; audience: PackagePriceAudience; compact?: boolean; showRibbon?: boolean; className?: string }) {
  const value = getPackagePricePresentation(pricing, audience);
  return <div className={cn('min-w-0', className)}>
    {showRibbon && value.active ? <PackageOfferRibbon pricing={pricing} audience={audience} /> : null}
    {value.active ? <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', showRibbon && 'mt-2')}>
      <span className="text-xs font-semibold text-muted-foreground line-through" aria-label={`Regular ${audience.toUpperCase()} price ${formatAed(value.normalPrice)}`}>{formatAed(value.normalPrice)}</span>
      <span className={cn('font-heading font-bold text-primary-900', compact ? 'text-sm' : 'text-lg')} aria-label={`Offer ${audience.toUpperCase()} price ${formatAed(value.effectivePrice)}`}>{formatAed(value.effectivePrice)}</span>
      {!compact ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700" aria-label={`Savings ${formatAed(value.savings)}`}>Save {formatAed(value.savings)}</span> : null}
    </div> : <span className={cn('font-heading font-bold text-primary-900', compact ? 'text-sm' : 'text-lg')} aria-label={`${audience.toUpperCase()} price ${formatAed(value.normalPrice)}`}>{formatAed(value.normalPrice)}</span>}
  </div>;
}
