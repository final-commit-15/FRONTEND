// src/pages/ExecutionCreatePage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Play, Bot, ListChecks } from 'lucide-react';
import { agentsApi } from '@/api/agents';
import { executionsApi } from '@/api/executions';
import { tasksApi } from '@/api/tasks';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select, SelectItem } from '@/components/ui/Select';
import type { Agent } from '@/types/models';
import type { Task } from '@/types/models';

export function ExecutionCreatePage() {
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState('');
  const [taskId, setTaskId] = useState('');

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents', 'create-exec'], 
    queryFn: () => agentsApi.list({ limit: 100 }),
    retry: false,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'create-exec'],
    queryFn: () => tasksApi.list({ limit: 100 }),
    retry: false,
  });

  useEffect(() => {
    if (!agentId && agentsData?.items?.length) setAgentId(agentsData.items[0].id);
  }, [agentsData, agentId]);

  useEffect(() => {
    if (!taskId && tasksData?.items?.length) setTaskId(tasksData.items[0].id);
  }, [tasksData, taskId]);

  const createMutation = useMutation({
    mutationFn: () => executionsApi.create(agentId, taskId),
    onSuccess: (execution) => navigate(`/executions/${execution.id}`),
  });

  const agents: Agent[] = agentsData?.items ?? [];
  const tasks: Task[] = tasksData?.items ?? [];

  return (
    <div className="page-container mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/executions')} className="gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to executions
      </Button>

      <PageHeader
        title="New Execution"
        description="Run an AI agent against a task."
      />

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-text-heading mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-brand-primary" /> Select Agent
            </p>
            {agentsLoading ? (
              <Skeleton variant="card" className="h-12" />
            ) : agents.length === 0 ? (
              <p className="text-sm text-text-muted">No agents found. Create one first.</p>
            ) : (
              <Select value={agentId} onChange={setAgentId} hint="Choose which agent should run">
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} {a.status !== 'active' ? '(inactive)' : ''}
                  </SelectItem>
                ))}
              </Select>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-text-heading mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-brand-primary" /> Select Task
            </p>
            {tasksLoading ? (
              <Skeleton variant="card" className="h-12" />
            ) : tasks.length === 0 ? (
              <p className="text-sm text-text-muted">No tasks found. Create a task first.</p>
            ) : (
              <Select value={taskId} onChange={setTaskId} hint="Choose the task to execute">
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </Select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => navigate('/executions')}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!agentId || !taskId}
              icon={<Play className="h-4 w-4" />}
            >
              Start Execution
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}