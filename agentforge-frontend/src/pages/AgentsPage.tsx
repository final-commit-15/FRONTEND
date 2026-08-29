// src/pages/AgentsPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { agentsApi } from '@/api/agents';
import { AgentCard } from '@/components/agents/AgentCard';
import { AgentFilters } from '@/components/agents/AgentFilters';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { AgentStatus, Agent } from '@/types/models';

export function AgentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('-created_at');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agents', { search, statusFilter, typeFilter, sortBy }],
    queryFn: () =>
      agentsApi.list({
        search,
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        sort: sortBy,
      }),
  });

  const toggleAgent = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      agentsApi.update(id, { status: enabled ? 'active' : 'inactive' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });

  const deleteAgent = useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });

  const agents: Agent[] = data?.items ?? [];

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as AgentStatus | 'all');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Agents</h1>
          <p className="text-text-body mt-1">Manage your AI agents and their configurations.</p>
        </div>
        <Button onClick={() => navigate('/agents/new')} icon={<Plus size={18} />}>
          New Agent
        </Button>
      </div>

      {/* Filters */}
      <AgentFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load agents"
          description={error instanceof Error ? error.message : 'Unknown error'}
          onRetry={refetch}
        />
      ) : agents.length === 0 ? (
        <EmptyState
          title="No agents yet"
          description="Create your first agent to start executing AI workflows."
          action={<Button onClick={() => navigate('/agents/new')} icon={<Plus size={18} />}>Create Agent</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggle={(enabled) => toggleAgent.mutate({ id: agent.id, enabled })}
              onDelete={() => deleteAgent.mutate(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}