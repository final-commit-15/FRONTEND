// src/pages/AgentDetailPage.tsx

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '@/api/agents';
import type { Agent } from '@/types/models';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AgentDetailHeader } from '@/components/agents/AgentDetailHeader';
import { AgentOverview } from '@/components/agents/AgentOverview';
import { AgentCapabilities } from '@/components/agents/AgentCapabilities';
import { AgentTools } from '@/components/agents/AgentTools';
import { AgentPermissions } from '@/components/agents/AgentPermissions';
import { AgentConfiguration } from '@/components/agents/AgentConfiguration';
import { AgentExecutionHistory } from '@/components/agents/AgentExecutionHistory';
import { AgentPerformanceChart } from '@/components/agents/AgentPerformanceChart';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent } from '@/components/ui/Card';

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

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <Skeleton variant="card" className="h-32" />
        <Card>
          <CardContent className="pt-0">
            <Skeleton variant="card" className="h-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load agent" description={(error as Error).message} onRetry={refetch} />;
  }

  if (!agent) {
    return <ErrorState title="Agent not found" description="The requested agent could not be found." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AgentDetailHeader agent={agent} />

      <Card className="overflow-hidden">
        <Tabs defaultValue="overview">
          <TabsList className="m-4 mb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-fade-in">
            <CardContent className="pt-4"><AgentOverview agent={agent} /></CardContent>
          </TabsContent>
          <TabsContent value="capabilities" className="animate-fade-in">
            <CardContent className="pt-4"><AgentCapabilities agent={agent} /></CardContent>
          </TabsContent>
          <TabsContent value="tools" className="animate-fade-in">
            <CardContent className="pt-4"><AgentTools agent={agent} /></CardContent>
          </TabsContent>
          <TabsContent value="permissions" className="animate-fade-in">
            <CardContent className="pt-4"><AgentPermissions agent={agent} /></CardContent>
          </TabsContent>
          <TabsContent value="configuration" className="animate-fade-in">
            <CardContent className="pt-4"><AgentConfiguration agent={agent} /></CardContent>
          </TabsContent>
          <TabsContent value="history" className="animate-fade-in">
            <CardContent className="pt-4"><AgentExecutionHistory agentId={agent.id} /></CardContent>
          </TabsContent>
          <TabsContent value="performance" className="animate-fade-in">
            <CardContent className="pt-4"><AgentPerformanceChart agentId={agent.id} /></CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}