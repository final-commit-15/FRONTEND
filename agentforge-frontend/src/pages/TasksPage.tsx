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

export function TasksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('-created_at');

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton variant="title" className="w-48" />
          <Skeleton variant="rectangular" className="h-10 w-32" />
        </div>
        <Skeleton variant="rectangular" className="h-12 w-full" />
        <Card className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} variant="text" className="h-8 flex-1" />
              ))}
            </div>
          ))}
        </Card>
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

  const tasks = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tasks"
        description="Manage tasks for your agents."
        action={
          <Button onClick={() => navigate('/tasks/new')} icon={<Plus size={18} />}>
            New Task
          </Button>
        }
      />

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
          action={<Button onClick={() => navigate('/tasks/new')} icon={<Plus size={18} />}>Create Task</Button>}
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