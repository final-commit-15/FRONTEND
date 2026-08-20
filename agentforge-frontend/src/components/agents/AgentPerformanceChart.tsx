// src/components/agents/AgentPerformanceChart.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '@/api/analytics';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

interface AgentPerformanceChartProps {
  agentId: string;
}

export function AgentPerformanceChart({ agentId }: AgentPerformanceChartProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agent-performance', agentId],
    queryFn: () => analyticsApi.getExecutionActivity('7d'), // simplified; adapt to actual endpoint
    enabled: !!agentId,
  });

  if (isLoading) return <ChartSkeleton height={300} />;

  if (error) {
    return (
      <ErrorState
        title="Failed to load performance chart"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  // Transform data for chart
  const chartData = data?.map((point) => ({
    date: point.timestamp,
    executions: point.count,
  }));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="agentPerfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} width={40} />
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
              dataKey="executions"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#agentPerfGradient)"
              activeDot={{ r: 4, fill: '#8b5cf6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}