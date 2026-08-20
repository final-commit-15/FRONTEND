// src/pages/AnalyticsPage.tsx

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

type TimeRange = '24h' | '7d' | '30d' | '90d';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

// ─── Helper: ensure array from various API shapes ──────────
function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    // Try common keys
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
}

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '0.5rem',
  color: '#f1f5f9',
  fontSize: '0.875rem',
};

export function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('7d');

  // ── Queries ──────────────────────────────────────────────────
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

  // ── Combined loading / error ───────────────────────────────
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
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

  // ── Safe data ───────────────────────────────────────────────
  const executionData = ensureArray<ExecutionActivityPoint>(executionQuery.data);
  const agentUsage = ensureArray<AgentUsagePoint>(agentUsageQuery.data);
  const taskData = ensureArray<TaskActivityPoint>(tasksQuery.data);
  const performanceData = ensureArray<AgentUsagePoint>(performanceQuery.data);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep insights into your AI operations."
        action={<TimeRangeSelector value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executions Over Time */}
        <ChartCard title="Executions Over Time" isLoading={false}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={executionData}>
              <defs>
                <linearGradient id="execAnalytics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#execAnalytics)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Agent Usage */}
        <ChartCard title="Agent Usage" isLoading={false}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="agent_name" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="executions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tasks Over Time */}
        <ChartCard title="Tasks Over Time" isLoading={false}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={taskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Average Duration */}
        <ChartCard title="Average Execution Duration" isLoading={false}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="agent_name" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg_duration" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}