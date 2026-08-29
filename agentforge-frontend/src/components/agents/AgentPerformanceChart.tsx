// src/components/agents/AgentPerformanceChart.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '@/api/analytics';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

interface AgentPerformanceChartProps {
  agentId: string;
}

export function AgentPerformanceChart({ agentId }: AgentPerformanceChartProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agent-performance', agentId],
    queryFn: () => analyticsApi.getExecutionActivity('7d'),
    enabled: !!agentId,
  });

  if (isLoading) return <ChartSkeleton className="h-[380px]" />;

  if (error) {
    return (
      <ErrorState
        title="Failed to load performance chart"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  const chartData = data?.map((point) => ({
    date: point.timestamp,
    executions: point.count,
  })) ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <h3 className="font-heading text-lg font-semibold text-text-heading">Performance Over Time</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="agentPerfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.70)',
                  borderRadius: '0.75rem',
                  color: '#171717',
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                }}
                labelStyle={{ color: '#6B7280' }}
              />
              <Area
                type="monotone"
                dataKey="executions"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#agentPerfGradient)"
                activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#FFFFFF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}