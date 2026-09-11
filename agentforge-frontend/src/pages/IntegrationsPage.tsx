import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  GitBranch,
  Database,
  MessagesSquare,
  Brain,
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatRelativeTime } from '@/lib/format';

interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  account?: string | null;
  last_synced?: string | null;
  enabled: boolean;
}

const integrationsApi = {
  list: () =>
    apiClient.get('/integrations').then((res) => {
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.results)) return data.results;
      }
      return [];
    }),

  connect: (id: string) =>
    apiClient.post(`/integrations/${id}/connect`).then((res) => res.data),

  disconnect: (id: string) =>
    apiClient.delete(`/integrations/${id}/disconnect`).then((res) => res.data),

  update: (id: string, payload: { enabled: boolean }) =>
    apiClient.patch(`/integrations/${id}`, payload).then((res) => res.data),

  sync: () => apiClient.post('/integrations/sync').then((res) => res.data),
};

function Toggle({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-brand-primary' : 'bg-canvas-border'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function getStatusBadge(status: IntegrationProvider['status']) {
  switch (status) {
    case 'connected':
      return <Badge variant="success">Connected</Badge>;
    case 'disconnected':
      return <Badge variant="neutral">Disconnected</Badge>;
    case 'error':
      return <Badge variant="error">Error</Badge>;
    default:
      return <Badge variant="neutral">Unknown</Badge>;
  }
}

const iconMap: Record<string, React.ElementType> = {
  github: GitBranch,
  supabase: Database,
  slack: MessagesSquare,
  openai: Brain,
  email: Mail,
};

const providerDescriptions: Record<string, string> = {
  github: 'Connect GitHub to manage repositories, pull requests, and code reviews',
  supabase: 'Connect Supabase for database, auth, and realtime subscriptions',
  slack: 'Connect Slack for team notifications and collaboration',
  openai: 'Connect OpenAI for AI-powered features and agents',
  email: 'Configure email provider for notifications and alerts',
};

const allowedProviders = ['github', 'supabase', 'slack', 'openai', 'email'];

interface ProviderCardProps {
  provider: IntegrationProvider;
  onToggle: (id: string, enabled: boolean) => void;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  isPending?: boolean;
}

function ProviderCard({ provider, onToggle, onConnect, onDisconnect, isPending }: ProviderCardProps) {
  const Icon = iconMap[provider.id] || Zap;
  const description = providerDescriptions[provider.id] || '';

  return (
    <Card className="card-hover p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10">
            <Icon size={20} className="text-brand-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-text-heading">{provider.name}</h4>
            <p className="text-xs text-text-muted">{description}</p>
          </div>
        </div>
        {getStatusBadge(provider.status)}
      </div>

      {provider.account && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Account:</span>
          <span className="text-text-heading font-mono text-xs">{provider.account}</span>
        </div>
      )}

      {provider.last_synced && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock size={14} />
          <span>Last synced: {formatRelativeTime(provider.last_synced)}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-canvas-border">
        <Toggle
          checked={provider.enabled}
          onCheckedChange={(checked) => onToggle(provider.id, checked)}
        />
        <span className="text-xs text-text-muted">
          {provider.enabled ? 'Enabled' : 'Disabled'}
        </span>
        <div className="ml-auto flex gap-2">
          {provider.status === 'connected' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDisconnect(provider.id)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" size={14} /> : 'Disconnect'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConnect(provider.id)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" size={14} /> : 'Connect'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const {
    data: providers = [],
    isLoading: providersLoading,
    error: providersError,
    refetch: refetchProviders,
  } = useQuery<IntegrationProvider[]>({
    queryKey: ['integrations'],
    queryFn: integrationsApi.list,
  });

  const connectMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.connect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      addToast({ type: 'success', title: 'Integration connected' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Connection failed' });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      addToast({ type: 'success', title: 'Integration disconnected' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Disconnection failed' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      integrationsApi.update(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Update failed' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => integrationsApi.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      addToast({ type: 'success', title: 'Sync triggered' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Sync failed' });
    },
  });

  const handleToggle = (id: string, enabled: boolean) => {
    toggleMutation.mutate({ id, enabled });
  };

  const handleConnect = (id: string) => {
    connectMutation.mutate(id);
  };

  const handleDisconnect = (id: string) => {
    disconnectMutation.mutate(id);
  };

  const handleSyncAll = () => {
    syncMutation.mutate();
  };

  if (providersLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Integrations" description="Loading integrations..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (providersError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Integrations" description="Failed to load integrations" />
        <ErrorState
          title="Failed to load integrations"
          description="Please try again."
          onRetry={refetchProviders}
        />
      </div>
    );
  }

  // Filter to only allowed providers
  const filteredProviders = providers.filter(p => allowedProviders.includes(p.id));

  const connectedProviders = filteredProviders.filter((p) => p.status === 'connected');
  const syncedCount = connectedProviders.filter((p) => p.last_synced).length;
  const errorCount = filteredProviders.filter((p) => p.status === 'error').length;

  const isPending =
    connectMutation.isPending ||
    disconnectMutation.isPending ||
    toggleMutation.isPending ||
    syncMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Integrations"
        description="Manage your connected services and external integrations."
      />

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-heading">Connected Services</h2>
            <p className="text-sm text-text-muted">
              {connectedProviders.length} of {filteredProviders.length} services connected
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />}
            onClick={handleSyncAll}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? 'Syncing...' : 'Refresh All'}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onToggle={handleToggle}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isPending={isPending}
            />
          ))}
        </div>
      </section>

      <section>
        <Card className="p-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-text-heading">Sync Health</h3>
                <p className="text-sm text-text-muted">Integration sync status and reliability.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />}
                onClick={handleSyncAll}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-canvas-surface rounded-xl border border-canvas-border">
                <div className="p-2 rounded-lg bg-success-100 text-success-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-heading">{connectedProviders.length}</p>
                  <p className="text-xs text-text-muted">Connected Services</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-canvas-surface rounded-xl border border-canvas-border">
                <div className="p-2 rounded-lg bg-warning-100 text-warning-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-heading">{syncedCount}</p>
                  <p className="text-xs text-text-muted">Synced Today</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-canvas-surface rounded-xl border border-canvas-border">
                <div className="p-2 rounded-lg bg-error-100 text-error-600">
                  <XCircle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-heading">{errorCount}</p>
                  <p className="text-xs text-text-muted">Sync Errors</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-canvas-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Last sync</span>
                <span className="text-text-heading">{formatRelativeTime(new Date().toISOString())}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-text-muted">Sync interval</span>
                <span className="text-text-heading">15 minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}