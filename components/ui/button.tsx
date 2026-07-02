import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg[data-icon]]:size-4 [&_svg[data-icon]]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary-900 text-white shadow-[0px_-2px_0px_0px_#0A0A0A_inset,0px_1px_0px_0px_rgba(255,255,255,0.24)_inset,0px_2px_2px_0px_rgba(0,0,0,0.08),0px_8px_12px_0px_rgba(0,0,0,0.11),0px_18px_24px_0px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 hover:bg-primary-800',
        gold: 'bg-accent-500 text-ink shadow-[0px_-2px_0px_0px_rgba(0,0,0,0.045)_inset,0px_1px_0px_0px_rgba(255,255,255,0.52)_inset,0px_3px_5px_0px_rgba(0,0,0,0.055),0px_14px_22px_0px_rgba(217,181,109,0.16)] hover:-translate-y-0.5 hover:bg-accent-600',
        outline: 'border border-white/80 bg-[#F7F7F8] text-foreground shadow-[0px_-2px_0px_0px_#EEEEEE_inset,0px_1px_0px_0px_rgba(255,255,255,0.62)_inset,0px_2px_2px_0px_rgba(0,0,0,0.055),0px_3px_3px_0px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 hover:bg-white hover:text-primary-800',
        ghost: 'text-muted-foreground hover:bg-primary-50 hover:text-primary-800',
        subtle: 'bg-[#F7F7F8] text-primary-800 shadow-[0px_-3px_0px_0px_rgba(0,0,0,0.035)_inset,0px_2px_0px_0px_rgba(255,255,255,0.55)_inset,0px_5px_10px_0px_rgba(0,0,0,0.04),0px_2px_3px_0px_rgba(0,0,0,0.06)] hover:bg-white'
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
