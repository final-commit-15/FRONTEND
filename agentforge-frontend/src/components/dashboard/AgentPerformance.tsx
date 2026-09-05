import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

import { analyticsApi } from '../../api/analytics';
import type { AgentUsagePoint } from '../../types/api';
import { Table, TableColumn } from '../../components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
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
      <Card className="h-full">
        <CardHeader className="pb-4">
          <h3 className="font-heading text-lg font-semibold text-text-heading">Agent Performance</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton variant="card" className="h-60" />
        </CardContent>
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

  const columns: TableColumn<AgentUsagePoint>[] = [
    {
      key: 'agent_id',
      label: 'Agent',
      render: (_, row) => (
        <Link
          to={`/agents/${row.agent_id}`}
          className="flex items-center gap-3 hover:underline"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <Bot size={16} className="text-brand-primary" />
          </div>
          <div>
            <p className="font-medium text-text-heading">{row.agent_name}</p>
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
        if (rate > 90) return <Badge variant="success">{formatPercent(rate)}</Badge>;
        if (rate > 70) return <Badge variant="warning">{formatPercent(rate)}</Badge>;
        return <Badge variant="error">{formatPercent(rate)}</Badge>;
      },
    },
    {
      key: 'avg_duration',
      label: 'Avg Duration',
      render: (value) => <span className="font-mono text-text-body">{formatDuration(value as number)}</span>,
    },
  ];

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-text-heading">Agent Performance</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table columns={columns} data={agents} striped hoverable />
        </div>
      </CardContent>
    </Card>
  );
}