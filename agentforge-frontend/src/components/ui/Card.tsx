import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glass?: boolean;
  elevated?: boolean;
}

export function Card({ className, interactive, glass, elevated, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
        glass
          ? 'bg-canvas-surface backdrop-blur-md border border-canvas-border shadow-glass'
          : elevated
          ? 'bg-canvas border border-canvas-border shadow-card-hover'
          : 'bg-canvas border border-canvas-border shadow-card',
        interactive && 'hover:shadow-glass-hover hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5 border-b border-canvas-border', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-t border-canvas-border bg-canvas-surface/50 rounded-b-2xl', className)} {...props}>
      {children}
    </div>
  );
}