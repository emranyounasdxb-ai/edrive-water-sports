import Image from 'next/image';
import { cn } from '@/lib/utils';

export function BrandMark({ compact = false, inverse = false, className }: { compact?: boolean; inverse?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/brand/logo-primary.png"
        alt="eDrive Water Sports"
        width={600}
        height={180}
        priority
        className={cn('h-auto w-[8.8rem] object-contain sm:w-[9.6rem]', compact && 'w-[3.3rem]', inverse && 'drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]')}
      />
      <span className="sr-only">eDrive Water Sports</span>
    </div>
  );
}
