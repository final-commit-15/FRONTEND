import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { executionsApi } from '../../api/executions';
import { Badge } from '../../components/ui/Badge';
import { Table, TableColumn } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatRelativeTime, formatDuration } from '../../lib/format';
import type { Execution } from '../../types/models';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';

type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'pending';

const getStatusBadge = (status: ExecutionStatus) => {
  if (status === 'completed') return <Badge variant="success">{status}</Badge>;
  if (status === 'running') return <Badge variant="info">{status}</Badge>;
  if (status === 'failed') return <Badge variant="error">{status}</Badge>;
  if (status === 'pending') return <Badge variant="warning">{status}</Badge>;
  if (status === 'cancelled') return <Badge variant="neutral">{status}</Badge>;
  if (status === 'queued') return <Badge variant="info">{status}</Badge>;
  return <Badge variant="neutral">{status}</Badge>;
};

export function RecentExecutions() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['executions', { limit: 10 }],
    queryFn: () => executionsApi.list({ limit: 10 }),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-text-heading">Recent Executions</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton variant="card" className="h-60" />
        </CardContent>
      </Card>
    );
  }

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
      <Card className="h-full">
        <CardHeader className="pb-4">
          <h3 className="font-heading text-lg font-semibold text-text-heading">Recent Executions</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="empty-state-title">No recent executions</p>
            <p className="empty-state-description">Execute a task to see it appear here.</p>
          </div>
        </CardContent>
      </Card>
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
      key: 'agent_name',
      label: 'Agent',
      render: (_, row) => (
        <Link to={`/agents/${row.agent_id}`} className="font-medium text-text-heading hover:text-brand-primary">
          {row.agent_name}
        </Link>
      ),
    },
    {
      key: 'task_name',
      label: 'Task',
      render: (_, row) => (
        <Link to={`/tasks/${row.task_id}`} className="font-medium text-text-heading hover:text-brand-primary">
          {row.task_name}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => getStatusBadge(row.status),
    },
    {
      key: 'started_at',
      label: 'Started',
      render: (value) => <span className="text-text-muted">{formatRelativeTime(String(value))}</span>,
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => <span className="font-mono text-text-body">{formatDuration(Number(value))}</span>,
    },
  ];

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-text-heading">Recent Executions</h3>
          <Link to="/executions" className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover">
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table columns={columns} data={executions} striped hoverable />
        </div>
      </CardContent>
    </Card>
  );
}