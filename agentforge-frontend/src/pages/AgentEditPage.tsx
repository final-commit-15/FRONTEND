// src/pages/AgentEditPage.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '@/api/agents';
import { AgentForm } from '@/components/agents/AgentForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function AgentEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: agent, isLoading, error, refetch } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <Skeleton variant="card" className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load agent"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  if (!agent) {
    return (
      <ErrorState
        title="Agent not found"
        description="The agent you are trying to edit does not exist or has been removed."
        onRetry={() => window.history.back()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Agent" description={`Editing ${agent.name}`} />
      <AgentForm initialData={agent} mode="edit" agentId={agent.id} />
    </div>
  );
}