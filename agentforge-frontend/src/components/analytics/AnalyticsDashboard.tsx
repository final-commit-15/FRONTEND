import React from 'react';
import { ExecutionActivityChart } from '@/components/dashboard/ExecutionActivityChart';
import { AgentPerformance } from '@/components/dashboard/AgentPerformance';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector } from './TimeRangeSelector';

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <TimeRangeSelector />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExecutionActivityChart />
        {/* Additional charts */}
      </div>
      <AgentPerformance />
    </div>
  );
}