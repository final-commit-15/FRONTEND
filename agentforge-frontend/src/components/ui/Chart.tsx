import React from 'react';
import { cn } from '../../lib/utils';

// This is a placeholder – you can replace with your chart library (e.g., Recharts)
export interface ChartProps<T> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  className?: string;
  height?: number;
}

export function Chart<T>({ data, xKey, yKey, className, height = 300 }: ChartProps<T>) {
  // Example: simple bar chart using divs, or you'd use a real chart library
  return (
    <div className={cn('relative', className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 p-4">
        {data.map((item, idx) => {
          const value = Number(item[yKey]) || 0;
          const max = Math.max(...data.map((d) => Number(d[yKey]) || 0), 1);
          const heightPct = (value / max) * 100;
          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-electric-500/40 rounded-t"
                style={{ height: `${heightPct}%` }}
              />
              <span className="mt-1 text-xs text-base-500">
                {String(item[xKey])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}