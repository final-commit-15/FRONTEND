// src/pages/TasksPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import type { Task, TaskStatus } from '@/types/models';
import type { TaskListResponse } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Plus } from 'lucide-react';

// ─── Table skeleton ──────────────────────────────────────────
function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Card className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </Card>
  );
}

export function TasksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Filter state ────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('-created_at');

  // ── Query: list tasks ──────────────────────────────────────
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<TaskListResponse>({
    queryKey: ['tasks', { search, statusFilter, sortBy }],
    queryFn: () =>
      tasksApi.list({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort: sortBy,
      }),
  });

  // ── Delete mutation ────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // ── Combined loading / error ──────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load tasks"
        description={(error as Error).message || 'Unable to retrieve tasks.'}
        onRetry={refetch}
      />
    );
  }

  // ── Safe data ──────────────────────────────────────────────
  const tasks = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage tasks for your agents."
        // ✅ removed `action` prop – not supported
      />

      {/* Toolbar with New Task button */}
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => navigate('/tasks/new')} icon={<Plus size={18} />}>
          New Task
        </Button>
      </div>

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create a task to assign to your agents."
          actionLabel="Create Task"
          onAction={() => navigate('/tasks/new')}
        />
      ) : (
        <TaskList
          tasks={tasks}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}