// src/pages/TasksPage.tsx

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { teamMembersApi } from '@/api/team_members';
import { useToast } from '@/hooks/useToast';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Plus, ArrowLeftRight, Shuffle } from 'lucide-react';

export function TasksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('-created_at');
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState('');
  const [reassignMemberId, setReassignMemberId] = useState('');

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

  const membersQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamMembersApi.list(),
    retry: false,
  });
  const members: any[] = useMemo(() => {
    const d: unknown = membersQuery.data;
    return Array.isArray(d) ? d : [];
  }, [membersQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) => {
      const m = members.find((x: any) => String(x.id) === String(memberId));
      return tasksApi.update(id, {
        assignee_name: m?.full_name,
        assignee_email: m?.email,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowReassign(false);
      setReassignTaskId('');
      setReassignMemberId('');
      addToast({ type: 'success', title: 'Task reassigned', description: 'Task moved to the selected team member.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Reassign failed', description: e.message }),
  });

  const redistributeMutation = useMutation({
    mutationFn: async () => {
      const list = tasks.filter((t: any) => !((t as any).assignee_email || (t as any).assignee_name));
      if (members.length === 0 || list.length === 0) return;
      for (let i = 0; i < list.length; i++) {
        const m = members[i % members.length];
        await tasksApi.update((list[i] as any).id, {
          assignee_name: m.full_name,
          assignee_email: m.email,
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast({ type: 'success', title: 'Tasks redistributed', description: 'Unassigned tasks were shared across the team.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Redistribute failed', description: e.message }),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tasks"
        description="AI-assigned tasks appear here automatically. Reassign, redistribute, or create manual tasks."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowReassign(true)} icon={<ArrowLeftRight size={16} />}>
              Reassign
            </Button>
            <Button variant="outline" onClick={() => redistributeMutation.mutate()} icon={<Shuffle size={16} />}>
              Redistribute
            </Button>
            <Button onClick={() => navigate('/tasks/new')} icon={<Plus size={18} />}>
              New Task
            </Button>
          </div>
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
          description="Tasks assigned by AI intake will appear here. You can also create one manually."
          action={<Button onClick={() => navigate('/tasks/new')} icon={<Plus size={18} />}>Create Task</Button>}
        />
      ) : (
        <TaskList
          tasks={tasks as Task[]}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}

      <Dialog open={showReassign} onOpenChange={setShowReassign}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign task</DialogTitle>
            <DialogDescription>Move a task from one team member to another.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="label">Task</label>
              <Select value={reassignTaskId} onValueChange={setReassignTaskId}>
                <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                <SelectContent>
                  {tasks.map((t: any) => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>{String(t.title)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="label">Move to team member</label>
              <Select value={reassignMemberId} onValueChange={setReassignMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => (
                    <SelectItem key={String(m.id)} value={String(m.id)}>
                      {String(m.full_name)} · {String(m.email)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowReassign(false)}>Cancel</Button>
            <Button
              disabled={!reassignTaskId || !reassignMemberId || reassignMutation.isPending}
              onClick={() => reassignMutation.mutate({ id: reassignTaskId, memberId: reassignMemberId })}
            >
              Move task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
