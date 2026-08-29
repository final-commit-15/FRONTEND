// src/pages/DashboardPage.tsx

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';
import { executionsApi } from '../api/executions';
import { useAuth } from '../hooks/useAuth';

import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { ExecutionActivityChart } from '../components/dashboard/ExecutionActivityChart';
import { AgentPerformance } from '../components/dashboard/AgentPerformance';
import { RecentExecutions } from '../components/dashboard/RecentExecutions';
import { SystemHealth } from '../components/dashboard/SystemHealth';
import { Card } from '../components/ui/Card';

export function DashboardPage() {
  const { user } = useAuth();

  // ── Queries ──────────────────────────────────────────────────
  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview(),
    retry: false,
  });

  const recentExecutionsQuery = useQuery({
    queryKey: ['executions', 'recent'],
    queryFn: () => executionsApi.list({ limit: 5 }),
    retry: false,
  });

  // ── Combined loading / error states ──────────────────────
  const isLoading = overviewQuery.isLoading || recentExecutionsQuery.isLoading;
  const isError = overviewQuery.isError || recentExecutionsQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <Skeleton variant="card" className="h-32" />
        <Skeleton variant="card" className="h-80" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description="Unable to load AgentForge analytics. Please try again later."
        onRetry={() => {
          overviewQuery.refetch();
          recentExecutionsQuery.refetch();
        }}
      />
    );
  }

  // ── Data ────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here's what's happening across your AI operations."
      />

      <KpiGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExecutionActivityChart />
        </div>
        <div>
          <SystemHealth />
        </div>
      </div>

      <AgentPerformance />

      <RecentExecutions />
    </div>
  );
}