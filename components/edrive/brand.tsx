import Image from 'next/image';
import { cn } from '@/lib/utils';

export function BrandMark({ compact = false, inverse = false, className }: { compact?: boolean; inverse?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/brand/edrive-logo-header.png"
        alt="eDrive Water Sports"
        width={600}
        height={220}
        priority
        className={cn(
          'h-auto w-[9.8rem] object-contain sm:w-[11rem] lg:w-[12.5rem]',
          compact && 'w-[4.4rem] sm:w-[5rem] lg:w-[5.4rem]',
          inverse && 'drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]'
        )}
      />
      <span className="sr-only">eDrive Water Sports</span>
    </div>
  );
}
