// src/pages/TaskEditPage.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function TaskEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
    retry: false,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title ?? '');
      setDescription((task as any).description ?? '');
      if ((task as any).deadline) {
        const d = new Date((task as any).deadline);
        if (!isNaN(d.getTime())) setDeadline(d.toISOString().slice(0, 16));
      }
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: () =>
      tasksApi.update(id!, {
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      navigate(`/tasks/${id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" className="w-56" />
        <Card><CardContent className="pt-6"><Skeleton variant="card" className="h-64" /></CardContent></Card>
      </div>
    );
  }

  if (error || !task) {
    return (
      <ErrorState
        title="Failed to load task"
        description={(error as Error)?.message || 'Task not found'}
        onRetry={() => navigate('/tasks')}
      />
    );
  }

  return (
    <div className="page-container mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${id}`)} className="gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to task
      </Button>

      <PageHeader title="Edit Task" description={`Editing "${task.title}"`} />

      <Card>
        <CardContent className="pt-6 space-y-5">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task..."
            rows={4}
          />
          <Input
            label="Deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => navigate(`/tasks/${id}`)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate()}
              loading={updateMutation.isPending}
              disabled={!title.trim()}
              icon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}