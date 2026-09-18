// src/components/settings/AIProvidersSettings.tsx
// AI Providers Settings - configure API keys, models, and routing for AI providers

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Zap, Globe, Cpu, Key, Save, TestTube, RefreshCw, PlugZap, AlertCircle, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { aiProvidersApi, ProviderConfig, ProviderHealth } from '@/api/aiProviders';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { motion } from 'framer-motion';

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Brain size={18} className="text-blue-500" />,
  'groq': <Zap size={18} className="text-green-500" />,
  'openrouter': <Globe size={18} className="text-purple-500" />,
  'opencode-zen': <Cpu size={18} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  'google-ai': 'Gemini models (2.5 Flash, 2.5 Pro, 1.5 Pro, 1.5 Flash) via Google AI Studio',
  'groq': 'Fast inference with Llama 3.3, Mixtral, Gemma models',
  'openrouter': 'Access to 100+ models including DeepSeek, Qwen, Mistral, Claude',
  'opencode-zen': 'OpenCode Zen free models (Muse Spark, Big Pickle, Ling, Nemotron)',
};

const PROVIDER_ENV_VARS: Record<string, string> = {
  'google-ai': 'GOOGLE_AI_API_KEY',
  'groq': 'GROQ_API_KEY',
  'openrouter': 'OPENROUTER_API_KEY',
  'opencode-zen': 'OPENCODE_API_KEY',
};

// Truthful status derived from the backend (never "Degraded" for a missing key).
function providerStatus(p?: ProviderConfig): { label: string; variant: 'success' | 'error' | 'outline' } {
  if (!p) return { label: 'Unknown', variant: 'outline' };
  if (p.health_status === 'not_configured' || !p.connected)
    return { label: 'Not Configured', variant: 'outline' };
  if (p.health_status === 'healthy') return { label: 'Healthy', variant: 'success' };
  return { label: 'Offline', variant: 'error' };
}

interface ProviderSettings {
  provider: string;
  apiKey: string;
  enabled: boolean;
  defaultModel: string;
  models: string[];
  priority: number;
  baseUrl?: string;
  testResult?: 'success' | 'error' | 'testing';
  testMessage?: string;
}

export function AIProvidersSettings() {
  const queryClient = useQueryClient();
  const [providerSettings, setProviderSettings] = useState<Record<string, ProviderSettings>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);

  // Fetch providers
  const { data: providersData, isLoading, refetch } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiProvidersApi.listProviders,
    staleTime: 30000,
  });

  // Fetch health
  const { data: healthData } = useQuery({
    queryKey: ['ai-providers-health'],
    queryFn: aiProvidersApi.healthCheck,
    refetchInterval: 60000,
  });

  // Live model inventory (for Model Count + model dropdowns)
  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['ai-providers-models'],
    queryFn: () => aiProvidersApi.listModels(),
    staleTime: 60000,
  });

  const [lastSync, setLastSync] = useState<Record<string, string>>({});
  const [busyAction, setBusyAction] = useState<Record<string, 'refresh' | 'toggle' | undefined>>({});

  // Initialize provider settings from fetched data
  useEffect(() => {
    if (providersData) {
      const settings: Record<string, ProviderSettings> = {};
      providersData.providers.forEach(p => {
        settings[p.provider] = {
          provider: p.provider,
          apiKey: '', // Would be loaded from secure storage in production
          enabled: p.enabled,
          defaultModel: p.default_model,
          models: p.models,
          priority: p.priority,
          baseUrl: p.base_url,
        };
      });
      setProviderSettings(settings);
    }
  }, [providersData]);

  const updateProviderSetting = (provider: string, updates: Partial<ProviderSettings>) => {
    setProviderSettings(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates },
    }));
  };

  const testProvider = async (provider: string) => {
    updateProviderSetting(provider, { testResult: 'testing' });

    try {
      // Real backend ping — GET /ai/providers/health/{provider}.
      const live = await aiProvidersApi.providerHealth(provider);
      queryClient.invalidateQueries({ queryKey: ['ai-providers-health'] });
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      if (live.is_healthy) {
        updateProviderSetting(provider, { testResult: 'success', testMessage: `Connection successful · ${live.latency_ms.toFixed(0)}ms · ${live.models_available} models` });
        showToast('success', `${PROVIDER_LABELS[provider]} connection test passed`);
      } else {
        updateProviderSetting(provider, { testResult: 'error', testMessage: live.last_error || 'Provider unreachable' });
        showToast('error', `${PROVIDER_LABELS[provider]} connection test failed: ${live.last_error || 'Provider unreachable'}`);
      }
    } catch (e) {
      updateProviderSetting(provider, { testResult: 'error', testMessage: 'Test request failed' });
      showToast('error', 'Test request failed');
    }
  };

  const refreshModels = async (provider: string) => {
    setBusyAction(prev => ({ ...prev, [provider]: 'refresh' }));
    try {
      // Real backend refresh — POST /ai/providers/{provider}/refresh-models.
      const res = await aiProvidersApi.refreshProviderModels(provider);
      setLastSync(prev => ({ ...prev, [provider]: new Date().toLocaleString() }));
      updateProviderSetting(provider, { models: res.models });
      await refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-providers-health'] });
      showToast('success', `${PROVIDER_LABELS[provider]} models refreshed · ${res.count} models`);
    } catch (e) {
      showToast('error', `Refresh failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setBusyAction(prev => ({ ...prev, [provider]: undefined }));
    }
  };

  const toggleEnabled = async (provider: string, enabled: boolean) => {
    setBusyAction(prev => ({ ...prev, [provider]: 'toggle' }));
    try {
      // Runtime enable/disable — POST /ai/providers/{provider}/enabled.
      const res = await aiProvidersApi.setProviderEnabled(provider, enabled);
      updateProviderSetting(provider, { enabled: res.enabled });
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-providers-health'] });
      showToast('success', `${PROVIDER_LABELS[provider]} ${res.enabled ? 'enabled' : 'disconnected (until backend restart)'}`);
    } catch (e) {
      showToast('error', `Update failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setBusyAction(prev => ({ ...prev, [provider]: undefined }));
    }
  };

  const saveAllSettings = async () => {
    try {
      // In production, this would save to backend
      localStorage.setItem('ai-provider-settings', JSON.stringify(providerSettings));
      showToast('success', 'AI provider settings saved');
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    } catch (e) {
      showToast('error', 'Failed to save settings');
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const providers = ['google-ai', 'groq', 'openrouter', 'opencode-zen'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Loader2 size={20} className="animate-spin text-brand-primary" />
          <span>Loading AI providers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-heading flex items-center gap-2">
          <Brain size={24} className="text-brand-primary" />
          AI Providers
        </h2>
        <p className="text-text-muted mt-1">
          Configure API keys, models, and routing for AI providers. Changes require a backend restart to take effect.
        </p>
      </div>

      {/* Provider Overview */}
      <Card className="p-4">
        <h3 className="font-semibold text-text-heading mb-3">Provider Status Overview</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map(provider => {
            const settings = providerSettings[provider];
            const health = healthData?.providers[provider];
            const cfg = providersData?.providers.find(p => p.provider === provider);
            const status = providerStatus(cfg);
            const connected = cfg?.connected ?? false;

            return (
              <div
                key={provider}
                data-testid={`provider-card-${provider}`}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  status.label === 'Healthy' ? 'border-emerald-200 bg-emerald-50/50' : 'border-canvas-border'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  {PROVIDER_ICONS[provider]}
                  <div className="flex-1">
                    <p className="font-medium text-text-heading">{PROVIDER_LABELS[provider]}</p>
                    <p className="text-xs text-text-muted">{PROVIDER_DESCRIPTIONS[provider]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={status.variant} className="text-xs" data-testid={`provider-status-${provider}`}>
                    {status.label}
                  </Badge>
                  <Badge variant={connected ? 'success' : 'outline'} className="text-xs">
                    {connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  {settings?.enabled && <Badge variant="outline" className="text-xs">Enabled</Badge>}
                </div>
                {status.label === 'Not Configured' && (
                  <p className="mt-2 text-xs text-text-muted">API key missing.</p>
                )}
                {health && (
                  <div className="mt-3 text-xs text-text-muted grid grid-cols-2 gap-1">
                    <span>Latency: {health.latency_ms.toFixed(0)}ms</span>
                    <span>Models: {health.models_available}</span>
                    <span>Errors: {(health.error_rate * 100).toFixed(1)}%</span>
                    <span>Failures: {health.consecutive_failures}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Provider Configuration Tabs */}
      <Tabs defaultValue="google-ai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {providers.map(provider => (
            <TabsTrigger key={provider} value={provider}>
              <div className="flex items-center gap-1.5">
                {PROVIDER_ICONS[provider]}
                <span>{PROVIDER_LABELS[provider]}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {providers.map(provider => {
          const settings = providerSettings[provider];
          const health = healthData?.providers[provider];
          const cfg = providersData?.providers.find(p => p.provider === provider);
          const status = providerStatus(cfg);
          const liveModels = modelsData?.models?.[provider] ?? [];
          const modelCount = liveModels.length || settings?.models.length || 0;

          return (
            <TabsContent key={provider} value={provider} className="animate-fade-in">
              <Card className="p-6 space-y-6">
                {/* API Key Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {PROVIDER_ICONS[provider]}
                      <h4 className="font-semibold text-text-heading">API Configuration</h4>
                    </div>
                    <Badge variant={cfg?.connected ? 'success' : 'outline'} data-testid={`provider-connection-${provider}`}>
                      {cfg?.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>

                  <div className="text-xs text-text-muted grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid={`provider-meta-${provider}`}>
                    <span>Connection Status: <strong className="text-text-heading">{status.label}</strong></span>
                    <span>Model Count: <strong className="text-text-heading">{modelCount}</strong></span>
                    <span>Last Sync: <strong className="text-text-heading">{lastSync[provider] ?? '—'}</strong></span>
                    <span>Latency: <strong className="text-text-heading">{health ? `${health.latency_ms.toFixed(0)}ms` : '—'}</strong></span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`api-key-${provider}`}>API Key</Label>
                      <div className="relative">
                        <Input
                          id={`api-key-${provider}`}
                          type={showKeys[provider] ? 'text' : 'password'}
                          value={settings?.apiKey || ''}
                          onChange={(e) => updateProviderSetting(provider, { apiKey: e.target.value })}
                          placeholder={`Enter ${PROVIDER_ENV_VARS[provider]}`}
                          className="pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-[38px]"
                          onClick={() => setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
                        >
                          {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        Environment variable: <code className="font-mono text-text-heading">{PROVIDER_ENV_VARS[provider]}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={settings?.enabled || false}
                          onChange={(e) => updateProviderSetting(provider, { enabled: e.target.checked })}
                        />
                        <span className="text-sm">Enable this provider</span>
                      </Label>
                      <Badge variant={settings?.enabled ? 'success' : 'outline'} className="text-xs">
                        {settings?.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Model Configuration */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-text-heading flex items-center gap-2">
                    {PROVIDER_ICONS[provider]}
                    Model Configuration
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Default Model</Label>
                      <Select
                        value={settings?.defaultModel || ''}
                        onValueChange={(value) => updateProviderSetting(provider, { defaultModel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default model" />
                        </SelectTrigger>
                        <SelectContent>
                          {settings?.models.map(model => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Priority (higher = preferred)</Label>
                      <Input
                        type="number"
                        value={settings?.priority || 0}
                        onChange={(e) => updateProviderSetting(provider, { priority: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    {provider === 'opencode-zen' && settings?.baseUrl && (
                      <div className="sm:col-span-2">
                        <Label>Base URL</Label>
                        <Input
                          value={settings.baseUrl}
                          onChange={(e) => updateProviderSetting(provider, { baseUrl: e.target.value })}
                          placeholder="https://opencode.ai/zen/v1"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Available Models</Label>
                    <div className="flex flex-wrap gap-2">
                      {(liveModels.length > 0 ? liveModels.map(m => m.id) : settings?.models ?? []).map((model, i) => (
                        <Badge key={model} variant="outline" className="text-xs">
                          {model}
                          {i === 0 && <span className="ml-1 text-emerald-500">★</span>}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Live from the provider API{liveModels.length === 0 ? ' (fallback list — refresh to sync)' : ''}.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshModels(provider)}
                      disabled={busyAction[provider] === 'refresh'}
                      icon={busyAction[provider] === 'refresh' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      data-testid={`provider-refresh-${provider}`}
                    >
                      {busyAction[provider] === 'refresh' ? 'Refreshing...' : 'Refresh Models'}
                    </Button>
                    <Button
                      variant={settings?.enabled ? 'danger' : 'outline'}
                      size="sm"
                      onClick={() => toggleEnabled(provider, !settings?.enabled)}
                      disabled={busyAction[provider] === 'toggle'}
                      icon={busyAction[provider] === 'toggle' ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} />}
                      data-testid={`provider-disconnect-${provider}`}
                    >
                      {settings?.enabled ? 'Disconnect' : 'Enable'}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Connection Test */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-text-heading flex items-center gap-2">
                    <TestTube size={18} />
                    Connection Test
                  </h4>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => testProvider(provider)}
                      disabled={settings?.testResult === 'testing' || (!settings?.apiKey && !cfg?.connected)}
                      icon={settings?.testResult === 'testing' ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
                      data-testid={`provider-test-${provider}`}
                    >
                      {settings?.testResult === 'testing' ? 'Testing...' : 'Test Connection'}
                    </Button>

                    {settings?.testResult === 'success' && (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                        <CheckCircle size={14} />
                        <span>{settings.testMessage}</span>
                      </div>
                    )}

                    {settings?.testResult === 'error' && (
                      <div className="flex items-center gap-1.5 text-red-600 text-sm">
                        <XCircle size={14} />
                        <span>{settings.testMessage}</span>
                      </div>
                    )}
                  </div>

                    {!settings?.apiKey && !cfg?.connected && (
                      <p className="text-xs text-text-muted">
                        API key missing — set {PROVIDER_ENV_VARS[provider]} on the backend, then test the connection.
                      </p>
                    )}
                </div>
              </Card>
            </TabsContent>
          );
        })}

        {/* Global Settings Tab */}
        <TabsContent value="global" className="animate-fade-in">
          <Card className="p-6 space-y-6">
            <h3 className="font-semibold text-text-heading">Global AI Routing Settings</h3>

            <div className="space-y-4">
              <div>
                <Label>Default Provider</Label>
                <Select
                  value={providersData?.default_provider || 'google-ai'}
                  onValueChange={(value) => {
                    // Would update global settings
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider} value={provider}>
                        <div className="flex items-center gap-2">
                          {PROVIDER_ICONS[provider]}
                          <span>{PROVIDER_LABELS[provider]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Default Model</Label>
                <Input
                  value={providersData?.default_model || 'gemini-2.5-flash'}
                  onChange={(e) => {
                    // Would update global settings
                  }}
                  placeholder="gemini-2.5-flash"
                />
              </div>

              <div>
                <Label>Provider Priority Order (comma-separated)</Label>
                <Input
                  value="google-ai,groq,openrouter,opencode-zen"
                  onChange={(e) => {
                    // Would update global settings
                  }}
                  placeholder="google-ai,groq,openrouter,opencode-zen"
                />
                <p className="text-xs text-text-muted mt-1">
                  Higher priority providers are tried first for automatic fallback.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={true}
                      onChange={() => {}}
                    />
                    <span>Enable Provider Router</span>
                  </Label>
                  <p className="text-xs text-text-muted mt-1 ml-6">
                    Automatically route requests to the best available provider.
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={true}
                      onChange={() => {}}
                    />
                    <span>Enable Provider Fallback</span>
                  </Label>
                  <p className="text-xs text-text-muted mt-1 ml-6">
                    Automatically switch providers on quota exhaustion or errors.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={saveAllSettings} icon={<Save size={14} />}>
                Save All Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Toasts */}
      {toasts.map(toast => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm">{toast.message}</span>
          <Button variant="ghost" size="sm" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-white hover:text-white/80">
            <XCircle size={14} />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}