// src/components/dashboard/KpiGrid.tsx

import { useQuery } from '@tanstack/react-query';
import { Bot, TerminalSquare, CheckCircle2, Activity } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { ErrorState } from '../../components/ui/ErrorState';
import { analyticsApi } from '../../api/analytics';
import { formatNumber, formatPercent } from '../../lib/format';

export function KpiGrid() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: analyticsApi.getOverview,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6 h-32 animate-pulse bg-base-800/50" />
        ))}
      </div>
    );
  }

  if (error) {
    // 👇 Assuming ErrorState accepts `title` and `description` (common pattern)
    return (
      <ErrorState
        title="Failed to load KPIs"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={() => refetch()}
      />
    );
  }

  // Guard against undefined data
  const safeData = data ?? {
    total_agents: 0,
    active_agents: 0,
    total_executions: 0,
    success_rate: 0,
    agents_change: 0,
    active_agents_change: 0,
    executions_change: 0,
    success_rate_change: 0,
  };

  const stats = [
    {
      title: 'Total Agents',
      value: formatNumber(safeData.total_agents),
      change: safeData.agents_change,
      // 👇 Render icon as element with color class
      icon: <Bot className="text-electric-400" size={20} />,
    },
    {
      title: 'Active Agents',
      value: formatNumber(safeData.active_agents),
      change: safeData.active_agents_change,
      icon: <Activity className="text-violet-400" size={20} />,
    },
    {
      title: 'Executions',
      value: formatNumber(safeData.total_executions),
      change: safeData.executions_change,
      icon: <TerminalSquare className="text-info-500" size={20} />,
    },
    {
      title: 'Success Rate',
      value: formatPercent(safeData.success_rate),
      change: safeData.success_rate_change,
      icon: <CheckCircle2 className="text-success-500" size={20} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}