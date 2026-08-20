// src/components/agents/AgentExecutionHistory.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { executionsApi } from '@/api/executions';
import { Table, TableColumn } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDateTime, formatDuration } from '@/lib/format';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Execution } from '@/types/models';

interface AgentExecutionHistoryProps {
  agentId: string;
}

export function AgentExecutionHistory({ agentId }: AgentExecutionHistoryProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['executions', { agent_id: agentId, limit: 50 }],
    queryFn: () => executionsApi.list({ agent_id: agentId, limit: 50 }),
  });

  if (isLoading) return <TableSkeleton rows={5} cols={5} />;
  if (error) {
    return (
      <ErrorState
        title="Failed to load execution history"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  const executions: Execution[] = data?.items ?? [];

  if (executions.length === 0) {
    return (
      <div className="card p-6 text-center text-base-400">
        No executions found for this agent.
      </div>
    );
  }

  const columns: TableColumn<Execution>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (_, row) => (
        <Link to={`/executions/${row.id}`} className="font-mono text-xs hover:text-electric-400">
          {row.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'task_name',
      label: 'Task',
      render: (value) => <span>{String(value) || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={String(value)} />,
    },
    {
      key: 'started_at',
      label: 'Started',
      render: (value) => (
        <span className="text-base-400">{formatDateTime(String(value))}</span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => <span>{formatDuration(Number(value))}</span>,
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-base-800">
        <h3 className="text-lg font-semibold text-white">Execution History</h3>
      </div>
      <div className="overflow-x-auto">
        <Table columns={columns} data={executions} />
      </div>
    </div>
  );
}