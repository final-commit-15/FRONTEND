// src/components/tasks/TaskForm.tsx

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, Sparkles, Upload } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { tasksApi, TaskCreatePayload } from '@/api/tasks';
import { teamMembersApi } from '@/api/team_members';
import { useToast } from '@/hooks/useToast';
import { Task } from '@/types/models';

const taskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().max(2000).optional(),
  assignee_id: z.string().optional(),
  assignee_name: z.string().optional(),
  assignee_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  deadline: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialData?: Task;
  mode: 'create' | 'edit';
  taskId?: string;
}

function suggestDeadline(title: string, description?: string): string {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  const days = text.includes('urgent') || text.includes('critical') || text.includes('asap')
    ? 3
    : text.includes('research') || text.includes('design') || text.includes('documentation')
      ? 14
      : 7;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function TaskForm({ initialData, mode, taskId }: TaskFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [attachmentName, setAttachmentName] = useState<string>('');

  const { data: membersData } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamMembersApi.list(),
  });

  const members: any[] = Array.isArray(membersData) ? membersData : [];

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description || '',
          assigned_agent_id: (initialData as any).assigned_agent_id || '',
          assignee_name: (initialData as any).assignee_name || '',
          assignee_email: (initialData as any).assignee_email || '',
          deadline: (initialData as any).deadline ? String((initialData as any).deadline).split('T')[0] : '',
        } as any
      : {
          title: '',
          description: '',
          assigned_agent_id: '',
          assignee_name: '',
          assignee_email: '',
          deadline: '',
        } as any,
  });

  const title = watch('title' as any) as unknown as string;
  const description = watch('description' as any) as unknown as string;

  const mutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      const payload: any = {
        title: data.title,
        description: attachmentName
          ? `${data.description ?? ''}\n\n[Attachment: ${attachmentName}]`.trim()
          : data.description,
        assignee_name: (data as any).assignee_name || undefined,
        assignee_email: (data as any).assignee_email || undefined,
        deadline: (data as any).deadline ? new Date(String((data as any).deadline)).toISOString() : undefined,
      };
      const memberId = (data as any).assigned_agent_id;
      if (memberId) {
        const m = members.find((x: any) => String(x.id) === String(memberId));
        payload.assignee_name = payload.assignee_name || m?.full_name;
        payload.assignee_email = payload.assignee_email || m?.email;
      }
      if (mode === 'create') return tasksApi.create(payload as TaskCreatePayload);
      return tasksApi.update(taskId!, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast({
        type: 'success',
        title: mode === 'create' ? 'Task created' : 'Task updated',
        description: `${data.title} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
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
          label="Task Title"
          {...register('title')}
          placeholder="e.g., Build attendance QR scanner"
          error={errors.title?.message}
        />
        <Textarea
          label="Description"
          {...register('description')}
          rows={4}
          placeholder="Describe the task..."
          error={errors.description?.message}
        />
        <div>
          <label className="label">Task details file (Word/PDF, optional)</label>
          <label className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-canvas-border px-4 py-3 text-sm text-text-muted cursor-pointer hover:border-brand-primary/50">
            <Upload size={16} />
            <span>{attachmentName || 'Upload .pdf, .doc, .docx with task details'}</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? '')}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Team member name"
            {...register('assignee_name' as any)}
            placeholder="e.g., Priya Sharma"
            error={(errors as any).assignee_name?.message}
          />
          <Input
            label="Team member email"
            {...register('assignee_email' as any)}
            placeholder="member@company.com"
            error={(errors as any).assignee_email?.message}
          />
        </div>
        <Controller
          name={'assigned_agent_id' as any}
          control={control}
          render={({ field }) => (
            <Select
              label="Assign to team member (optional)"
              value={String(field.value ?? '')}
              onChange={(e: any) => {
                const v = e?.target ? e.target.value : e;
                field.onChange(v);
                const m = members.find((x: any) => String(x.id) === String(v));
                if (m) {
                  setValue('assignee_name' as any, m.full_name);
                  setValue('assignee_email' as any, m.email);
                }
              }}
            >
              <option value="">No member</option>
              {members.map((m: any) => (
                <option key={String(m.id)} value={String(m.id)}>
                  {String(m.full_name)} · {String(m.email)}
                </option>
              ))}
            </Select>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Input
            label="Estimated deadline"
            type="date"
            {...register('deadline' as any)}
            error={(errors as any).deadline?.message}
          />
          <Button
            type="button"
            variant="outline"
            icon={<Sparkles size={16} />}
            onClick={() => setValue('deadline' as any, suggestDeadline(title ?? '', description ?? ''))}
          >
            Suggest with AI
          </Button>
        </div>
        <p className="text-xs text-text-muted">If you leave the deadline empty, the AI suggests one automatically when the task is created from intake. For manual tasks you can keep the AI suggestion or pick your own date.</p>
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
