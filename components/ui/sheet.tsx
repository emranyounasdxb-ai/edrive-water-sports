'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type SheetSize = 'sm' | 'md' | 'lg' | 'xl';
type SheetVariant = 'details' | 'inspector' | 'form' | 'workflow';

const sizeClasses: Record<SheetSize, string> = {
  sm: 'sm:max-w-[460px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[660px]',
  xl: 'sm:max-w-[760px]'
};

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: SheetSize; variant?: SheetVariant }
>(({ className, children, size = 'lg', variant = 'inspector', ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[3px] transition-opacity duration-200 motion-reduce:transition-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
    <DialogPrimitive.Content
      ref={ref}
      data-variant={variant}
      className={cn(
        'fixed inset-0 z-50 flex w-full flex-col overflow-hidden border-border bg-[#FCFEFE] shadow-[0_24px_80px_rgba(8,37,50,0.22)] outline-none transition duration-200 motion-reduce:transition-none data-[state=closed]:translate-x-3 data-[state=closed]:opacity-0 data-[state=open]:translate-x-0 data-[state=open]:opacity-100 sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:h-auto sm:rounded-[1.25rem] sm:border',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 z-30 flex size-8 items-center justify-center rounded-lg border border-border/70 bg-white/90 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 motion-reduce:transition-none" aria-label="Close panel">
        <X className="size-4" aria-hidden="true" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('sticky top-0 z-20 shrink-0 border-b border-border/70 bg-white/95 px-4 py-3 pr-14 backdrop-blur-md sm:px-5', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('sticky bottom-0 z-20 mt-auto flex shrink-0 flex-wrap justify-end gap-2 border-t border-border/70 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-5', className)} {...props} />;
}

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => <DialogPrimitive.Title ref={ref} className={cn('font-heading text-lg font-semibold text-foreground', className)} {...props} />);
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />);
SheetDescription.displayName = 'SheetDescription';
