// src/components/agents/AgentExecutionHistory.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { executionsApi } from '@/api/executions';
import { Table, TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
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

  if (isLoading) return <TableSkeleton rows={5} columns={5} />;
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
      <div className="empty-state py-12">
        <div className="empty-state-icon">
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="empty-state-title">No executions</p>
        <p className="empty-state-description">No executions found for this agent.</p>
      </div>
    );
  }

  const columns: TableColumn<Execution>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (_, row) => (
        <Link to={`/executions/${row.id}`} className="font-mono text-xs text-text-muted hover:text-brand-primary">
          {row.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'task_name',
      label: 'Task',
      render: (value) => <span className="text-text-body">{String(value) || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const status = String(value);
        if (status === 'completed') return <Badge variant="success">{status}</Badge>;
        if (status === 'running') return <Badge variant="info">{status}</Badge>;
        if (status === 'failed') return <Badge variant="error">{status}</Badge>;
        if (status === 'pending') return <Badge variant="warning">{status}</Badge>;
        if (status === 'cancelled') return <Badge variant="neutral">{status}</Badge>;
        if (status === 'queued') return <Badge variant="info">{status}</Badge>;
        return <Badge variant="neutral">{status}</Badge>;
      },
    },
    {
      key: 'started_at',
      label: 'Started',
      render: (value) => <span className="text-text-muted">{formatDateTime(String(value))}</span>,
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => <span className="font-mono text-text-body">{formatDuration(Number(value))}</span>,
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-canvas-border">
        <h3 className="font-heading text-lg font-semibold text-text-heading">Execution History</h3>
      </div>
      <div className="overflow-x-auto">
        <Table columns={columns} data={executions} striped hoverable />
      </div>
    </div>
  );
}