import { Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark({ compact = false, inverse = false, className }: { compact?: boolean; inverse?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className={cn('flex size-10 items-center justify-center rounded-md border', inverse ? 'border-white/20 bg-white/10 text-white' : 'border-primary/15 bg-primary-100 text-primary')}>
        <Waves data-icon aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className={cn('block font-heading text-2xl font-semibold tracking-normal', inverse ? 'text-white' : 'text-foreground')}>eDrive</span>
          <span className={cn('mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.3em]', inverse ? 'text-primary-100' : 'text-primary')}>Water Sports</span>
        </span>
      ) : null}
    </div>
  );
}
