import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-base-800', className)} style={style} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn('card p-5 animate-pulse h-48', className)} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-base-800">
        <div className="h-5 bg-base-800 rounded w-1/3" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-base-800 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return <div className="card p-6 animate-pulse" style={{ height }} />;
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-base-800 rounded-xl" />
      <div className="h-64 bg-base-800 rounded-xl" />
      <div className="h-48 bg-base-800 rounded-xl" />
    </div>
  );
}