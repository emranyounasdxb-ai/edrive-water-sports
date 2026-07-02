import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg[data-icon]]:size-4 [&_svg[data-icon]]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary-900 text-white shadow-[0px_-3px_0px_0px_#080808_inset,0px_1px_0px_0px_rgba(255,255,255,0.30)_inset,0px_2.77px_2.21px_0px_rgba(0,0,0,0.12),0px_6.65px_5.32px_0px_rgba(0,0,0,0.13),0px_12.52px_10.02px_0px_rgba(0,0,0,0.13),0px_22.34px_17.87px_0px_rgba(0,0,0,0.14),0px_41.78px_33.42px_0px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 hover:bg-primary-800',
        gold: 'bg-accent-500 text-ink shadow-[0px_-3px_0px_0px_rgba(0,0,0,0.06)_inset,0px_1px_0px_0px_rgba(255,255,255,0.60)_inset,0px_3.44px_5.57px_0px_rgba(0,0,0,0.09),0px_22.91px_37.08px_0px_rgba(217,181,109,0.22),0px_14px_34px_0px_rgba(217,181,109,0.18)] hover:-translate-y-0.5 hover:bg-accent-600',
        outline: 'border border-white/80 bg-[#F4F4F5] text-foreground shadow-[0px_-3px_0px_0px_#E9E9E9_inset,0px_1px_0px_0px_rgba(255,255,255,0.70)_inset,0px_2.77px_2.21px_0px_rgba(0,0,0,0.12),0px_3px_3px_0px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:bg-white hover:text-primary-800',
        ghost: 'text-muted-foreground hover:bg-primary-50 hover:text-primary-800',
        subtle: 'bg-[#F4F4F5] text-primary-800 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.05)_inset,0px_4px_0px_0px_rgba(255,255,255,0.60)_inset,0px_7.77px_16px_0px_rgba(0,0,0,0.06),0px_3px_3px_0px_rgba(0,0,0,0.10)] hover:bg-white'
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
