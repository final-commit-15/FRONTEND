import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import type {
  ExecutionActivityPoint,
  AgentUsagePoint,
  TaskActivityPoint,
} from '@/types/api';

import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';
import { TimeRangeSelector } from '@/components/analytics/TimeRangeSelector';
import { ChartCard } from '@/components/analytics/ChartCard';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

type TimeRange = '24h' | '7d' | '30d' | '90d';

function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
}

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(255,255,255,0.70)',
  borderRadius: '0.75rem',
  color: '#171717',
  fontSize: '0.875rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
};

const executionFormatter = (value: unknown): [string, string] => [
  typeof value === 'number' ? value.toLocaleString() : '0',
  'Executions',
];

const durationFormatter = (value: unknown): [string, string] => [
  typeof value === 'number' ? value.toFixed(0) + 'ms' : '0ms',
  'Duration',
];

export function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('7d');

  const executionQuery = useQuery<ExecutionActivityPoint[]>({
    queryKey: ['analytics-executions', range],
    queryFn: () => analyticsApi.getExecutionActivity(range),
  });

  const agentUsageQuery = useQuery<AgentUsagePoint[]>({
    queryKey: ['analytics-agents', range],
    queryFn: () => analyticsApi.getAgentUsage(range),
  });

  const tasksQuery = useQuery<TaskActivityPoint[]>({
    queryKey: ['analytics-tasks', range],
    queryFn: () => analyticsApi.getTasksOverTime(range),
  });

  const performanceQuery = useQuery<AgentUsagePoint[]>({
    queryKey: ['analytics-performance', range],
    queryFn: () => analyticsApi.getAgentPerformanceComparison(range),
  });

  const isLoading =
    executionQuery.isLoading ||
    agentUsageQuery.isLoading ||
    tasksQuery.isLoading ||
    performanceQuery.isLoading;

  const isError =
    executionQuery.isError ||
    agentUsageQuery.isError ||
    tasksQuery.isError ||
    performanceQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Analytics unavailable"
        description="Unable to retrieve analytics from AgentForge backend."
        onRetry={() => {
          executionQuery.refetch();
          agentUsageQuery.refetch();
          tasksQuery.refetch();
          performanceQuery.refetch();
        }}
      />
    );
  }

  const executionData = ensureArray<ExecutionActivityPoint>(executionQuery.data);
  const agentUsage = ensureArray<AgentUsagePoint>(agentUsageQuery.data);
  const taskData = ensureArray<TaskActivityPoint>(tasksQuery.data);
  const performanceData = ensureArray<AgentUsagePoint>(performanceQuery.data);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics"
        description="Deep insights into your AI operations."
        action={<TimeRangeSelector value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <h3 className="font-heading text-lg font-semibold text-text-heading">Executions Over Time</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={executionData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="execAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0084FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0084FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B7280' }} formatter={executionFormatter as any} />
                <Area type="monotone" dataKey="count" stroke="#0084FF" strokeWidth={2} fill="url(#execAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-4">
            <h3 className="font-heading text-lg font-semibold text-text-heading">Agent Usage</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentUsage} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="agent_name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B7280' }} />
                <Bar dataKey="executions" fill="#0084FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-4">
            <h3 className="font-heading text-lg font-semibold text-text-heading">Tasks Over Time</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={taskData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B7280' }} />
                <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 6, fill: '#8B5CF6', strokeWidth: 2, stroke: '#FFFFFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-4">
            <h3 className="font-heading text-lg font-semibold text-text-heading">Average Execution Duration</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="agent_name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B7280' }} formatter={durationFormatter as any} />
                <Bar dataKey="avg_duration" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}