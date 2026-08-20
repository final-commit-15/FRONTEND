// src/pages/AgentDetailPage.tsx

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '@/api/agents';
import type { Agent } from '@/types/models';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AgentDetailHeader } from '@/components/agents/AgentDetailHeader';
import { AgentOverview } from '@/components/agents/AgentOverview';
import { AgentCapabilities } from '@/components/agents/AgentCapabilities';
import { AgentTools } from '@/components/agents/AgentTools';
import { AgentPermissions } from '@/components/agents/AgentPermissions';
import { AgentConfiguration } from '@/components/agents/AgentConfiguration';
import { AgentExecutionHistory } from '@/components/agents/AgentExecutionHistory';
import { AgentPerformanceChart } from '@/components/agents/AgentPerformanceChart';
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: agent,
    isLoading,
    error,
    refetch,
  } = useQuery<Agent>({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <DetailSkeleton />;
  if (error) return <ErrorState title="Failed to load agent" description={(error as Error).message} onRetry={refetch} />;
  if (!agent) return <ErrorState title="Agent not found" description="The requested agent could not be found." />;

  return (
    <div className="space-y-6">
      <AgentDetailHeader agent={agent} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AgentOverview agent={agent} />
        </TabsContent>
        <TabsContent value="capabilities">
          <AgentCapabilities agent={agent} />
        </TabsContent>
        <TabsContent value="tools">
          <AgentTools agent={agent} />
        </TabsContent>
        <TabsContent value="permissions">
          <AgentPermissions agent={agent} />
        </TabsContent>
        <TabsContent value="configuration">
          <AgentConfiguration agent={agent} />
        </TabsContent>
        <TabsContent value="history">
          <AgentExecutionHistory agentId={agent.id} />
        </TabsContent>
        <TabsContent value="performance">
          <AgentPerformanceChart agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}