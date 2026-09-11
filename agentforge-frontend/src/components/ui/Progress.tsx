import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  max?: number;
}

export function Progress({ value, max = 100, className }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className={cn('w-full h-2 bg-canvas-surface rounded-full overflow-hidden', className)} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      <div 
        className="h-full bg-brand-primary transition-all duration-300 ease-out" 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}