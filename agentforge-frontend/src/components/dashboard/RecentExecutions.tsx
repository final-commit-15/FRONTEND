// src/components/dashboard/RecentExecutions.tsx

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { executionsApi } from '../../api/executions';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, TableColumn } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatRelativeTime, formatDuration } from '../../lib/format';
import type { Execution } from '../../types/models';

export function RecentExecutions() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['executions', { limit: 10 }],
    queryFn: () => executionsApi.list({ limit: 10 }),
    refetchInterval: 15000,
  });

  if (isLoading) return <TableSkeleton rows={8} cols={6} />;
  if (error) {
    return (
      <ErrorState
        title="Failed to load recent executions"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  const executions: Execution[] = data?.items ?? [];

  if (executions.length === 0) {
    return (
      <div className="card p-6 text-center text-base-400">
        No recent executions found.
      </div>
    );
  }

  const columns: TableColumn<Execution>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (_, row) => (
        <Link to={`/executions/${row.id}`} className="font-mono text-xs text-base-400 hover:text-electric-400">
          {row.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'agent_name',
      label: 'Agent',
      render: (_, row) => (
        <Link to={`/agents/${row.agent_id}`} className="hover:text-electric-400">
          {row.agent_name}
        </Link>
      ),
    },
    {
      key: 'task_name',
      label: 'Task',
      render: (_, row) => (
        <Link to={`/tasks/${row.task_id}`} className="hover:text-electric-400">
          {row.task_name}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'started_at',
      label: 'Started',
      render: (value) => <span className="text-base-400">{formatRelativeTime(String(value))}</span>,
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => <span>{formatDuration(Number(value))}</span>,
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-base-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Executions</h3>
        <Link to="/executions" className="text-sm text-electric-400 hover:text-electric-300">
          View all
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table columns={columns} data={executions} />
      </div>
    </div>
  );
}