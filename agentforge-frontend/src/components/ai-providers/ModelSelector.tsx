// src/components/ai-providers/ModelSelector.tsx
// Dynamic Model Selector - collapsible provider cards with lazy-loaded model lists.

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, Zap, Globe, Cpu, Check, ExternalLink, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { aiProvidersApi, ModelInfo } from '@/api/aiProviders';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Sparkles size={12} className="text-blue-500" />,
  'groq': <Zap size={12} className="text-green-500" />,
  'openrouter': <Globe size={12} className="text-purple-500" />,
  'opencode-zen': <Cpu size={12} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  'chat': <span className="text-xs">💬</span>,
  'reasoning': <span className="text-xs">🧠</span>,
  'code': <span className="text-xs">💻</span>,
  'embedding': <span className="text-xs">🔢</span>,
  'vision': <span className="text-xs">👁️</span>,
  'function_calling': <span className="text-xs">⚙️</span>,
  'structured_output': <span className="text-xs">📋</span>,
};

interface ModelSelectorProps {
  selectedModel?: string;
  onModelChange?: (model: string, provider: string) => void;
  filterProvider?: string;
  filterCapability?: string[];
  showPricing?: boolean;
  showCapabilities?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const ITEMS_PER_PAGE = 20;

function ModelListForProvider({
  models,
  searchQuery,
  selectedModel,
  onSelect,
  showPricing,
  showCapabilities,
  disabled,
  selectedModelId,
}: {
  models: Array<any>;
  searchQuery: string;
  selectedModel?: string;
  onSelect: (model: any) => void;
  showPricing: boolean;
  showCapabilities: boolean;
  disabled: boolean;
  selectedModelId?: string;
}) {
  const filtered = models
    .filter(m => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;
      return (m.name?.toLowerCase().includes(query) ?? false) ||
        (m.id?.toLowerCase().includes(query) ?? false);
    })
    .filter(m => m.is_available);

  const visibleModels = models.slice(0, 20);

  if (visibleModels.length === 0) {
    return (
      <div className="text-center py-4 text-text-muted">
        No available models found
      </div>
    );
  }

  return (
    <>
      {visibleModels.map(model => (
        <button
          key={model.id}
          onClick={() => handleSelect(model)}
          disabled={disabled}
          className={cn(
            'w-full p-3 text-left transition-colors hover:bg-canvas-surface/50',
            model.id === selectedModel ? 'bg-brand-primary/5' : ''
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-heading truncate">{model.name}</span>
                {model.id !== model.name && (
                  <span className="text-xs text-text-muted font-mono">{model.id}</span>
                )}
                {model.is_free && (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                    Free
                  </Badge>
                )}
              </div>
              {showCapabilities && model.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {model.capabilities.map((cap: string) => (
                    <span key={cap} className="inline-flex items-center gap-0.5 text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface">
                      {CAPABILITY_ICONS[cap]}
                      <span className="capitalize">{cap.replace('_', ' ')}</span>
                    </span>
                  ))}
                </div>
              )}
              {showPricing && (model.pricing_input > 0 || model.pricing_output > 0) && (
                <div className="flex gap-3 mt-1 text-xs text-text-muted">
                  <span>In: ${(model.pricing_input / 1000000).toFixed(4)}/1M</span>
                  <span>Out: ${(model.pricing_output / 1000000).toFixed(4)}/1M</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                <span>Context: {model.context_window.toLocaleString()}</span>
                <span>Max out: {model.max_output_tokens.toLocaleString()}</span>
              </div>
            </div>
            {model.id === selectedModel && (
              <Check size={20} className="text-brand-primary shrink-0" />
            )}
          </div>
        </button>
      ))}
    </>
  );
}

function ProviderCard({
  provider,
  models,
  expandedProviders,
  setExpandedProviders,
  searchQuery,
  setSearchQuery,
  handleSelect,
  selectedModel,
  showPricing,
  showCapabilities,
  disabled,
}: {
  provider: string;
  models: Array<any>;
  expandedProviders: Record<string, boolean>;
  setExpandedProviders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSelect: (model: any) => void;
  selectedModel?: string;
  showPricing: boolean;
  showCapabilities: boolean;
  disabled: boolean;
}) {
  const isExpanded = expandedProviders[provider] ?? false;
  const icon = PROVIDER_ICONS[provider];
  const label = PROVIDER_LABELS[provider] || provider;

  return (
    <div key={provider} className="border-b border-canvas-border last:border-0">
      <button
        onClick={() => {
          setExpandedProviders(prev => ({ ...prev, [provider]: !prev[provider] }));
        }}
        className="w-full px-3 py-2 bg-canvas-surface/50 text-xs font-semibold text-text-muted flex items-center gap-2 justify-between"
      >
        <div className="flex items-center gap-2">
          {PROVIDER_ICONS[provider]}
          <span>{PROVIDER_LABELS[provider] || provider}</span>
          <Badge variant="outline" className="text-xs">{models.length}</Badge>
        </div>
        <ChevronRight
          size={14}
          className={cn('text-text-muted transition-transform', expandedProviders[provider] && 'rotate-90')}
        />
      </button>

      <AnimatePresence>
        {expandedProviders[provider] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-canvas-border bg-canvas-surface/30"
          >
            <div className="p-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={`Search ${PROVIDER_LABELS[provider] || provider} models...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 max-w-md"
                />
              </div>

              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {(() => {
                  const filtered = models
                    .filter(m => {
                      const query = searchQuery.toLowerCase();
                      if (!query) return true;
                      return (m.name?.toLowerCase().includes(query) ?? false) ||
                        (m.id?.toLowerCase().includes(query) ?? false);
                    })
                    .filter(m => m.is_available);

                  const visibleModels = models.slice(0, 20);

                  if (visibleModels.length === 0) {
                    return (
                      <div className="text-center py-4 text-text-muted">
                        No available models found
                      </div>
                    );
                  }

                  return (
                    <>
                      {visibleModels.map(model => (
                        <button
                          key={model.id}
                          onClick={() => handleSelect(model)}
                          disabled={disabled}
                          className={cn(
                            'w-full p-3 text-left transition-colors hover:bg-canvas-surface/50',
                            model.id === selectedModel ? 'bg-brand-primary/5' : ''
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-heading truncate">{model.name}</span>
                                {model.id !== model.name && (
                                  <span className="text-xs text-text-muted font-mono">{model.id}</span>
                                )}
                                {model.is_free && (
                                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                                    Free
                                  </Badge>
                                )}
                              </div>
                              {showCapabilities && model.capabilities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
{model.capabilities.map((cap: string) => (
                                    <span key={cap} className="inline-flex items-center gap-0.5 text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface">
                                      {CAPABILITY_ICONS[cap]}
                                      <span className="capitalize">{cap.replace('_', ' ')}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {showPricing && (model.pricing_input > 0 || model.pricing_output > 0) && (
                                <div className="flex gap-3 mt-1 text-xs text-text-muted">
                                  <span>In: ${(model.pricing_input / 1000000).toFixed(4)}/1M</span>
                                  <span>Out: ${(model.pricing_output / 1000000).toFixed(4)}/1M</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                                <span>Context: {model.context_window.toLocaleString()}</span>
                                <span>Max out: {model.max_output_tokens.toLocaleString()}</span>
                              </div>
                            </div>
                            {model.id === selectedModel && (
                              <Check size={20} className="text-brand-primary shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
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
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  filterProvider,
  filterCapability,
  showPricing = true,
  showCapabilities = true,
  placeholder = 'Select a model...',
  disabled = false,
}: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  // Fetch models
  const { data: modelsData, isLoading, refetch } = useQuery({
    queryKey: ['ai-models', filterProvider],
    queryFn: () => aiProvidersApi.listModels(filterProvider),
    staleTime: 60000,
  });

  // Flatten models from all providers
  const allModels: Array<ModelInfo & { providerName: string }> = [];
  if (modelsData) {
    Object.entries(modelsData.models).forEach(([provider, models]) => {
      models.forEach(model => {
        if (model.id.toLowerCase().includes('qwen')) return; // Exclude Qwen models (P0 fix)
        allModels.push({ ...model, providerName: provider });
      });
    });
  }

  // Filter models
  const filteredModels = allModels.filter(model => {
    // Provider filter
    if (selectedProviderFilter !== 'all' && model.provider !== selectedProviderFilter) {
      return false;
    }
    // Capability filter
    if (filterCapability && filterCapability.length > 0) {
      const hasCapability = filterCapability.some(cap => model.capabilities.includes(cap));
      if (!hasCapability) return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!model.name.toLowerCase().includes(query) && !model.id.toLowerCase().includes(query)) {
        return false;
      }
    }
    return model.is_available;
  });

  // Group by provider
  const modelsByProvider = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Array<any>>);

  const currentModel = allModels.find(m => m.id === selectedModel);

  const handleSelect = (model: any) => {
    onModelChange?.(model.id, model.provider);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between"
        disabled
      >
        <Loader2 size={16} className="animate-spin" />
        Loading models...
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          {currentModel && PROVIDER_ICONS[currentModel.provider]}
          <span className="truncate">
            {currentModel ? currentModel.name : placeholder}
          </span>
          {currentModel && showPricing && currentModel.pricing_input > 0 && (
            <Badge variant="outline" className="text-xs ml-auto">
              ${(currentModel.pricing_input / 1000000).toFixed(2)}/1M in
            </Badge>
          )}
        </div>
        <ChevronDown size={16} />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="w-full max-h-[500px] overflow-hidden">
            {/* Header with search and filters */}
            <div className="p-3 border-b border-canvas-border">
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedProviderFilter} onValueChange={setSelectedProviderFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {Object.keys(modelsByProvider).map(provider => (
                      <SelectItem key={provider} value={provider}>
                        <div className="flex items-center gap-2">
                          {PROVIDER_ICONS[provider]}
                          <span>{PROVIDER_LABELS[provider] || provider}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Provider Cards - Collapsible */}
            <div className="max-h-[400px] overflow-y-auto">
              {Object.keys(modelsByProvider).length === 0 ? (
                <div className="p-6 text-center text-text-muted">
                  No models found matching your criteria
                </div>
              ) : (
                Object.entries(modelsByProvider).map(([provider, models]) => (
                  <ProviderCard
                    key={provider}
                    provider={provider}
                    models={models}
                    expandedProviders={expandedProviders}
                    setExpandedProviders={setExpandedProviders}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSelect={handleSelect}
                    selectedModel={selectedModel}
                    showPricing={showPricing}
                    showCapabilities={showCapabilities}
                    disabled={disabled}
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function handleSelect(model: any) {
  // Defined in parent component
}

// Simple model dropdown for inline use
export function InlineModelSelector({
  models,
  selectedModel,
  onChange,
  disabled = false,
}: {
  models: Array<ModelInfo & { provider: string }>;
  selectedModel?: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={selectedModel || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {models.map(model => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-2">
              {PROVIDER_ICONS[model.provider]}
              <span className="flex-1 truncate">{model.name}</span>
              {model.is_free && <Badge variant="outline" className="text-xs">Free</Badge>}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}