import React from 'react';
import { cn } from '@/lib/utils';

interface TimeRangeSelectorProps {
  value?: '24h' | '7d' | '30d' | '90d';
  onChange?: (value: '24h' | '7d' | '30d' | '90d') => void;
}

const ranges = ['24h', '7d', '30d', '90d'] as const;

export function TimeRangeSelector({ value = '7d', onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange?.(range)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            value === range ? 'bg-electric-600 text-white' : 'text-base-400 hover:text-white hover:bg-base-800'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}