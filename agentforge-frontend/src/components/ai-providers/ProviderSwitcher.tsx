// src/components/ai-providers/ProviderSwitcher.tsx
// Provider Switcher - collapsible provider cards with lazy-loaded model lists.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Check, AlertCircle, Loader2, Zap, Brain, Cpu, Globe, WifiOff, AlertCircle as AlertCircleIcon, Clock, Database, Wifi } from 'lucide-react';
import { aiProvidersApi, ProviderConfig, ProviderHealth, ModelInfo } from '@/api/aiProviders';
import { getStoredProvider, storeProvider, subscribeProviderChange } from '@/lib/providerSelection';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';

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

const ITEMS_PER_PAGE = 20;

interface ProviderSwitcherProps {
  onProviderChange?: (provider: string) => void;
  compact?: boolean;
  showHealth?: boolean;
}

function getHealthStatus(health: ProviderHealth | undefined, config: ProviderConfig | undefined): { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode } {
  if (!config?.enabled) {
    return { label: 'Not Configured', variant: 'default', icon: <WifiOff size={12} className="text-text-muted" /> };
  }
  if (!config?.connected) {
    return { label: 'Offline', variant: 'error', icon: <WifiOff size={12} className="text-error-500" /> };
  }
  if (!health?.is_healthy) {
    if (health?.error_rate && health.error_rate > 0.5) return { label: 'Provider Error', variant: 'error', icon: <AlertCircle size={12} className="text-error-500" /> };
    if (health?.latency_ms && health.latency_ms > 30000) return { label: 'Rate Limited', variant: 'warning', icon: <Clock size={12} className="text-amber-500" /> };
    if (health?.consecutive_failures && health.consecutive_failures > 3) return { label: 'Quota Exhausted', variant: 'warning', icon: <WifiOff size={12} className="text-amber-500" /> };
    return { label: 'Provider Error', variant: 'error', icon: <AlertCircle size={12} className="text-error-500" /> };
  }
  return { label: 'Healthy', variant: 'success', icon: <Wifi size={12} className="text-emerald-500" /> };
}

export function ProviderSwitcher({ onProviderChange, compact = false, showHealth = true }: ProviderSwitcherProps) {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string>(() => getStoredProvider());
  const [healthData, setHealthData] = useState<Record<string, ProviderHealth>>({});
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [pageNumbers, setPageNumbers] = useState<Record<string, number>>({});

  // Fetch providers
  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiProvidersApi.listProviders,
    staleTime: 30000,
  });

  // Fetch health data
  const { data: healthResponse, isLoading: healthLoading } = useQuery({
    queryKey: ['ai-providers-health'],
    queryFn: aiProvidersApi.healthCheck,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Fetch all provider models once
  const { data: providerModelsData } = useQuery({
    queryKey: ['provider-models'],
    queryFn: () => aiProvidersApi.listModels(),
    staleTime: 60000,
  });

  // Group models by provider, filter out Qwen
  const groupedModels = useMemo(() => {
    if (!providerModelsData?.models) return {};
    const acc: Record<string, ModelInfo[]> = {};
    Object.entries(providerModelsData.models).forEach(([provider, models]) => {
      if (!acc[provider]) acc[provider] = [];
      models.forEach((m) => {
        if (!m.id.toLowerCase().includes('qwen')) {
          acc[provider].push(m);
        }
      });
    });
    return acc;
  }, [providerModelsData]);

  useEffect(() => {
    if (healthResponse) {
      setHealthData(healthResponse.providers);
    }
  }, [healthResponse]);

  // Set default provider (persisted selection wins over backend default).
  useEffect(() => {
    if (providersData?.default_provider && !selectedProvider && !getStoredProvider()) {
      setSelectedProvider(providersData.default_provider);
    }
  }, [providersData, selectedProvider]);

  // Stay in sync when another switcher instance changes the selection.
  useEffect(() => subscribeProviderChange(setSelectedProvider), []);

  // Switch provider mutation
  const switchProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      storeProvider(provider);
      return provider;
    },
    onSuccess: (provider) => {
      setSelectedProvider(provider);
      onProviderChange?.(provider);
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  const handleProviderChange = (provider: string) => {
    switchProviderMutation.mutate(provider);
  };

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

  if (providersLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-brand-primary" />
        <span className="text-sm text-text-muted">Loading providers...</span>
      </div>
    );
  }

  const providers = providersData?.providers || [];
  const connectedProviders = providers.filter(p => p.connected);
  const notConnectedProviders = providers.filter(p => !p.connected);

  if (connectedProviders.length === 0 && notConnectedProviders.length > 0) {
    return (
      <Card className="p-4 text-center">
        <AlertCircle size={24} className="mx-auto text-amber-500 mb-2" />
        <p className="text-sm text-text-muted">No AI providers connected</p>
        <p className="text-xs text-text-muted mt-1">Add API keys in Settings to connect providers</p>
      </Card>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="p-4 text-center">
        <AlertCircle size={24} className="mx-auto text-amber-500 mb-2" />
        <p className="text-sm text-text-muted">No AI providers configured</p>
        <p className="text-xs text-text-muted mt-1">Add API keys in Settings</p>
      </Card>
    );
  }

  const displayProviders = [...connectedProviders, ...notConnectedProviders];

  const currentProvider = connectedProviders.find(p => p.provider === selectedProvider) || connectedProviders[0] || displayProviders[0];

  if (compact) {
    return (
      <Select value={currentProvider?.provider || ''} onValueChange={handleProviderChange} disabled={switchProviderMutation.isPending}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select AI provider" />
        </SelectTrigger>
        <SelectContent>
          {displayProviders.map((provider) => (
            <SelectItem key={provider.provider} value={provider.provider}>
              <div className="flex items-center gap-2">
                {PROVIDER_ICONS[provider.provider]}
                <span>{PROVIDER_LABELS[provider.provider] || provider.provider}</span>
                {showHealth && healthData[provider.provider] && (
                  <Badge variant={healthData[provider.provider]?.is_healthy ? 'success' : 'error'} className="ml-auto">
                    {healthData[provider.provider]?.is_healthy ? 'Healthy' : 'Degraded'}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const healthMap = healthResponse?.providers ?? {};

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-heading">AI Provider</h3>
        {showHealth && currentProvider && healthMap[currentProvider.provider] && (
          <Badge variant={healthMap[currentProvider.provider]?.is_healthy ? 'success' : 'error'}>
            {healthMap[currentProvider.provider]?.is_healthy ? 'Healthy' : 'Degraded'}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {displayProviders.map((provider) => {
          const health = healthMap[provider.provider];
          const isSelected = provider.provider === selectedProvider;
          const isConnected = provider.connected;
          const healthStatus = getHealthStatus(healthMap[provider.provider], provider);
          const icon = PROVIDER_ICONS[provider.provider];
          const label = PROVIDER_LABELS[provider.provider] || provider.provider;
          const isExpanded = expandedProviders[provider.provider] ?? false;

          return (
            <div key={provider.provider} className="card overflow-hidden">
              <button
                onClick={() => {
                  if (!isExpanded) {
                    handleToggleProvider(provider.provider);
                  } else if (!isSelected && isConnected) {
                    handleProviderChange(provider.provider);
                  }
                }}
                className="w-full p-4 flex items-center justify-between gap-4 hover:bg-canvas-surface/30 transition-colors text-left"
                aria-expanded={isExpanded}
                disabled={switchProviderMutation.isPending || (isExpanded && isSelected) || (!isExpanded && isSelected && !isConnected)}
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
                      <Badge variant={healthStatus.variant === 'success' ? 'success' : healthStatus.variant === 'warning' ? 'warning' : healthStatus.variant === 'error' ? 'error' : 'default'} className="text-[10px]">
                        {healthStatus.icon}
                        <span className="ml-1">{healthStatus.label}</span>
                      </Badge>
                      {provider.provider === providersData?.default_provider && (
                        <Badge variant="outline" className="text-[10px]">Default</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted mt-1">
                      <span className="flex items-center gap-1">
                        <Database size={10} /> {provider.models_available ?? 0} models
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {health?.latency_ms?.toFixed(0) ?? 0}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu size={10} /> Default: {provider.default_model}
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

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-canvas-border bg-canvas-surface/30"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder={`Search ${label} models...`}
                          value={searchQueries[provider.provider] ?? ''}
                          onChange={(e) => handleSearchChange(provider.provider, e.target.value)}
                          className="flex-1 max-w-md"
                        />
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => handleProviderChange(provider.provider)}
                          disabled={switchProviderMutation.isPending || !isConnected}
                          className="whitespace-nowrap"
                        >
                          {isSelected ? 'Current' : 'Select'}
                        </Button>
                      </div>

                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {(() => {
                          if (!providerModelsData) {
                            return <div className="py-4 text-center text-text-muted">Loading models...</div>;
                          }

                          const allModels = groupedModels[provider.provider] ?? [];
                          const query = (searchQueries[provider.provider] ?? '').toLowerCase();

                          const filtered = allModels.filter(m => {
                            if (!m.is_available) return false;
                            if (!query) return true;
                            return (m.name?.toLowerCase().includes(query) ?? false) ||
                              (m.id?.toLowerCase().includes(query) ?? false);
                          });

                          const page = pageNumbers[provider.provider] ?? 0;
                          const end = (page + 1) * ITEMS_PER_PAGE;
                          const visibleModels = filtered.slice(0, end);
                          const hasMore = end < filtered.length;

                          if (visibleModels.length === 0) {
                            return (
                              <div className="text-center py-8 text-text-muted">
                                No available models found
                              </div>
                            );
                          }

                          return (
                            <>
                              {visibleModels.map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => handleProviderChange(provider.provider)}
                                  disabled={switchProviderMutation.isPending}
                                  className={cn(
                                    'w-full p-3 text-left transition-colors rounded-lg hover:bg-canvas-surface/50',
                                    m.id === provider.default_model && 'bg-brand-primary/5'
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-text-heading truncate">{m.name}</span>
                                        {m.id !== m.name && (
                                          <span className="text-xs text-text-muted font-mono">{m.id}</span>
                                        )}
                                        {m.is_free && (
                                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                                            Free
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {m.capabilities?.map((cap: string) => (
                                          <span key={cap} className="inline-flex items-center gap-0.5 text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface">
                                            {cap.replace('_', ' ')}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {hasMore && (
                                <button
                                  onClick={() => handleLoadMore(provider.provider)}
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

      {switchProviderMutation.isPending && (
        <div className="flex items-center justify-center gap-2 text-sm text-brand-primary">
          <Loader2 size={16} className="animate-spin" />
          Switching provider...
        </div>
      )}
    </Card>
  );
}

// Quick provider selector for toolbar/header
export function QuickProviderSelector({ onSelect }: { onSelect?: (provider: string) => void }) {
  const queryClient = useQueryClient();
  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiProvidersApi.listProviders,
    staleTime: 30000,
  });

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(() => getStoredProvider());

  useEffect(() => subscribeProviderChange(setSelected), []);
  useEffect(() => {
    if (providersData?.default_provider && !selected && !getStoredProvider()) {
      setSelected(providersData.default_provider);
    }
  }, [providersData, selected]);

  const providers = providersData?.providers || [];
  const connectedProviders = providers.filter(p => p.connected);
  const currentProviderId = selected || providersData?.default_provider || connectedProviders[0]?.provider || providers[0]?.provider;

  const choose = (provider: string) => {
    storeProvider(provider);
    setSelected(provider);
    onSelect?.(provider);
    queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    setOpen(false);
  };

  if (providers.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5"
      >
        {PROVIDER_ICONS[currentProviderId || '']}
        <span className="hidden sm:inline">{PROVIDER_LABELS[currentProviderId || ''] || 'Provider'}</span>
        <ChevronDown size={12} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-canvas-border bg-canvas shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-canvas-border text-xs font-semibold text-text-muted">
            Switch Provider
          </div>
          {connectedProviders.map((provider) => (
            <button
              key={provider.provider}
              onClick={() => choose(provider.provider)}
              className={cn(
                'w-full px-3 py-2 text-sm text-left transition-colors',
                provider.provider === currentProviderId
                  ? 'bg-brand-primary/5 text-brand-primary'
                  : 'text-text-body hover:bg-canvas-surface'
              )}
            >
              <div className="flex items-center gap-2">
                {PROVIDER_ICONS[provider.provider]}
                <span>{PROVIDER_LABELS[provider.provider] || provider.provider}</span>
                {provider.provider === currentProviderId && <Check size={14} />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}