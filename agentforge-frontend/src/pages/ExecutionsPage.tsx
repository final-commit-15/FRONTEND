// src/pages/ExecutionsPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executionsApi } from '@/api/executions';
import type { Execution } from '@/types/models';
import type { ExecutionListResponse } from '@/types/api';
import { ExecutionFilters } from '@/components/executions/ExecutionFilters';
import { ExecutionList } from '@/components/executions/ExecutionList';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card } from '@/components/ui/Card';

export function ExecutionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as string,
    sortBy: '-started_at',
  });

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<ExecutionListResponse>({
    queryKey: ['executions', filters],
    queryFn: () =>
      executionsApi.list({
        search: filters.search || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
        sort: filters.sortBy,
      }),
    refetchInterval: 15000,
  });

  const { lastMessage, connected } = useWebSocket('/ws/executions');

  useEffect(() => {
    if (lastMessage) {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    }
  }, [lastMessage, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => executionsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['executions'] }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => executionsApi.retry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['executions'] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Executions"
        description="Monitor and manage agent execution runs."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {connected && (
            <div className="flex items-center gap-2 text-sm text-success-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
              </span>
              Live updates active
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            icon={<RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button onClick={() => navigate('/executions/new')} icon={<Plus size={18} />}>
            New Execution
          </Button>
        </div>
      </div>

      <ExecutionFilters
        search={filters.search}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        statusFilter={filters.status}
        onStatusFilterChange={(value) => setFilters({ ...filters, status: value })}
        sortBy={filters.sortBy}
        onSortChange={(value) => setFilters({ ...filters, sortBy: value })}
      />

      {isLoading ? (
        <Card className="p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} variant="text" className="h-8 flex-1" />
              ))}
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState
          title="Failed to load executions"
          description={(error as Error).message || 'Unknown error'}
          onRetry={refetch}
        />
      ) : !data?.items?.length ? (
        <EmptyState
          title="No executions yet"
          description="Run an agent against a task to see execution results here."
          action={<Button onClick={() => navigate('/executions/new')} icon={<Plus size={18} />}>Create Execution</Button>}
        />
      ) : (
        <ExecutionList
          executions={data.items}
          onRetry={(id) => retryMutation.mutate(id)}
          onCancel={(id) => cancelMutation.mutate(id)}
        />
      )}
    </div>
  );
}