import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg[data-icon]]:size-4 [&_svg[data-icon]]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-primary-500 to-primary-700 text-primary-foreground shadow-[0_16px_34px_rgba(14,124,134,0.22),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-12px_22px_rgba(5,26,36,0.16)] hover:-translate-y-0.5 hover:from-primary-600 hover:to-primary-800',
        gold: 'bg-gradient-to-b from-accent-500 to-accent-600 text-ink shadow-[0_16px_34px_rgba(217,181,109,0.24),inset_0_1px_0_rgba(255,255,255,0.42)] hover:-translate-y-0.5 hover:to-accent-700',
        outline: 'border border-primary/18 bg-white text-foreground shadow-[0_12px_28px_rgba(8,37,50,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-50 hover:text-primary-800',
        ghost: 'text-muted-foreground hover:bg-primary-50 hover:text-primary-800',
        subtle: 'bg-primary-100 text-primary-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-[#CBECEF]'
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-7',
        icon: 'size-10 rounded-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Button.displayName = 'Button';

export { Button, buttonVariants };
