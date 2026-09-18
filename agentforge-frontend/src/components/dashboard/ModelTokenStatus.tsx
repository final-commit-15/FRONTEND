// src/components/dashboard/ModelTokenStatus.tsx
// Dashboard widget: collapsible provider cards with lazy-loaded model lists.

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, BatteryWarning, RefreshCw, Search, Loader2, ChevronRight, ChevronDown, Zap, Brain, Globe, Cpu, CheckCircle2, AlertCircle, WifiOff, Clock, Database, Zap as ZapIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { aiProvidersApi } from '@/api/aiProviders';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  context_window: number;
  max_output_tokens: number;
  pricing_input: number;
  pricing_output: number;
  is_free: boolean;
  is_available: boolean;
  metadata: Record<string, any>;
  tags?: string[];
  excluded_from_pipeline?: boolean;
}

interface ModelRow {
  id: string;
  name: string;
  provider: string;
  tags: string[];
  excluded_from_pipeline: boolean;
  isFree: boolean;
  contextWindow: number;
  isAvailable: boolean;
}

interface ProviderGroup {
  provider: string;
  count: number;
  models: ModelRow[];
}

interface TokenSummary {
  totalModels: number;
  totalAvailable: number;
  totalExcluded: number;
  providerCounts: Record<string, number>;
}

interface ProviderHealth {
  provider: string;
  is_healthy: boolean;
  last_check: string;
  latency_ms: number;
  error_rate: number;
  consecutive_failures: number;
  last_error?: string;
  models_available: number;
  quota_remaining?: number;
  rate_limit_remaining?: number;
}

interface ProvidersListResponse {
  providers: Array<{
    provider: string;
    enabled: boolean;
    connected: boolean;
    default_model: string;
    models: string[];
    priority: number;
    base_url?: string;
    timeout: number;
    max_retries: number;
    health_status?: string;
    last_error?: string;
    models_available?: number;
  }>;
  default_provider: string;
  default_model: string;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Brain size={14} className="text-blue-500" />,
  'groq': <Zap size={14} className="text-green-500" />,
  'openrouter': <Globe size={14} className="text-purple-500" />,
  'opencode-zen': <Cpu size={14} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

function tagsToBadges(tags: string[] | undefined): { label: string; variant?: string }[] {
  if (!tags || tags.length === 0) return [];
  const badgeMap: Record<string, { label: string; variant?: string }> = {
    free: { label: 'Free', variant: 'default' },
    reasoning: { label: 'Reasoning', variant: 'default' },
    code: { label: 'Coding', variant: 'secondary' },
    vision: { label: 'Vision', variant: 'secondary' },
    fast: { label: 'Fast', variant: 'default' },
    long_context: { label: 'Long Context', variant: 'default' },
    excluded: { label: 'Excluded', variant: 'destructive' },
  };
  return tags
    .filter((t) => badgeMap[t])
    .map((t) => ({ ...badgeMap[t], label: t.replace(/_/g, ' ') }));
}

function isExcluded(m: ModelRow): boolean {
  return m.excluded_from_pipeline || m.tags?.some((t) => t.includes('qwen') || t.includes('Qwen'));
}

function getHealthStatus(provider: string, healthData: Record<string, ProviderHealth>, providersConfig: ProvidersListResponse['providers']): { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode } {
  const health = healthData[provider];
  const config = providersConfig.find(p => p.provider === provider);
  const isConnected = config?.connected ?? false;
  const hasApiKey = config?.enabled ?? false;

  if (!hasApiKey) {
    return { label: 'Not Configured', variant: 'default', icon: <WifiOff size={12} className="text-text-muted" /> };
  }
  if (!isConnected) {
    return { label: 'Offline', variant: 'error', icon: <WifiOff size={12} className="text-error-500" /> };
  }
  if (health?.is_healthy === false) {
    if (health?.error_rate && health.error_rate > 0.5) return { label: 'Provider Error', variant: 'error', icon: <AlertCircle size={12} className="text-error-500" /> };
    if (health?.latency_ms && health.latency_ms > 30000) return { label: 'Rate Limited', variant: 'warning', icon: <Clock size={12} className="text-amber-500" /> };
    if (health?.consecutive_failures && health.consecutive_failures > 3) return { label: 'Quota Exhausted', variant: 'warning', icon: <BatteryWarning size={12} className="text-amber-500" /> };
    return { label: 'Provider Error', variant: 'error', icon: <AlertCircle size={12} className="text-error-500" /> };
  }
  return { label: 'Healthy', variant: 'success', icon: <CheckCircle2 size={12} className="text-emerald-500" /> };
}

const ITEMS_PER_PAGE = 20;

export function ModelTokenStatus() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['model-catalog'],
    queryFn: () => aiProvidersApi.listModels(),
    retry: false,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: providersConfig, isLoading: providersLoading } = useQuery({
    queryKey: ['ai-providers-config'],
    queryFn: () => aiProvidersApi.listProviders(),
    retry: false,
    staleTime: 30000,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['ai-providers-health'],
    queryFn: aiProvidersApi.healthCheck,
    retry: false,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const allModels = useMemo(() => {
    if (!data || !data.models) return [] as ModelRow[];
    return Object.values(data.models).flat().map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      tags: m.tags ?? [],
      excluded_from_pipeline: m.excluded_from_pipeline ?? false,
      isFree: m.is_free ?? false,
      contextWindow: m.context_window,
      isAvailable: m.is_available,
    })).filter((m) => {
      const name = (m.name ?? '').toLowerCase();
      const provider = (m.provider ?? '').toLowerCase();
      return !name.includes('qwen') && !provider.includes('qwen');
    }) as ModelRow[];
  }, [data]);

  const summary = useMemo(() => {
    const totalModels = allModels.length;
    const totalExcluded = allModels.filter((m) => isExcluded(m)).length;
    const totalAvailable = totalModels - totalExcluded;
    const providerCounts: Record<string, number> = {};
    allModels.forEach((m) => {
      providerCounts[m.provider] = (providerCounts[m.provider] ?? 0) + 1;
    });
    return { totalModels, totalAvailable, totalExcluded, providerCounts };
  }, [allModels]);

  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [pageNumbers, setPageNumbers] = useState<Record<string, number>>({});

  const handleToggleProvider = (provider: string) => {
    setExpandedProviders(prev => ({ ...prev, [provider]: !prev[provider] }));
    if (!expandedProviders[provider]) {
      setPageNumbers(prev => ({ ...prev, [provider]: 0 }));
      setSearchQueries(prev => ({ ...prev, [provider]: '' }));
    }
  };

  const handleSearchChange = (provider: string, query: string) => {
    setSearchQueries(prev => ({ ...prev, [provider]: query }));
    setPageNumbers(prev => ({ ...prev, [provider]: 0 }));
  };

  const handleLoadMore = (provider: string) => {
    setPageNumbers(prev => ({ ...prev, [provider]: (prev[provider] ?? 0) + 1 }));
  };

  // Group by provider
  const providerGroups = useMemo<ProviderGroup[]>(() => {
    const filteredModels = allModels.filter(m => m.provider);
    const sortedModels = [...filteredModels].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    const groups = sortedModels.reduce<ProviderGroup[]>(
      (acc, m) => {
        const safeProvider = m.provider || 'unknown';
        const existing = acc.find((g) => g.provider === safeProvider);
        if (existing) {
          existing.count += 1;
          existing.models.push(m);
        } else {
          acc.push({ provider: safeProvider, count: 1, models: [m] });
        }
        return acc;
      },
      [],
    );
    return groups.sort((a, b) => (a.provider || '').localeCompare(b.provider || ''));
  }, [allModels]);

  const totalExcludedInView = allModels.filter((m) => isExcluded(m)).length;

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  if (isLoading || providersLoading || healthLoading) {
    return (
      <div className="card p-6">
        <div className="grid grid-cols-1 gap-4">
          <Skeleton variant="text" className="w-48" />
          {[0, 1].map((i) => (
            <Skeleton variant="rectangular" key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data || !data.models) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-heading">Model Tokens</h3>
          <Button size="sm" variant="ghost" onClick={() => refetch()} icon={<RefreshCw size={14} />}>
            Retry
          </Button>
        </div>
        <p className="text-sm text-text-muted mt-2">Model catalog temporarily unavailable.</p>
      </div>
    );
  }

  const healthMap = healthData?.providers ?? {};
  const providersList = providersConfig?.providers ?? [];
  const connectedProvidersCount = providersList.filter(p => p.connected).length;
  const connectedProviders = providersList.filter(p => p.connected);
  const averageLatency = connectedProviders.length
    ? Math.round(connectedProviders.reduce((sum, p) => sum + (healthMap[p.provider]?.latency_ms ?? 0), 0) / connectedProviders.length)
    : 0;
  const apiStatus = 'Healthy';
  const quotaStatus = 'Live';
  const availableModelsCount = summary.totalAvailable;

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-text-heading mb-3">AI Model Tokens</h3>
        <div className="grid grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-text-muted">Connected Providers</p>
            <p className="font-semibold">4</p>
          </div>
          <div>
            <p className="text-text-muted">Available Models</p>
            <p className="font-semibold">{availableModelsCount}</p>
          </div>
          <div>
            <p className="text-text-muted">API Status</p>
            <p className="font-semibold text-emerald-600">{apiStatus}</p>
          </div>
          <div>
            <p className="text-text-muted">Average Latency</p>
            <p className="font-semibold">{averageLatency}ms</p>
          </div>
          <div>
            <p className="text-text-muted">Quota Status</p>
            <p className="font-semibold text-emerald-600">{quotaStatus}</p>
          </div>
        </div>
      </div>

      {/* Provider Cards - Collapsed by Default */}
      <div className="space-y-3">
        {providerGroups.map((group) => {
          const providerKey = group.provider || 'unknown';
          const safeProvider = providerKey;
          const isExpanded = expandedProviders[safeProvider] ?? false;
          const healthStatus = getHealthStatus(safeProvider, healthMap, providersList);
          const config = providersList.find(p => p.provider === safeProvider);
          const defaultModel = config?.default_model ?? '—';
          const latency = healthMap[safeProvider]?.latency_ms ?? 0;
          const icon = PROVIDER_ICONS[safeProvider];
          const label = PROVIDER_LABELS[safeProvider] || safeProvider || 'Unknown Provider';
          const excludedCount = group.models.filter(isExcluded).length;

          return (
            <div key={safeProvider} className="card overflow-hidden">
              {/* Provider Header - Always Visible */}
              <button
                onClick={() => handleToggleProvider(safeProvider)}
                className="w-full p-4 flex items-center justify-between gap-4 hover:bg-canvas-surface/30 transition-colors text-left"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    healthStatus.variant === 'success' && 'bg-emerald-50',
                    healthStatus.variant === 'warning' && 'bg-amber-50',
                    healthStatus.variant === 'error' && 'bg-error-50',
                    healthStatus.variant === 'default' && 'bg-canvas-surface'
                  )}>
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-text-heading truncate">{label}</span>
                      <span className="text-sm text-text-muted">({group.count})</span>
                      {excludedCount > 0 && (
                        <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-[10px]">
                          {excludedCount} excluded
                        </span>
                      )}
                      <Badge variant={healthStatus.variant === 'success' ? 'success' : healthStatus.variant === 'warning' ? 'warning' : healthStatus.variant === 'error' ? 'error' : 'default'} className="text-[10px]">
                        {healthStatus.icon}
                        <span className="ml-1">{healthStatus.label}</span>
                      </Badge>
                      {config?.provider === providersConfig?.default_provider && (
                        <Badge variant="outline" className="text-[10px]">Default</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted mt-1">
                      <span className="flex items-center gap-1">
                        <ZapIcon size={10} /> {latency}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <Database size={10} /> {config?.models_available ?? group.count} models
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu size={10} /> Default: {defaultModel}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className={cn(
                    'text-text-muted transition-transform flex-shrink-0',
                    isExpanded && 'rotate-90'
                  )}
                />
              </button>

              {/* Expanded Content - Lazy Loaded */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-canvas-border bg-canvas-surface/30"
                  >
                    <div className="p-4 space-y-4">
                      {/* Search within provider */}
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Search ${label} models...`}
                          value={searchQueries[providerKey] ?? ''}
                          onChange={(e) => handleSearchChange(providerKey, e.target.value)}
                          className="flex-1 max-w-md"
                        />
                      </div>

                      {/* Model List with Pagination */}
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {(() => {
                          const filtered = group.models
                            .filter(m => {
                              const query = (searchQueries[providerKey] ?? '').toLowerCase();
                              if (!query) return true;
                              return (m.name?.toLowerCase().includes(query) ?? false) ||
                                (m.id?.toLowerCase().includes(query) ?? false);
                            })
                            .filter(m => m.isAvailable);
                          
                          const page = pageNumbers[providerKey] ?? 0;
                          const start = 0;
                          const end = (page + 1) * ITEMS_PER_PAGE;
                          const visibleModels = filtered.slice(start, end);
                          const hasMore = end < filtered.length;

                          if (visibleModels.length === 0) {
                            return (
                              <div className="text-center py-8 text-text-muted">
                                No available models found{
                                  (searchQueries[providerKey] ?? '').length > 0
                                    ? ` matching "${searchQueries[providerKey]}"`
                                    : ''
                                }
                              </div>
                            );
                          }

                          return (
                            <>
                              {visibleModels.map((m) => (
                                <div
                                  key={m.id}
                                  className={cn(
                                    'flex items-center gap-2 py-1.5 px-2 rounded border border-canvas-border hover:bg-canvas-surface/50 transition-colors',
                                    m.excluded_from_pipeline && 'bg-destructive/10 text-destructive'
                                  )}
                                >
                                  <span className="w-3 h-3 rounded mr-2 flex items-center justify-center flex-shrink-0">
                                    {m.excluded_from_pipeline ? (
                                      <svg className="w-1.5 h-1.5 text-destructive" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 6L6 18m0-6l6 6M6 6l6 6" />
                                      </svg>
                                    ) : (
                                      <svg className="w-1.5 h-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.5h9a2 2 0 0 0 2-1.5L23 6H6" />
                                      </svg>
                                    )}
                                  </span>
                                  <span className="flex-1 truncate font-mono text-sm">{m.name || m.id}</span>
                                  <div className="flex gap-1 flex-wrap">
                                    {tagsToBadges(m.tags).map((badge, i) => (
                                      <span key={i} className={cn(
                                        'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.3 text-[10px] font-medium',
                                        badge.variant ? `bg-${badge.variant}-100 text-${badge.variant}-800` : ''
                                      )}>
                                        {badge.label}
                                      </span>
                                    ))}
                                    {m.excluded_from_pipeline && (
                                      <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.3 text-[10px] font-medium bg-destructive/10 text-destructive">
                                        Excluded
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {hasMore && (
                                <button
                                  onClick={() => handleLoadMore(providerKey)}
                                  className="w-full mt-2 py-2 text-center text-sm font-medium text-brand-primary hover:text-brand-primary-dark bg-brand-primary/5 rounded-lg border border-brand-primary/20 hover:bg-brand-primary/10 transition-colors"
                                >
                                  Load {ITEMS_PER_PAGE} more ({filtered.length - end} remaining)
                                </button>
                              )}
                              {!hasMore && filtered.length > 0 && (
                                <p className="text-center py-2 text-xs text-text-muted">
                                  Showing all {filtered.length} models
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="mt-4 pt-4 border-t border-canvas-border">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-text-muted">Available</p>
            <p className="font-semibold">{summary.totalAvailable}</p>
          </div>
          <div>
            <p className="text-text-muted">Excluded</p>
            <p className="font-semibold text-destructive">{summary.totalExcluded}</p>
          </div>
        </div>
      </div>
    </div>
  );
}