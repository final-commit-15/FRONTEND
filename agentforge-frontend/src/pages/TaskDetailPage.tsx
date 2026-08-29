// src/pages/TaskDetailPage.tsx

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { executionsApi } from '@/api/executions';
import type { Task } from '@/types/models';
import type { ExecutionListResponse } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExecutionList } from '@/components/executions/ExecutionList';
import { formatDateTime } from '@/lib/format';

function getStatusVariant(status: Task['status']): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'running':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: task,
    isLoading,
    error,
    refetch,
  } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
  });

  const { data: executionsData } = useQuery<ExecutionListResponse>({
    queryKey: ['executions', { task_id: id }],
    queryFn: () => executionsApi.list({ task_id: id }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <Card>
          <CardContent className="pt-0">
            <Skeleton variant="card" className="h-72" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load task"
        description={(error as Error).message || 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  if (!task) {
    return (
      <ErrorState
        title="Task not found"
        description="Unable to retrieve this AgentForge task."
        onRetry={() => window.history.back()}
      />
    );
  }

  const executions = executionsData?.items ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={task.name}
        description="Task details and execution history"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
        <span className="text-sm text-text-muted">Created {formatDateTime(task.created_at)}</span>
      </div>

      {task.description && <p className="mt-4 text-text-body">{task.description}</p>}

      <Card>
        <CardHeader>
          <h3 className="font-heading text-lg font-semibold text-text-heading">Details</h3>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <dt className="text-sm text-text-muted">Assigned Agent</dt>
              <dd className="text-sm text-text-heading">
                {task.assigned_agent_name ? (
                  <Link to={`/agents/${task.assigned_agent_id}`} className="hover:text-brand-primary font-medium">
                    {task.assigned_agent_name}
                  </Link>
                ) : (
                  <span className="text-text-muted">Unassigned</span>
                )}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <dt className="text-sm text-text-muted">Execution Count</dt>
              <dd className="text-sm font-mono font-medium text-text-heading">{task.execution_count}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <dt className="text-sm text-text-muted">Last Updated</dt>
              <dd className="text-sm text-text-heading">{formatDateTime(task.updated_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading text-xl font-semibold text-text-heading mb-4">Executions</h2>
        {executions.length ? (
          <ExecutionList executions={executions} />
        ) : (
          <p className="text-text-muted">No executions for this task yet.</p>
        )}
      </div>
    </div>
  );
}