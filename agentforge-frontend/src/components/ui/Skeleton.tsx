import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'title';
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  lines = 1,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-canvas-surface animate-pulse rounded';

  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'h-10 w-10 rounded-full',
    rectangular: 'h-16 w-full rounded-xl',
    card: 'h-32 w-full rounded-2xl',
    title: 'h-8 w-56 rounded-lg',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseStyles,
              variantStyles.text,
              i === lines - 1 && 'w-3/4'
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} {...props} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card p-5 space-y-4', className)}>
      <Skeleton variant="circular" className="w-10 h-10" />
      <Skeleton variant="text" lines={2} />
      <Skeleton variant="rectangular" className="h-8 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-container">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="table-header">
                <Skeleton variant="text" className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-canvas-border/50">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="table-row">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="table-cell">
                  <Skeleton variant="text" className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <Skeleton variant="circular" className="w-12 h-12" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-5 w-3/4" />
            <Skeleton variant="text" className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-6', className)}>
      <Skeleton variant="title" className="w-48 mb-4" />
      <Skeleton variant="rectangular" className="h-64" />
    </div>
  );
}

export { SkeletonTable as TableSkeleton };