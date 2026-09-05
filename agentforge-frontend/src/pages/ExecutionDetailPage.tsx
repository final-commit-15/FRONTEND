// src/pages/ExecutionDetailPage.tsx

import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { executionsApi } from '@/api/executions';
import type { Execution } from '@/types/models';
import { ExecutionDetailHeader } from '@/components/executions/ExecutionDetailHeader';
import { ExecutionTimeline } from '@/components/executions/ExecutionTimeline';
import { ExecutionLogs } from '@/components/executions/ExecutionLogs';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDateTime, formatDuration } from '@/lib/format';

export function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: execution,
    isLoading,
    error,
    refetch,
  } = useQuery<Execution>({
    queryKey: ['execution', id],
    queryFn: () => executionsApi.get(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' || status === 'queued' ? 3000 : false;
    },
  });

  const { lastMessage } = useWebSocket(`/ws/executions/${id}`);

  useEffect(() => {
    if (lastMessage) {
      queryClient.invalidateQueries({ queryKey: ['execution', id] });
    }
  }, [lastMessage, id, queryClient]);

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
        title="Failed to load execution"
        description={(error as Error).message || 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  if (!execution) {
    return (
      <ErrorState
        title="Execution not found"
        description="The execution could not be found."
        onRetry={() => window.history.back()}
      />
    );
  }

  const getStatusVariant = (status: Execution['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
        return 'error';
      case 'queued':
        return 'info';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <ExecutionDetailHeader
        execution={execution}
        onRefresh={refetch}
        onRetry={
          execution.status === 'failed' || execution.status === 'cancelled'
            ? () => executionsApi.retry(id!)
            : undefined
        }
        onCancel={
          execution.status === 'queued' || execution.status === 'running'
            ? () => executionsApi.cancel(id!)
            : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ExecutionTimeline execution={execution} />
          <ExecutionLogs logs={execution.logs ?? []} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-heading text-lg font-semibold text-text-heading">Details</h3>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <dt className="text-sm text-text-muted">Execution ID</dt>
                  <dd className="text-sm font-mono text-text-heading">{execution.id}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <dt className="text-sm text-text-muted">Agent</dt>
                  <dd className="text-sm text-text-heading">
                    <Link to={`/agents/${execution.agent_id}`} className="hover:text-brand-primary font-medium">
                      {execution.agent_name}
                    </Link>
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <dt className="text-sm text-text-muted">Task</dt>
                  <dd className="text-sm text-text-heading">
                    <Link to={`/tasks/${execution.task_id}`} className="hover:text-brand-primary font-medium">
                      {execution.task_name}
                    </Link>
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <dt className="text-sm text-text-muted">Status</dt>
                  <dd>
                    <Badge variant={getStatusVariant(execution.status)}>
                      {execution.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <dt className="text-sm text-text-muted">Started</dt>
                  <dd className="text-sm text-text-heading">{formatDateTime(execution.started_at)}</dd>
                </div>
                {execution.completed_at && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <dt className="text-sm text-text-muted">Completed</dt>
                    <dd className="text-sm text-text-heading">{formatDateTime(execution.completed_at)}</dd>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <dt className="text-sm text-text-muted">Duration</dt>
                  <dd className="text-sm font-mono text-text-heading">{formatDuration(execution.duration)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {execution.error && (
            <Card className="border-error-200">
              <CardHeader>
                <h3 className="font-heading text-lg font-semibold text-error-600">Error</h3>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-error-700 whitespace-pre-wrap bg-error-50 p-4 rounded-xl">{execution.error.message}</pre>
                {execution.error.stack && (
                  <details className="mt-4">
                    <summary className="text-sm text-text-muted cursor-pointer">Stack trace</summary>
                    <pre className="mt-2 text-xs text-text-muted whitespace-pre-wrap bg-canvas-surface p-4 rounded-xl">{execution.error.stack}</pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}