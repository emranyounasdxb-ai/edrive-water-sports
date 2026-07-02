import { Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex size-11 items-center justify-center rounded-lg border border-primary/[0.35] bg-primary/10 text-primary shadow-glow">
        <Waves data-icon aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block font-heading text-2xl font-bold tracking-normal text-gold">eDrive</span>
          <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-ocean-glow">Water Sports</span>
        </span>
      ) : null}
    </div>
  );
}
