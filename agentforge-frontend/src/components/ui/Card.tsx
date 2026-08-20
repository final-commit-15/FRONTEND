import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glass?: boolean;
}

export function Card({ className, interactive, glass, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-card transition-all duration-200',
        glass ? 'bg-base-900/80 backdrop-blur-md border-white/5 shadow-glass' : 'bg-base-900 border-base-800',
        interactive && 'hover:border-base-700 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}