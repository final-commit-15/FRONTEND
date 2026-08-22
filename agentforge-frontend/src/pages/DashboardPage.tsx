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

export function DashboardPage() {
  const { user } = useAuth();

  // ── Queries ──────────────────────────────────────────────────
  // Use correct method names – assuming getOverview exists
  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview(),
    retry: false,
  });

  // Recent executions – use limit instead of page_size
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-80 w-full" />
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
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here's what's happening across your AI operations."
      />

      {/* KpiGrid fetches its own data – no props needed */}
      <KpiGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* ExecutionActivityChart fetches its own data – no props */}
          <ExecutionActivityChart />
        </div>
        <div>
          <SystemHealth />
        </div>
      </div>

      <AgentPerformance />

      {/* RecentExecutions fetches its own data – no props */}
      <RecentExecutions />
    </div>
  );
}