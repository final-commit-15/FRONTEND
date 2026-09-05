// src/pages/IntegrationsPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  GitBranch,
  MessagesSquare,
  HardDrive,
  NotepadText,
  Briefcase,
  Mail,
  Building2,
  Webhook as WebhookIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Zap,
  ExternalLink,
  Loader2,
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

interface Webhook {
  id: string;
  name: string;
  type: 'incoming' | 'outgoing';
  url: string;
  secret?: string;
  status: 'active' | 'inactive' | 'error';
  last_triggered?: string | null;
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

  listWebhooks: () =>
    apiClient.get('/webhooks').then((res) => {
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.results)) return data.results;
      }
      return [];
    }),

  deleteWebhook: (id: string) =>
    apiClient.delete(`/webhooks/${id}`).then((res) => res.data),

  testWebhook: (id: string) =>
    apiClient.post(`/webhooks/${id}/test`).then((res) => res.data),
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

function getStatusBadge(status: IntegrationProvider['status'] | Webhook['status']) {
  switch (status) {
    case 'connected':
    case 'active':
      return <Badge variant="success">Connected</Badge>;
    case 'disconnected':
    case 'inactive':
      return <Badge variant="neutral">Disconnected</Badge>;
    case 'error':
      return <Badge variant="error">Error</Badge>;
    default:
      return <Badge variant="neutral">Unknown</Badge>;
  }
}

const iconMap: Record<string, React.ElementType> = {
  github: GitBranch,
  slack: MessagesSquare,
  discord: MessagesSquare,
  googledrive: HardDrive,
  notion: NotepadText,
  jira: Briefcase,
  gmail: Mail,
  outlook: Building2,
  webhook: WebhookIcon,
};

interface ProviderCardProps {
  provider: IntegrationProvider;
  onToggle: (id: string, enabled: boolean) => void;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  isPending?: boolean;
}

function ProviderCard({ provider, onToggle, onConnect, onDisconnect, isPending }: ProviderCardProps) {
  const Icon = iconMap[provider.id] || WebhookIcon;

  return (
    <Card className="card-hover p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10">
            <Icon size={20} className="text-brand-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-text-heading">{provider.name}</h4>
            <p className="text-xs text-text-muted">{provider.description}</p>
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

interface WebhookSectionProps {
  webhooks: Webhook[];
  isLoading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  isPending?: boolean;
}

function WebhookSection({ webhooks, isLoading, onAdd, onDelete, onTest, isPending }: WebhookSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-text-heading">Webhooks</h3>
            <p className="text-sm text-text-muted">Loading webhooks...</p>
          </div>
        </div>
        <Card className="p-8 text-center border-dashed border-canvas-border">
          <Loader2 className="animate-spin mx-auto text-text-muted" size={24} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-text-heading">Webhooks</h3>
          <p className="text-sm text-text-muted">Manage incoming and outgoing webhook endpoints.</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={onAdd}>
          Add Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <EmptyState
          title="No webhooks configured yet"
          description="Create your first webhook to start receiving events."
          action={<Button variant="primary" onClick={onAdd} icon={<Plus size={18} />}>Add Webhook</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <WebhookIcon size={16} className="text-brand-primary" />
                    <h4 className="font-medium text-text-heading">{webhook.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={webhook.type === 'incoming' ? 'info' : 'warning'}>
                      {webhook.type}
                    </Badge>
                    {getStatusBadge(webhook.status)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTest(webhook.id)}
                    icon={<Zap size={14} />}
                    disabled={isPending}
                  >
                    Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(webhook.id)}
                    icon={<Trash2 size={14} />}
                    className="text-error-600 hover:text-error-500"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 text-xs text-text-muted bg-canvas-surface p-2 rounded-xl font-mono truncate">
                  <span className="shrink-0">URL:</span>
                  <span className="text-text-heading truncate">{webhook.url}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ExternalLink size={12} />}
                    className="ml-auto shrink-0"
                  />
                </div>
                {webhook.last_triggered && (
                  <p className="text-xs text-text-muted mt-1">
                    Last triggered: {formatRelativeTime(webhook.last_triggered)}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
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

  const {
    data: webhooks = [],
    isLoading: webhooksLoading,
    refetch: refetchWebhooks,
  } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: integrationsApi.listWebhooks,
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

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      addToast({ type: 'success', title: 'Webhook deleted' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Deletion failed' });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.testWebhook(id),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Webhook test sent' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Test failed' });
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

  const handleAddWebhook = () => {
    alert('Open webhook creation modal');
  };

  const handleDeleteWebhook = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      deleteWebhookMutation.mutate(id);
    }
  };

  const handleTestWebhook = (id: string) => {
    testWebhookMutation.mutate(id);
  };

  if (providersLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Integrations" description="Loading integrations..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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

  const connectedProviders = providers.filter((p) => p.status === 'connected');
  const syncedCount = connectedProviders.filter((p) => p.last_synced).length;
  const errorCount = providers.filter((p) => p.status === 'error').length;

  const isPending =
    connectMutation.isPending ||
    disconnectMutation.isPending ||
    toggleMutation.isPending ||
    syncMutation.isPending ||
    deleteWebhookMutation.isPending ||
    testWebhookMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Integrations"
        description="Manage GitHub, Slack, Discord, Webhooks, and other external service integrations."
      />

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-heading">Connected Services</h2>
            <p className="text-sm text-text-muted">
              {connectedProviders.length} of {providers.length} services connected
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
          {providers.map((provider) => (
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
        <WebhookSection
          webhooks={webhooks}
          isLoading={webhooksLoading}
          onAdd={handleAddWebhook}
          onDelete={handleDeleteWebhook}
          onTest={handleTestWebhook}
          isPending={isPending}
        />
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