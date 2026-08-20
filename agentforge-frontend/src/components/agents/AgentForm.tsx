import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi, AgentCreatePayload } from '@/api/agents';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { Loader2, Save } from 'lucide-react';
import { Agent } from '@/types/models';

const agentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(500).optional(),
  type: z.string().min(1, 'Type is required'),
  status: z.enum(['active', 'inactive']),
  capabilities: z.array(z.string()),
  tools: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormProps {
  initialData?: Agent;
  mode: 'create' | 'edit';
  agentId?: string;
}

export function AgentForm({ initialData, mode, agentId }: AgentFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
          type: initialData.type,
          status: initialData.status,
          capabilities: initialData.capabilities || [],
          tools: initialData.tools || [],
          permissions: initialData.permissions || [],
          configuration: initialData.configuration || {},
        }
      : {
          name: '',
          description: '',
          type: 'coding',
          status: 'active',
          capabilities: [],
          tools: [],
          permissions: [],
          configuration: {},
        },
  });

  const capabilities = watch('capabilities') ?? [];

  const addCapability = () => {
    setValue('capabilities', [...capabilities, ''], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updateCapability = (index: number, value: string) => {
    const updated = [...capabilities];
    updated[index] = value;
    setValue('capabilities', updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeCapability = (index: number) => {
    setValue(
      'capabilities',
      capabilities.filter((_, i) => i !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const mutation = useMutation({
    mutationFn: (data: AgentFormData) => {
      const payload: AgentCreatePayload = data;
      if (mode === 'create') return agentsApi.create(payload);
      return agentsApi.update(agentId!, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      addToast({
        type: 'success',
        title: mode === 'create' ? 'Agent created' : 'Agent updated',
        description: `${data.name} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });
      navigate(`/agents/${data.id}`);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Operation failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    },
  });

  const onSubmit = (data: AgentFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Identity</h2>
        <div className="space-y-4">
          <div>
            <Input label="Agent Name" {...register('name')} placeholder="e.g., Code Helper" error={errors.name?.message} />
          </div>
          <div>
            <Textarea label="Description" {...register('description')} rows={3} placeholder="What does this agent do?" error={errors.description?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Type" {...register('type')} error={errors.type?.message}>
                <option value="coding">Coding</option>
                <option value="automation">Automation</option>
                <option value="data">Data</option>
                <option value="research">Research</option>
              </Select>
            </div>
            <div>
              <Select label="Status" {...register('status')} error={errors.status?.message}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Capabilities</h2>
        <div className="space-y-3">
          {capabilities.map((capability, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={capability}
                onChange={(e) => updateCapability(index, e.target.value)}
                placeholder="e.g., code generation"
                error={errors.capabilities?.[index]?.message}
              />
              <Button type="button" variant="ghost" onClick={() => removeCapability(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addCapability}>
            Add Capability
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tools</h2>
          <p className="text-sm text-base-500">Tools can be managed in the Tools section.</p>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Permissions</h2>
          <p className="text-sm text-base-500">Permissions can be managed in the Permissions section.</p>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Advanced Configuration</h2>
        <p className="text-sm text-base-500">Advanced configuration options coming soon.</p>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {mode === 'create' ? 'Create Agent' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}