// src/pages/ExecutionDetailPage.tsx

import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { executionsApi } from '@/api/executions';
import type { Execution } from '@/types/models';
import { ExecutionDetailHeader } from '@/components/executions/ExecutionDetailHeader';
import { ExecutionTimeline } from '@/components/executions/ExecutionTimeline';
import { ExecutionLogs } from '@/components/executions/ExecutionLogs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDateTime, formatDuration } from '@/lib/format';

// ─── Loading skeleton ────────────────────────────────────────
function DetailSkeleton() {
  return (
    <Card className="p-6 space-y-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </Card>
  );
}

export function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // ── Query: fetch execution ──────────────────────────────────
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

  // ── WebSocket live updates ─────────────────────────────────
  const { lastMessage } = useWebSocket(`/ws/executions/${id}`);

  useEffect(() => {
    if (lastMessage) {
      queryClient.invalidateQueries({ queryKey: ['execution', id] });
    }
  }, [lastMessage, id, queryClient]);

  // ── Loading / Error states ──────────────────────────────────
  if (isLoading) return <DetailSkeleton />;

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

  // ── Helper for status badge variant ────────────────────────
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

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
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
        {/* Left column: timeline and logs */}
        <div className="lg:col-span-2 space-y-6">
          <ExecutionTimeline execution={execution} />
          <ExecutionLogs logs={execution.logs ?? []} />
        </div>

        {/* Right column: details and error */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-base-500">Execution ID</dt>
                <dd className="text-sm font-mono text-base-300">{execution.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-base-500">Agent</dt>
                <dd className="text-sm text-white">
                  <Link to={`/agents/${execution.agent_id}`} className="hover:underline text-electric-400">
                    {execution.agent_name}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-base-500">Task</dt>
                <dd className="text-sm text-white">
                  <Link to={`/tasks/${execution.task_id}`} className="hover:underline text-electric-400">
                    {execution.task_name}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-base-500">Status</dt>
                <dd>
                  <Badge variant={getStatusVariant(execution.status)}>
                    {execution.status}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-base-500">Started</dt>
                <dd className="text-sm text-base-300">{formatDateTime(execution.started_at)}</dd>
              </div>
              {execution.completed_at && (
                <div className="flex justify-between">
                  <dt className="text-sm text-base-500">Completed</dt>
                  <dd className="text-sm text-base-300">{formatDateTime(execution.completed_at)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-base-500">Duration</dt>
                <dd className="text-sm text-base-300">{formatDuration(execution.duration)}</dd>
              </div>
            </dl>
          </Card>

          {/* Error card (if any) */}
          {execution.error && (
            <Card className="border-error-700/30 p-6">
              <h3 className="text-lg font-semibold text-error-500 mb-2">Error</h3>
              <pre className="text-sm text-error-400 whitespace-pre-wrap">{execution.error.message}</pre>
              {execution.error.stack && (
                <details className="mt-2">
                  <summary className="text-sm text-base-500 cursor-pointer">Stack trace</summary>
                  <pre className="mt-2 text-xs text-base-400 whitespace-pre-wrap">{execution.error.stack}</pre>
                </details>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}