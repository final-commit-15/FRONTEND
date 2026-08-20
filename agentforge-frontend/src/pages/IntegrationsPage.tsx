// src/pages/IntegrationsPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  GitBranch,          // ✅ correct casing           // ✅ exists
  MessageSquare,         // ✅ exists
  HardDrive,
  NotepadText,
  Briefcase,
  Mail,
  Building2,
  Webhook as WebhookIcon,   // ✅ renamed to avoid conflict
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Zap,
  ExternalLink,
  Loader2,
  GitBranchIcon,
  MessagesSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client'; // ✅ use the shared API client
import { useToast } from '@/hooks/useToast';

// ─── Types ──────────────────────────────────────────────────
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

// ─── API Client ─────────────────────────────────────────────
// Replace these with actual backend endpoints
// ─── API Client ─────────────────────────────────────────────
// Replace these with your actual backend endpoints and response shapes.
const integrationsApi = {
  list: () =>
    apiClient.get('/integrations').then((res) => {
      const data = res.data;
      // If it's already an array, return it.
      if (Array.isArray(data)) return data;
      // If it's an object, try common wrapper keys.
      if (data && typeof data === 'object') {
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.results)) return data.results;
      }
      // Fallback: empty array.
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

// ─── Simple Toggle ──────────────────────────────────────────
function Toggle({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-electric-600' : 'bg-base-700'
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

// ─── Helpers ──────────────────────────────────────────────────
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

function formatRelativeTime(timestamp?: string | null) {
  if (!timestamp) return 'Never';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Icon mapping ───────────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  github: GitBranch,
  slack: MessagesSquare,
  discord: MessageSquare,
  googledrive: HardDrive,
  notion: NotepadText,
  jira: Briefcase,
  gmail: Mail,
  outlook: Building2,
  webhook: WebhookIcon,
};

// ─── Provider Card ───────────────────────────────────────────
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
    <Card className="p-5 flex flex-col gap-3 hover:border-base-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-base-800">
            <Icon size={20} className="text-electric-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{provider.name}</h4>
            <p className="text-xs text-base-500">{provider.description}</p>
          </div>
        </div>
        {getStatusBadge(provider.status)}
      </div>

      {provider.account && (
        <div className="flex items-center gap-2 text-sm text-base-400">
          <span>Account:</span>
          <span className="text-white font-mono text-xs">{provider.account}</span>
        </div>
      )}

      {provider.last_synced && (
        <div className="flex items-center gap-2 text-xs text-base-500">
          <Clock size={14} />
          <span>Last synced: {formatRelativeTime(provider.last_synced)}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-base-800">
        <Toggle
          checked={provider.enabled}
          onCheckedChange={(checked) => onToggle(provider.id, checked)}
        />
        <span className="text-xs text-base-500">
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

// ─── Webhook Section ─────────────────────────────────────────
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
            <h3 className="text-lg font-semibold text-white">Webhooks</h3>
            <p className="text-sm text-base-500">Loading webhooks...</p>
          </div>
        </div>
        <Card className="p-8 text-center border-dashed">
          <Loader2 className="animate-spin mx-auto text-base-500" size={24} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Webhooks</h3>
          <p className="text-sm text-base-500">Manage incoming and outgoing webhook endpoints.</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={onAdd}>
          Add Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-base-500">No webhooks configured yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <WebhookIcon size={16} className="text-electric-400" />
                    <h4 className="font-medium text-white">{webhook.name}</h4>
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
                    className="text-error-500 hover:text-error-400"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 text-xs text-base-500 bg-base-900 p-2 rounded-md font-mono truncate">
                  <span className="shrink-0">URL:</span>
                  <span className="text-white truncate">{webhook.url}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ExternalLink size={12} />}
                    className="ml-auto shrink-0"
                  />
                </div>
                {webhook.last_triggered && (
                  <p className="text-xs text-base-500 mt-1">
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

// ─── Main Page ──────────────────────────────────────────────
export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // ── Queries ──────────────────────────────────────────────
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

  // ── Mutations ────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────
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
    // Open a modal/drawer – for now just alert
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

  // ── Loading / Error ──────────────────────────────────────
  if (providersLoading) {
    return (
      <div className="space-y-8">
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
      <div className="space-y-8">
        <PageHeader title="Integrations" description="Failed to load integrations" />
        <Card className="p-8 text-center">
          <p className="text-error-500">Failed to load integrations. Please try again.</p>
          <Button variant="secondary" className="mt-4" onClick={() => refetchProviders()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // ── Stats ────────────────────────────────────────────────
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
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Manage GitHub, Slack, Discord, Webhooks, and other external service integrations."
      />

      {/* Connected Services */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Connected Services</h2>
            <p className="text-sm text-base-500">
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

      {/* Webhooks */}
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

      {/* Sync Health */}
      <section>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Sync Health</h3>
              <p className="text-sm text-base-500">Integration sync status and reliability.</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-base-800/50 rounded-lg">
              <div className="p-2 rounded-lg bg-success-500/10 text-success-500">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{connectedProviders.length}</p>
                <p className="text-xs text-base-500">Connected Services</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-base-800/50 rounded-lg">
              <div className="p-2 rounded-lg bg-warning-500/10 text-warning-500">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{syncedCount}</p>
                <p className="text-xs text-base-500">Synced Today</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-base-800/50 rounded-lg">
              <div className="p-2 rounded-lg bg-error-500/10 text-error-500">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{errorCount}</p>
                <p className="text-xs text-base-500">Sync Errors</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-base-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-base-500">Last sync</span>
              <span className="text-white">{formatRelativeTime(new Date().toISOString())}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-base-500">Sync interval</span>
              <span className="text-white">15 minutes</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}