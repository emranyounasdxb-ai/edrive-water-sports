import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/[0.45] bg-primary/[0.14] text-ocean-glow',
        secondary: 'border-white/[0.12] bg-white/[0.08] text-pearl-muted',
        gold: 'border-gold/40 bg-gold/[0.13] text-gold-soft',
        success: 'border-emerald-300/[0.35] bg-emerald-400/[0.12] text-emerald-200',
        warning: 'border-amber-300/[0.35] bg-amber-400/[0.12] text-amber-200',
        destructive: 'border-red-300/[0.35] bg-red-400/[0.12] text-red-200'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
