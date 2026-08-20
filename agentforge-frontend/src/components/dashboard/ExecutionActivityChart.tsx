// src/components/dashboard/ExecutionActivityChart.tsx

import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../../api/analytics';
import { ChartSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export function ExecutionActivityChart() {
  const [range, setRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['execution-activity', range],
    queryFn: () => analyticsApi.getExecutionActivity(range),
    refetchInterval: 60000,
  });

  // ── Guard: ensure data is an array ─────────────────────────
  const chartData = Array.isArray(data) ? data : [];

  if (isLoading) return <ChartSkeleton height={300} />;
  if (error) {
    return (
      <ErrorState
        title="Failed to load execution activity"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Execution Activity</h3>
          <p className="text-sm text-base-500">Number of executions over time</p>
        </div>
        <div className="flex gap-1">
          {(['24h', '7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                range === r ? 'bg-electric-600 text-white' : 'text-base-400 hover:text-white hover:bg-base-800'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="executionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timestamp"
              stroke="#475569"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#475569"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
                fontSize: '0.875rem',
              }}
              labelStyle={{ color: '#64748b' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#executionGradient)"
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}