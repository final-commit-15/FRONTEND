// src/pages/TaskDetailPage.tsx

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { executionsApi } from '@/api/executions';
import type { Task } from '@/types/models';
import type { ExecutionListResponse } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExecutionList } from '@/components/executions/ExecutionList';
import { formatDateTime } from '@/lib/format';

// ─── Status badge helper (valid Badge variants) ─────────────
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

// ─── Loading skeleton ────────────────────────────────────────
function DetailSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </Card>
  );
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ── Task query ─────────────────────────────────────────────
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

  // ── Executions query ──────────────────────────────────────
  const { data: executionsData } = useQuery<ExecutionListResponse>({
    queryKey: ['executions', { task_id: id }],
    queryFn: () => executionsApi.list({ task_id: id }),
    enabled: !!id,
  });

  // ── Combined loading / error ─────────────────────────────
  if (isLoading) return <DetailSkeleton />;

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

  // ── Safe data ─────────────────────────────────────────────
  const executions = executionsData?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.name}
        description="Task details and execution history"
        // ✅ backHref removed – not supported
      />

      <div className="flex items-center gap-2 mt-2">
        <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
        <span className="text-sm text-base-500">Created {formatDateTime(task.created_at)}</span>
      </div>

      {task.description && <p className="mt-4 text-base-300">{task.description}</p>}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Assigned Agent</dt>
            <dd className="text-sm text-white">
              {task.assigned_agent_name ? (
                <Link to={`/agents/${task.assigned_agent_id}`} className="hover:text-electric-400">
                  {task.assigned_agent_name}
                </Link>
              ) : (
                'Unassigned'
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Execution Count</dt>
            <dd className="text-sm text-white">{task.execution_count}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Last Updated</dt>
            <dd className="text-sm text-white">{formatDateTime(task.updated_at)}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Executions</h2>
        {executions.length ? (
          <ExecutionList executions={executions} />
        ) : (
          <p className="text-base-500">No executions for this task yet.</p>
        )}
      </div>
    </div>
  );
}