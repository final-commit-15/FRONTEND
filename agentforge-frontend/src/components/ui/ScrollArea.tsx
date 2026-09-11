import React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '../../lib/utils';

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    className?: string;
    type?: 'always' | 'hover' | 'scroll' | 'auto';
  }
>(({ className, type = 'auto', ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    type={type}
    {...props}
  />
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
    className?: string;
    orientation?: 'vertical' | 'horizontal';
  }
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-canvas-border p-[1px]',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-canvas-border p-[1px]',
      className
    )}
    orientation={orientation}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className={cn(
      'relative flex-1 rounded-full bg-text-muted/30',
      'hover:bg-text-muted/50',
      'active:bg-text-muted/70',
      'data-[state=visible]:opacity-100',
      'data-[state=hidden]:opacity-0',
    )} />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

const ScrollAreaViewport = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <ScrollAreaPrimitive.Viewport
    ref={ref}
    className={cn('h-full w-full rounded-[inherit]', className)}
    {...props}
  />
));
ScrollAreaViewport.displayName = ScrollAreaPrimitive.Viewport.displayName;

export { ScrollArea, ScrollBar, ScrollAreaViewport };