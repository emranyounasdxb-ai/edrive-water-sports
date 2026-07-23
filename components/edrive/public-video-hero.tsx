import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeroVideoMedia } from './hero-video-media';
import { MotionReveal } from './motion-reveal';

export const publicHeroFrameClass = 'relative isolate min-h-[600px] overflow-hidden bg-primary-900 text-white sm:min-h-[620px] lg:min-h-[640px] xl:min-h-[680px]';
export const publicHeroContentClass = 'container-x relative flex min-h-[600px] items-center pb-10 pt-28 sm:min-h-[620px] sm:pb-12 sm:pt-28 lg:min-h-[640px] lg:pb-14 lg:pt-24 xl:min-h-[680px]';

export type PublicHeroAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'outline' | 'gold';
  external?: boolean;
};

export function PublicVideoHero({
  title,
  text,
  fallbackImage,
  fallbackAlt,
  actions = []
}: {
  title: string;
  text: string;
  fallbackImage: string;
  fallbackAlt: string;
  actions?: PublicHeroAction[];
}) {
  return (
    <section className={publicHeroFrameClass} data-public-hero>
      <HeroVideoMedia fallbackImage={fallbackImage} fallbackAlt={fallbackAlt} priority />
      <div className={publicHeroContentClass}>
        <MotionReveal>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-accent-300">eDrive Water Sports</p>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">{text}</p>
            {actions.length ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {actions.map((action) => <PublicHeroButton key={action.label} action={action} />)}
              </div>
            ) : null}
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

function PublicHeroButton({ action }: { action: PublicHeroAction }) {
  const Icon = action.icon;
  const className = cn(
    'rounded-full',
    action.variant === 'outline' && 'bg-white text-primary-900 hover:bg-primary-50',
    action.variant === 'gold' && 'bg-accent text-primary-950 hover:bg-accent-300'
  );
  const content = <><Icon data-icon aria-hidden="true" />{action.label}</>;

  if (action.external) {
    return <Button asChild className={className}><a href={action.href} target="_blank" rel="noopener noreferrer">{content}</a></Button>;
  }

  return <Button asChild className={className}><Link href={action.href}>{content}</Link></Button>;
}
