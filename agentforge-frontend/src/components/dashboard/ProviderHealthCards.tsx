// src/components/dashboard/ProviderHealthCards.tsx
// Provider health cards showing each AI provider's status, models, latency, and configuration.

import { useQuery } from '@tanstack/react-query';
import { Sparkles, Zap, Globe, Cpu, CheckCircle2, XCircle, AlertTriangle, Loader2, Wifi, WifiOff, Database, Zap as ZapIcon, Clock } from 'lucide-react';
import { aiProvidersApi } from '@/api/aiProviders';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Sparkles size={16} className="text-blue-500" />,
  'groq': <Zap size={16} className="text-green-500" />,
  'openrouter': <Globe size={16} className="text-purple-500" />,
  'opencode-zen': <Cpu size={16} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

export function ProviderHealthCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['provider-health-cards'],
    queryFn: async () => {
      const [providersRes, healthRes] = await Promise.all([
        aiProvidersApi.listProviders(),
        aiProvidersApi.healthCheck(),
      ]);
      return { providers: providersRes.providers, health: healthRes.providers };
    },
    retry: false,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="card" className="h-40" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4 text-center text-text-muted">
            Provider data unavailable
          </Card>
        ))}
      </div>
    );
  }

  const { providers, health } = data;
  const connectedProviders = providers.filter((p) => p.connected);

  if (connectedProviders.length === 0 && providers.length > 0) {
    return (
      <Card className="p-6 text-center col-span-full">
        <AlertTriangle size={24} className="mx-auto text-amber-500 mb-2" />
        <p className="text-sm text-text-muted">No AI providers connected</p>
        <p className="text-xs text-text-muted mt-1">Add API keys in Settings to connect providers</p>
      </Card>
    );
  }

  const displayProviders = connectedProviders.length > 0 ? connectedProviders : providers;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayProviders.map((provider) => {
        const providerHealth = health[provider.provider];
        const isHealthy = providerHealth?.is_healthy ?? false;
        const modelsAvailable = providerHealth?.models_available ?? 0;
        const latency = providerHealth?.latency_ms ?? 0;
        const lastError = providerHealth?.last_error;
        const hasApiKey = provider.connected;
        const defaultModel = provider.default_model;
        const icon = PROVIDER_ICONS[provider.provider];
        const label = PROVIDER_LABELS[provider.provider] || provider.provider;

        return (
          <Card key={provider.provider} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  provider.connected ? 'bg-brand-primary/10' : 'bg-canvas-surface'
                )}>
                  {icon}
                </div>
                <div>
                  <p className="font-medium text-text-heading">{label}</p>
                  <p className="text-xs text-text-muted">{provider.provider}</p>
                </div>
              </div>
              <Badge variant={isHealthy ? 'success' : 'error'} className="text-[10px]">
                {isHealthy ? 'Healthy' : 'Degraded'}
              </Badge>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Models</span>
                <span className="font-medium">{modelsAvailable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Latency</span>
                <span className="font-medium tabular-nums">{latency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">API Key</span>
                <span className={cn('font-medium', hasApiKey ? 'text-emerald-600' : 'text-error-600')}>
                  {hasApiKey ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Default</span>
                <span className="font-mono text-xs text-text-body truncate max-w-[140px]">{defaultModel}</span>
              </div>
            </div>

            {lastError && (
              <div className="mt-2 p-2 rounded bg-error-50 border border-error-200">
                <p className="text-xs text-error-600 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {lastError.length > 60 ? lastError.slice(0, 60) + '…' : lastError}
                </p>
              </div>
            )}

            {!provider.connected && (
              <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Add API key in Settings to enable
                </p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}