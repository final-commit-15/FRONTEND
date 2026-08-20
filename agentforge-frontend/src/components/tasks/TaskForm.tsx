// src/components/tasks/TaskForm.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { tasksApi, TaskCreatePayload } from '@/api/tasks';
import { agentsApi } from '@/api/agents';
import { useToast } from '@/hooks/useToast';
import { Task, Agent } from '@/types/models';

const taskSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(1000).optional(),
  assigned_agent_id: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialData?: Task;
  mode: 'create' | 'edit';
  taskId?: string;
}

export function TaskForm({ initialData, mode, taskId }: TaskFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Query agents – response is PaginatedResponse<Agent>
  const { data: agentsData } = useQuery({
    queryKey: ['agents', { limit: 100 }],
    queryFn: () => agentsApi.list({ limit: 100 }),
  });

  // Safely extract agents array
  const agents: Agent[] = agentsData?.items ?? [];

  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
          assigned_agent_id: initialData.assigned_agent_id || '',
        }
      : {
          name: '',
          description: '',
          assigned_agent_id: '',
        },
  });

  const mutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      const payload: TaskCreatePayload = data;
      if (mode === 'create') return tasksApi.create(payload);
      return tasksApi.update(taskId!, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast({
        type: 'success',
        title: mode === 'create' ? 'Task created' : 'Task updated',
        description: `${data.name} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });
      navigate(`/tasks/${data.id}`);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Operation failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Task Details</h2>
        <Input
          label="Task Name"
          {...register('name')}
          placeholder="e.g., Generate weekly report"
          error={errors.name?.message}
        />
        <Textarea
          label="Description"
          {...register('description')}
          rows={4}
          placeholder="Describe the task..."
          error={errors.description?.message}
        />
        <Select
          label="Assigned Agent (optional)"
          {...register('assigned_agent_id')}
          error={errors.assigned_agent_id?.message}
        >
          <option value="">No agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {mode === 'create' ? 'Create Task' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}