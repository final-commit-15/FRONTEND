// src/components/dashboard/AgentPerformance.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

import { analyticsApi } from '../../api/analytics';
import type { AgentUsagePoint } from '../../types/api';
import { Table, TableColumn } from '../../components/ui/Table'; // ✅ use generic Table
import { Badge } from '@/components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatPercent, formatDuration } from '../../lib/format';

export function AgentPerformance() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<AgentUsagePoint[]>({
    queryKey: ['analytics', 'agent-performance'],
    queryFn: () => analyticsApi.getAgentUsage('7d'),
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load agent performance"
        description="Unable to retrieve analytics from AgentForge backend."
        onRetry={refetch}
      />
    );
  }

  const agents = data ?? [];

  // ─── Table columns ──────────────────────────────────────────
  const columns: TableColumn<AgentUsagePoint>[] = [
    {
      key: 'agent_id',
      label: 'Agent',
      render: (_, row) => (
        <Link
          to={`/agents/${row.agent_id}`}
          className="flex items-center gap-3 hover:underline"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-500/20 to-violet-500/20 flex items-center justify-center">
            <Bot size={16} className="text-electric-400" />
          </div>
          <div>
            <p className="font-medium text-white">{row.agent_name}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'executions',
      label: 'Executions',
    },
    {
      key: 'success_rate',
      label: 'Success Rate',
      render: (value, row) => {
        const rate = row.success_rate;
        const color = rate > 90 ? 'text-success-500' : rate > 70 ? 'text-warning-500' : 'text-error-500';
        return <span className={color}>{formatPercent(rate)}</span>;
      },
    },
    {
      key: 'avg_duration',
      label: 'Avg Duration',
      render: (value) => <span>{formatDuration(value as number)}</span>,
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-base-800">
        <h3 className="text-lg font-semibold text-white">Agent Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <Table columns={columns} data={agents} />
      </div>
    </div>
  );
}