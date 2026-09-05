import React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface TimeRangeSelectorProps {
  value?: '24h' | '7d' | '30d' | '90d';
  onChange?: (value: '24h' | '7d' | '30d' | '90d') => void;
}

const ranges = ['24h', '7d', '30d', '90d'] as const;

export function TimeRangeSelector({ value = '7d', onChange }: TimeRangeSelectorProps) {
  return (
    <Tabs defaultValue={value} onValueChange={onChange as (value: string) => void}>
      <TabsList className="bg-canvas-surface border-canvas-border p-1">
        {ranges.map((range) => (
          <TabsTrigger key={range} value={range} className="px-3 py-1.5 text-xs font-medium">
            {range}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}